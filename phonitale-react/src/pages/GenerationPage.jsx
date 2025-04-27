import React, { useState, useEffect, useRef } from 'react';
import { Progress, Input, Spin, message } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import BlueButton from '../components/BlueButton';
import { useExperiment } from '../context/ExperimentContext';
import { submitResponse } from '../utils/api';

// --- Helper Functions (제거 또는 이동 필요) ---
// parseCSV 및 shuffleArray 제거
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

// --- Generation Page Component ---
const GenerationPage = () => {
    const { roundNumber: roundNumberStr } = useParams();
    const navigate = useNavigate();
    const { wordList: wordsByRound, isLoadingWords } = useExperiment();
    const [wordsForRound, setWordsForRound] = useState([]);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [userInput, setUserInput] = useState('');
    const [timeLeft, setTimeLeft] = useState(30);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const timerRef = useRef(null);
    const timestampInRef = useRef(null);

    const roundNumber = parseInt(roundNumberStr, 10);

    useEffect(() => {
        if (!isLoadingWords && Object.keys(wordsByRound).length > 0) {
            const words = wordsByRound[roundNumber] || [];
            console.log(`GenerationPage Round ${roundNumber}: Loaded ${words.length} words.`);
            setWordsForRound(words);
        } else if (!isLoadingWords && Object.keys(wordsByRound).length === 0) {
            console.error("GenerationPage: Word list object is empty after loading.");
            setWordsForRound([]);
        }
        setCurrentWordIndex(0);
    }, [wordsByRound, isLoadingWords, roundNumber]);

    useEffect(() => {
        if (isLoadingWords || wordsForRound.length === 0 || currentWordIndex >= wordsForRound.length) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        timestampInRef.current = new Date().toISOString();
        console.log(`GenerationPage - Word ${currentWordIndex + 1} entered at:`, timestampInRef.current);

        setUserInput('');
        setTimeLeft(30);

        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft(prevTime => {
                if (prevTime <= 1) {
                    clearInterval(timerRef.current);
                    handleNextClick(true);
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [currentWordIndex, wordsForRound, isLoadingWords]);

    const handleNextClick = async (isTimeout = false) => {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsTransitioning(true);

        const timestampOut = new Date().toISOString();
        const timestampIn = timestampInRef.current;
        const currentWord = wordsForRound[currentWordIndex];
        const userId = sessionStorage.getItem('userId');
        let duration = null;
        if (timestampIn && timestampOut) {
            try { duration = Math.round((new Date(timestampOut) - new Date(timestampIn)) / 1000); } catch (e) { /*...*/ }
        }

        console.log(`Generation Word: ${currentWord?.meaning}, User Input: ${userInput}, Duration: ${duration}s, Timeout: ${isTimeout}`);

        if (!userId) {
            console.error("User ID not found!");
            setIsTransitioning(false);
            return;
        }

        try {
            const responseData = {
                user: userId,
                english_word: currentWord.word,
                round_number: roundNumber,
                page_type: 'generation',
                timestamp_in: timestampIn,
                timestamp_out: timestampOut,
                duration: duration,
                response: userInput || null,
            };
            await submitResponse(responseData);
            console.log("Generation response submitted for:", currentWord.meaning);
        } catch (error) {
            console.error("Failed to submit generation response:", error);
            message.error(`Failed to save response: ${error.message}`);
        } finally {
            setTimeout(() => {
                if (currentWordIndex < wordsForRound.length - 1) {
                    setCurrentWordIndex(prevIndex => prevIndex + 1);
                    setIsTransitioning(false);
                } else {
                    console.log(`Generation Round ${roundNumber} Complete.`);
                    if (roundNumber < 3) {
                        navigate(`/round/${roundNumber + 1}/start`);
                    } else {
                        navigate('/survey/start');
                    }
                }
            }, 300);
        }
    };

    if (isLoadingWords) {
        return <MainLayout><div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div></MainLayout>;
    }

    if (wordsForRound.length === 0 || currentWordIndex >= wordsForRound.length) {
        return <MainLayout><div>No words for this round or loading error.</div></MainLayout>;
    }

    const currentWordData = wordsForRound[currentWordIndex];
    const progressPercent = Math.round(((currentWordIndex + 1) / wordsForRound.length) * 100);

    return (
        <MainLayout>
            <div 
                className="generation-content-wrapper" 
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
                        <span style={{ fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#868686' }}>Round {roundNumber} | Generation Test</span>
                        <span style={{ fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#868686' }}>{currentWordIndex + 1} / {wordsForRound.length}</span>
                    </div>
                    <Progress percent={progressPercent} showInfo={false} strokeColor="#2049FF" />
                </div>

                {/* Instruction Text */}                
                <div className="instruction-text" style={{ fontFamily: 'BBTreeGo_R, sans-serif', fontSize: '20px', color: '#000', textAlign: 'center', marginBottom: '32px' }}>
                    한국어 뜻을 보고, 영어 단어를 입력해주세요.
                </div>

                {/* Word Display & Input Section (Order reversed from Recognition) */}                
                <div className="word-display-section" style={{
                    width: '100%', 
                    maxWidth: '550px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    marginBottom: '32px',
                }}>
                     {/* Input card first */}                     
                     <div className="word-card input-card" style={{ background: '#fff', borderRadius: '20px', padding: '25px 32px', boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.25)', position: 'relative', textAlign: 'center', minHeight: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', marginBottom: '16px' }}>
                        <span className="word-card-label" style={{ position: 'absolute', top: '50%', left: '-100px', transform: 'translateY(-50%)', fontFamily: 'Rubik, sans-serif', fontSize: '16px', color: '#C7C7C7', width: '90px', textAlign: 'right' }}>English Word</span>
                        <Input
                            placeholder="Enter English word"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
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
                     {/* Meaning card second */}                     
                     <div className="word-card" style={{ background: '#fff', borderRadius: '20px', padding: '20px 32px', boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.25)', position: 'relative', textAlign: 'center', minHeight: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', marginBottom: '16px' }}>
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
                        disabled={false} // Always enabled
                    />
                </div>
            </div>
        </MainLayout>
    );
};

export default GenerationPage; 