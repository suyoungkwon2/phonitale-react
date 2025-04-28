import React, { useState, useEffect, useRef } from 'react';
import { Progress, Rate, Spin, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import BlueButton from '../components/BlueButton';
import { useExperiment } from '../context/ExperimentContext';
import { submitResponse } from '../utils/api';

// --- Helper Functions (LearningPage에서 재복사) ---
// Indexing String Parser
function parseIndexingString(indexString) {
    if (!indexString || typeof indexString !== 'string' || !indexString.startsWith('[')) {
        return [];
    }
    const indices = [];
    // LearningPage 정규식 사용
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

// LearningPage와 동일한 함수 -> 수정된 함수
function renderWordWithUnderlines(word, indexingData, isKeyWord = false) {
    if (!word) return null;

    // Handle Key Words (isKeyWord = true) - 이전 수정 유지
    if (isKeyWord) {
        if (!indexingData || !Array.isArray(indexingData) || indexingData.length === 0) {
            return word; 
        }
        const styledKeys = indexingData.map(({ key }, groupIndex) => {
            const color = UNDERLINE_COLORS[groupIndex % UNDERLINE_COLORS.length];
            const style = {
                borderBottom: `4px solid ${color}`,
                paddingBottom: '2px',
                display: 'inline-block',
                lineHeight: 1.1
            };
            const spanKey = `kw-${groupIndex}-${key}`;
            return <span key={spanKey} className="underline-span-keyword" style={style}>{key}</span>;
        });
        const result = [];
        styledKeys.forEach((span, index) => {
            result.push(span);
            if (index < styledKeys.length - 1) {
                result.push(<span key={`sep-${index}`}>, </span>);
            }
        });
        return result;
    }

    // Handle English Words (isKeyWord = false) - 겹침 처리 및 유효성 검사 조정
    else {
        if (!indexingData || !Array.isArray(indexingData) || indexingData.length === 0) {
            return word; 
        }

        let parts = [];
        let lastIndex = 0; // 다음 텍스트 시작 위치
        let lastSpanEndIndex = 0; // 이전에 그려진 span의 끝 위치 (겹침 감지용)
        const sortedIndices = [...indexingData].sort((a, b) => (a.range && b.range) ? a.range[0] - b.range[0] : 0);

        sortedIndices.forEach(({ key, range }, groupIndex) => {
            if (!range) return; 
            let [start, end] = range;
            
            // 범위 유효성 검사 (end가 길이를 1 초과하는 것까지 허용하되, 실제 사용은 length까지)
            if (start === null || end === null || start >= end || start < 0 || start >= word.length) { 
                 console.warn(`Invalid start/end range detected and skipped: [${start}, ${end}] for word "${word}"`);
                 return;
            }
            // end가 길이를 초과하면 경고 후 조정
            if (end > word.length) {
                 console.warn(`End index ${end} exceeds word length ${word.length}. Adjusting range [${start}, ${end}] to [${start}, ${word.length}] for word "${word}"`);
                 end = word.length; // 실제 사용할 end 값 조정
            }

            const color = UNDERLINE_COLORS[groupIndex % UNDERLINE_COLORS.length];
            let spanStyle = {
                borderBottom: `4px solid ${color}`,
                paddingBottom: '2px',
                display: 'inline-block',
                lineHeight: 1.1,
                position: 'relative' // 겹침 시 top 조정 위해 추가
            };

            // 겹침 감지 및 스타일 조정
            if (start < lastSpanEndIndex) { 
                 console.log(`Overlap detected: Current [${start}, ${end}] overlaps with previous ending at ${lastSpanEndIndex}`);
                 spanStyle.top = '4px'; // 아래로 4px 이동 (겹쳐 보이도록)
            }

            // Add text before the current span if needed
            if (start > lastIndex) {
                parts.push(word.substring(lastIndex, start));
            }

            // Add the highlighted span
            const spanKey = `ew-${groupIndex}-${start}-${end}`; 
            // substring에 조정된 end 사용
            parts.push(<span key={spanKey} className="underline-span" style={spanStyle}>{word.substring(start, end)}</span>);
            
            // 다음 텍스트 시작 위치 업데이트 (조정된 end 기준)
            lastIndex = Math.max(lastIndex, end); 
            // 현재 span의 끝 위치 저장 (다음 겹침 감지용)
            lastSpanEndIndex = end;

        });

        // Add remaining text
        if (lastIndex < word.length) {
            parts.push(word.substring(lastIndex));
        }
        
        return parts.length > 0 ? parts : word; 
    }
}

// 변경: Key Words 렌더링 전용 함수
function renderStyledKeywords(wordString, indexingData) {
    if (!wordString) return null;
    if (!indexingData || !Array.isArray(indexingData) || indexingData.length === 0) {
        return wordString;
    }
    let parts = [wordString];
    const sortedIndices = [...indexingData].sort((a, b) => (a.range && b.range) ? a.range[0] - b.range[0] : 0);
    sortedIndices.forEach(({ key }, groupIndex) => {
        const color = UNDERLINE_COLORS[groupIndex % UNDERLINE_COLORS.length];
        const style = {
            borderBottom: `4px solid ${color}`,
            paddingBottom: '2px',
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
                newParts.push(part);
            }
        });
        parts = newParts;
    });
    return parts;
}

