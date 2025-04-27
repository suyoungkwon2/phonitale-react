import React, { useState, useEffect } from 'react';
import { Progress, Rate, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import BlueButton from '../components/BlueButton';
import { useExperiment } from '../context/ExperimentContext';

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

// Underline Renderer
const UNDERLINE_COLORS = [
    'rgba(127, 151, 255, 0.7)', 
    'rgba(151, 218, 155, 0.7)', 
    'rgba(255, 186, 186, 0.7)', 
    'rgba(226, 217, 138, 0.7)', 
    'rgba(255, 185, 145, 0.7)', 
];

// LearningPage와 동일한 함수
function renderWordWithUnderlines(word, indexingData, isKeyWord = false) {
    if (!word) return null;
    if (!indexingData || !Array.isArray(indexingData) || indexingData.length === 0) {
        // LearningPage의 원본 반환 로직
        return isKeyWord && Array.isArray(word) ? word.join('') : word;
    }

    let parts = [];
    let lastIndex = 0;
    // LearningPage와 동일한 정렬 로직
    const sortedIndices = [...indexingData].sort((a, b) => (a.range && b.range) ? a.range[0] - b.range[0] : 0);

    sortedIndices.forEach(({ key, range }, groupIndex) => {
        if (!range) return; // range 없는 경우 처리 추가

        const color = UNDERLINE_COLORS[groupIndex % UNDERLINE_COLORS.length];
        const style = { borderBottomColor: color };

        if (isKeyWord) {
             if (parts.length === 0 && lastIndex === 0) parts.push(word);
 
             let newParts = [];
             parts.forEach(part => {
                 if (typeof part === 'string') {
                     // LearningPage의 정규식 이스케이프 사용
                     const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                     const regex = new RegExp(escapedKey, 'g');
                     let subLastIndex = 0;
                     let match;
                     while ((match = regex.exec(part)) !== null) {
                         if (match.index > subLastIndex) {
                             newParts.push(part.substring(subLastIndex, match.index));
                         }
                         // LearningPage의 키 생성 방식
                         const spanKey = `kw-${groupIndex}-${match.index}`; 
                         newParts.push(<span key={spanKey} className="underline-span" style={style}>{match[0]}</span>);
                         subLastIndex = regex.lastIndex;
                     }
                     if (subLastIndex < part.length) {
                         newParts.push(part.substring(subLastIndex));
                     }
                 } else {
                     newParts.push(part); // 기존 JSX 요소 유지
                 }
             });
             parts = newParts;

        } else {
             const [start, end] = range;
             if (start === null || end === null) return; 

            if (start > lastIndex) {
                parts.push(word.substring(lastIndex, start));
            }
             if (start < lastIndex) { // LearningPage의 중복 범위 경고
                  console.warn(`Overlapping range detected: [${start}, ${end}]`);
             }
            // LearningPage의 키 생성 방식
            const spanKey = `ew-${groupIndex}-${start}-${end}`; 
            parts.push(<span key={spanKey} className="underline-span" style={style}>{word.substring(start, end)}</span>);
            lastIndex = Math.max(lastIndex, end);
        }
    });

    // LearningPage의 남은 텍스트 추가 로직
    if (!isKeyWord && lastIndex < word.length) {
        parts.push(word.substring(lastIndex));
    }
    
    // LearningPage의 반환 로직 (배열 반환)
    return parts;
}
// --------------------------------------------------------

// --- Survey Page Component ---
const SurveyPage = () => {
    const navigate = useNavigate();
    const { wordList: wordsByRound, isLoadingWords } = useExperiment();
    const [surveyWordList, setSurveyWordList] = useState([]);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [responses, setResponses] = useState([]);
    const [usefulnessRating, setUsefulnessRating] = useState(0);
    const [coherenceRating, setCoherenceRating] = useState(0);

    const API_ENDPOINT = 'https://2ml24s4a3jfj5hqx4y644cgzbq0jbzmt.lambda-url.us-east-2.on.aws/responses';

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
            setResponses([]);
            setUsefulnessRating(0);
            setCoherenceRating(0);
        } else if (!isLoadingWords && Object.keys(wordsByRound).length === 0) {
            console.error("SurveyPage: Word list object is empty after loading.");
            setSurveyWordList([]);
        }
    }, [wordsByRound, isLoadingWords]);

    useEffect(() => {
        setUsefulnessRating(0);
        setCoherenceRating(0);
    }, [currentWordIndex]);

    const submitResponses = async (finalResponses) => {
        const userId = sessionStorage.getItem('userName') || 'unknown_user';
        const payload = {
            userId: userId,
            round: 0,
            phase: 'survey',
            responses: finalResponses.map(r => ({
                word: r.word,
                meaning: r.meaning,
                usefulness: r.usefulness, 
                coherence: r.coherence,
                timestamp: r.timestamp
            }))
        };
        console.log("Submitting survey responses:", payload);
        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            if (response.ok) {
                console.log('Survey responses submitted successfully');
            } else {
                console.error('Failed to submit survey responses:', response.status, await response.text());
            }
        } catch (error) {
            console.error('Error submitting survey responses:', error);
        }
    };

    const handleNextClick = () => {
        if (usefulnessRating === 0 || coherenceRating === 0) {
            alert('Please rate both usefulness and coherence.');
            return;
        }

        const currentWordData = surveyWordList[currentWordIndex];
        const newResponse = {
            word: currentWordData.word,
            meaning: currentWordData.meaning,
            usefulness: usefulnessRating,
            coherence: coherenceRating,
            timestamp: new Date().toISOString()
        };
        const updatedResponses = [...responses, newResponse];
        setResponses(updatedResponses);
        console.log("Survey Response Recorded:", newResponse);

        if (currentWordIndex < surveyWordList.length - 1) {
            setCurrentWordIndex(prevIndex => prevIndex + 1);
        } else {
            console.log('Survey Complete. Final Responses:', updatedResponses);
            submitResponses(updatedResponses);
            navigate('/end');
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
    // 키워드 처리 로직 추가
    const keywordIndexingString = currentWordData[keywordKey];
    const keywordIndices = parseIndexingString(keywordIndexingString);
    const displayKeywordString = keywordIndices.length > 0 ? keywordIndices.map(item => item.key).join(', ') : (keywordIndexingString || "N/A");
    const displayVerbalCue = currentWordData[verbalCueKey] || "N/A";

    const isNextDisabled = usefulnessRating === 0 || coherenceRating === 0;

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
                    <div className="word-card english-word-card" style={{ background: '#fff', borderRadius: '20px', padding: '20px 32px', boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.25)', position: 'relative', textAlign: 'center', minHeight: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', marginBottom: '16px' }}>
                        <span className="word-card-label" style={{ position: 'absolute', top: '50%', left: '-100px', transform: 'translateY(-50%)', fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#C7C7C7', width: '90px', textAlign: 'right' }}>English Words</span>
                        <span className="english-word-text" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '36px', fontWeight: 500, color: '#000' }}>
                           {currentWordData.word}
                        </span>
                    </div>
                    <div className="word-card key-words-card" style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: '25px 32px 10px', boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.25)', position: 'relative', textAlign: 'center', minHeight: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', marginBottom: '-1px', borderBottom: 'none' }}>
                        <span className="word-card-label" style={{ position: 'absolute', top: '50%', left: '-100px', transform: 'translateY(-50%)', fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#C7C7C7', width: '90px', textAlign: 'right' }}>Key Words</span>
                        <span className="key-words-text" style={{ fontFamily: 'BBTreeGo_R, sans-serif', fontSize: '20px', color: '#000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            {renderWordWithUnderlines(displayKeywordString, keywordIndices, true)}
                        </span>
                    </div>
                    <div className="word-card verbal-cue-card" style={{ background: '#fff', padding: '15px 32px', boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.25)', position: 'relative', textAlign: 'center', minHeight: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderTop: '1px dashed #C7C7C7', borderBottom: '1px dashed #C7C7C7', borderRadius: 0, lineHeight: 1.6, marginBottom: '-1px' }}>
                        <span className="word-card-label" style={{ position: 'absolute', top: '50%', left: '-100px', transform: 'translateY(-50%)', fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#C7C7C7', width: '90px', textAlign: 'right' }}>Verbal Cue</span>
                        <span className="verbal-cue-text" style={{ fontFamily: 'BBTreeGo_R, sans-serif', fontSize: '20px', color: '#000', lineHeight: 1.6 }}>{displayVerbalCue}</span>
                    </div>
                    <div className="word-card korean-meaning-card" style={{ background: '#fff', borderRadius: '0 0 20px 20px', padding: '10px 32px 25px', boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.25)', position: 'relative', textAlign: 'center', minHeight: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderTop: 'none' }}>
                        <span className="word-card-label" style={{ position: 'absolute', top: '50%', left: '-100px', transform: 'translateY(-50%)', fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#C7C7C7', width: '90px', textAlign: 'right' }}>Korean Meaning</span>
                        <span className="korean-meaning-text" style={{ fontFamily: 'BBTreeGo_R, sans-serif', fontSize: '30px', color: '#000' }}>{currentWordData.meaning}</span>
                    </div>
                </div>

                <div className="rating-section" style={{ width: '100%', maxWidth: '550px', display: 'flex', flexDirection: 'column', marginBottom: '32px' }}>
                    <div className="rating-card" style={{ background: '#fff', borderRadius: '20px', padding: '20px 32px', boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.25)', position: 'relative', textAlign: 'center', minHeight: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', marginBottom: '16px' }}>
                        <span className="word-card-label" style={{ position: 'absolute', top: '50%', left: '-100px', transform: 'translateY(-50%)', fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#C7C7C7', width: '90px', textAlign: 'right' }}>Usefulness</span>
                        <div className="rating-question" style={{ fontFamily: 'BBTreeGo_R, sans-serif', fontSize: '16px', color: '#555', marginBottom: '10px' }}>Key Words와 Verbal Cue가 학습에 얼마나 도움이 되었나요?</div>
                        <Rate allowHalf={false} count={5} value={usefulnessRating} onChange={setUsefulnessRating} style={{ fontSize: '28px' }} />
                    </div>
                    <div className="rating-card" style={{ background: '#fff', borderRadius: '20px', padding: '20px 32px', boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.25)', position: 'relative', textAlign: 'center', minHeight: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', marginBottom: '16px' }}>
                        <span className="word-card-label" style={{ position: 'absolute', top: '50%', left: '-100px', transform: 'translateY(-50%)', fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#C7C7C7', width: '90px', textAlign: 'right' }}>Coherence</span>
                        <div className="rating-question" style={{ fontFamily: 'BBTreeGo_R, sans-serif', fontSize: '16px', color: '#555', marginBottom: '10px' }}>Key Words와 Verbal Cue가 얼마나 명확하고 자연스러웠나요?</div>
                        <Rate allowHalf={false} count={5} value={coherenceRating} onChange={setCoherenceRating} style={{ fontSize: '28px' }} />
                    </div>
                </div>

                <div className="footer-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <BlueButton
                        text="Next"
                        onClick={handleNextClick}
                        disabled={isNextDisabled}
                    />
                </div>
            </div>
            <style>{`
                .underline-span {
                    display: inline-block;
                    padding-bottom: 2px;
                    border-bottom-width: 4px;
                    border-bottom-style: solid;
                    line-height: 1.1;
                }
            `}</style>
        </MainLayout>
    );
};

export default SurveyPage; 