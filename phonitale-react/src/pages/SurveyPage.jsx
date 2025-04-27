import React, { useState, useEffect } from 'react';
import { Progress, Rate, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import BlueButton from '../components/BlueButton';

// --- Helper Functions (Copied from LearningPage) ---
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

function parseIndexingString(indexString) {
    if (!indexString || typeof indexString !== 'string' || !indexString.startsWith('[')) {
        return [];
    }
    const indices = [];
    const regex = /\{'([^\']+)':\s*'(\d+):(\d+)'\}/g;
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

const UNDERLINE_COLORS = [
    'rgba(127, 151, 255, 0.7)', 
    'rgba(151, 218, 155, 0.7)', 
    'rgba(255, 186, 186, 0.7)', 
    'rgba(226, 217, 138, 0.7)', 
    'rgba(255, 185, 145, 0.7)', 
];

function renderWordWithUnderlines(word, indexingData, isKeyWord = false) {
    if (!word) return null;
    if (!indexingData || !Array.isArray(indexingData) || indexingData.length === 0) {
        return isKeyWord && Array.isArray(word) ? word.join('') : word;
    }
    let parts = [];
    let lastIndex = 0;
    const sortedIndices = [...indexingData].sort((a, b) => a.range[0] - b.range[0]);

    sortedIndices.forEach(({ key, range }, groupIndex) => {
        const color = UNDERLINE_COLORS[groupIndex % UNDERLINE_COLORS.length];
        const style = { borderBottomColor: color };

        if (isKeyWord) {
            if (parts.length === 0 && lastIndex === 0) parts.push(word);
            let newParts = [];
            parts.forEach(part => {
                if (typeof part === 'string') {
                    const regex = new RegExp(key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
                    let subLastIndex = 0;
                    let match;
                    while ((match = regex.exec(part)) !== null) {
                        if (match.index > subLastIndex) {
                            newParts.push(part.substring(subLastIndex, match.index));
                        }
                        newParts.push(<span key={`kw-${groupIndex}-${match.index}`} className="underline-span" style={style}>{match[0]}</span>);
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
        } else {
            const [start, end] = range || [null, null];
            if (start === null || end === null) return;
            if (start > lastIndex) parts.push(word.substring(lastIndex, start));
            parts.push(<span key={`ew-${groupIndex}`} className="underline-span" style={style}>{word.substring(start, end)}</span>);
            lastIndex = Math.max(lastIndex, end);
        }
    });

    if (!isKeyWord && lastIndex < word.length) {
        parts.push(word.substring(lastIndex));
    }
    return parts.length > 0 ? parts : word;
}
// --------------------------------------------------------

const SurveyPage = () => {
    const navigate = useNavigate();
    const [wordList, setWordList] = useState([]);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [responses, setResponses] = useState({}); // Store responses keyed by word
    const [usefulnessRating, setUsefulnessRating] = useState(0);
    const [coherenceRating, setCoherenceRating] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const CSV_PATH = '/words/words_data_test.csv';
    const API_ENDPOINT = 'https://2ml24s4a3jfj5hqx4y644cgzbq0jbzmt.lambda-url.us-east-2.on.aws/survey'; // Specific endpoint for survey
    const USER_GROUP = 'kss'; // TODO: Dynamic user group?

    // Load Words (No Shuffle for Survey)
    useEffect(() => {
        setIsLoading(true);
        fetch(CSV_PATH)
            .then(response => response.ok ? response.text() : Promise.reject('Failed to load CSV'))
            .then(csvText => {
                const parsedData = parseCSV(csvText);
                setWordList(parsedData); // Use the original order
                setCurrentWordIndex(0);
                setResponses({});
                setUsefulnessRating(0);
                setCoherenceRating(0);
                setIsLoading(false);
            })
            .catch(error => {
                console.error('Error loading/parsing CSV:', error);
                setIsLoading(false);
            });
    }, []);

    // Submit Survey Responses
    const submitSurvey = async (finalResponses) => {
        const userId = sessionStorage.getItem('userName') || 'unknown_user';
        const payload = {
            userId: userId,
            surveyResponses: Object.values(finalResponses) // Send array of response objects
        };
        console.log("Submitting survey responses:", payload);
        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (response.ok) {
                console.log('Survey submitted successfully');
            } else {
                console.error('Failed to submit survey:', response.status, await response.text());
            }
        } catch (error) {
            console.error('Error submitting survey:', error);
        }
    };

    // Handle Next Click
    const handleNextClick = () => {
        if (usefulnessRating === 0 || coherenceRating === 0) return;

        const currentWordData = wordList[currentWordIndex];
        const newResponse = {
            word: currentWordData.english_word,
            condition: USER_GROUP, // Add condition info
            usefulness: usefulnessRating,
            coherence: coherenceRating,
            timestamp: new Date().toISOString()
        };
        
        const updatedResponses = { ...responses, [currentWordData.english_word]: newResponse };
        setResponses(updatedResponses);
        console.log("Survey Response Recorded:", newResponse);

        if (currentWordIndex < wordList.length - 1) {
            setCurrentWordIndex(prevIndex => prevIndex + 1);
            setUsefulnessRating(0);
            setCoherenceRating(0);
        } else {
            // End of Survey
            console.log("Survey Complete. All Responses:", updatedResponses);
            submitSurvey(updatedResponses);
            navigate('/end'); // Navigate to end page
        }
    };

    if (isLoading) {
        return <MainLayout><div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div></MainLayout>;
    }

    if (wordList.length === 0 || currentWordIndex >= wordList.length) {
        return <MainLayout><div>Loading or survey complete...</div></MainLayout>;
    }

    const currentWordData = wordList[currentWordIndex];
    const progressPercent = Math.round(((currentWordIndex + 1) / wordList.length) * 100);
    const totalWordsDisplay = wordList.length;

    const keywordKey = `keyword_${USER_GROUP}`;
    const verbalCueKey = `verbal_cue_${USER_GROUP}`;
    const keywordIndexingString = currentWordData[keywordKey];
    const keywordIndices = parseIndexingString(keywordIndexingString);
    const displayKeyword = keywordIndices.length > 0 ? keywordIndices.map(item => item.key).join(', ') : currentWordData[keywordKey];
    const displayVerbalCue = currentWordData[verbalCueKey];

    const isNextDisabled = usefulnessRating === 0 || coherenceRating === 0;

    // --- Render Logic ---
    return (
        <MainLayout>
            <div className="survey-content-wrapper" style={{ padding: '20px' }}>
                {/* Progress Section */}                <div className="progress-section" style={{ width: '100%', maxWidth: '550px', marginBottom: '24px' }}>
                    <div className="progress-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '0 5px' }}>
                        <span style={{ fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#868686' }}>Survey</span>
                        <span style={{ fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#868686' }}>{currentWordIndex + 1} / {totalWordsDisplay}</span>
                    </div>
                    <Progress percent={progressPercent} showInfo={false} strokeColor="#2049FF" />
                </div>

                {/* Word Display Section */}                <div className="word-display-section" style={{ width: '100%', maxWidth: '550px', display: 'flex', flexDirection: 'column', marginBottom: '16px' }}>
                     {/* Copied card structure from learning.html */}
                     <div className="word-card english-word-card" style={{ /* styles */ }}>
                         <span className="word-card-label" style={{ /* styles */ }}>English Words</span>
                         <span className="english-word-text" style={{ /* styles */ }}>
                             {renderWordWithUnderlines(currentWordData.english_word, keywordIndices, false)}
                         </span>
                     </div>
                     <div className="word-card key-words-card" style={{ /* styles */ }}>
                          <span className="word-card-label" style={{ /* styles */ }}>Key Words</span>
                          <span className="key-words-text" style={{ /* styles */ }}>
                              {renderWordWithUnderlines(displayKeyword, keywordIndices, true)}
                          </span>
                     </div>
                     <div className="word-card verbal-cue-card" style={{ /* styles */ }}>
                          <span className="word-card-label" style={{ /* styles */ }}>Verbal Cue</span>
                          <span className="verbal-cue-text" style={{ /* styles */ }}>{displayVerbalCue}</span>
                     </div>
                     <div className="word-card korean-meaning-card" style={{ /* styles */ }}>
                          <span className="word-card-label" style={{ /* styles */ }}>Korean Meaning</span>
                          <span className="korean-meaning-text" style={{ /* styles */ }}>{currentWordData.meaning}</span>
                     </div>
                 </div>

                {/* Rating Section */}                <div className="rating-section" style={{ width: '100%', maxWidth: '550px', display: 'flex', flexDirection: 'column', marginBottom: '32px' }}>
                    <div className="rating-card" style={{ /* card styles */ marginBottom: '16px' }}>
                        <span className="word-card-label" style={{ /* label styles */ }}>Usefulness</span>
                        <div className="rating-question" style={{ fontFamily: 'BBTreeGo_R, sans-serif', fontSize: '16px', color: '#555', marginBottom: '10px' }}>Key Words와 Verbal Cue가 학습에 얼마나 도움이 되었나요?</div>
                        <Rate allowHalf={false} count={5} value={usefulnessRating} onChange={setUsefulnessRating} style={{ fontSize: '28px' }} />
                    </div>
                    <div className="rating-card" style={{ /* card styles */ }}>
                        <span className="word-card-label" style={{ /* label styles */ }}>Coherence</span>
                        <div className="rating-question" style={{ fontFamily: 'BBTreeGo_R, sans-serif', fontSize: '16px', color: '#555', marginBottom: '10px' }}>Key Words와 Verbal Cue가 얼마나 명확하고 자연스러웠나요?</div>
                        <Rate allowHalf={false} count={5} value={coherenceRating} onChange={setCoherenceRating} style={{ fontSize: '28px' }} />
                    </div>
                </div>

                {/* Footer Section */}                <div className="footer-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <BlueButton
                        text="Next"
                        onClick={handleNextClick}
                        disabled={isNextDisabled}
                    />
                </div>
                 <style>{`
                    .underline-span {
                         display: inline-block;
                         padding-bottom: 2px;
                         border-bottom-width: 4px;
                         border-bottom-style: solid;
                         line-height: 1.1;
                    }
                    .word-card { background: #fff; border-radius: 20px; padding: 20px 32px; box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.25); position: relative; text-align: center; min-height: 80px; display: flex; flex-direction: column; justify-content: center; margin-bottom: -1px; }
                    .word-card-label { position: absolute; top: 50%; left: -100px; transform: translateY(-50%); font-family: 'Rubik', sans-serif; font-size: 16px; color: #C7C7C7; width: 90px; text-align: right; }
                    .english-word-text { font-family: 'Rubik', sans-serif; font-size: 36px; font-weight: 500; color: #000; text-align: center; }
                    .key-words-text { font-family: 'BBTreeGo_R', sans-serif; font-size: 20px; color: #000; display: inline-flex; align-items: center; justify-content: center; gap: 8px; text-align: center; }
                    .verbal-cue-text { font-family: 'BBTreeGo_R', sans-serif; font-size: 20px; color: #000; line-height: 1.6; text-align: center; }
                    .korean-meaning-text { font-family: 'BBTreeGo_R', sans-serif; font-size: 30px; color: #000; text-align: center; }
                    .english-word-card { margin-bottom: 16px; }
                    .key-words-card { border-radius: 20px 20px 0 0; padding-top: 25px; padding-bottom: 10px; border-bottom: none; }
                    .verbal-cue-card { border-top: 1px dashed #C7C7C7; border-bottom: 1px dashed #C7C7C7; border-radius: 0; padding: 15px 32px; }
                    .korean-meaning-card { border-radius: 0 0 20px 20px; padding-top: 10px; padding-bottom: 25px; border-top: none; }
                    .rating-card { background: #fff; border-radius: 20px; padding: 20px 32px; box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.25); position: relative; text-align: center; min-height: 80px; display: flex; flex-direction: column; justify-content: center; margin-bottom: 16px; }
                  `}</style>
            </div>
        </MainLayout>
    );
};

export default SurveyPage; 