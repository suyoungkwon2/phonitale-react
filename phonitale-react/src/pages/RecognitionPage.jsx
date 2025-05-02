import React, { useState, useEffect, useRef } from 'react';
import { Progress, Input, Spin, message } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import BlueButton from '../components/BlueButton';
import { useExperiment } from '../context/ExperimentContext';
import { submitResponse } from '../utils/api';

// --- Helper Function (shuffleArray - 필요시 useExperiment에서 가져오거나 공통 유틸로 분리) ---
// 여기서는 임시로 유지, 실제로는 Context나 util에서 관리 권장
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

// --- 카드 스타일 정의 (LearningPage에서 복사) --- 
const cardStyles = {
    blockContainer: {
      background: '#FFFFFF',
      borderRadius: '12px', 
      padding: '24px', 
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      width: '100%', 
      maxWidth: '685px', 
      display: 'flex',
      flexDirection: 'column',
      minHeight: '150px', // 내용 없을 때 최소 높이 (조정 가능)
    },
    rowWrapper: { 
      display: 'flex',
      width: '100%',
      alignItems: 'center', 
    },
    leftTitle: {
      width: '120px', 
      textAlign: 'right',
      color: '#656565',
      fontSize: '14px', 
      paddingTop: '2px', 
      paddingRight: '16px', 
      flexShrink: 0, 
      whiteSpace: 'nowrap',
    },
    rightContent: {
      flexGrow: 1, 
      paddingLeft: '16px', 
      position: 'relative',
    },
    dashedBorder: { 
      borderTop: '1px dashed #C7C7C7',
      margin: '16px 0', 
    },
    englishWordText: { // LearningPage 스타일 재사용
      fontSize: '36px', fontWeight: 500, fontFamily: 'Pretendard Variable, sans-serif', // Pretendard 적용
      position: 'relative', display: 'inline-block', color: '#000000', lineHeight: '1.2',
    },
    // Recognition 페이지에 필요한 다른 스타일 추가 가능
    inputStyle: {
        marginTop: '8px', // 단어와 간격
        fontSize: '16px', // 입력 필드 글자 크기
    }
  };

