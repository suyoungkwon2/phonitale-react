import React, { useState, useEffect, useRef } from 'react';
import { Progress, Input, Spin } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import BlueButton from '../components/BlueButton';
import { useExperiment } from '../context/ExperimentContext';

// --- Helper Functions (제거 또는 이동 필요) ---
// parseCSV 및 shuffleArray 제거
// Fisher-Yates Shuffle (useExperiment에서 가져오거나 여기에 유지할 수 있음)
function shuffleArray(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
    return array;
}

// --- Recognition Page Component ---
const RecognitionPage = () => {
    const { roundNumber: roundNumberStr } = useParams(); // 문자열로 받아옴
    const navigate = useNavigate();
    // 변경: wordList는 이제 객체 형태 { 1: [], 2: [], 3: [] }
    const { wordList: wordsByRound, isLoadingWords } = useExperiment(); 
    const [shuffledWords, setShuffledWords] = useState([]);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [startTime, setStartTime] = useState(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [userAnswer, setUserAnswer] = useState(""); 
    const [responses, setResponses] = useState([]); // 응답 저장 유지
    const timerRef = useRef(null);
    const inputRef = useRef(null); 
    // 추가: 오디오 재생 타임아웃 ID 저장을 위한 Ref
    const audioTimeoutRefs = useRef([]); 

    const API_ENDPOINT = 'https://2ml24s4a3jfj5hqx4y644cgzbq0jbzmt.lambda-url.us-east-2.on.aws/responses'; // API Gateway endpoint for submitting responses

    // 추가: roundNumber를 숫자로 변환
    const roundNumber = parseInt(roundNumberStr, 10);

    // 변경: 라운드별 단어 목록 가져오기 및 셔플
    useEffect(() => {
        // isLoadingWords가 false이고, wordsByRound 객체가 로드되었는지 확인
        if (!isLoadingWords && Object.keys(wordsByRound).length > 0) {
            // 현재 라운드 번호에 해당하는 단어 목록 가져오기 (없으면 빈 배열)
            const wordsForCurrentRound = wordsByRound[roundNumber] || [];
            console.log(`RecognitionPage Round ${roundNumber}: Loaded ${wordsForCurrentRound.length} words.`);
            
            if (wordsForCurrentRound.length > 0) {
                const shuffled = shuffleArray([...wordsForCurrentRound]);
                setShuffledWords(shuffled);
            } else {
                 // 해당 라운드 단어가 없으면 빈 배열 설정
                 setShuffledWords([]);
                 console.warn(`No words found for round ${roundNumber}`);
                 // TODO: 사용자에게 알림 또는 다음 단계로 자동 이동 등의 처리 추가 가능
            }
            // 라운드 시작 시 상태 초기화
            setCurrentWordIndex(0);
            setResponses([]); // 라운드 시작 시 응답 초기화
            setUserAnswer(""); // 라운드 시작 시 사용자 답변 초기화
        } else if (!isLoadingWords && Object.keys(wordsByRound).length === 0) {
            console.error("Word list object is empty after loading.");
            setShuffledWords([]);
        }
        // 의존성 배열에 wordsByRound, roundNumber 추가
    }, [wordsByRound, isLoadingWords, roundNumber]);

    // Timer and Word Transition Logic + 오디오 재생
    useEffect(() => {
        if (isLoadingWords || shuffledWords.length === 0 || currentWordIndex >= shuffledWords.length) {
            if (timerRef.current) clearInterval(timerRef.current);
            // 이전 타임아웃 클리어
            audioTimeoutRefs.current.forEach(clearTimeout);
            audioTimeoutRefs.current = [];
            return;
        }

        const currentWordData = shuffledWords[currentWordIndex]; // 현재 단어 데이터 가져오기

        setTimeLeft(30);
        setStartTime(Date.now());
        setUserAnswer(""); 
        if (inputRef.current) inputRef.current.focus(); 

        // --- Timer Logic --- 
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft(prevTime => {
                if (prevTime <= 1) {
                    clearInterval(timerRef.current);
                    handleNextClick(true); // Timeout
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);

        // --- Audio Playback Logic --- 
        // 이전 오디오 타임아웃 클리어
        audioTimeoutRefs.current.forEach(clearTimeout);
        audioTimeoutRefs.current = [];

        if (currentWordData?.audio_path) {
            const audioPath = `/${currentWordData.audio_path}`; // public 폴더 기준 경로
            const playAudio = () => {
                try {
                    const audio = new Audio(audioPath);
                    audio.play().catch(e => console.error("Audio play failed:", e));
                    console.log(`Playing audio: ${audioPath}`);
                } catch (error) {
                    console.error("Error creating or playing audio:", error);
                }
            };

            // 2초 후 재생 예약
            const timeoutId1 = setTimeout(playAudio, 2000);
            // 7초 후 재생 예약
            const timeoutId2 = setTimeout(playAudio, 7000);

            // 타임아웃 ID 저장
            audioTimeoutRefs.current.push(timeoutId1, timeoutId2);
        } else {
            console.warn(`Audio path not found for word: ${currentWordData?.word}`);
        }

        // Cleanup 함수
        return () => { 
            if (timerRef.current) clearInterval(timerRef.current);
            // 컴포넌트 언마운트 또는 의존성 변경 시 타임아웃 클리어
            audioTimeoutRefs.current.forEach(clearTimeout);
            audioTimeoutRefs.current = [];
        };
    // 의존성 배열 유지
    }, [currentWordIndex, shuffledWords, isLoadingWords]);

    // Function to send responses to API
    const submitResponses = async (finalResponses) => {
        const userId = sessionStorage.getItem('userName') || 'unknown_user'; // Get userId (or default)
        const payload = {
            userId: userId,
            round: roundNumber,
            phase: 'recognition',
            responses: finalResponses
        };
        console.log("Submitting responses:", payload);
        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            if (response.ok) {
                console.log('Responses submitted successfully');
            } else {
                console.error('Failed to submit responses:', response.status, await response.text());
                 // TODO: Handle API error (e.g., retry, user notification)
            }
        } catch (error) {
            console.error('Error submitting responses:', error);
             // TODO: Handle network error
        }
    };

    // Next Button Handler
    const handleNextClick = (isTimeout = false) => {
        if (timerRef.current) clearInterval(timerRef.current);

        const endTime = Date.now();
        const duration = startTime ? Math.round((endTime - startTime) / 1000) : 0;
        const currentWordData = shuffledWords[currentWordIndex];

        const newResponse = {
            word: currentWordData.word,
            answer: userAnswer,
            correct_answer: currentWordData.meaning, // Include correct answer for evaluation
            is_correct: userAnswer.trim() === currentWordData.meaning.trim(), // Basic correctness check
            duration: duration,
            isTimeout: isTimeout,
            timestamp: new Date().toISOString()
        };
        const updatedResponses = [...responses, newResponse];
        setResponses(updatedResponses);
        console.log("Recognition Response Recorded:", newResponse);

        setIsTransitioning(true);
        setTimeout(() => {
            if (currentWordIndex < shuffledWords.length - 1) {
                setCurrentWordIndex(prevIndex => prevIndex + 1);
                setIsTransitioning(false);
            } else {
                // End of recognition phase
                console.log(`Recognition Round ${roundNumber} Complete. Responses:`, updatedResponses);
                submitResponses(updatedResponses); // Submit data to API
                navigate(`/round/${roundNumber}/generation/start`);
            }
        }, 500); // Shorter transition time
    };

    // 로딩 상태 표시 변경 (isLoading -> isLoadingWords)
    if (isLoadingWords && shuffledWords.length === 0) {
        return <MainLayout><div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div></MainLayout>;
    }

    if (shuffledWords.length === 0 || currentWordIndex >= shuffledWords.length) {
        return <MainLayout><div>Loading or phase complete...</div></MainLayout>;
    }

    const currentWordData = shuffledWords[currentWordIndex];
    const progressPercent = Math.round(((currentWordIndex + 1) / shuffledWords.length) * 100);

    // --- Render Logic (기존과 유사, word 컬럼 사용 확인) ---
    return (
        <MainLayout>
            <div 
                className="recognition-content-wrapper" 
                style={{ 
                    opacity: isTransitioning ? 0 : 1, 
                    transition: 'opacity 0.3s ease-in-out',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}
            >
                {/* Progress Section */}                
                <div className="progress-section" style={{ width: '100%', maxWidth: '550px', marginBottom: '24px' }}>
                    <div className="progress-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '0 5px' }}>
                        <span style={{ fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#868686' }}>Round {roundNumber} | Recognition Test</span>
                        <span style={{ fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#868686' }}>{currentWordIndex + 1} / {shuffledWords.length}</span>
                    </div>
                    <Progress percent={progressPercent} showInfo={false} strokeColor="#2049FF" />
                </div>

                {/* Instruction Text */}                
                <div className="instruction-text" style={{ fontFamily: 'BBTreeGo_R, sans-serif', fontSize: '20px', color: '#000', textAlign: 'center', marginBottom: '32px' }}>
                    영어 단어를 보고, 한국어 뜻을 입력해주세요.
                </div>

                {/* Word Display & Input Section */}                
                <div className="word-display-section" style={{
                    width: '100%', 
                    maxWidth: '550px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    marginBottom: '32px',
                }}>
                    <div className="word-card" style={{ background: '#fff', borderRadius: '20px', padding: '20px 32px', boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.25)', position: 'relative', textAlign: 'center', minHeight: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', marginBottom: '16px' }}>
                        <span className="word-card-label" style={{ position: 'absolute', top: '50%', left: '-100px', transform: 'translateY(-50%)', fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#C7C7C7', width: '90px', textAlign: 'right' }}>English Words</span>
                        <span className="english-word-text" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '36px', fontWeight: 500, color: '#000' }}>{currentWordData.word}</span>
                    </div>

                    <div className="word-card input-card" style={{ background: '#fff', borderRadius: '20px', padding: '25px 32px', boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.25)', position: 'relative', textAlign: 'center', minHeight: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', marginBottom: '16px' }}>
                        <span className="word-card-label" style={{ position: 'absolute', top: '50%', left: '-100px', transform: 'translateY(-50%)', fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#C7C7C7', width: '90px', textAlign: 'right' }}>Korean Meaning</span>
                        <Input
                            ref={inputRef}
                            placeholder="Enter Korean meaning"
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            className="korean-input"
                            size="large"
                            bordered={false}
                            onPressEnter={() => handleNextClick(false)}
                            style={{ fontFamily: 'BBTreeGo_R, sans-serif', fontSize: '24px', textAlign: 'center' }}
                        />
                    </div>
                </div>

                {/* Footer Section */}                
                <div className="footer-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <span className="timer-text" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#868686' }}>{timeLeft}s</span>
                    <BlueButton
                        text="Next"
                        onClick={() => handleNextClick(false)}
                        disabled={false} // Always enabled
                    />
                </div>
            </div>
        </MainLayout>
    );
};

export default RecognitionPage; 