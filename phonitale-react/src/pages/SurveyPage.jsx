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
function renderStyledKeywords(indexingData) {
    if (!indexingData || !Array.isArray(indexingData) || indexingData.length === 0) {
        return null;
    }

    // LearningPage와 동일한 로직 적용
    return indexingData.map((item, groupIndex) => {
        // 각 item 객체에서 첫 번째 키(key)를 추출합니다.
        const key = Object.keys(item)[0];
        if (!key) return null; // 키가 없는 경우 렌더링하지 않음

        const color = UNDERLINE_COLORS[groupIndex % UNDERLINE_COLORS.length];
        const style = {
            borderBottom: `4px solid ${color}`,
            paddingBottom: '2px',
            display: 'inline-block', // inline-block 유지
            lineHeight: '1.1', // 키워드 줄 간격 조정 필요시
        };
        // 고유한 span key 생성 시 실제 키 값 사용
        const spanKey = `kw-${groupIndex}-${key.replace(/\s+/g, '-')}`; // 공백 등 특수문자 처리

        const separator = groupIndex < indexingData.length - 1 ? ', ' : null;

        return (
            <React.Fragment key={spanKey}>
                <span style={style}>{key}</span>
                {separator}
            </React.Fragment>
        );
    });
}

// --- 신규: 영어 단어 밑줄 처리 함수 (LearningPage에서 복사) ---
function renderEnglishWordWithUnderlines(word, indexingData) {
    if (!word) return null;
    if (!indexingData || !Array.isArray(indexingData) || indexingData.length === 0) {
        return word; // 밑줄 데이터 없으면 단어만 반환
    }

    let parts = [];
    let lastIndex = 0;
    try {
        // 인덱스 기준으로 정렬 및 데이터 구조 변환
        const sortedIndices = indexingData.flatMap(item => {
            const key = Object.keys(item)[0];
            const rangeString = item[key];
            if (!key || !rangeString) {
                return [];
            }
            const [startStr, endStr] = rangeString.split(':');
            const start = parseInt(startStr, 10);
            const end = parseInt(endStr, 10);
            // 유효성 검사 추가
            if (isNaN(start) || isNaN(end) || start < 0 || start >= end || start >= word.length) {
                return [];
            }
            return { key, range: [start, end] };
        }).sort((a, b) => a.range[0] - b.range[0]);

        sortedIndices.forEach(({ key, range }, index) => {
            const [start, end] = range;
            const renderEnd = Math.min(end, word.length);

            if (start > lastIndex) {
                parts.push(word.substring(lastIndex, start));
            }

            const color = UNDERLINE_COLORS[index % UNDERLINE_COLORS.length];
            const style = {
                borderBottom: `4px solid ${color}`,
                paddingBottom: '2px',
            };
            const spanKey = `ew-${index}-${start}-${renderEnd}`;
            parts.push(
                <span key={spanKey} style={style}>
                    {word.substring(start, renderEnd)}
                </span>
            );

            lastIndex = Math.max(lastIndex, renderEnd);
        });

        if (lastIndex < word.length) {
            parts.push(word.substring(lastIndex));
        }

        return parts;
    } catch (error) {
        console.error("[Survey Render] Error in renderEnglishWordWithUnderlines:", error);
        return word; // 오류 발생 시 원본 단어 반환
    }
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
      color: '#656565',
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
      fontSize: '36px', fontWeight: 500, fontFamily: 'Rubik, sans-serif', // LearningPage 폰트
      position: 'relative', display: 'inline-block', color: '#000000', lineHeight: '1.2',
    },
    keyWordsText: { // LearningPage 스타일
        fontSize: '14px',
        color: '#000000',
        lineHeight: '1.6',
        display: 'inline-flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '4px',
    },
    koreanMeaningText: { // LearningPage 스타일
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#000000',
        // fontFamily 유지 (필요시 LearningPage 폰트로 변경)
    },
    verbalCueText: { // LearningPage 스타일
        fontSize: '14px',
        color: '#000000',
        lineHeight: '1.6',
        // fontFamily 유지 (필요시 LearningPage 폰트로 변경)
     },
     // --- 설문 관련 스타일 --- 
     surveyLeftTitle: { // 설문 전용 제목 스타일 -> 기본 leftTitle 스타일과 동일하게 변경
        width: '120px',
        textAlign: 'right', // 오른쪽 정렬로 변경
        color: '#656565',
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
        fontFamily: 'BBTreeGo_R, sans-serif',
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
        title: <span style={{ color: '#888888' }}>점수</span>,
        dataIndex: 'score',
        key: 'score',
        width: '60px',
        align: 'center',
        render: (text) => <Text style={{ color: '#888888', fontWeight: 'bold' }}>{text}</Text>,
        onHeaderCell: () => ({
            style: { backgroundColor: '#f5f5f5' }
        })
    },
    {
        title: <span style={{ color: '#888888' }}>설명(예시)</span>,
        dataIndex: 'description',
        key: 'description',
        render: (text) => (
            <Text style={{ color: '#888888', whiteSpace: 'pre-line' }}>
                {formatRubricText(text)}
            </Text>
        ),
        onHeaderCell: () => ({
            style: { backgroundColor: '#f5f5f5' }
        })
    },
];

