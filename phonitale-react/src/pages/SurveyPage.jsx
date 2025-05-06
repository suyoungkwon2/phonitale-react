import React, { useState, useEffect, useRef } from 'react';
import { Progress, Rate, Spin, message, Table, Typography, Divider } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import BlueButton from '../components/BlueButton';
import { useExperiment } from '../context/ExperimentContext';
import { submitResponse } from '../utils/api';

const { Text } = Typography;

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

// Underline Renderer Constants
const UNDERLINE_COLORS = [ '#7F97FF', '#97DA9B', '#FFBABA', '#E2D98A', '#FFB991' ];

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

// 변경: Key Words 렌더링 전용 함수 (스타일링 + 쉼표 구분)
// 변경: isTextFlashing 인자 추가 (Survey에서는 항상 false)
function renderStyledKeywords(indexingData, isTextFlashing = false) {
    if (!indexingData || !Array.isArray(indexingData) || indexingData.length === 0) {
        return null;
    }

    // LearningPage와 동일한 로직 적용
    return indexingData.map((item, groupIndex) => {
        const key = Object.keys(item)[0];
        if (!key) return null;

        const underlineColor = UNDERLINE_COLORS[groupIndex % UNDERLINE_COLORS.length];
        const textColor = isTextFlashing ? '#FFFFFF' : '#000000'; // LearningPage 스타일 적용
        const style = {
            borderBottom: `4px solid ${underlineColor}`,
            paddingBottom: '2px',
            display: 'inline-block',
            color: textColor, // LearningPage 스타일 적용
            // fontWeight 제거됨 (LearningPage에는 없음)
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

// --- 신규: Verbal Cue 포맷팅 함수 (LearningPage에서 복사) ---
function formatVerbalCue(text, isTextFlashing = false) {
    if (!text) return text;

    const parts = [];
    let lastIndex = 0;
    const regex = /(\/([^\/]+?)\/)|(\{([^\}]+?)\})/g; // Regex 수정
    let match;

    try {
        while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parts.push(text.substring(lastIndex, match.index));
            }

            const isItalic = match[2] !== undefined;
            const isBold = match[4] !== undefined;
            const content = isItalic ? match[2] : match[4];

            if (content && content.trim()) {
                if (isItalic) {
                    // LearningPage 스타일 적용: 이탤릭체 색상 #A47A5C, 볼드체
                    const textColor = isTextFlashing ? '#FFFFFF' : '#A47A5C';
                    const style = { color: textColor , fontWeight: 'bold'};
                    parts.push(<strong key={`part-${match.index}`} style={style}>{content}</strong>);
                } else if (isBold) {
                    // LearningPage 스타일 적용: 볼드체 색상 기본값 (검정색)
                    const style = isTextFlashing ? { color: '#FFFFFF' } : {}; // 검정색 기본값
                    parts.push(<strong key={`part-${match.index}`} style={style}>{content}</strong>);
                }
            }
            lastIndex = regex.lastIndex;
        }

        if (lastIndex < text.length) {
            parts.push(text.substring(lastIndex));
        }

        return React.createElement(React.Fragment, null, ...parts.map((part, index) =>
            React.isValidElement(part) ? part : <React.Fragment key={`text-${index}`}>{part}</React.Fragment>
        ));
    } catch (error) {
        console.error("Error formatting verbal cue:", error, "Text:", text);
        return text;
    }
}

// --- 신규: 영어 단어 밑줄 처리 함수 (LearningPage에서 복사) ---
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
                zIndex: originalIndex + 1,                 pointerEvents: 'none', // Prevent underlines from interfering with text interaction
            };
            // Using originalIndex in key ensures stability
            return <span key={`ul-${originalIndex}-${color}`} style={underlineStyle}></span>;
        });

        parts.push(
            // Each segment is a span containing text and its absolutely positioned underlines
            <span key={spanKey} style={segmentSpanStyle}>
                {textSegment}
                {underlineElements}
            </span>
        );

        currentIndex = endIndex;
    }

    // No longer needed if segments are inline-block
    return <>{parts}</>; // Return fragments directly
}