// --- Recognition Page Component ---
const RecognitionPage = () => {
    const { roundNumber: roundNumberStr, groupCode } = useParams();
    const navigate = useNavigate();
    const { wordList: wordsByRound, isLoadingWords, userId, group, currentRound, setCurrentRound } = useExperiment();
    const [shuffledWords, setShuffledWords] = useState([]);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [userAnswer, setUserAnswer] = useState("");
    const timerRef = useRef(null);
    const inputRef = useRef(null);
    const audioTimeoutRefs = useRef([]);
    const timestampInRef = useRef(null); // 페이지 진입 시각 기록
    const [isTextFlashing, setIsTextFlashing] = useState(false); // 깜빡임 상태 추가
    const startTimeRef = useRef(null); // Referencia para el tiempo de inicio

    const roundNumber = parseInt(roundNumberStr, 10);

    // --- 단어 로딩 및 셔플 --- 
    useEffect(() => {
        if (!isLoadingWords && Object.keys(wordsByRound).length > 0) {
            const wordsForCurrentRound = wordsByRound[roundNumber] || [];
            console.log(`RecognitionPage Round ${roundNumber}: Loaded ${wordsForCurrentRound.length} words.`);
            if (wordsForCurrentRound.length > 0) {
                setShuffledWords(shuffleArray([...wordsForCurrentRound]));
            } else {
                setShuffledWords([]);
                console.warn(`No words found for round ${roundNumber}`);
            }
            setCurrentWordIndex(0);
            setUserAnswer(""); 
        } else if (!isLoadingWords && Object.keys(wordsByRound).length === 0) {
            console.error("Word list object is empty after loading.");
            setShuffledWords([]);
        }
    }, [wordsByRound, isLoadingWords, roundNumber]);

    // --- Timer, Audio, Focus, Transition Logic --- 
    useEffect(() => {
        console.log(`[RecognitionPage useEffect WordChange Start] Index: ${currentWordIndex}, isLoading: ${isLoadingWords}, shuffledWords length: ${shuffledWords.length}`);
        if (isLoadingWords || shuffledWords.length === 0 || currentWordIndex >= shuffledWords.length) {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            audioTimeoutRefs.current.forEach(clearTimeout);
            audioTimeoutRefs.current = [];
            return;
        }

        console.log(`[RecognitionPage useEffect WordChange] Setting up for index: ${currentWordIndex}`);
        setIsTransitioning(false); // 화면 표시
        console.log(`[RecognitionPage useEffect WordChange] Set isTransitioning: false`);
        setTimeLeft(30);
        setUserAnswer("");
        if (inputRef.current) inputRef.current.focus();
        timestampInRef.current = new Date().toISOString();
        console.log(`RecognitionPage - Word ${currentWordIndex + 1} entered at:`, timestampInRef.current);

        const currentWordData = shuffledWords[currentWordIndex];

        // --- Start Timer --- 
        if (timerRef.current) clearInterval(timerRef.current); 
        timerRef.current = setInterval(() => {
            setTimeLeft(prevTime => {
                if (prevTime <= 1) {
                    console.log("RecognitionPage Timer Expired! Auto-advancing...");
                    if (timerRef.current) {
                        clearInterval(timerRef.current);
                        timerRef.current = null;
                    }
                    handleNextClick(true); // Auto-advance on timeout
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);

        // --- Audio Play Logic --- 
        audioTimeoutRefs.current.forEach(clearTimeout);
        audioTimeoutRefs.current = [];
        if (currentWordData?.audio_path) { 
            const audioPath = `/${currentWordData.audio_path}`;
            const playAudio = () => {
                try {
                    const audio = new Audio(audioPath);
                    audio.play().catch(e => console.error("Audio play failed:", e));
                } catch (error) {
                    console.error("Error playing audio:", error);
                }
            };
            const timeoutId1 = setTimeout(playAudio, 2000);
            const timeoutId2 = setTimeout(playAudio, 7000);
            audioTimeoutRefs.current.push(timeoutId1, timeoutId2);
        }

        // Cleanup function
        return () => { 
            if (timerRef.current) {
                 clearInterval(timerRef.current);
                 timerRef.current = null;
             }
            audioTimeoutRefs.current.forEach(clearTimeout);
            audioTimeoutRefs.current = [];
        };
    }, [currentWordIndex, shuffledWords, isLoadingWords]); // 의존성 배열 간소화

    // --- Next Button Handler (수정) --- 
    const handleNextClick = async (isTimeout = false) => {
        console.log(`[RecognitionPage handleNextClick Start] Index: ${currentWordIndex}, Timeout: ${isTimeout}, isTransitioning: ${isTransitioning}`);
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            console.log("[RecognitionPage handleNextClick] Timer cleared.");
        }
        if (isTransitioning) {
             console.log("[RecognitionPage handleNextClick Blocked] Already transitioning.");
             return;
         }

        setIsTextFlashing(true);
        setIsTransitioning(true);
        console.log("[RecognitionPage handleNextClick State] Set isTransitioning: true");

        setTimeout(() => setIsTextFlashing(false), 700);

        const timestampOut = new Date().toISOString();
        const timestampIn = timestampInRef.current;
        const currentWordData = shuffledWords[currentWordIndex] || {};
        let duration = null;
        if (timestampIn && timestampOut) {
            try { duration = Math.round((new Date(timestampOut) - new Date(timestampIn)) / 1000); } catch (e) { console.error("Error calculating duration:", e); }
        }
        
        console.log(`[RecognitionPage handleNextClick Data] Word: ${currentWordData?.word}, Answer: ${userAnswer}, Duration: ${duration}s, Timeout: ${isTimeout}`);

        if (!userId) {
            console.error("[RecognitionPage handleNextClick Error] User ID not found!");
            message.error("User ID not found. Cannot save response.");
            setIsTransitioning(false); // 에러 시 상태 복구
            console.log("[RecognitionPage handleNextClick State] User ID Error - Set isTransitioning: false");
            return;
        }
        
        try {
            console.log("[RecognitionPage handleNextClick API] Calling submitResponse...");
            const responseData = {
                user: userId,
                english_word: currentWordData.word,
                round_number: roundNumber,
                page_type: 'recognition',
                timestamp_in: timestampIn,
                timestamp_out: timestampOut,
                duration: duration,
                response: userAnswer || null,
            };
            await submitResponse(responseData, group);
            console.log("Recognition response submitted for:", currentWordData.word);

            if (currentWordIndex < shuffledWords.length - 1) {
                const nextIndex = currentWordIndex + 1;
                console.log(`[RecognitionPage handleNextClick Nav] Setting next index: ${nextIndex}`);
                setCurrentWordIndex(nextIndex);
            } else {
                console.log(`[RecognitionPage handleNextClick Nav] Round ${roundNumber} Complete. Navigating to /${groupCode}/round/${roundNumber}/generation/start`);
                navigate(`/${groupCode}/round/${roundNumber}/generation/start`);
            }

        } catch (error) {
            console.error("[RecognitionPage handleNextClick Error] Failed to submit recognition response:", error);
            message.error(`Failed to save response: ${error.message}`);
            setIsTransitioning(false); // 에러 시 상태 복구
            console.log("[RecognitionPage handleNextClick State] API Error - Set isTransitioning: false");
        }
        console.log("[RecognitionPage handleNextClick End]");
    };

    // --- 로딩 및 에러 상태 처리 --- 
    if (isLoadingWords) { 
        return <MainLayout><div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div></MainLayout>;
    }
    if (!isLoadingWords && shuffledWords.length === 0) { 
         return <MainLayout><div>No words available for this round.</div></MainLayout>;
    }
    if (shuffledWords.length > 0 && currentWordIndex >= shuffledWords.length) {
        return <MainLayout><div>Error: Word index out of bounds.</div></MainLayout>;
    }
    const currentWordData = shuffledWords[currentWordIndex];
    if (!currentWordData) {
         return <MainLayout><div>Loading word data...</div></MainLayout>;
    }

    const progressPercent = Math.round(((currentWordIndex + 1) / shuffledWords.length) * 100);

    // --- Component Render (수정된 레이아웃) --- 
    return (
        <MainLayout>
            <div 
                className="recognition-content-wrapper" 
                style={{ 
                    opacity: isTransitioning && !isTextFlashing ? 0 : 1, // 깜빡일 때 투명도 유지
                    transition: 'opacity 0.3s ease-in-out',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '24px' 
                }}
            >
                {/* --- Progress Bar Section --- */} 
                <div style={{ width: '100%', maxWidth: '685px' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                         <span style={{ fontSize: '16px', color: '#656565' }}>Round {roundNumber} | Recognition</span>
                         <span style={{ fontSize: '16px', color: '#656565' }}>{currentWordIndex + 1} / {shuffledWords.length}</span>
                     </div>
                    <Progress percent={progressPercent} showInfo={false} strokeColor="#2049FF" />
                </div>

                {/* --- Instruction Text (Optional) --- */} 
                <div style={{ color: '#656565', textAlign: 'center' }}>
                    영어 단어를 보고, 한국어 뜻을 입력해주세요.
                </div>

                 {/* === Block 1: English Word / Input === */} 
                 <div style={cardStyles.blockContainer}> 
                     <div style={cardStyles.rowWrapper}> 
                         <div style={cardStyles.leftTitle}>English Word</div> 
                         <div style={cardStyles.rightContent}> 
                             <span style={{...cardStyles.englishWordText, color: isTextFlashing ? '#FFFFFF' : '#000000'}}> {/* 조건부 색상 */} 
                                 {currentWordData.word} 
                             </span> 
                         </div> 
                     </div>
                     {/* Dashed Border */} 
                     <div style={cardStyles.dashedBorder}></div> 
                     {/* Input Row */} 
                     <div style={{...cardStyles.rowWrapper, alignItems: 'center'}}>
                         <div style={cardStyles.leftTitle}>Korean Meaning</div>
                         <div style={cardStyles.rightContent}> 
                             <Input 
                                 ref={inputRef}
                                 placeholder="Please enter your answer"
                                 value={userAnswer}
                                 onChange={(e) => setUserAnswer(e.target.value)}
                                 onPressEnter={() => handleNextClick(false)} // 엔터키로 제출
                                 style={cardStyles.inputStyle}
                             />
                         </div> 
                     </div>
                 </div> 
 
                 {/* === Block 2: (Empty or for other content) === */} 
                 {/* 
                 <div style={cardStyles.blockContainer}> 
                      <p>Block 2 Content (if needed)</p>
                 </div> 
                 */} 

                 {/* === Timer and Next Button Section === */} 
                 <div style={{ 
                     width: '100%',
                     maxWidth: '685px',
                     marginTop: '32px',
                     display: 'flex', 
                     justifyContent: 'flex-end',
                     alignItems: 'center',
                     gap: '8px' 
                 }}> 
                     <span style={{ fontSize: '14px', color: '#656565' }}>{timeLeft}s</span> 
                     <BlueButton
                         text="Next"
                         onClick={() => handleNextClick(false)}
                         // 버튼 활성화 조건 필요 시 추가 (예: userAnswer.trim() !== '')
                         // disabled={userAnswer.trim() === ''} 
                     />
                 </div> 
            </div>
        </MainLayout>
    );
};

export default RecognitionPage; 