const helpfulnessData = [
    {
        key: 'h5',
        score: '5점',
        description: `구조적으로 잘 연관되어 있고, 반복 학습 없이도 단어의 의미를 쉽게 떠올릴 수 있음\n- dodge: (재빨리) 홱 몸을 피하다, 회피하다\n- 술래잡기에서 술래의 손에 {닿지} 않으려고 {홱 몸을 피하다.}`,
    },
    {
        key: 'h3',
        score: '3점',
        description: `단서와 의미 사이에 약한 연결 고리가 있으나, 기억에 오래 남기엔 부족함\n- rebel: 반역자, 반역하다\n- 자신의 두목을 {re 뒤에서} 칼로 {벨}, 즉 {반역자, 반역하다.}`,
    },
    {
        key: 'h1',
        score: '1점',
        description: `단어의 뜻과 단서 사이에 직접적 연결이 거의 없어 기억하거나 학습하는 데 실질적인 도움이 되지 않음\n- glimpse: 흘끗 보다, 흘끗 봄\n- 호기심을 못 참고 {올림푸스} 신전의 메두사를 {흘끗 보다.}`,
    },
];

// --- 신규: Imageability 데이터 ---
const imageabilityData = [
    {
        key: 'i5',
        score: '5점',
        description: `익숙한 이미지로 쉽게 시각화되며 장면이 구체적으로 떠오름\n- sneak : 몰래 움직이다. 몰래하다\n- {스네이크(뱀)}이 먹이를 잡아먹으려고 {몰래 움직이다.}`
    },
    {
        key: 'i3',
        score: '3점',
        description: `단어와 관련된 이미지가 조금 있으나 모호하거나 약함\n- plump: 통통한, 토실토실한\n- {토실토실}한 볼살이 걷거나 뛸 때마다 {풀렁풀렁} 움직이는`
    },
    {
        key: 'i1',
        score: '1점',
        description: `장면이나 상황이 전혀 그려지지 않음\n- tangible: 실재하는, 유형의, 분명한\n- {ten(10)}개 {저 불}은 {실재하는} 유형의`
    }
];

