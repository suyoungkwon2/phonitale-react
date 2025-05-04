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
      color: 'rgba(0, 0, 0, 0.25)',
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
    const { roundNumber: roundNumberStr, groupCode } = useParams();
    const navigate = useNavigate();
    const { wordList: wordsByRound, isLoadingWords, userId, group, currentRound, setCurrentRound } = useExperiment();
    const [wordsForRound, setWordsForRound] = useState([]);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [userInput, setUserInput] = useState('');
    const [timeLeft, setTimeLeft] = useState(30);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isTextFlashing, setIsTextFlashing] = useState(false);
    const timerRef = useRef(null);
    const timestampInRef = useRef(null);
    const inputRef = useRef(null); // Input 참조 추가
    const startTimeRef = useRef(null);

    const roundNumber = parseInt(roundNumberStr, 10);

    // --- 새로고침 방지 --- 
    useEffect(() => {
        const handleBeforeUnload = (event) => {
            event.preventDefault();
            // 표준에 따라 returnValue를 설정해야 함 (브라우저마다 표시되는 메시지는 다를 수 있음)
            event.returnValue = ''; 
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        // 컴포넌트 언마운트 시 이벤트 리스너 제거
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []); // 빈 배열을 전달하여 마운트 시 한 번만 실행되도록 함

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
        console.log(`[GenerationPage useEffect WordChange Start] Index: ${currentWordIndex}, isLoading: ${isLoadingWords}, wordsForRound length: ${wordsForRound.length}`); // 로그 추가
        if (isLoadingWords || wordsForRound.length === 0 || currentWordIndex >= wordsForRound.length) {
            if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
            return;
        }

        console.log(`[GenerationPage useEffect WordChange] Setting up for index: ${currentWordIndex}`);
        setIsTransitioning(false); // 화면 표시
        console.log(`[GenerationPage useEffect WordChange] Set isTransitioning: false`); // 로그 추가
        setUserInput('');
        setTimeLeft(30);
        if (inputRef.current) inputRef.current.focus();
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
    }, [currentWordIndex, wordsForRound, isLoadingWords]);

    // --- Next Button Handler --- 
    const handleNextClick = async (isTimeout = false) => {
        console.log(`[GenerationPage handleNextClick Start] Index: ${currentWordIndex}, Timeout: ${isTimeout}, isTransitioning: ${isTransitioning}`); // 로그 추가
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; console.log("[GenerationPage handleNextClick] Timer cleared."); }
        if (!isTimeout && isTransitioning) {
             console.log("[GenerationPage handleNextClick Blocked] Already transitioning.");
             return; 
        }

        setIsTextFlashing(true); 
        setIsTransitioning(true);
        console.log("[GenerationPage handleNextClick State] Set isTransitioning: true");
        
        setTimeout(() => setIsTextFlashing(false), 700);

        const timestampOut = new Date().toISOString();
        const timestampIn = timestampInRef.current;
        const currentWord = wordsForRound[currentWordIndex] || {};
        let duration = null;
        if (timestampIn && timestampOut) {
            try { duration = Math.round((new Date(timestampOut) - new Date(timestampIn)) / 1000); } catch (e) { /*...*/ }
        }

        console.log(`[GenerationPage handleNextClick Data] Word: ${currentWord?.meaning}, User Input: ${userInput}, Duration: ${duration}s, Timeout: ${isTimeout}`);

        if (!userId) {
            console.error("[GenerationPage handleNextClick Error] User ID not found!");
            message.error("User ID not found. Cannot save response.");
            setIsTransitioning(false); // 에러 시 상태 복구
            console.log("[GenerationPage handleNextClick State] User ID Error - Set isTransitioning: false");
            return;
        }

        try {
            console.log("[GenerationPage handleNextClick API] Calling submitResponse...");
            const responseData = {
                user: userId,
                english_word: currentWord.word,
                round_number: roundNumber,
                page_type: 'generation',
                timestamp_in: timestampIn,
                timestamp_out: timestampOut,
                duration: duration,
                response: userInput.trim().toLowerCase() || null,
            };
            if (userId && group) {
                await submitResponse(responseData, group);
                console.log("Generation response submitted for:", currentWord.meaning);
            } else {
                console.warn("UserId or Group not available, response not submitted.");
            }

            if (currentWordIndex < wordsForRound.length - 1) {
                const nextIndex = currentWordIndex + 1;
                console.log(`[GenerationPage handleNextClick Nav] Setting next index: ${nextIndex}`); // 로그 추가
                setCurrentWordIndex(nextIndex);
            } else {
                console.log(`[GenerationPage handleNextClick Nav] Round ${roundNumber} Complete. Navigating...`);
                if (roundNumber < 3) { 
                    navigate(`/${groupCode}/round/${roundNumber + 1}/start`);
                } else { 
                    navigate(`/${groupCode}/survey/start`);
                }
            }

        } catch (error) {
            console.error("[GenerationPage handleNextClick Error] Failed to submit generation response:", error);
            message.error(`Failed to save response: ${error.message}`);
            setIsTransitioning(false); // 에러 시 상태 복구
            console.log("[GenerationPage handleNextClick State] API Error - Set isTransitioning: false");
        }
        console.log("[GenerationPage handleNextClick End]"); // 로그 추가
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
                    한국어 의미를 보고, 영어 단어를 입력해주세요.
                </div>

                 {/* === Single Block Container (Recognition 스타일 적용) === */} 
                 <div style={cardStyles.blockContainer}> 
                     {/* --- Section 1: English Word Input --- */} 
                     <div style={{...cardStyles.rowWrapper, alignItems: 'center'}}> 
                         <div style={cardStyles.leftTitle}>영어 단어</div> 
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
                         <div style={cardStyles.leftTitle}>의미</div> 
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