import React, { useState, useEffect, useRef } from 'react';
import { Progress, Spin } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import BlueButton from '../components/BlueButton';
import { useExperiment } from '../context/ExperimentContext';

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

// 변경: Key Words 렌더링 전용 함수 (renderWordWithUnderlines -> renderStyledKeywords)
function renderStyledKeywords(wordString, indexingData) {
    if (!wordString) return null;
    if (!indexingData || !Array.isArray(indexingData) || indexingData.length === 0) {
        return wordString; // 인덱싱 정보 없으면 원본 문자열 반환
    }

    // indexingData의 key 값들을 기준으로 wordString을 분할하고 스타일 적용
    let parts = [wordString]; // 초기값: 전체 문자열
    const sortedIndices = [...indexingData].sort((a, b) => (a.range && b.range) ? a.range[0] - b.range[0] : 0);

    sortedIndices.forEach(({ key }, groupIndex) => {
        const color = UNDERLINE_COLORS[groupIndex % UNDERLINE_COLORS.length];
        const style = {
            borderBottom: `4px solid ${color}`,
            paddingBottom: '2px',
            // 키워드는 inline으로 유지 (단어별 밑줄)
        };
        const spanKey = `kw-${groupIndex}-${key}`; 

        let newParts = [];
        parts.forEach((part, partIndex) => {
            if (typeof part === 'string') {
                const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                const regex = new RegExp(escapedKey, 'g');
                let subLastIndex = 0;
                let match;
                while ((match = regex.exec(part)) !== null) {
                    if (match.index > subLastIndex) {
                        newParts.push(part.substring(subLastIndex, match.index));
                    }
                    newParts.push(<span key={`${spanKey}-${match.index}`} style={style}>{match[0]}</span>);
                    subLastIndex = regex.lastIndex;
                }
                if (subLastIndex < part.length) {
                    newParts.push(part.substring(subLastIndex));
                }
            } else {
                newParts.push(part); // 이미 생성된 JSX 요소 유지
            }
        });
        parts = newParts;
    });

    // 최종 배열을 쉼표로 결합 (map으로 변경하여 key 부여 용이하게)
    const result = parts.map((part, index) => {
        // 문자열 사이에만 쉼표 추가 (마지막 제외)
        if (typeof part === 'string' && index > 0 && typeof parts[index-1] !== 'string') {
             // 수정: 키워드 사이의 쉼표 처리 (필요시 문자열 직접 추가)
             // 이 로직은 키워드가 정확히 일치할 때만 동작하므로,
             // 원본 displayKeywordString에 쉼표가 포함되어 있다면 그대로 두는 것이 나을 수 있음
             // return [<span key={`sep-${index}`}>, </span>, part]; // 예시
        }
        // 기본적으로는 part 반환
        // return <React.Fragment key={index}>{part}</React.Fragment>; // key 추가
         return part; // 단순화: 키워드 분리/쉼표 로직은 displayKeywordString 생성 시 처리 가정
    });
    
    // return result; // map을 사용하면 불필요
    return parts; // 원본 로직 유지 (개선 필요시 수정)
}

