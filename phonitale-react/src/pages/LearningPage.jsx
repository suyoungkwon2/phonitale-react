import React, { useState, useEffect, useRef } from 'react';
import { Progress, Spin } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import BlueButton from '../components/BlueButton';

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

// Underline Renderer
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
            // Simplified Key Word rendering: Assume word is a string (e.g., joined keys)
             if (parts.length === 0 && lastIndex === 0) parts.push(word); // Start with the full word string
 
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
                     newParts.push(part); // Keep existing spans
                 }
             });
             parts = newParts;

        } else {
             // English Word rendering (range based)
             const [start, end] = range || [null, null];
             if (start === null || end === null) return;

            if (start > lastIndex) {
                parts.push(word.substring(lastIndex, start));
            }
            if (start < lastIndex) {
                 console.warn(`Overlapping range detected: [${start}, ${end}]`);
            }
            parts.push(<span key={`ew-${groupIndex}`} className="underline-span" style={style}>{word.substring(start, end)}</span>);
            lastIndex = Math.max(lastIndex, end);
        }
    });

    if (!isKeyWord && lastIndex < word.length) {
        parts.push(word.substring(lastIndex));
    }

    return parts;
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
    const { roundNumber } = useParams();
    const navigate = useNavigate();
    const [wordList, setWordList] = useState([]);
    const [shuffledWords, setShuffledWords] = useState([]);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [isNextButtonEnabled, setIsNextButtonEnabled] = useState(false);
    const [startTime, setStartTime] = useState(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [responses, setResponses] = useState([]); // To store timing responses
    const timerRef = useRef(null);

    const USER_GROUP = 'kss'; // TODO: Make this dynamic if needed
    const CSV_PATH = '/words/words_data_test.csv'; // Assuming CSV is in /public/words/

    // Load and Shuffle Words
    useEffect(() => {
        setIsLoading(true);
        fetch(CSV_PATH)
            .then(response => response.ok ? response.text() : Promise.reject('Network error'))
            .then(csvText => {
                const parsedData = parseCSV(csvText);
                setWordList(parsedData);
                const shuffled = shuffleArray([...parsedData]);
                setShuffledWords(shuffled);
                setCurrentWordIndex(0);
                setResponses([]);
                setIsLoading(false);
            })
            .catch(error => {
                console.error('Error fetching/parsing CSV:', error);
                setIsLoading(false);
                // TODO: Show error message to user
            });
    }, [roundNumber]); // Re-fetch if roundNumber changes? (Likely not needed if words are same across rounds)

    // Timer and Word Transition Logic
    useEffect(() => {
        if (isLoading || shuffledWords.length === 0 || currentWordIndex >= shuffledWords.length) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

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
                // Enable next button after 15 seconds (at timeLeft 15)
                if (prevTime === 16) { 
                    setIsNextButtonEnabled(true);
                }
                return prevTime - 1;
            });
        }, 1000);

        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [currentWordIndex, shuffledWords, isLoading]);

    // Next Button Handler
    const handleNextClick = (isTimeout = false) => {
        if (timerRef.current) clearInterval(timerRef.current);

        const endTime = Date.now();
        const duration = startTime ? Math.round((endTime - startTime) / 1000) : 0;
        const currentWord = shuffledWords[currentWordIndex];

        // Record response locally (API call will be separate)
        const newResponse = { 
            round: roundNumber,
            phase: 'learning', 
            word: currentWord.english_word,
            duration: duration,
            timestamp: new Date().toISOString() 
        };
        const updatedResponses = [...responses, newResponse];
        setResponses(updatedResponses);
        console.log("Response Recorded:", newResponse);

        setIsTransitioning(true);
        setTimeout(() => {
            if (currentWordIndex < shuffledWords.length - 1) {
                setCurrentWordIndex(prevIndex => prevIndex + 1);
                setIsTransitioning(false);
            } else {
                 // End of learning phase for this round
                 console.log(`Learning Round ${roundNumber} Complete. Responses:`, updatedResponses);
                 // TODO: Save responses array (e.g., to chrome.storage or send to API)
                 navigate(`/round/${roundNumber}/recognition/start`);
            }
        }, 500); // Shorter transition time
    };

    if (isLoading) {
        return <MainLayout><div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div></MainLayout>;
    }

    if (shuffledWords.length === 0 || currentWordIndex >= shuffledWords.length) {
        // Should ideally navigate away or show completion message before this
        return <MainLayout><div>Loading or phase complete...</div></MainLayout>;
    }

    const currentWordData = shuffledWords[currentWordIndex];
    const progressPercent = Math.round(((currentWordIndex + 1) / shuffledWords.length) * 100);

    const keywordKey = `keyword_${USER_GROUP}`;
    const verbalCueKey = `verbal_cue_${USER_GROUP}`;
    const keywordIndices = parseIndexingString(currentWordData[keywordKey]);
    const displayKeyword = keywordIndices.length > 0 ? keywordIndices.map(item => item.key).join(', ') : currentWordData[keywordKey];
    const displayVerbalCue = currentWordData[verbalCueKey];

    // --- Render Logic ---
    return (
        <MainLayout>
            <div 
                className="learning-content-wrapper" 
                style={{ 
                    opacity: isTransitioning ? 0 : 1, 
                    transition: 'opacity 0.3s ease-in-out', // Smooth transition
                    padding: '20px' // Add some padding
                }}
            >
                {/* Progress Section */}                <div className="progress-section" style={{ width: '100%', maxWidth: '550px', marginBottom: '24px' }}>
                    <div className="progress-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '0 5px' }}>
                        <span style={{ fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#868686' }}>Round {roundNumber} | Learning</span>
                        <span style={{ fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#868686' }}>{currentWordIndex + 1} / {shuffledWords.length}</span>
                    </div>
                    <Progress percent={progressPercent} showInfo={false} strokeColor="#2049FF" />
                </div>

                {/* Instruction Text */}                <div className="instruction-text" style={{ fontFamily: 'BBTreeGo_R, sans-serif', fontSize: '20px', color: '#000', textAlign: 'center', marginBottom: '32px', whiteSpace: 'pre-line' }}>
                    영어 단어의 발음과 주어진 문장을 연상하여,<br/>
                    떠오르는 시각적인 장면을 상상해보세요.
                </div>

                {/* Word Display Section */}                <div className="word-display-section" style={{ 
                    width: '100%', 
                    maxWidth: '550px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    marginBottom: '32px',
                    margin: '0 auto'
                }}>
                    {/* Base Card Style */}                    
                    <div className="word-card english-word-card" style={{ background: '#fff', borderRadius: '20px', padding: '20px 32px', boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.25)', position: 'relative', textAlign: 'center', minHeight: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', marginBottom: '16px' }}>
                        <span className="word-card-label" style={{ position: 'absolute', top: '50%', left: '-100px', transform: 'translateY(-50%)', fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#C7C7C7', width: '90px', textAlign: 'right' }}>English Words</span>
                        <span className="english-word-text" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '36px', fontWeight: 500, color: '#000' }}>
                            {renderWordWithUnderlines(currentWordData.english_word, keywordIndices, false)}
                        </span>
                    </div>
                     <div className="word-card key-words-card" style={{ background: '#fff', padding: '20px 32px', boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.25)', position: 'relative', textAlign: 'center', minHeight: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRadius: '20px 20px 0 0', paddingTop: '25px', paddingBottom: '10px' }}>
                         <span className="word-card-label" style={{ position: 'absolute', top: '50%', left: '-100px', transform: 'translateY(-50%)', fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#C7C7C7', width: '90px', textAlign: 'right' }}>Key Words</span>
                        <span className="key-words-text" style={{ fontFamily: 'BBTreeGo_R, sans-serif', fontSize: '20px', color: '#000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            {renderWordWithUnderlines(displayKeyword, keywordIndices, true)}
                        </span>
                    </div>
                    <div className="word-card verbal-cue-card" style={{ background: '#fff', padding: '15px 32px', boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.25)', position: 'relative', textAlign: 'center', minHeight: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderTop: '1px dashed #C7C7C7', borderBottom: '1px dashed #C7C7C7', borderRadius: 0, lineHeight: 1.6 }}>
                         <span className="word-card-label" style={{ position: 'absolute', top: '50%', left: '-100px', transform: 'translateY(-50%)', fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#C7C7C7', width: '90px', textAlign: 'right' }}>Verbal Cue</span>
                        <span className="verbal-cue-text" style={{ fontFamily: 'BBTreeGo_R, sans-serif', fontSize: '20px', color: '#000' }}>{displayVerbalCue}</span>
                    </div>
                    <div className="word-card korean-meaning-card" style={{ background: '#fff', padding: '20px 32px', boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.25)', position: 'relative', textAlign: 'center', minHeight: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRadius: '0 0 20px 20px', paddingTop: '10px', paddingBottom: '25px' }}>
                         <span className="word-card-label" style={{ position: 'absolute', top: '50%', left: '-100px', transform: 'translateY(-50%)', fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#C7C7C7', width: '90px', textAlign: 'right' }}>Korean Meaning</span>
                        <span className="korean-meaning-text" style={{ fontFamily: 'BBTreeGo_R, sans-serif', fontSize: '30px', color: '#000' }}>{currentWordData.meaning}</span>
                    </div>
                </div>

                {/* Footer Section */}                <div className="footer-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <span className="timer-text" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#868686' }}>{timeLeft}s</span>
                    <BlueButton
                        text="Next"
                        onClick={() => handleNextClick(false)}
                        disabled={!isNextButtonEnabled}
                    />
                </div>

                 {/* Underline CSS - ideally move to a CSS file */}                 
                 <style>{`
                    .underline-span {
                         display: inline-block;
                         padding-bottom: 2px;
                         border-bottom-width: 4px;
                         border-bottom-style: solid;
                         line-height: 1.1;
                    }
                 `}</style>
            </div>
        </MainLayout>
    );
};

export default LearningPage; 