// --- 신규: 텍스트 내 {단어} 스타일링 함수 ---
function formatRubricText(text) {
    if (!text) return text;
    const parts = text.split(/({.*?})/g); // {} 로 감싸진 부분을 기준으로 분리
    return parts.map((part, index) => {
        if (part.startsWith('{') && part.endsWith('}')) {
            const content = part.slice(1, -1); // {} 제거
            return <strong key={index}><em>{content}</em></strong>; // Bold + Italic 적용
        }
        return part; // 일반 텍스트는 그대로 반환
    });
}

// --- 카드 스타일 수정 (LearningPage 기준으로 통합) ---
const cardStyles = {
    // 각 블록(그룹) 컨테이너 스타일 (LearningPage 스타일)
    blockContainer: {
      background: '#FFFFFF',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      width: '100%',
      maxWidth: '685px',
      display: 'flex',
      flexDirection: 'column',
    },
    rowWrapper: { // LearningPage 스타일
      display: 'flex',
      width: '100%',
      alignItems: 'center',
    },
    leftTitle: { // 기본 제목 스타일 (오른쪽 정렬)
      width: '120px',
      textAlign: 'right',
      color: 'rgba(0, 0, 0, 0.25)',
      fontSize: '14px',
      paddingTop: '2px',
      paddingRight: '16px',
      flexShrink: 0,
      whiteSpace: 'nowrap',
    },
    rightContent: { // LearningPage 스타일
      flexGrow: 1,
      paddingLeft: '16px',
      position: 'relative',
    },
    dashedBorder: { // LearningPage 스타일
      borderTop: '1px dashed #C7C7C7',
      margin: '16px 0',
    },
    englishWordText: { // LearningPage 스타일
      fontSize: '26px', fontWeight: 500, fontFamily: 'Rubik, sans-serif', // LearningPage 폰트
      position: 'relative', display: 'inline-block', color: '#000000', lineHeight: '1.2',
    },
    keyWordsText: { // LearningPage 스타일 적용
        fontSize: '18px',
        color: '#000000',
        lineHeight: '1.6',
        display: 'inline-flex', // LearningPage에선 inline-flex, 여기도 통일
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '4px',
        fontWeight: 500, // LearningPage 스타일 적용 (굵기 추가)
    },
    koreanMeaningText: { // LearningPage 스타일 적용
        fontSize: '18px',
        fontWeight: 500, // LearningPage 스타일 적용 (굵기 추가)
        color: '#000000', // LearningPage 스타일 적용 (색상 명시)
    },
    verbalCueText: { // LearningPage 스타일 적용
        fontSize: '18px',
        color: '#000000', // LearningPage 스타일 적용 (색상 명시)
        lineHeight: '1.6',
     },
     // --- 설문 관련 스타일 ---
     surveyLeftTitle: { // 설문 전용 제목 스타일 -> 기본 leftTitle 스타일과 동일하게 변경
        width: '120px',
        textAlign: 'right', // 오른쪽 정렬로 변경
        color: 'rgba(0, 0, 0, 0.25)',
        fontSize: '14px',
        paddingTop: '2px', // 패딩 추가 (다른 제목과 통일)
        paddingRight: '16px',
        flexShrink: 0,
        whiteSpace: 'pre-line', // 줄바꿈은 유지
     },
     ratingQuestionText: { // 유지
        fontSize: '14px',
        color: '#000000',
        lineHeight: '1.6',
        marginBottom: '10px',
        textAlign: 'left',
     },
     ratingComponentWrapper: { 
        width: '100%',
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px' // 간격 약간 줄임 (조정 가능)
     },
     rubricText: { // 유지
        fontSize: '12px',
        color: '#888888',
        flexShrink: 0, 
     }
};

// --- Rubric 데이터 및 컬럼 정의 ---
const rubricColumns = [
    {
        title: <span style={{ color: 'rgba(0, 0, 0, 0.6)' }}>점수</span>,
        dataIndex: 'score',
        key: 'score',
        width: '60px',
        align: 'center',
        render: (text) => <Text style={{ color: 'rgba(0, 0, 0, 0.6)', fontWeight: 'bold' }}>{text}</Text>,
        onHeaderCell: () => ({
            style: { backgroundColor: '#f5f5f5' }
        })
    },
    {
        title: <span style={{ color: 'rgba(0, 0, 0, 0.6)' }}>설명</span>,
        dataIndex: 'description',
        key: 'description',
        width: '240px', // 너비 설정
        render: (text) => (
            <Text style={{ color: 'rgba(0, 0, 0, 0.6)', whiteSpace: 'pre-line' }}>
                {formatRubricText(text)}
            </Text>
        ),
        onHeaderCell: () => ({
            style: { backgroundColor: '#f5f5f5' }
        })
    },
    {
        title: <span style={{ color: 'rgba(0, 0, 0, 0.6)' }}>예시</span>,
        dataIndex: 'example',
        key: 'example',
        width: '320px', // 너비 설정 (설명과 동일하게)
        render: (text) => (
             <Text style={{ color: 'rgba(0, 0, 0, 0.6)', whiteSpace: 'pre-line' }}>
                 {formatVerbalCue(text, false)}
             </Text>
         ),
        onHeaderCell: () => ({
            style: { backgroundColor: '#f5f5f5' }
        })
    }
];

