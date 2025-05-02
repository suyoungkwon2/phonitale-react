import React, { useState, useEffect, useRef } from 'react';
import { Progress, Rate, Spin, message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
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

// --- 카드 스타일 수정 ---
const cardStyles = {
    blockContainer: {
      background: '#FFFFFF',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      width: '100%',
      maxWidth: '685px', // 최대 너비 유지
      display: 'flex',
      flexDirection: 'column',
      marginBottom: '16px', // 블록 간 간격 추가
    },
    rowWrapper: {
      display: 'flex',
      width: '100%',
      alignItems: 'center',
    },
    leftTitle: {
      width: '120px',
      textAlign: 'center', // 가운데 정렬
      color: '#656565',
      fontSize: '14px',
    //   paddingTop: '2px', // 조정될 수 있음
      paddingRight: '16px',
      flexShrink: 0,
      whiteSpace: 'pre-line', // 줄바꿈 허용
      display: 'flex',       // Flexbox 사용하여
      flexDirection: 'column', // 세로 정렬
      justifyContent: 'center' // 수직 가운데 정렬
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
        gap: '4px',
    },
    koreanMeaningText: {
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#000000',
        fontFamily: 'BBTreeGo_R, sans-serif',
    },
    verbalCueText: {
        fontSize: '14px',
        color: '#000000',
        lineHeight: '1.6',
        fontFamily: 'BBTreeGo_R, sans-serif',
     },
     ratingQuestionText: {
        fontSize: '14px',
        color: '#000000',
        lineHeight: '1.6',
        marginBottom: '10px',
        fontFamily: 'BBTreeGo_R, sans-serif',
        textAlign: 'left',
     },
     ratingComponentWrapper: { // Rate 컴포넌트와 루브릭 포함
        width: '100%',
        textAlign: 'left',
        display: 'flex', // Flexbox 사용
        alignItems: 'center', // 세로 가운데 정렬
        gap: '10px' // 요소 간 간격
     },
     rubricText: { // 루브릭 텍스트 스타일
        fontSize: '12px',
        color: '#888888',
        flexShrink: 0, // 크기 줄어들지 않도록
     }
};

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
                round_number: parseInt(currentWordData.round || currentRound, 10), // currentWordData에서 round 가져오기
                page_type: 'survey',
                timestamp_in: timestampIn,
                timestamp_out: timestampOut,
                duration: duration,
                helpfulness: usefulnessRating, // 키 이름 변경
                imageability: imageabilityRating, // 신규 데이터 추가
                coherence: coherenceRating,
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
                    alignItems: 'center'
                }}
            >
                <div className="progress-section" style={{ width: '100%', maxWidth: '685px', margin: '20px auto 24px' }}>
                    <div className="progress-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '0 5px' }}>
                        <span style={{ fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#868686' }}>Survey</span>
                        <span style={{ fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#868686' }}>{currentWordIndex + 1} / {surveyWordList.length}</span>
                    </div>
                    <Progress percent={progressPercent} showInfo={false} strokeColor="#2049FF" />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '0 20px' }}>
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

                    <div style={cardStyles.blockContainer}>
                        <div style={cardStyles.rowWrapper}>
                            <div style={cardStyles.leftTitle}>Verbal Cue</div>
                            <div style={cardStyles.rightContent}>
                                <span style={cardStyles.verbalCueText}>{displayVerbalCue}</span>
                            </div>
                        </div>
                        <div style={cardStyles.dashedBorder}></div>
                        <div style={cardStyles.rowWrapper}>
                            <div style={cardStyles.leftTitle}>Korean Meaning</div>
                            <div style={cardStyles.rightContent}>
                                <span style={cardStyles.koreanMeaningText}>{currentWordData.meaning}</span>
                            </div>
                        </div>
                    </div>

                    <div style={cardStyles.blockContainer}>
                        <div style={cardStyles.rowWrapper}>
                            <div style={cardStyles.leftTitle}>Helpfulness{'\n'}(유익함)</div>
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
                                        style={{ fontSize: '28px', flexGrow: 1, textAlign: 'center' }}
                                        disabled={isSubmitting}
                                    />
                                    <span style={cardStyles.rubricText}>매우 그렇다</span>
                                </div>
                            </div>
                        </div>

                        <div style={cardStyles.dashedBorder}></div>

                        <div style={cardStyles.rowWrapper}>
                            <div style={cardStyles.leftTitle}>Imageability{'\n'}(이미지화 가능성)</div>
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
                                        style={{ fontSize: '28px', flexGrow: 1, textAlign: 'center' }}
                                        disabled={isSubmitting}
                                    />
                                    <span style={cardStyles.rubricText}>매우 그렇다</span>
                                </div>
                            </div>
                        </div>

                        <div style={cardStyles.dashedBorder}></div>

                        <div style={cardStyles.rowWrapper}>
                            <div style={cardStyles.leftTitle}>Coherence{'\n'}(일관성)</div>
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
                                        style={{ fontSize: '28px', flexGrow: 1, textAlign: 'center' }}
                                        disabled={isSubmitting}
                                    />
                                    <span style={cardStyles.rubricText}>매우 그렇다</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', maxWidth: '685px', padding: '16px 0 40px' }}>
                        <BlueButton
                            text="Next"
                            onClick={handleNextClick}
                            disabled={isNextDisabled}
                            loading={isSubmitting}
                        />
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default SurveyPage; 