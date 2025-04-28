import React, { useState, useEffect, useRef } from 'react';
import { Progress, Input, Spin, message } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import BlueButton from '../components/BlueButton';
import { useExperiment } from '../context/ExperimentContext';
import { submitResponse } from '../utils/api';

// --- Helper Function (제거 - Context 또는 Util 사용 권장) ---
// function shuffleArray(array) { /* ... */ }

// --- 카드 스타일 정의 (LearningPage에서 복사 및 수정) --- 
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
      minHeight: '150px', // 최소 높이
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
    koreanMeaningText: { // LearningPage 스타일 재사용
      fontSize: '20px', 
      fontWeight: 'bold', 
      color: '#000000',
      fontFamily: 'Pretendard Variable, sans-serif', // Pretendard 적용
    }, 
    verbalCueText: { // LearningPage 스타일 재사용
      fontSize: '14px', 
      color: '#000000', 
      lineHeight: '1.6',
      fontFamily: 'Pretendard Variable, sans-serif', // Pretendard 적용
    },
    inputStyle: {
        marginTop: '8px', // 제목과 간격
        fontSize: '16px', // 입력 필드 글자 크기
        fontFamily: 'Pretendard Variable, sans-serif', // Pretendard 적용
        textTransform: 'lowercase', // 기존 스타일 유지
    }
  };

