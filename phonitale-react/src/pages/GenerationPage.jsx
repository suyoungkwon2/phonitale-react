import React, { useState, useEffect, useRef } from 'react';
import { Progress, Input, Spin } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
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

// --- Generation Page Component ---
const GenerationPage = () => {
    const { roundNumber } = useParams();
    const navigate = useNavigate();
    const [wordList, setWordList] = useState([]);
    const [shuffledWords, setShuffledWords] = useState([]);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [startTime, setStartTime] = useState(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [userAnswer, setUserAnswer] = useState(""); 
    const [responses, setResponses] = useState([]);
    const timerRef = useRef(null);
    const inputRef = useRef(null); 

    const CSV_PATH = '/words/words_data_test.csv';
    const API_ENDPOINT = 'https://2ml24s4a3jfj5hqx4y644cgzbq0jbzmt.lambda-url.us-east-2.on.aws/responses';

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
                setUserAnswer("");
                setIsLoading(false);
            })
            .catch(error => {
                console.error('Error fetching/parsing CSV:', error);
                setIsLoading(false);
            });
    }, [roundNumber]);

    // Timer and Word Transition Logic
    useEffect(() => {
        if (isLoading || shuffledWords.length === 0 || currentWordIndex >= shuffledWords.length) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        setTimeLeft(30);
        setStartTime(Date.now());
        setUserAnswer(""); 
        if (inputRef.current) inputRef.current.focus();

        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            setTimeLeft(prevTime => {
                if (prevTime <= 1) {
                    clearInterval(timerRef.current);
                    handleNextClick(true); // Timeout
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);

        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [currentWordIndex, shuffledWords, isLoading]);

    // Function to send responses to API
    const submitResponses = async (finalResponses) => {
        const userId = sessionStorage.getItem('userName') || 'unknown_user'; 
        const payload = {
            userId: userId,
            round: roundNumber,
            phase: 'generation',
            responses: finalResponses
        };
        console.log("Submitting responses:", payload);
        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            if (response.ok) {
                console.log('Responses submitted successfully');
            } else {
                console.error('Failed to submit responses:', response.status, await response.text());
            }
        } catch (error) {
            console.error('Error submitting responses:', error);
        }
    };

    // Next Button Handler
    const handleNextClick = (isTimeout = false) => {
        if (timerRef.current) clearInterval(timerRef.current);

        const endTime = Date.now();
        const duration = startTime ? Math.round((endTime - startTime) / 1000) : 0;
        const currentWordData = shuffledWords[currentWordIndex];
        const formattedAnswer = userAnswer.trim().toLowerCase(); // Format answer
        const correctAnswer = currentWordData.english_word.trim().toLowerCase();

        const newResponse = {
            meaning: currentWordData.meaning,
            word: currentWordData.english_word,
            answer: formattedAnswer,
            is_correct: formattedAnswer === correctAnswer, // Correctness check
            duration: duration,
            isTimeout: isTimeout,
            timestamp: new Date().toISOString()
        };
        const updatedResponses = [...responses, newResponse];
        setResponses(updatedResponses);
        console.log("Generation Response Recorded:", newResponse);

        setIsTransitioning(true);
        setTimeout(() => {
            if (currentWordIndex < shuffledWords.length - 1) {
                setCurrentWordIndex(prevIndex => prevIndex + 1);
                setIsTransitioning(false);
            } else {
                // End of generation phase
                console.log(`Generation Round ${roundNumber} Complete. Responses:`, updatedResponses);
                submitResponses(updatedResponses); // Submit data to API

                const currentRound = parseInt(roundNumber, 10);
                if (currentRound < 3) {
                    navigate(`/round/${currentRound + 1}/learning/start`); // Go to next round
                } else {
                    navigate('/survey/start'); // Go to survey after round 3
                }
            }
        }, 500);
    };

    if (isLoading) {
        return <MainLayout><div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div></MainLayout>;
    }

    if (shuffledWords.length === 0 || currentWordIndex >= shuffledWords.length) {
        return <MainLayout><div>Loading or phase complete...</div></MainLayout>;
    }

    const currentWordData = shuffledWords[currentWordIndex];
    const progressPercent = Math.round(((currentWordIndex + 1) / shuffledWords.length) * 100);

    // --- Render Logic ---
    return (
        <MainLayout>
            <div 
                className="generation-content-wrapper" 
                style={{ 
                    opacity: isTransitioning ? 0 : 1, 
                    transition: 'opacity 0.3s ease-in-out',
                    padding: '20px' 
                }}
            >
                {/* Progress Section */}                <div className="progress-section" style={{ width: '100%', maxWidth: '550px', marginBottom: '24px' }}>
                    <div className="progress-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '0 5px' }}>
                        <span style={{ fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#868686' }}>Round {roundNumber} | Generation Test</span>
                        <span style={{ fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#868686' }}>{currentWordIndex + 1} / {shuffledWords.length}</span>
                    </div>
                    <Progress percent={progressPercent} showInfo={false} strokeColor="#2049FF" />
                </div>

                {/* Instruction Text */}                <div className="instruction-text" style={{ fontFamily: 'BBTreeGo_R, sans-serif', fontSize: '20px', color: '#000', textAlign: 'center', marginBottom: '32px' }}>
                    한국어 뜻을 보고, 영어 단어를 입력해주세요.
                </div>

                {/* Word Display & Input Section (Order reversed from Recognition) */}                <div className="word-display-section" style={{
                    width: '100%', 
                    maxWidth: '550px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    marginBottom: '32px',
                    margin: '0 auto'
                }}>
                     {/* Input card first */}                     <div className="word-card input-card" style={{ background: '#fff', borderRadius: '20px', padding: '25px 32px', boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.25)', position: 'relative', textAlign: 'center', minHeight: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', marginBottom: '16px' }}>
                        <span className="word-card-label" style={{ position: 'absolute', top: '50%', left: '-100px', transform: 'translateY(-50%)', fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#C7C7C7', width: '90px', textAlign: 'right' }}>English Word</span>
                        <Input
                            ref={inputRef}
                            placeholder="Enter English word"
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            className="english-input"
                            size="large"
                            bordered={false}
                            onPressEnter={() => handleNextClick(false)}
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck="false"
                            style={{ fontFamily: 'Rubik, sans-serif', fontSize: '24px', textAlign: 'center', textTransform: 'lowercase' }}
                        />
                    </div>
                     {/* Meaning card second */}                     <div className="word-card" style={{ background: '#fff', borderRadius: '20px', padding: '20px 32px', boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.25)', position: 'relative', textAlign: 'center', minHeight: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', marginBottom: '16px' }}>
                        <span className="word-card-label" style={{ position: 'absolute', top: '50%', left: '-100px', transform: 'translateY(-50%)', fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#C7C7C7', width: '90px', textAlign: 'right' }}>Korean Meaning</span>
                        <span className="korean-meaning-text" style={{ fontFamily: 'BBTreeGo_R, sans-serif', fontSize: '30px', color: '#000' }}>{currentWordData.meaning}</span>
                    </div>
                </div>

                {/* Footer Section */}                <div className="footer-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <span className="timer-text" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#868686' }}>{timeLeft}s</span>
                    <BlueButton
                        text="Next"
                        onClick={() => handleNextClick(false)}
                        disabled={false} // Always enabled
                    />
                </div>
            </div>
        </MainLayout>
    );
};

export default GenerationPage; 