const helpfulnessData = [
    {
        key: 'h5',
        score: '5점',
        description: `구조적으로 잘 연관되어 있고, 반복 학습 없이도 단어의 의미를 쉽게 떠올릴 수 있음`,
    },
    {
        key: 'h3',
        score: '3점',
        description: `단서와 의미 사이에 약한 연결 고리가 있으나, 기억에 오래 남기엔 부족함`,
    },
    {
        key: 'h1',
        score: '1점',
        description: `단어의 뜻과 단서 사이에 직접적 연결이 거의 없어 기억하거나 학습하는 데 실질적인 도움이 되지 않음`,
    },
];

// --- 신규: Imageability 데이터 (스크린샷 내용 반영) ---
const imageabilityData = [
    {
        key: 'i5',
        score: '5점',
        description: `익숙한 이미지로 쉽게 시각화되며 장면이 구체적으로 떠오름`,
        example: `- 키워드: {스니커즈}
        - 연상 문장: 새벽에 {스니커즈}를 신고 {몰래} 나가다가 들키다.`
    },
    {
        key: 'i3',
        score: '3점',
        description: `단어와 관련된 이미지가 조금 있으나 모호하거나 약함`,
        example: `- 키워드: {스님}
        - 연상 문장: {스님} {몰래} 절을 나갔다.`
    },
    {
        key: 'i1',
        score: '1점',
        description: `장면이나 상황이 전혀 그려지지 않음`,
        example: `- 키워드: {스노우볼}
        - 연상 문장: 나는 {스노우볼}을 보며 겨울을 {떠올렸다}.`
    }
];

// --- 신규: Coherence 데이터 (스크린샷 내용 반영) ---
const coherenceData = [
    {
        key: 'c5',
        score: '5점',
        description: `논리, 어휘, 의미 흐름이 매끄럽고 자연스럽게 구성됨`,
        example: `- 키워드: {토플}
        - 연상 문장: 나는 너무 긴장한 나머지 {토플} 시험장에서 {몰래} 넘어졌다.`
    },
    {
        key: 'c3',
        score: '3점',
        description: `비교적 자연스럽지만, 문법이나 논리 흐름에서 약간 부자연스러움`,
        example: `- 키워드: {탑}, {풀}
        - 연상 문장: {풀}을 바르지 않아 {탑}이 {넘어졌다.}`
    },
    {
        key: 'c1',
        score: '1점',
        description: `문장이 어색하고 단어 해석과 연결성이 부족함`,
        example: `- 키워드: {돛}, {풀}
        - 연상 문장: {돛}이 {풀}을 {쓰러트렸다.}`
    }
];

