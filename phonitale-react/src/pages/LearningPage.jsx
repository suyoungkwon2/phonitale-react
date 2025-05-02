import React, { useState, useEffect, useRef } from 'react';
import { Progress, Spin, message } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import BlueButton from '../components/BlueButton';
import { useExperiment } from '../context/ExperimentContext';
import { submitResponse } from '../utils/api';

// --- Helper Functions (from original script) ---
// CSV Parser
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    const data = lines.slice(1).map(line => {
        const values = [];
        let currentMatch = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"' && (i === 0 || line[i-1] !== '\\')) { 
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(currentMatch.trim().replace(/^"|"$/g, ''));
                currentMatch = '';
            } else {
                currentMatch += char;
            }
        }
        values.push(currentMatch.trim().replace(/^"|"$/g, '')); 
        const entry = {};
        headers.forEach((header, index) => {
            entry[header] = values[index] !== undefined ? values[index] : '';
        });
        return entry;
    });
    return data;
}

// Indexing String Parser
function parseIndexingString(indexString) {
    if (!indexString || typeof indexString !== 'string' || !indexString.startsWith('[')) {
        return [];
    }
    const indices = [];
    const regex = /\{'([^\']+)\':\s*'(\d+):(\d+)\'\}/g;
    let match;
    while ((match = regex.exec(indexString)) !== null) {
        const key = match[1];
        const start = parseInt(match[2], 10);
        const end = parseInt(match[3], 10);
        if (!isNaN(start) && !isNaN(end)) {
            indices.push({ key: key, range: [start, end] });
        }
    }
    return indices;
}

// Underline Renderer Constants (색상 변경)
const UNDERLINE_COLORS = [
    '#7F97FF', // rgba(127, 151, 255, 0.7)
    '#97DA9B', // rgba(151, 218, 155, 0.7)
    '#FFBABA', // rgba(255, 186, 186, 0.7)
    '#E2D98A', // rgba(226, 217, 138, 0.7)
    '#FFB991', // rgba(255, 185, 145, 0.7)
];

// 변경: Key Words 렌더링 전용 함수 (스타일링 + 쉼표 구분)
function renderStyledKeywords(indexingData) {
    if (!indexingData || !Array.isArray(indexingData) || indexingData.length === 0) {
        return null;
    }

    return indexingData.map(({ key }, groupIndex) => {
        const color = UNDERLINE_COLORS[groupIndex % UNDERLINE_COLORS.length];
        const style = {
            borderBottom: `4px solid ${color}`,
            paddingBottom: '2px',
            display: 'inline-block',
        };
        const spanKey = `kw-${groupIndex}-${key}`;

        const separator = groupIndex < indexingData.length - 1 ? ', ' : null;

        return (
            <React.Fragment key={spanKey}> 
                <span style={style}>{key}</span>
                {separator}
            </React.Fragment>
        );
    });
}

// --- 신규: 밑줄 스타일 계산 함수 ---
function calculateUnderlineStyles(word, indexingData, containerElement) {
    if (!word || !indexingData || !Array.isArray(indexingData) || indexingData.length === 0 || !containerElement) {
        return [];
    }

    const calculatedStyles = [];
    let overlapLevels = {};
    const underlineHeight = 4;
    const verticalGap = 1;
    const baseTopOffset = '100%';

    const containerRect = containerElement.getBoundingClientRect();
    
    const tempSpanStyle = {
        position: 'absolute',
        visibility: 'hidden',
        whiteSpace: 'pre',
        fontFamily: 'Rubik, sans-serif',
        fontSize: '36px', 
        fontWeight: 500,
    };

    const sortedIndices = [...indexingData].sort((a, b) => (a.range && b.range) ? a.range[0] - b.range[0] : 0);

    sortedIndices.forEach(({ key, range }, groupIndex) => {
        if (!range) return;
        let [start, end] = range;

        if (start === null || end === null || start >= end || start < 0 || start >= word.length) {
            console.warn(`Invalid start/end range detected and skipped: [${start}, ${end}] for word "${word}"`);
            return;
        }
        const renderEnd = Math.min(end, word.length);
        if (end > word.length) {
            console.warn(`End index ${end} exceeds word length ${word.length}. Rendering underline up to ${renderEnd} for word "${word}"`);
        }

        let calculatedLeftPx = 0;
        let calculatedWidthPx = 0;

        try {
            const prefixSpan = document.createElement('span');
            Object.assign(prefixSpan.style, tempSpanStyle);
            prefixSpan.textContent = word.substring(0, start);
            containerElement.appendChild(prefixSpan);
            calculatedLeftPx = prefixSpan.offsetWidth;
            containerElement.removeChild(prefixSpan);

            const targetSpan = document.createElement('span');
            Object.assign(targetSpan.style, tempSpanStyle);
            targetSpan.textContent = word.substring(start, renderEnd);
            containerElement.appendChild(targetSpan);
            calculatedWidthPx = targetSpan.offsetWidth;
            containerElement.removeChild(targetSpan);

        } catch (error) {
            console.error("Error calculating underline dimensions:", error);
            calculatedLeftPx = (start / word.length) * containerRect.width;
            calculatedWidthPx = ((renderEnd - start) / word.length) * containerRect.width;
        }

        let currentOverlapLevel = 0;
        const startPx = calculatedLeftPx;
        const endPx = calculatedLeftPx + calculatedWidthPx;
        for (let px = Math.floor(startPx); px < Math.ceil(endPx); px++) {
            if (overlapLevels[px] !== undefined) {
                currentOverlapLevel = Math.max(currentOverlapLevel, overlapLevels[px] + 1);
            }
        }
        for (let px = Math.floor(startPx); px < Math.ceil(endPx); px++) {
            overlapLevels[px] = currentOverlapLevel;
        }

        const color = UNDERLINE_COLORS[groupIndex % UNDERLINE_COLORS.length];
        const calculatedTop = `calc(${baseTopOffset} + ${currentOverlapLevel * (underlineHeight + verticalGap)}px)`;

        const style = {
            position: 'absolute',
            left: `${calculatedLeftPx}px`,
            width: `${calculatedWidthPx}px`,
            top: calculatedTop,
            height: `${underlineHeight}px`,
            backgroundColor: color,
        };

        const underlineKey = `ul-${groupIndex}-${start}-${end}`;
        calculatedStyles.push({ key: underlineKey, style: style });
    });

    return calculatedStyles;
}

// Fisher-Yates Shuffle
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

// --- 카드 스타일 정의 (그룹핑 반영) --- 
const cardStyles = {
    // 각 블록(그룹) 컨테이너 스타일
    blockContainer: {
      background: '#FFFFFF',
      borderRadius: '12px', 
      padding: '24px', // 패딩 24px로 수정
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      width: '100%', 
      maxWidth: '685px', // 전체 너비 제한
      display: 'flex',
      flexDirection: 'column',
    },
    rowWrapper: { 
      display: 'flex',
      width: '100%',
      alignItems: 'center', // 세로 중앙 정렬 추가
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
      margin: '16px 0', // 행과 행 사이 간격 
    },
    englishWordText: {
      fontSize: '36px', fontWeight: 500, fontFamily: 'Rubik, sans-serif', 
      position: 'relative', display: 'inline-block', color: '#000000', lineHeight: '1.2',
    },
    keyWordsText: { 
        fontSize: '14px', 
        color: '#000000', 
        lineHeight: '1.6', 
        display: 'inline-flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '4px'
    },
    koreanMeaningText: { fontSize: '20px', fontWeight: 'bold', color: '#000000' },
    verbalCueText: { fontSize: '14px', color: '#000000', lineHeight: '1.6' },
  };

// --- Learning Page Component ---
const LearningPage = () => {
    const { roundNumber: roundNumberStr, groupCode } = useParams();
    const navigate = useNavigate();
    const { userId, group, wordList: wordsByRound, isLoadingWords, currentRound, setCurrentRound } = useExperiment();
    const [shuffledWords, setShuffledWords] = useState([]);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [isNextButtonEnabled, setIsNextButtonEnabled] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const timerRef = useRef(null);
    const audioTimeoutRefs = useRef([]);
    const wordContainerRef = useRef(null);
    const [underlineStyles, setUnderlineStyles] = useState([]);
    const timestampInRef = useRef(null);
    const roundNumber = parseInt(roundNumberStr, 10);
    const [isTextFlashing, setIsTextFlashing] = useState(false);
    const wordDisplayRef = useRef(null);
    const startTimeRef = useRef(null);

    useEffect(() => {
        if (!isLoadingWords && Object.keys(wordsByRound).length > 0) {
            const wordsForCurrentRound = wordsByRound[roundNumber] || [];
            console.log(`LearningPage Round ${roundNumber}: Loaded ${wordsForCurrentRound.length} words.`);
            
            if (wordsForCurrentRound.length > 0) {
                const shuffled = shuffleArray([...wordsForCurrentRound]);
                setShuffledWords(shuffled);
            } else {
                 setShuffledWords([]);
                 console.warn(`No words found for round ${roundNumber}`);
            }
            setCurrentWordIndex(0);
        } else if (!isLoadingWords && Object.keys(wordsByRound).length === 0) {
            console.error("Word list object is empty after loading.");
            setShuffledWords([]);
        }
    }, [wordsByRound, isLoadingWords, roundNumber]);

    useEffect(() => {
        console.log(`[LearningPage useEffect WordChange Start] Index: ${currentWordIndex}, isLoading: ${isLoadingWords}, shuffledWords length: ${shuffledWords.length}`);
        if (isLoadingWords || shuffledWords.length === 0 || currentWordIndex >= shuffledWords.length) {
            console.log("[useEffect WordChange] Conditions not met or cleanup needed.");
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            audioTimeoutRefs.current.forEach(clearTimeout);
            audioTimeoutRefs.current = [];
            return;
        }

        console.log(`[LearningPage useEffect WordChange] Setting up for word index: ${currentWordIndex}`);
        setIsTransitioning(false);
        setIsNextButtonEnabled(false);
        setTimeLeft(30);
        timestampInRef.current = new Date().toISOString();
        console.log(`[LearningPage useEffect WordChange] State Reset Complete. isTransitioning: false`);

        const currentWordData = shuffledWords[currentWordIndex];

        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft(prevTime => {
                if (prevTime <= 1) {
                    console.log("LearningPage Timer Expired! Auto-advancing...");
                    if (timerRef.current) {
                        clearInterval(timerRef.current);
                        timerRef.current = null;
                    }
                    handleNextClick(true);
                    return 0;
                }

                const nextTime = prevTime - 1;
                const activationDelay = 2;
                if (!isNextButtonEnabled && (30 - nextTime) >= activationDelay) {
                    console.log(`[Timer Tick] Enabling Next button: currentTime=${nextTime}, delay=${activationDelay}`);
                    setIsNextButtonEnabled(true);
                }

                return nextTime;
            });
        }, 1000);

        audioTimeoutRefs.current.forEach(clearTimeout);
        audioTimeoutRefs.current = [];

        if (currentWordData?.audio_path) {
            const audioPath = `/${currentWordData.audio_path}`;
            const playAudio = () => {
                try {
                    const audio = new Audio(audioPath);
                    audio.play().catch(e => console.error("Audio play failed:", e));
                    console.log(`Playing audio: ${audioPath}`);
                } catch (error) {
                    console.error("Error creating or playing audio:", error);
                }
            };

            const timeoutId1 = setTimeout(playAudio, 2000);
            const timeoutId2 = setTimeout(playAudio, 7000);

            audioTimeoutRefs.current.push(timeoutId1, timeoutId2);
        } else {
            console.warn(`Audio path not found for word: ${currentWordData?.word}`);
        }

        if (wordContainerRef.current) {
            const keywordIndicesStringForUnderline = currentWordData?.kss_keyword_refined;
            const keywordIndicesForUnderline = parseIndexingString(keywordIndicesStringForUnderline);
            const styles = calculateUnderlineStyles(currentWordData.word, keywordIndicesForUnderline, wordContainerRef.current);
            setUnderlineStyles(styles);
        } else {
            setUnderlineStyles([]);
        }

        return () => {
            console.log(`[LearningPage useEffect WordChange] Cleanup for index: ${currentWordIndex}`);
            if (timerRef.current) {
                 clearInterval(timerRef.current);
                 timerRef.current = null;
             }
            audioTimeoutRefs.current.forEach(clearTimeout);
            audioTimeoutRefs.current = [];
        };
    }, [currentWordIndex, shuffledWords, isLoadingWords]);

    const handleNextClick = async (isTimeout = false) => {
        console.log(`[LearningPage handleNextClick Start] Index: ${currentWordIndex}, Timeout: ${isTimeout}, isTransitioning: ${isTransitioning}`);
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            console.log("[LearningPage handleNextClick] Timer cleared.");
        }
        if (!isTimeout && isTransitioning) {
            console.log("[LearningPage handleNextClick Blocked] Already transitioning.");
            return;
        }

        setIsTextFlashing(true);
        setIsTransitioning(true);
        setIsNextButtonEnabled(false);
        console.log("[LearningPage handleNextClick State] Set isTransitioning: true, isNextButtonEnabled: false");

        setTimeout(() => setIsTextFlashing(false), 700);

        const timestampOut = new Date();
        const timestampIn = timestampInRef.current;
        const currentWord = shuffledWords[currentWordIndex] || {};
        let duration = null;
        if (timestampIn && timestampOut) {
            try { duration = Math.round((new Date(timestampOut) - new Date(timestampIn)) / 1000); } catch (e) { console.error("Error calculating duration:", e); }
        }

        console.log(`[LearningPage handleNextClick Data] Word: ${currentWord?.word}, Duration: ${duration}s, Timeout: ${isTimeout}`);

        if (!userId) {
            console.error("[LearningPage handleNextClick Error] User ID not found!");
            message.error("User ID not found. Cannot save response.");
            setIsTransitioning(false);
            console.log("[LearningPage handleNextClick State] User ID Error - Set isTransitioning: false");
            return;
        }

        try {
            console.log("[LearningPage handleNextClick API] Calling submitResponse...");
            const responseData = {
                user: userId,
                english_word: currentWord.word,
                round_number: roundNumber,
                page_type: 'learning',
                timestamp_in: timestampIn,
                timestamp_out: timestampOut.toISOString(),
                duration: duration,
            };
            await submitResponse(responseData, group);
            console.log(`Response for ${currentWord.word} submitted successfully with group ${group}.`);

            if (currentWordIndex < shuffledWords.length - 1) {
                const nextIndex = currentWordIndex + 1;
                console.log(`[LearningPage handleNextClick Nav] Setting next index: ${nextIndex}`);
                setCurrentWordIndex(nextIndex);
            } else {
                console.log(`[LearningPage handleNextClick Nav] Round ${roundNumber} Complete. Navigating to /${groupCode}/round/${roundNumber}/recognition/start`);
                navigate(`/${groupCode}/round/${roundNumber}/recognition/start`);
            }

        } catch (error) {
            console.error("[LearningPage handleNextClick Error] Failed to submit learning response:", error);
            message.error(`Failed to save response: ${error.message || 'Unknown error'}`);
            setIsTransitioning(false);
            console.log("[LearningPage handleNextClick State] API Error - Set isTransitioning: false");
        }
        console.log("[LearningPage handleNextClick End]");
    };

    if (isLoadingWords) {
        return <MainLayout><div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div></MainLayout>;
    }

    if (shuffledWords.length === 0 || currentWordIndex >= shuffledWords.length) {
        return <MainLayout><div>No words for this round or loading error.</div></MainLayout>;
    }

    const currentWordData = shuffledWords[currentWordIndex];
    const progressPercent = Math.round(((currentWordIndex + 1) / shuffledWords.length) * 100);
    const keywordIndicesStringForStyling = currentWordData?.kss_keyword_refined;
    const keywordIndicesForStyling = parseIndexingString(keywordIndicesStringForStyling);
    const displayVerbalCue = currentWordData?.kss_verbal_cue;

    return (
        <MainLayout>
            <div 
                className="learning-content-wrapper" 
                style={{ 
                    opacity: isTransitioning && !isTextFlashing ? 0 : 1,
                    transition: 'opacity 0.3s ease-in-out',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '24px'
                }}
            >
                <div style={{ width: '100%', maxWidth: '685px' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                         <span style={{ fontSize: '16px', color: '#656565' }}>Round {roundNumber} | Learning</span>
                         <span style={{ fontSize: '16px', color: '#656565' }}>{currentWordIndex + 1} / {shuffledWords.length}</span>
                     </div>
                    <Progress percent={progressPercent} showInfo={false} strokeColor="#2049FF" />
                </div>

                <div style={{ color: '#656565', textAlign: 'center', whiteSpace: 'pre-line' }}>
                    영어 단어의 발음과 주어진 문장을 연상하여, 
                    영어 단어와 한국어 의미를 암기하세요.
                </div>

                 <div style={cardStyles.blockContainer}> 
                     <div style={cardStyles.rowWrapper}> 
                         <div style={cardStyles.leftTitle}>English Words</div> 
                         <div style={cardStyles.rightContent}> 
                             <span ref={wordContainerRef} style={{...cardStyles.englishWordText, color: isTextFlashing ? '#FFFFFF' : '#000000'}}> 
                                 {currentWordData.word}
                                  {underlineStyles.map(({ key, style }) => ( 
                                     <div key={key} className="english-underline" style={{...style, backgroundColor: isTextFlashing ? 'transparent' : style.backgroundColor }}></div> 
                                 ))} 
                             </span> 
                         </div> 
                     </div>
                     <div style={cardStyles.dashedBorder}></div> 
                     <div style={cardStyles.rowWrapper}> 
                         <div style={cardStyles.leftTitle}>Key Words</div> 
                         <div style={cardStyles.rightContent}> 
                             <span style={{...cardStyles.keyWordsText, color: isTextFlashing ? '#FFFFFF' : '#000000'}}> 
                                 {renderStyledKeywords(keywordIndicesForStyling)} 
                             </span>
                         </div> 
                     </div>
                 </div> 
 
                 <div style={cardStyles.blockContainer}> 
                     <div style={cardStyles.rowWrapper}> 
                         <div style={cardStyles.leftTitle}>Korean Meaning</div> 
                         <div style={cardStyles.rightContent}> 
                             <span style={{...cardStyles.koreanMeaningText, color: isTextFlashing ? '#FFFFFF' : '#000000'}}>{currentWordData.meaning}</span> 
                         </div> 
                     </div>
                      <div style={cardStyles.dashedBorder}></div> 
                      <div style={cardStyles.rowWrapper}> 
                          <div style={cardStyles.leftTitle}>Verbal Cue</div> 
                          <div style={cardStyles.rightContent}> 
                              <span style={{...cardStyles.verbalCueText, color: isTextFlashing ? '#FFFFFF' : '#000000'}}>{displayVerbalCue}</span> 
                          </div> 
                      </div> 
                 </div> 

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
                         disabled={!isNextButtonEnabled}
                     />
                 </div> 
            </div>
        </MainLayout>
    );
};

export default LearningPage; 