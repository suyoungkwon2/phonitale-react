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
function renderStyledKeywords(indexingData, isTextFlashing) {
    if (!indexingData || !Array.isArray(indexingData) || indexingData.length === 0) {
        return null;
    }

    return indexingData.map((item, groupIndex) => {
        const key = Object.keys(item)[0];
        if (!key) return null;

        const underlineColor = UNDERLINE_COLORS[groupIndex % UNDERLINE_COLORS.length];
        const textColor = isTextFlashing ? '#FFFFFF' : '#000000';
        const style = {
            borderBottom: `4px solid ${underlineColor}`,
            paddingBottom: '2px',
            display: 'inline-block',
            color: textColor
        };
        const spanKey = `kw-${groupIndex}-${key.replace(/\s+/g, '-')}`;

        const separator = groupIndex < indexingData.length - 1 ? ', ' : null;

        return (
            <React.Fragment key={spanKey}>
                <span style={style}>{key}</span>
                {separator}
            </React.Fragment>
        );
    });
}

// --- 신규: 영어 단어 밑줄 처리 함수 (겹침 처리 로직 수정: 그룹화 + zIndex, display:inline) ---
function renderEnglishWordWithUnderlines(word, indexingData) {
    if (!word) return null;
    if (!indexingData || !Array.isArray(indexingData) || indexingData.length === 0) {
        return word;
    }

    // 1. Map character index to underline info ({ color, originalIndex })
    const underlineMap = Array(word.length).fill(null).map(() => []);
    const keywordRanges = indexingData.flatMap((item, index) => {
        const key = Object.keys(item)[0];
        const rangeString = item[key];
        if (!key || !rangeString) return [];
        const [startStr, endStr] = rangeString.split(':');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (isNaN(start) || isNaN(end) || start < 0 || start >= end || start >= word.length) {
             console.warn(`Invalid range [${start}, ${end}] for word '${word}' in key '${key}'. Skipping.`);
            return [];
        }
        return { range: [start, Math.min(end, word.length)], originalIndex: index };
    });

    keywordRanges.forEach(({ range, originalIndex }) => {
        const [start, end] = range;
        const color = UNDERLINE_COLORS[originalIndex % UNDERLINE_COLORS.length];
        for (let i = start; i < end; i++) {
            if (underlineMap[i] && !underlineMap[i].some(info => info.originalIndex === originalIndex)) {
                underlineMap[i].push({ color, originalIndex });
            }
        }
    });

    // Sort underlines for each character by originalIndex for consistent stacking order
    underlineMap.forEach(infoArray => infoArray.sort((a, b) => a.originalIndex - b.originalIndex));

    // Determine the maximum vertical level needed for each keyword based on overlaps
    const keywordVerticalLevel = {};
    for (let i = 0; i < word.length; i++) {
        underlineMap[i].forEach((info, level) => {
            const currentMaxLevel = keywordVerticalLevel[info.originalIndex] || 0;
            keywordVerticalLevel[info.originalIndex] = Math.max(currentMaxLevel, level);
        });
    }

    // 2. Group characters and render
    let parts = [];
    let currentIndex = 0;
    while (currentIndex < word.length) {
        const currentUnderlineInfo = underlineMap[currentIndex]; // Already sorted array of {color, originalIndex}
        let endIndex = currentIndex + 1;

        // Find end of segment with identical underline info
        while (
            endIndex < word.length &&
            underlineMap[endIndex].length === currentUnderlineInfo.length &&
            underlineMap[endIndex].every((info, i) =>
                info.color === currentUnderlineInfo[i].color &&
                info.originalIndex === currentUnderlineInfo[i].originalIndex
            )
        ) {
            endIndex++;
        }

        const textSegment = word.substring(currentIndex, endIndex);
        const spanKey = `ew-${currentIndex}-${endIndex}`;

        const segmentSpanStyle = {
            position: 'relative', // Crucial for absolute positioning of underlines
            display: 'inline-block', // Revert back to inline-block for stable positioning context
            // whiteSpace: 'pre' // Likely not needed with display: inline
        };

        const underlineElements = currentUnderlineInfo.map(({ color, originalIndex }) => {
            // Calculate bottom based on the pre-calculated max level for this keyword
            const level = keywordVerticalLevel[originalIndex] || 0;
            const calculatedBottom = -2 - level * 4;

            const underlineStyle = {
                position: 'absolute',
                left: 0, // Span the full width of the parent segment span
                right: 0,
                bottom: `${calculatedBottom}px`, // Use calculated level
                height: '4px',
                backgroundColor: color,
                zIndex: originalIndex + 1, // Underlines at zIndex 1, 2, 3...
                pointerEvents: 'none', // Prevent underlines from interfering with text interaction
            };
            // Using originalIndex in key ensures stability
            return <span key={`ul-${originalIndex}-${color}`} style={underlineStyle}></span>;
        });

        // New: Style for the text segment itself to ensure it's above underlines
        const textSpanStyle = {
            position: 'relative', // Necessary to establish stacking context for zIndex
            zIndex: 10, // Set higher zIndex than any underline
        };

        parts.push(
            // Each segment is a span containing text and its absolutely positioned underlines
            <span key={spanKey} style={segmentSpanStyle}>
                {/* Wrap textSegment in its own span with relative positioning and higher zIndex */}
                <span style={textSpanStyle}>{textSegment}</span>
                {underlineElements}
            </span>
        );

        currentIndex = endIndex;
    }

    // Wrap the whole thing in a container to ensure consistent inline behavior
    // No longer needed if segments are inline-block
    // return <span style={{ display: 'inline' }}>{parts}</span>;
    return <>{parts}</>; // Return fragments directly
}