// --- Survey Page Component ---
const SurveyPage = () => {
    const { roundNumber, groupCode } = useParams();
    const { userId, group, wordList, isLoadingWords, currentRound } = useExperiment();
    const navigate = useNavigate();
    
    const [surveyWordList, setSurveyWordList] = useState([]);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [usefulnessRating, setUsefulnessRating] = useState(0); // Helpfulness 용으로 사용
    const [imageabilityRating, setImageabilityRating] = useState(0); // 신규 상태
    const [coherenceRating, setCoherenceRating] = useState(0);
    const timestampInRef = useRef(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        if (!isLoadingWords && Object.keys(wordList).length > 0) {
            const combinedList = [
                ...(wordList[1] || []),
                ...(wordList[2] || []),
                ...(wordList[3] || [])
            ];
            console.log(`SurveyPage: Combined ${combinedList.length} words for survey.`);
            setSurveyWordList(combinedList);
            setCurrentWordIndex(0);
        } else if (!isLoadingWords && Object.keys(wordList).length === 0) {
            console.error("SurveyPage: Word list object is empty after loading.");
            setSurveyWordList([]);
        }
    }, [wordList, isLoadingWords]);

    useEffect(() => {
        if (isLoadingWords || surveyWordList.length === 0 || currentWordIndex >= surveyWordList.length) {
            return;
        }
        timestampInRef.current = new Date().toISOString();
        // console.log(`SurveyPage - Word ${currentWordIndex + 1} entered at:`, timestampInRef.current);
        setUsefulnessRating(0);
        setImageabilityRating(0); // 이미지화 가능성 초기화 추가
        setCoherenceRating(0);
    }, [currentWordIndex, surveyWordList, isLoadingWords]);

    const handleNextClick = async () => {
        // 모든 평가 항목 확인
        if (usefulnessRating === 0 || imageabilityRating === 0 || coherenceRating === 0) {
            message.warning('모든 항목을 평가해주세요.');
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

        // console.log(`Survey Word: ${currentWordData?.word}, Helpfulness: ${usefulnessRating}, Imageability: ${imageabilityRating}, Coherence: ${coherenceRating}, Duration: ${duration}s`);

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
                round_number: parseInt(currentWordData.round || currentRound, 10),
                page_type: 'survey',
                timestamp_in: timestampIn,
                timestamp_out: timestampOut,
                duration: duration,
                survey_helpfulness: usefulnessRating,
                survey_imageability: imageabilityRating,
                survey_coherence: coherenceRating,
            };
            await submitResponse(responseData, group);
            // console.log("Survey response submitted for:", currentWordData.word);

            if (currentWordIndex < surveyWordList.length - 1) {
                setCurrentWordIndex(prevIndex => prevIndex + 1);
            } else {
                console.log('Survey Complete.');
                navigate(`/${groupCode}/end`);
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

    const keywordIndices = currentWordData.keyword_refined;
    const displayVerbalCue = currentWordData.verbal_cue || "N/A";

    // console.log(`SurveyPage Render: Word '${currentWordData?.word}', keyword_refined data passed to render:`, keywordIndices);

    const isNextDisabled = usefulnessRating === 0 || imageabilityRating === 0 || coherenceRating === 0 || isSubmitting;

    // --- 루브릭 테이블 렌더링 로직 수정 ---

    // Helpfulness 테이블 컬럼 (점수 컬럼 너비 명시적으로 재설정)
    const helpfulnessColumns = rubricColumns
        .filter(col => col.key !== 'example')
        .map(col => {
            if (col.key === 'score') {
                return { ...col, width: '60px' }; // 너비 명시적 재설정
            }
            return col;
        });

    // Imageability 테이블 컬럼 (점수 컬럼 너비 명시적으로 재설정 및 예시 헤더 변경)
    const imageabilityColumns = rubricColumns.map(col => {
        if (col.key === 'score') {
            return { ...col, width: '60px' }; // 너비 명시적 재설정
        }
        if (col.key === 'example') {
            return {
                ...col,
                title: <span style={{ color: 'rgba(0, 0, 0, 0.6)' }}>예시 (sneak: 몰래 움직이다. 몰래하다)</span>
            };
        }
        return col;
    });

    // Coherence 테이블 컬럼 (점수 컬럼 너비 명시적으로 재설정 및 예시 헤더 변경)
    const coherenceColumns = rubricColumns.map(col => {
        if (col.key === 'score') {
            return { ...col, width: '60px' }; // 너비 명시적 재설정
        }
        if (col.key === 'example') {
            return {
                ...col,
                title: <span style={{ color: 'rgba(0, 0, 0, 0.6)' }}>예시 (topple: 쓰러트리다, 넘어지다)</span>
            };
        }
        return col;
    });

    return (
        <MainLayout>
            <div
                className="survey-content-wrapper"
                style={{
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '24px' // 이 gap으로 요소 간 간격 제어
                }}
            >
                {/* Progress Bar Section */} 
                <div className="progress-section" style={{ width: '100%', maxWidth: '685px' }}> 
                    <div className="progress-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '0 5px' }}>
                        <span style={{ fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#868686' }}>Survey</span>
                        <span style={{ fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#868686' }}>{currentWordIndex + 1} / {surveyWordList.length}</span>
                    </div>
                    <Progress percent={progressPercent} showInfo={false} strokeColor="#2049FF" />
                </div>


                {/* --- Instruction Text (Optional) --- */} 
                <div style={{ color: '#656565', textAlign: 'center' }}>
                    각각의 평가 항목에 대해 아래 평가 기준을 참고하여 점수를 선택하세요.
                </div>


                {/* === 단어 정보 카드 그룹 === */} 
                {/* 카드 1: English / Key Words */}
                <div style={cardStyles.blockContainer}> 
                    <div style={cardStyles.rowWrapper}>
                        <div style={cardStyles.leftTitle}>영어 단어</div>
                        <div style={cardStyles.rightContent}>
                            <span style={cardStyles.englishWordText}>
                                {renderEnglishWordWithUnderlines(currentWordData.word, keywordIndices)}
                            </span>
                        </div>
                    </div>
                    <div style={cardStyles.dashedBorder}></div>
                    <div style={cardStyles.rowWrapper}>
                        <div style={cardStyles.leftTitle}>키워드</div>
                        <div style={cardStyles.rightContent}>
                            <span style={cardStyles.keyWordsText}>
                                {renderStyledKeywords(keywordIndices, false)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 카드 2: Meaning / Verbal Cue */} 
                <div style={cardStyles.blockContainer}> 
                    <div style={cardStyles.rowWrapper}>
                        <div style={cardStyles.leftTitle}>의미</div>
                        <div style={cardStyles.rightContent}>
                            <span style={cardStyles.koreanMeaningText}>{currentWordData.meaning}</span>
                        </div>
                    </div>
                    <div style={cardStyles.dashedBorder}></div>
                    <div style={cardStyles.rowWrapper}>
                        <div style={cardStyles.leftTitle}>연상 문장</div>
                        <div style={cardStyles.rightContent}>
                            <span style={cardStyles.verbalCueText}>
                                {formatVerbalCue(displayVerbalCue, false)}
                            </span>
                        </div>
                    </div>
                </div>
                {/* === 단어 정보 카드 그룹 끝 === */} 

                {/* === 설문 항목 카드 === */} 
                <div style={cardStyles.blockContainer}> 
                    {/* 1. Helpfulness */} 
                    <div style={cardStyles.rowWrapper}>
                        <div style={cardStyles.surveyLeftTitle}>유익함</div> 
                        <div style={cardStyles.rightContent}>
                            <div style={cardStyles.ratingQuestionText}>
                                이 키워드와 연상 문장은 단어를 학습하는 데 효과적이었다.
                            </div>
                            <div style={cardStyles.ratingComponentWrapper}>
                                <span style={cardStyles.rubricText}>전혀 그렇지 않다</span>
                                <Rate
                                    allowHalf={false}
                                    count={5}
                                    value={usefulnessRating}
                                    onChange={setUsefulnessRating}
                                    style={{ fontSize: '28px' }} // flexGrow, textAlign 제거
                                    disabled={isSubmitting}
                                />
                                <span style={cardStyles.rubricText}>매우 그렇다</span>
                            </div>
                        </div>
                    </div>

                    <div style={cardStyles.dashedBorder}></div> 

                    {/* 2. Imageability */} 
                    <div style={cardStyles.rowWrapper}>
                        <div style={cardStyles.surveyLeftTitle}>이미지화 가능성</div> 
                        <div style={cardStyles.rightContent}>
                            <div style={cardStyles.ratingQuestionText}>
                                이 키워드와 연상 문장은 생생하고 구체적인 심상을 떠올리게 한다.
                            </div>
                            <div style={cardStyles.ratingComponentWrapper}>
                                <span style={cardStyles.rubricText}>전혀 그렇지 않다</span>
                                <Rate
                                    allowHalf={false}
                                    count={5}
                                    value={imageabilityRating} 
                                    onChange={setImageabilityRating} 
                                    style={{ fontSize: '28px' }} // flexGrow, textAlign 제거
                                    disabled={isSubmitting}
                                />
                                <span style={cardStyles.rubricText}>매우 그렇다</span>
                            </div>
                        </div>
                    </div>

                    <div style={cardStyles.dashedBorder}></div> 

                    {/* 3. Coherence */} 
                    <div style={cardStyles.rowWrapper}>
                        <div style={cardStyles.surveyLeftTitle}>논리적 연결성</div> 
                        <div style={cardStyles.rightContent}>
                            <div style={cardStyles.ratingQuestionText}>
                                이 키워드와 연상 문장은 의미가 명확하고 문장이 자연스럽게 구성되어 있다.
                            </div>
                            <div style={cardStyles.ratingComponentWrapper}>
                                <span style={cardStyles.rubricText}>전혀 그렇지 않다</span>
                                <Rate
                                    allowHalf={false}
                                    count={5}
                                    value={coherenceRating}
                                    onChange={setCoherenceRating}
                                    style={{ fontSize: '28px' }} // flexGrow, textAlign 제거
                                    disabled={isSubmitting}
                                />
                                <span style={cardStyles.rubricText}>매우 그렇다</span>
                            </div>
                        </div>
                    </div>
                </div>
                {/* === 설문 항목 카드 끝 === */} 

                {/* Next Button Section */} 
                <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', maxWidth: '685px' }}> 
                    <BlueButton
                        text="Next"
                        onClick={handleNextClick}
                        disabled={isNextDisabled}
                        loading={isSubmitting}
                    />
                </div>

                {/* Divider 수정: 색상, 두께, 점선 간격 느낌 조정 */}
                <Divider
                    dashed
                    style={{
                        width: '100%',
                        maxWidth: '685px',
                        margin: '16px 0',
                        borderColor: '#b0b0b0', // 더 진한 회색
                        borderWidth: '1px 0 0 0', // 두께 약간 증가 (상단선만)
                        // 점선 간격 직접 조절은 어려우나, 색상/두께 변경으로 가시성 향상
                        borderStyle: 'dashed'
                    }}
                />

                {/* === 상세 평가 기준 (Rubric) Section === */}
                <div
                    className="rubric-section"
                    style={{
                        width: '100%',
                        maxWidth: '685px',
                        paddingBottom: '40px'
                    }}
                >
                    <Typography.Title level={5} style={{ color: 'rgba(0, 0, 0, 0.6)', marginBottom: '8px' }}>
                        &lt;평가 기준&gt;
                    </Typography.Title>
                    <Typography.Paragraph style={{ color: 'rgba(0, 0, 0, 0.6)', marginBottom: '24px' }}>
                        아래는 5점 척도에서 일관적인 점수를 부여할 수 있도록 돕기 위한 예시 문장입니다.
                        <br />
                        각각의 평가 항목에 대해 1점, 3점, 5점의 사례를 참고하여 점수를 선택하세요.
                    </Typography.Paragraph>

                    {/* 1. Helpfulness Rubric */}
                    <div style={{ marginBottom: '32px' }}>
                        <Typography.Title level={5} style={{ color: 'rgba(0, 0, 0, 0.6)', marginBottom: '16px' }}>
                            1. 유익함 (Helpfulness)
                        </Typography.Title>
                        <Table
                            columns={helpfulnessColumns}
                            dataSource={helpfulnessData}
                            pagination={false}
                            bordered
                            size="small"
                            rowKey="key"
                        />
                    </div>

                    {/* 2. Imageability Rubric */}
                    <div style={{ marginBottom: '32px' }}>
                        <Typography.Title level={5} style={{ color: 'rgba(0, 0, 0, 0.6)', marginBottom: '16px' }}>
                            2. 이미지화 가능성 (Imageability)
                        </Typography.Title>
                        <Table
                            columns={imageabilityColumns}
                            dataSource={imageabilityData}
                            pagination={false}
                            bordered
                            size="small"
                            rowKey="key"
                        />
                    </div>

                    {/* 3. Coherence Rubric */}
                    <div style={{ marginBottom: '32px' }}>
                        <Typography.Title level={5} style={{ color: 'rgba(0, 0, 0, 0.6)', marginBottom: '16px' }}>
                            3. 논리적 연결성 (Coherence)
                        </Typography.Title>
                        <Table
                            columns={coherenceColumns}
                            dataSource={coherenceData}
                            pagination={false}
                            bordered
                            size="small"
                            rowKey="key"
                        />
                    </div>
                </div>
                {/* === 상세 평가 기준 (Rubric) Section 끝 === */}
            </div>
        </MainLayout>
    );
};

export default SurveyPage; 