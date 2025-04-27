import React, { createContext, useState, useContext, useEffect } from 'react';

// --- CSV 파싱 함수 (여기로 이동) ---
function parseCSV(csvText) {
    // ... (기존 parseCSV 함수 내용 전체 복사) ...
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    const data = lines.slice(1).map(line => {
        const values = [];
        let currentMatch = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '\"' && (i === 0 || line[i-1] !== '\\')) { 
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(currentMatch.trim().replace(/^\"|\"$/g, ''));
                currentMatch = '';
            } else {
                currentMatch += char;
            }
        }
        values.push(currentMatch.trim().replace(/^\"|\"$/g, '')); 
        const entry = {};
        headers.forEach((header, index) => {
            entry[header] = values[index] !== undefined ? values[index] : '';
        });
        return entry;
    });
    return data;
}
// ------------------------------

// 1. Context 생성
const ExperimentContext = createContext();

// 2. Provider 컴포넌트 생성
export const ExperimentProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [wordList, setWordList] = useState([]);
  const [isLoadingWords, setIsLoadingWords] = useState(true);

  useEffect(() => {
    const CSV_PATH = '/words/words_data_test_full.csv';
    console.log("Attempting to load CSV from:", CSV_PATH);
    fetch(CSV_PATH)
      .then(response => {
          if (!response.ok) {
              throw new Error(`Network response was not ok: ${response.statusText}`);
          }
          return response.text();
      })
      .then(csvText => {
          console.log("CSV text loaded, length:", csvText.length);
          const parsedData = parseCSV(csvText);
          console.log("Parsed word data count:", parsedData.length);
          setWordList(parsedData);
          setIsLoadingWords(false);
      })
      .catch(error => {
          console.error('Error fetching/parsing CSV in Context:', error);
          setIsLoadingWords(false);
      });
  }, []);

  const value = {
    userId,
    setUserId,
    currentRound,
    setCurrentRound,
    wordList,
    isLoadingWords,
  };

  return (
    <ExperimentContext.Provider value={value}>
      {children}
    </ExperimentContext.Provider>
  );
};

export const useExperiment = () => {
  const context = useContext(ExperimentContext);
  if (context === undefined) {
    throw new Error('useExperiment must be used within an ExperimentProvider');
  }
  return context;
}; 