// --- Generation Page Component ---
const GenerationPage = () => {
    const { roundNumber: roundNumberStr } = useParams();
    const navigate = useNavigate();
    const { wordList: wordsByRound, isLoadingWords } = useExperiment();
    const [wordsForRound, setWordsForRound] = useState([]);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [userInput, setUserInput] = useState('');
    const [timeLeft, setTimeLeft] = useState(30);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isTextFlashing, setIsTextFlashing] = useState(false);
    const timerRef = useRef(null);
    const timestampInRef = useRef(null);
    const inputRef = useRef(null); // Input 참조 추가

    const roundNumber = parseInt(roundNumberStr, 10);

    // --- 단어 로딩 --- 
    useEffect(() => {
        if (!isLoadingWords && Object.keys(wordsByRound).length > 0) {
            const words = wordsByRound[roundNumber] || [];
            console.log(`GenerationPage Round ${roundNumber}: Loaded ${words.length} words.`);
            // Generation은 순서대로 진행하므로 셔플 불필요
            setWordsForRound(words);
        } else if (!isLoadingWords && Object.keys(wordsByRound).length === 0) {
            console.error("GenerationPage: Word list object is empty after loading.");
            setWordsForRound([]);
        }
        setCurrentWordIndex(0); // 라운드 시작 시 인덱스 초기화
    }, [wordsByRound, isLoadingWords, roundNumber]);

    // --- Timer, Focus, Transition Logic --- 
    useEffect(() => {
        if (isLoadingWords || wordsForRound.length === 0 || currentWordIndex >= wordsForRound.length) {
            if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
            return;
        }

        // Reset state for the new word
        setIsTransitioning(false); // Show content
        setUserInput(''); // Clear input
        setTimeLeft(30); // Reset timer
        if (inputRef.current) inputRef.current.focus(); // Focus input
        timestampInRef.current = new Date().toISOString();
        console.log(`GenerationPage - Word ${currentWordIndex + 1} entered at:`, timestampInRef.current);

        // --- Start Timer --- 
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } // Clear previous timer
        timerRef.current = setInterval(() => {
            setTimeLeft(prevTime => {
                if (prevTime <= 1) {
                    console.log("GenerationPage Timer Expired! Auto-advancing...");
                    if (timerRef.current) {
                        clearInterval(timerRef.current);
                        timerRef.current = null;
                    }
                    handleNextClick(true); // Auto-advance
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);

        // Cleanup
        return () => {
            if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        };
    }, [currentWordIndex, wordsForRound, isLoadingWords, navigate, roundNumber]);

    // --- Next Button Handler --- 
    const handleNextClick = async (isTimeout = false) => {
        console.log(`GenerationPage handleNextClick triggered. Timeout: ${isTimeout}`);
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        if (!isTimeout && isTransitioning) {
             console.log("GenerationPage handleNextClick blocked by isTransitioning");
             return; 
        }

        setIsTextFlashing(true); 
        setIsTransitioning(true);
        
        // 0.7초 후 깜빡임 상태 해제
        setTimeout(() => setIsTextFlashing(false), 700);

        const timestampOut = new Date().toISOString();
        const timestampIn = timestampInRef.current;
        const currentWord = wordsForRound[currentWordIndex] || {};
        const userId = sessionStorage.getItem('userId');
        let duration = null;
        if (timestampIn && timestampOut) {
            try { duration = Math.round((new Date(timestampOut) - new Date(timestampIn)) / 1000); } catch (e) { /*...*/ }
        }

        console.log(`Generation Word: ${currentWord?.meaning}, User Input: ${userInput}, Duration: ${duration}s, Timeout: ${isTimeout}`);

        if (!userId) {
            console.error("User ID not found!");
            message.error("User ID not found. Cannot save response.");
            setIsTransitioning(false);
            return;
        }

        // --- API 호출 --- 
        try {
            const responseData = {
                user: userId,
                english_word: currentWord.word, // 백엔드는 여전히 english_word를 키로 사용
                round_number: roundNumber,
                page_type: 'generation',
                timestamp_in: timestampIn,
                timestamp_out: timestampOut,
                duration: duration,
                response: userInput.trim().toLowerCase() || null, // 공백 제거 및 소문자 변환
            };
            await submitResponse(responseData);
            console.log("Generation response submitted for:", currentWord.meaning);

            // --- 다음 단어 또는 페이지 이동 --- 
            if (currentWordIndex < wordsForRound.length - 1) {
                console.log("GenerationPage: Setting next word index...");
                setCurrentWordIndex(prevIndex => prevIndex + 1);
            } else {
                console.log(`GenerationPage: Round ${roundNumber} Complete. Navigating...`);
                if (roundNumber < 3) { 
                    navigate(`/round/${roundNumber + 1}/start`);
                } else { 
                    navigate('/survey/start');
                }
            }

        } catch (error) {
            console.error("Failed to submit generation response:", error);
            message.error(`Failed to save response: ${error.message}`);
            setIsTransitioning(false); // 에러 시 트랜지션 해제
        }
    };

    // --- 로딩 및 에러 상태 처리 --- 
    if (isLoadingWords) { 
        return <MainLayout><div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div></MainLayout>;
    }
    if (!isLoadingWords && wordsForRound.length === 0) { 
         return <MainLayout><div>No words available for this round.</div></MainLayout>;
    }
    if (wordsForRound.length > 0 && currentWordIndex >= wordsForRound.length) {
        return <MainLayout><div>Error: Word index out of bounds.</div></MainLayout>;
    }
    const currentWordData = wordsForRound[currentWordIndex];
    if (!currentWordData) {
         return <MainLayout><div>Loading word data...</div></MainLayout>;
    }

    const progressPercent = Math.round(((currentWordIndex + 1) / wordsForRound.length) * 100);
    const displayVerbalCue = currentWordData?.kss_verbal_cue; // Verbal Cue 필드명 확인

    // --- Component Render (수정된 레이아웃) --- 
    return (
        <MainLayout>
            <div 
                className="generation-content-wrapper" 
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
                        <span style={{ fontSize: '16px', color: '#656565' }}>Round {roundNumber} | Generation</span>
                        <span style={{ fontSize: '16px', color: '#656565' }}>{currentWordIndex + 1} / {wordsForRound.length}</span>
                    </div>
                    <Progress percent={progressPercent} showInfo={false} strokeColor="#2049FF" />
                </div>

                {/* --- Instruction Text --- */}
                <div style={{ color: '#656565', textAlign: 'center' }}>
                    한국어 뜻을 보고, 영어 단어를 입력해주세요.
                </div>

                 {/* === Single Block Container (Recognition 스타일 적용) === */} 
                 <div style={cardStyles.blockContainer}> 
                     {/* --- Section 1: English Word Input --- */} 
                     <div style={{...cardStyles.rowWrapper, alignItems: 'center'}}> 
                         <div style={cardStyles.leftTitle}>English Word</div> 
                         <div style={cardStyles.rightContent}> 
                             <Input 
                                 ref={inputRef} // Ref 연결
                                 placeholder="Please enter your answer" 
                                 value={userInput}
                                 onChange={(e) => setUserInput(e.target.value)}
                                 onPressEnter={() => handleNextClick(false)} 
                                 autoComplete="off"
                                 autoCorrect="off"
                                 spellCheck="false"
                                 style={cardStyles.inputStyle} 
                             />
                         </div> 
                     </div>

                     {/* --- 구분선 --- */} 
                     <div style={cardStyles.dashedBorder}></div>

                     {/* --- Section 2: Korean Meaning Display --- */} 
                     <div style={cardStyles.rowWrapper}> 
                         <div style={cardStyles.leftTitle}>Korean Meaning</div> 
                         <div style={cardStyles.rightContent}> 
                             <span style={{...cardStyles.koreanMeaningText, color: isTextFlashing ? '#FFFFFF' : '#000000'}}>{currentWordData.meaning}</span> 
                         </div> 
                     </div>
                 </div> 

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
                         // disabled={userInput.trim() === ''} // 입력 여부로 비활성화 가능
                     />
                 </div> 
            </div>
        </MainLayout>
    );
};

export default GenerationPage; 