// --- 신규: Verbal Cue 포맷팅 함수 ---
function formatVerbalCue(text, isTextFlashing) {
    if (!text) return text;

    const parts = [];
    let lastIndex = 0;
    // 정규식: /.../ 또는 {...} 찾기
    const regex = /(\/([^\/]+?)\/)|(\{([^\}]+?)\})/g;
    let match;

    try {
        while ((match = regex.exec(text)) !== null) {
            // Add text before the current match
            if (match.index > lastIndex) {
                parts.push(text.substring(lastIndex, match.index));
            }

            const isItalic = match[2] !== undefined; // Captured content from /.../
            const isBold = match[4] !== undefined;   // Captured content from {...}
            const content = isItalic ? match[2] : match[4];

            // 내용이 비어있지 않은 경우에만 태그 추가
            if (content && content.trim()) {
                if (isItalic) {
                    // 변경: isTextFlashing 상태에 따라 color 조건부 설정
                    const textColor = isTextFlashing ? '#FFFFFF' : '#A47A5C';
                    const style = { color: textColor , fontWeight: 'bold'};
                    parts.push(<strong key={`part-${match.index}`} style={style}>{content}</strong>);
                } else if (isBold) {
                    // 변경: isTextFlashing 상태일 때 흰색으로 만들기 위해 스타일 추가
                    const style = isTextFlashing ? { color: '#FFFFFF' } : {};
                    parts.push(<strong key={`part-${match.index}`} style={style}>{content}</strong>);
                }
            }

            lastIndex = regex.lastIndex;
        }

        // Add any remaining text after the last match
        if (lastIndex < text.length) {
            parts.push(text.substring(lastIndex));
        }

        // Wrap parts in fragments for stable keys if they are just strings
        return React.createElement(React.Fragment, null, ...parts.map((part, index) =>
            React.isValidElement(part) ? part : <React.Fragment key={`text-${index}`}>{part}</React.Fragment>
        ));
    } catch (error) {
        console.error("Error formatting verbal cue:", error, "Text:", text);
        return text; // 오류 발생 시 원본 텍스트 반환
    }
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
      margin: '16px 0', // 행과 행 사이 간격 
    },
    englishWordText: {
      fontSize: '26px', fontWeight: 500, fontFamily: 'Rubik, sans-serif', 
      position: 'relative', display: 'inline-block', color: '#000000', lineHeight: '1.2',
    },
    keyWordsText: { 
        fontSize: '18px', 
        color: '#000000',
        lineHeight: '1.6', 
        display: 'inline-flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '4px',
        fontWeight: 500,
    },
    koreanMeaningText: { 
        fontSize: '18px', 
        fontWeight: 500,
        color: '#000000' 
    },
    verbalCueText: { fontSize: '18px', color: '#000000', lineHeight: '1.6' },
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
    const timestampInRef = useRef(null);
    const roundNumber = parseInt(roundNumberStr, 10);
    const [isTextFlashing, setIsTextFlashing] = useState(false);
    const wordDisplayRef = useRef(null);
    const startTimeRef = useRef(null);

    // --- 새로고침 방지 --- 
    useEffect(() => {
        const handleBeforeUnload = (event) => {
            event.preventDefault();
            event.returnValue = ''; 
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

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
                const activationDelay = 15;
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
    const keywordIndicesForStyling = currentWordData?.keyword_refined;
    const displayVerbalCue = currentWordData?.verbal_cue;

    // --- 데이터 확인 로그 추가 --- 
    console.log(`LearningPage Render: Word '${currentWordData?.word}', keyword_refined data passed to render:`, keywordIndicesForStyling);
    // --- 데이터 확인 로그 끝 --- 

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
                    영어 단어의 발음과 키워드, 연상 문장을 함께 연상하여, <br />
                    영어 단어와 의미를 암기하세요.
                </div>

                 <div style={cardStyles.blockContainer}> 
                     <div style={cardStyles.rowWrapper}> 
                         <div style={cardStyles.leftTitle}>영어 단어</div> 
                         <div style={cardStyles.rightContent}> 
                             <span /* ref={wordContainerRef} */ style={{...cardStyles.englishWordText, color: isTextFlashing ? '#FFFFFF' : '#000000'}}> 
                                 {renderEnglishWordWithUnderlines(currentWordData.word, currentWordData.keyword_refined)}
                             </span> 
                         </div> 
                     </div>
                     <div style={cardStyles.dashedBorder}></div> 
                     <div style={cardStyles.rowWrapper}> 
                         <div style={cardStyles.leftTitle}>키워드</div> 
                         <div style={cardStyles.rightContent}> 
                             <span style={cardStyles.keyWordsText}>
                                 {renderStyledKeywords(keywordIndicesForStyling, isTextFlashing)}
                             </span>
                         </div> 
                     </div>
                 </div> 
 
                 <div style={cardStyles.blockContainer}> 
                     <div style={cardStyles.rowWrapper}> 
                         <div style={cardStyles.leftTitle}>의미</div> 
                         <div style={cardStyles.rightContent}> 
                             <span style={{...cardStyles.koreanMeaningText, color: isTextFlashing ? '#FFFFFF' : '#000000'}}>{currentWordData.meaning}</span> 
                         </div> 
                     </div>
                      <div style={cardStyles.dashedBorder}></div> 
                      <div style={cardStyles.rowWrapper}> 
                          <div style={cardStyles.leftTitle}>연상 문장</div> 
                          <div style={cardStyles.rightContent}> 
                              <span style={{...cardStyles.verbalCueText, color: isTextFlashing ? '#FFFFFF' : '#000000'}}>
                                  {formatVerbalCue(displayVerbalCue, isTextFlashing)}
                              </span> 
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