// --- 신규: 밑줄 스타일 계산 함수 (LearningPage에서 복사) ---
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

// --- Survey Page Component ---
const SurveyPage = () => {
    const navigate = useNavigate();
    const { wordList: wordsByRound, isLoadingWords } = useExperiment();
    const [surveyWordList, setSurveyWordList] = useState([]);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [usefulnessRating, setUsefulnessRating] = useState(0);
    const [coherenceRating, setCoherenceRating] = useState(0);
    const wordContainerRef = useRef(null);
    const [underlineStyles, setUnderlineStyles] = useState([]);
    const timestampInRef = useRef(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isLoadingWords && Object.keys(wordsByRound).length > 0) {
            const combinedList = [
                ...(wordsByRound[1] || []),
                ...(wordsByRound[2] || []),
                ...(wordsByRound[3] || [])
            ];
            console.log(`SurveyPage: Combined ${combinedList.length} words for survey.`);
            setSurveyWordList(combinedList);
            setCurrentWordIndex(0);
        } else if (!isLoadingWords && Object.keys(wordsByRound).length === 0) {
            console.error("SurveyPage: Word list object is empty after loading.");
            setSurveyWordList([]);
        }
    }, [wordsByRound, isLoadingWords]);

    useEffect(() => {
        if (isLoadingWords || surveyWordList.length === 0 || currentWordIndex >= surveyWordList.length) {
            return;
        }
        timestampInRef.current = new Date().toISOString();
        console.log(`SurveyPage - Word ${currentWordIndex + 1} entered at:`, timestampInRef.current);
        setUsefulnessRating(0);
        setCoherenceRating(0);
    }, [currentWordIndex, surveyWordList, isLoadingWords]);

    useEffect(() => {
        if (!isLoadingWords && surveyWordList.length > 0 && currentWordIndex < surveyWordList.length && wordContainerRef.current) {
            const currentWordData = surveyWordList[currentWordIndex];
            const keywordKey = `kss_keyword_refined`;
            const keywordIndexingString = currentWordData[keywordKey];
            const keywordIndices = parseIndexingString(keywordIndexingString);

            const styles = calculateUnderlineStyles(currentWordData.word, keywordIndices, wordContainerRef.current);
            setUnderlineStyles(styles);
        }
         else {
             setUnderlineStyles([]);
         }
    }, [currentWordIndex, surveyWordList, isLoadingWords, wordContainerRef.current]);

    const handleNextClick = async () => {
        if (usefulnessRating === 0 || coherenceRating === 0) {
            message.warning('Please rate both usefulness and coherence.');
            return;
        }
        if (isSubmitting) return;
        setIsSubmitting(true);

        const timestampOut = new Date().toISOString();
        const timestampIn = timestampInRef.current;
        const currentWordData = surveyWordList[currentWordIndex];
        const userId = sessionStorage.getItem('userId');
        let duration = null;
        if (timestampIn && timestampOut) {
            try { duration = Math.round((new Date(timestampOut) - new Date(timestampIn)) / 1000); } catch (e) { /*...*/ }
        }

        console.log(`Survey Word: ${currentWordData?.word}, Usefulness: ${usefulnessRating}, Coherence: ${coherenceRating}, Duration: ${duration}s`);

        if (!userId) {
            console.error("User ID not found!");
            message.error("User session error. Please restart the experiment.");
            setIsSubmitting(false);
            return;
        }

        try {
            const responseData = {
                user: userId,
                english_word: currentWordData.word,
                round_number: 0,
                page_type: 'survey',
                timestamp_in: timestampIn,
                timestamp_out: timestampOut,
                duration: duration,
                usefulness: usefulnessRating,
                coherence: coherenceRating,
            };
            await submitResponse(responseData);
            console.log("Survey response submitted for:", currentWordData.word);

            if (currentWordIndex < surveyWordList.length - 1) {
                setCurrentWordIndex(prevIndex => prevIndex + 1);
            } else {
                console.log('Survey Complete.');
                navigate('/end');
            }

        } catch (error) {
            console.error("Failed to submit survey response:", error);
            message.error(`Failed to save response: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingWords || surveyWordList.length === 0) {
        return <MainLayout><div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div></MainLayout>;
    }

    if (currentWordIndex >= surveyWordList.length) {
        console.warn("Current word index out of bounds after loading.");
        return <MainLayout><div>Unexpected state: Index out of bounds.</div></MainLayout>;
    }

    const currentWordData = surveyWordList[currentWordIndex];
    const progressPercent = Math.round(((currentWordIndex + 1) / surveyWordList.length) * 100);

    const keywordKey = `kss_keyword_refined`;
    const verbalCueKey = `kss_verbal_cue`;
    const keywordIndexingString = currentWordData[keywordKey];
    const keywordIndices = parseIndexingString(keywordIndexingString);
    const displayKeywordString = keywordIndices.length > 0 ? keywordIndices.map(item => item.key).join(', ') : (keywordIndexingString || "N/A");
    const displayVerbalCue = currentWordData[verbalCueKey] || "N/A";

    const isNextDisabled = usefulnessRating === 0 || coherenceRating === 0 || isSubmitting;

    return (
        <MainLayout>
            <div
                className="survey-content-wrapper"
                style={{
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}
            >
                <div className="progress-section" style={{ width: '100%', maxWidth: '550px', marginBottom: '24px' }}>
                    <div className="progress-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '0 5px' }}>
                        <span style={{ fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#868686' }}>Survey</span>
                        <span style={{ fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#868686' }}>{currentWordIndex + 1} / {surveyWordList.length}</span>
                    </div>
                    <Progress percent={progressPercent} showInfo={false} strokeColor="#2049FF" />
                </div>

                <div className="word-display-section" style={{ 
                    width: '100%', 
                    maxWidth: '550px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    marginBottom: '16px' 
                }}>
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
                            ref={wordContainerRef}
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
                        borderRadius: '20px 20px 0 0', 
                        padding: '25px 32px 10px', 
                        boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.25)', 
                        position: 'relative', 
                        minHeight: '80px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        marginBottom: '-1px', 
                        borderBottom: 'none' 
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
                        lineHeight: 1.6, 
                        marginBottom: '-1px' 
                    }}>
                        <span className="word-card-label" style={{ position: 'absolute', top: '50%', left: '-100px', transform: 'translateY(-50%)', fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#C7C7C7', width: '90px', textAlign: 'right' }}>Verbal Cue</span>
                        <span className="verbal-cue-text" style={{ fontFamily: 'BBTreeGo_R, sans-serif', fontSize: '20px', color: '#000', lineHeight: 1.6 }}>{displayVerbalCue}</span>
                    </div>
                    <div className="word-card korean-meaning-card" style={{ 
                        background: '#fff', 
                        borderRadius: '0 0 20px 20px', 
                        padding: '10px 32px 25px', 
                        boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.25)', 
                        position: 'relative', 
                        minHeight: '80px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        borderTop: 'none' 
                    }}>
                        <span className="word-card-label" style={{ position: 'absolute', top: '50%', left: '-100px', transform: 'translateY(-50%)', fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#C7C7C7', width: '90px', textAlign: 'right' }}>Korean Meaning</span>
                        <span className="korean-meaning-text" style={{ fontFamily: 'BBTreeGo_R, sans-serif', fontSize: '30px', color: '#000' }}>{currentWordData.meaning}</span>
                    </div>
                </div>

                <div className="rating-section" style={{ width: '100%', maxWidth: '550px', display: 'flex', flexDirection: 'column', marginBottom: '32px' }}>
                    <div className="rating-card" style={{ 
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
                        <span className="word-card-label" style={{ position: 'absolute', top: '50%', left: '-100px', transform: 'translateY(-50%)', fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#C7C7C7', width: '90px', textAlign: 'right' }}>Usefulness</span>
                        <div className="rating-question" style={{ fontFamily: 'BBTreeGo_R, sans-serif', fontSize: '16px', color: '#555', marginBottom: '10px' }}>Key Words와 Verbal Cue가 학습에 얼마나 도움이 되었나요?</div>
                        <Rate allowHalf={false} count={5} value={usefulnessRating} onChange={setUsefulnessRating} style={{ fontSize: '28px' }} disabled={isSubmitting} />
                    </div>
                    <div className="rating-card" style={{ background: '#fff', borderRadius: '20px', padding: '20px 32px', boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.25)', position: 'relative', textAlign: 'center', minHeight: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', marginBottom: '16px' }}>
                        <span className="word-card-label" style={{ position: 'absolute', top: '50%', left: '-100px', transform: 'translateY(-50%)', fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#C7C7C7', width: '90px', textAlign: 'right' }}>Coherence</span>
                        <div className="rating-question" style={{ fontFamily: 'BBTreeGo_R, sans-serif', fontSize: '16px', color: '#555', marginBottom: '10px' }}>Key Words와 Verbal Cue가 얼마나 명확하고 자연스러웠나요?</div>
                        <Rate allowHalf={false} count={5} value={coherenceRating} onChange={setCoherenceRating} style={{ fontSize: '28px' }} disabled={isSubmitting} />
                    </div>
                </div>

                <div className="footer-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <BlueButton
                        text="Next"
                        onClick={handleNextClick}
                        disabled={isNextDisabled}
                        loading={isSubmitting}
                    />
                </div>
            </div>
        </MainLayout>
    );
};

export default SurveyPage; 