// --- 신규: Coherence 데이터 ---
const coherenceData = [
    {
        key: 'c5',
        score: '5점',
        description: `논리, 어휘, 의미 흐름이 매끄럽고 자연스럽게 구성됨\n- topple: 쓰러트리다, 넘어지다\n- 친구가 정섯껏 레고로 쌓은 {탑을} {쓰러뜨리다.}`
    },
    {
        key: 'c3',
        score: '3점',
        description: `비교적 자연스럽지만, 문법이나 논리 흐름에서 약간 부자연스러움\n- clutter: 난장판, 혼란\n- {클랐다!} 부모님이 돌아오실 시간인데 집을 {난장판}을 만들어놨다!`
    },
    {
        key: 'c1',
        score: '1점',
        description: `문장이 어색하고 단어 해석과 연결성이 부족함\n- anguish: 심한 고통, 괴로움\n- {엥! 기시}네! (기어가시네!)`
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

                {/* === 단어 정보 카드 그룹 === */} 
                {/* 카드 1: English / Key Words */}
                <div style={cardStyles.blockContainer}> 
                    <div style={cardStyles.rowWrapper}>
                        <div style={cardStyles.leftTitle}>English Words</div>
                        <div style={cardStyles.rightContent}>
                            <span style={cardStyles.englishWordText}>
                                {renderEnglishWordWithUnderlines(currentWordData.word, keywordIndices)}
                            </span>
                        </div>
                    </div>
                    <div style={cardStyles.dashedBorder}></div>
                    <div style={cardStyles.rowWrapper}>
                        <div style={cardStyles.leftTitle}>Key Words</div>
                        <div style={cardStyles.rightContent}>
                            <span style={cardStyles.keyWordsText}>
                                {renderStyledKeywords(keywordIndices)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 카드 2: Meaning / Verbal Cue */} 
                <div style={cardStyles.blockContainer}> 
                    <div style={cardStyles.rowWrapper}>
                        <div style={cardStyles.leftTitle}>Korean Meaning</div>
                        <div style={cardStyles.rightContent}>
                            <span style={cardStyles.koreanMeaningText}>{currentWordData.meaning}</span>
                        </div>
                    </div>
                    <div style={cardStyles.dashedBorder}></div>
                    <div style={cardStyles.rowWrapper}>
                        <div style={cardStyles.leftTitle}>Verbal Cue</div>
                        <div style={cardStyles.rightContent}>
                            <span style={cardStyles.verbalCueText}>{displayVerbalCue}</span>
                        </div>
                    </div>
                </div>
                {/* === 단어 정보 카드 그룹 끝 === */} 

                {/* === 설문 항목 카드 === */} 
                <div style={cardStyles.blockContainer}> 
                    {/* 1. Helpfulness */} 
                    <div style={cardStyles.rowWrapper}>
                        <div style={cardStyles.surveyLeftTitle}>Helpfulness{'\n'}(유익함)</div> 
                        <div style={cardStyles.rightContent}>
                            <div style={cardStyles.ratingQuestionText}>
                                이 단서(문장과 키워드)들은 단어를 학습하는 데 효과적이었다.
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
                        <div style={cardStyles.surveyLeftTitle}>Imageability{'\n'}(이미지화 가능성)</div> 
                        <div style={cardStyles.rightContent}>
                            <div style={cardStyles.ratingQuestionText}>
                                이 단서들은 생생하고 구체적인 심상을 떠올리게 한다.
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
                        <div style={cardStyles.surveyLeftTitle}>Coherence{'\n'}(일관성)</div> 
                        <div style={cardStyles.rightContent}>
                            <div style={cardStyles.ratingQuestionText}>
                                이 단서는 의미가 명확하고 문장이 자연스럽게 구성되어 있다.
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
                    <Typography.Title level={5} style={{ color: '#888888', marginBottom: '8px' }}>
                        &lt;평가 기준&gt;
                    </Typography.Title>
                    <Typography.Paragraph style={{ color: '#888888', marginBottom: '24px' }}>
                        아래는 5점 척도에서 일관적인 점수를 부여할 수 있도록 돕기 위한 예시 문장입니다.
                        <br />
                        각각의 평가 항목에 대해 1점, 3점, 5점의 사례를 참고하여 점수를 선택하세요.
                    </Typography.Paragraph>

                    {/* 1. Helpfulness Rubric */}
                    <div style={{ marginBottom: '32px' }}>
                        <Typography.Title level={5} style={{ color: '#888888', marginBottom: '16px' }}>
                            1. Helpfulness (유익함)
                        </Typography.Title>
                        <Table
                            columns={rubricColumns}
                            dataSource={helpfulnessData}
                            pagination={false}
                            bordered
                            size="small"
                            rowKey="key"
                        />
                    </div>

                    {/* 2. Imageability Rubric */}
                    <div style={{ marginBottom: '32px' }}>
                        <Typography.Title level={5} style={{ color: '#888888', marginBottom: '16px' }}>
                            2. Imageability (이미지화 가능성)
                        </Typography.Title>
                        {/* 테이블 추가 */}
                        <Table
                            columns={rubricColumns}
                            dataSource={imageabilityData} // 데이터 소스 변경
                            pagination={false}
                            bordered
                            size="small"
                            rowKey="key"
                        />
                        {/* <Typography.Paragraph style={{ color: '#888888' }}>
                            (Imageability 평가 기준 예시 추가 예정)
                        </Typography.Paragraph> */}
                    </div>

                    {/* 3. Coherence Rubric */}
                    <div style={{ marginBottom: '32px' }}>
                        <Typography.Title level={5} style={{ color: '#888888', marginBottom: '16px' }}>
                            3. Coherence (일관성)
                        </Typography.Title>
                        {/* 테이블 추가 */}
                        <Table
                            columns={rubricColumns}
                            dataSource={coherenceData} // 데이터 소스 변경
                            pagination={false}
                            bordered
                            size="small"
                            rowKey="key"
                        />
                         {/* <Typography.Paragraph style={{ color: '#888888' }}>
                            (Coherence 평가 기준 예시 추가 예정)
                        </Typography.Paragraph> */}
                    </div>
                </div>
                {/* === 상세 평가 기준 (Rubric) Section 끝 === */}
            </div>
        </MainLayout>
    );
};

export default SurveyPage; 