// --- 신규: 밑줄 스타일 계산 함수 ---
function calculateUnderlineStyles(word, indexingData, containerElement) {
    if (!word || !indexingData || !Array.isArray(indexingData) || indexingData.length === 0 || !containerElement) {
        return [];
    }

    const calculatedStyles = [];
    let overlapLevels = {}; // 각 시작점(start)에서의 겹침 레벨을 기록
    const underlineHeight = 4; // 높이 조정 (Key Words와 동일하게 4px로 변경)
    const verticalGap = 1; // 간격 유지
    const baseTopOffset = '100%'; // 기준 위치 유지

    // 컨테이너의 시작 위치 (기준점)
    const containerRect = containerElement.getBoundingClientRect();
    
    // 임시 span 스타일 (측정용)
    const tempSpanStyle = {
        position: 'absolute',
        visibility: 'hidden',
        whiteSpace: 'pre', // 공백 유지
        fontFamily: 'Rubik, sans-serif',
        fontSize: '36px', 
        fontWeight: 500,
        // 필요한 다른 스타일 속성 추가 (예: letterSpacing)
    };

    const sortedIndices = [...indexingData].sort((a, b) => (a.range && b.range) ? a.range[0] - b.range[0] : 0);

    sortedIndices.forEach(({ key, range }, groupIndex) => {
        if (!range) return;
        let [start, end] = range;

        // 범위 유효성 검사
        if (start === null || end === null || start >= end || start < 0 || start >= word.length) {
            console.warn(`Invalid start/end range detected and skipped: [${start}, ${end}] for word "${word}"`);
            return;
        }
        const renderEnd = Math.min(end, word.length);
        if (end > word.length) {
            console.warn(`End index ${end} exceeds word length ${word.length}. Rendering underline up to ${renderEnd} for word "${word}"`);
        }

        // --- 픽셀 기반 위치 및 너비 계산 --- 
        let calculatedLeftPx = 0;
        let calculatedWidthPx = 0;

        try {
            // 시작 위치 계산용 임시 span
            const prefixSpan = document.createElement('span');
            Object.assign(prefixSpan.style, tempSpanStyle);
            prefixSpan.textContent = word.substring(0, start);
            containerElement.appendChild(prefixSpan);
            calculatedLeftPx = prefixSpan.offsetWidth; // 시작 offset
            containerElement.removeChild(prefixSpan);

            // 너비 계산용 임시 span
            const targetSpan = document.createElement('span');
            Object.assign(targetSpan.style, tempSpanStyle);
            targetSpan.textContent = word.substring(start, renderEnd);
            containerElement.appendChild(targetSpan);
            calculatedWidthPx = targetSpan.offsetWidth; // 실제 너비
            containerElement.removeChild(targetSpan);

        } catch (error) {
            console.error("Error calculating underline dimensions:", error);
            // 오류 발생 시 백분율 기반으로 대체 (선택 사항)
            calculatedLeftPx = (start / word.length) * containerRect.width;
            calculatedWidthPx = ((renderEnd - start) / word.length) * containerRect.width;
        }
        // --- 계산 끝 --- 

        // 겹침 레벨 계산
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
            left: `${calculatedLeftPx}px`, // 픽셀 값 사용
            width: `${calculatedWidthPx}px`, // 픽셀 값 사용
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

// --- Learning Page Component ---
const LearningPage = () => {
    const { roundNumber: roundNumberStr } = useParams();
    const navigate = useNavigate();
    const { wordList: wordsByRound, isLoadingWords } = useExperiment();
    const [shuffledWords, setShuffledWords] = useState([]);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [isNextButtonEnabled, setIsNextButtonEnabled] = useState(false);
    const [startTime, setStartTime] = useState(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const timerRef = useRef(null);
    const audioTimeoutRefs = useRef([]);
    const wordContainerRef = useRef(null); // 영어 단어 컨테이너 ref 추가
    const [underlineStyles, setUnderlineStyles] = useState([]); // 밑줄 스타일 상태 추가

    const roundNumber = parseInt(roundNumberStr, 10);

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
        if (isLoadingWords || shuffledWords.length === 0 || currentWordIndex >= shuffledWords.length) {
            if (timerRef.current) clearInterval(timerRef.current);
            audioTimeoutRefs.current.forEach(clearTimeout);
            audioTimeoutRefs.current = [];
            return;
        }

        const currentWordData = shuffledWords[currentWordIndex];

        setTimeLeft(30);
        setIsNextButtonEnabled(false);
        setStartTime(Date.now());

        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft(prevTime => {
                if (prevTime <= 1) {
                    clearInterval(timerRef.current);
                    handleNextClick(true); // Timeout
                    return 0;
                }
                if (prevTime === 30) { 
                    setIsNextButtonEnabled(true);
                }
                return prevTime - 1;
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
            if (timerRef.current) clearInterval(timerRef.current);
            audioTimeoutRefs.current.forEach(clearTimeout);
            audioTimeoutRefs.current = [];
        };
    }, [currentWordIndex, shuffledWords, isLoadingWords]);

    // --- 신규: 밑줄 스타일 계산 useEffect ---
    useEffect(() => {
        if (!isLoadingWords && shuffledWords.length > 0 && currentWordIndex < shuffledWords.length && wordContainerRef.current) {
            const currentWordData = shuffledWords[currentWordIndex];
            const keywordKey = `kss_keyword_refined`;
            const keywordIndexingString = currentWordData[keywordKey];
            const keywordIndices = parseIndexingString(keywordIndexingString);

            const styles = calculateUnderlineStyles(currentWordData.word, keywordIndices, wordContainerRef.current);
            setUnderlineStyles(styles);
        }
         else {
             setUnderlineStyles([]); // 로딩 중이거나 데이터 없으면 초기화
         }
    }, [currentWordIndex, shuffledWords, isLoadingWords, wordContainerRef.current]); // ref.current도 의존성 배열에 포함

    const handleNextClick = (isTimeout = false) => {
        if (timerRef.current) clearInterval(timerRef.current);

        const endTime = Date.now();
        const duration = startTime ? Math.round((endTime - startTime) / 1000) : 0;
        const currentWord = shuffledWords[currentWordIndex];

        console.log(`Learning Word: ${currentWord?.word}, Duration: ${duration}s, Timeout: ${isTimeout}`);

        setIsTransitioning(true);
        setTimeout(() => {
            if (currentWordIndex < shuffledWords.length - 1) {
                setCurrentWordIndex(prevIndex => prevIndex + 1);
                setIsTransitioning(false);
            } else {
                 console.log(`Learning Round ${roundNumber} Complete.`);
                 navigate(`/round/${roundNumber}/recognition/start`);
            }
        }, 500);
    };

    if (isLoadingWords) {
        return <MainLayout><div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div></MainLayout>;
    }

    if (shuffledWords.length === 0 || currentWordIndex >= shuffledWords.length) {
        return <MainLayout><div>No words for this round or loading error.</div></MainLayout>;
    }

    const currentWordData = shuffledWords[currentWordIndex];
    const progressPercent = Math.round(((currentWordIndex + 1) / shuffledWords.length) * 100);

    const keywordKey = `kss_keyword_refined`;
    const verbalCueKey = `kss_verbal_cue`;
    const keywordIndexingString = currentWordData[keywordKey];
    const keywordIndices = parseIndexingString(keywordIndexingString);
    const displayKeywordString = keywordIndices.length > 0 ? keywordIndices.map(item => item.key).join(', ') : (keywordIndexingString || "N/A");
    const displayVerbalCue = currentWordData[verbalCueKey];

    // --- Render Logic ---
    return (
        <MainLayout>
            <div 
                className="learning-content-wrapper" 
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
                        <span style={{ fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#868686' }}>Round {roundNumber} | Learning</span>
                        <span style={{ fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#868686' }}>{currentWordIndex + 1} / {shuffledWords.length}</span>
                    </div>
                    <Progress percent={progressPercent} showInfo={false} strokeColor="#2049FF" />
                </div>

                {/* Instruction Text */}                
                <div className="instruction-text" style={{ fontFamily: 'BBTreeGo_R, sans-serif', fontSize: '20px', color: '#000', textAlign: 'center', marginBottom: '32px', whiteSpace: 'pre-line' }}>
                    영어 단어의 발음과 주어진 문장을 연상하여,<br/>
                    떠오르는 시각적인 장면을 상상해보세요.
                </div>

                {/* Word Display Section */}                
                <div className="word-display-section" style={{ 
                    width: '100%', 
                    maxWidth: '550px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    marginBottom: '32px',
                }}>
                    {/* Base Card Style */}                    
                    <div className="word-card english-word-card" style={{ 
                        background: '#fff', 
                        borderRadius: '20px', 
                        padding: '20px 32px', 
                        boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.25)', 
                        position: 'relative', 
                        minHeight: '80px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        marginBottom: '16px' 
                    }}>
                        <span className="word-card-label" style={{ position: 'absolute', top: '50%', left: '-100px', transform: 'translateY(-50%)', fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#C7C7C7', width: '90px', textAlign: 'right' }}>English Words</span>
                        <span 
                            ref={wordContainerRef} // ref 할당
                            className="english-word-text-container" 
                            style={{ 
                                position: 'relative', 
                                display: 'inline-block', 
                            }}
                        >
                            <span className="english-word-text" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '36px', fontWeight: 500, color: '#000' }}>
                                {currentWordData.word}
                            </span>
                            {underlineStyles.map(({ key, style }) => (
                                <div key={key} className="english-underline" style={style}></div>
                            ))}
                        </span>
                    </div>
                     <div className="word-card key-words-card" style={{ 
                         background: '#fff', 
                         padding: '20px 32px', 
                         boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.25)', 
                         position: 'relative', 
                         minHeight: '80px', 
                         display: 'flex', 
                         flexDirection: 'column', 
                         justifyContent: 'center', 
                         alignItems: 'center',
                         borderRadius: '20px 20px 0 0', 
                         paddingTop: '25px', 
                         paddingBottom: '10px' 
                     }}>
                         <span className="word-card-label" style={{ position: 'absolute', top: '50%', left: '-100px', transform: 'translateY(-50%)', fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#C7C7C7', width: '90px', textAlign: 'right' }}>Key Words</span>
                        <span className="key-words-text" style={{ fontFamily: 'BBTreeGo_R, sans-serif', fontSize: '20px', color: '#000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            {renderStyledKeywords(displayKeywordString, keywordIndices)}
                        </span>
                    </div>
                    <div className="word-card verbal-cue-card" style={{ 
                        background: '#fff', 
                        padding: '15px 32px', 
                        boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.25)', 
                        position: 'relative', 
                        minHeight: '80px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        borderTop: '1px dashed #C7C7C7', 
                        borderBottom: '1px dashed #C7C7C7', 
                        borderRadius: 0, 
                        lineHeight: 1.6 
                    }}>
                         <span className="word-card-label" style={{ position: 'absolute', top: '50%', left: '-100px', transform: 'translateY(-50%)', fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#C7C7C7', width: '90px', textAlign: 'right' }}>Verbal Cue</span>
                        <span className="verbal-cue-text" style={{ fontFamily: 'BBTreeGo_R, sans-serif', fontSize: '20px', color: '#000' }}>{displayVerbalCue}</span>
                    </div>
                    <div className="word-card korean-meaning-card" style={{ 
                        background: '#fff', 
                        padding: '20px 32px', 
                        boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.25)', 
                        position: 'relative', 
                        minHeight: '80px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        borderRadius: '0 0 20px 20px', 
                        paddingTop: '10px', 
                        paddingBottom: '25px' 
                    }}>
                         <span className="word-card-label" style={{ position: 'absolute', top: '50%', left: '-100px', transform: 'translateY(-50%)', fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#C7C7C7', width: '90px', textAlign: 'right' }}>Korean Meaning</span>
                        <span className="korean-meaning-text" style={{ fontFamily: 'BBTreeGo_R, sans-serif', fontSize: '30px', color: '#000' }}>{currentWordData.meaning}</span>
                    </div>
                </div>

                {/* Footer Section */}                
                <div className="footer-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <span className="timer-text" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#868686' }}>{timeLeft}s</span>
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