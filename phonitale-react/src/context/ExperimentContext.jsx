import React, { createContext, useState, useContext, useEffect } from 'react';

// --- CSV 파싱 함수 ---
function parseCSV(csvText) {
    // ... (parseCSV implementation remains the same) ...
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    const data = lines.slice(1).map(line => {
        // Improved CSV parsing logic to handle quoted commas
        const values = [];
        let currentMatch = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"' && !inQuotes && (i === 0 || line[i-1] === ',')) {
                 // Start of quoted field
                 inQuotes = true;
                 continue; // Skip the opening quote
            } else if (char === '"' && inQuotes && (nextChar === ',' || nextChar === undefined)) {
                 // End of quoted field
                 inQuotes = false;
                 continue; // Skip the closing quote
            } else if (char === ',' && !inQuotes) {
                // End of unquoted field
                values.push(currentMatch.trim());
                currentMatch = '';
            } else {
                currentMatch += char;
            }
        }
        values.push(currentMatch.trim()); // Add the last value

        const entry = {};
        headers.forEach((header, index) => {
            // Handle potential mismatch between headers and values
            entry[header] = values[index] !== undefined ? values[index].replace(/^\"|\"$/g, '').trim() : '';
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
  const [userId, setUserId] = useState(() => {
      // Initialize userId from sessionStorage if available
      return sessionStorage.getItem('userId');
  });
  const [group, setGroup] = useState(null);
  const [currentRound, setCurrentRound] = useState(1); 
  const [wordList, setWordList] = useState({}); // 최종 단어 목록
  const [allParsedWords, setAllParsedWords] = useState([]); // 모든 파싱된 단어 저장
  const [isLoadingWords, setIsLoadingWords] = useState(true); // 초기 로딩 상태

  // userId 변경 시 sessionStorage에 저장
  useEffect(() => {
    if (userId) {
      sessionStorage.setItem('userId', userId);
    } else {
      sessionStorage.removeItem('userId');
    }
  }, [userId]);

  // 초기 CSV 데이터 로딩
  useEffect(() => {
    const CSV_PATH = '/words/words_data_test_full.csv';
    console.log("Context: Attempting to load CSV from:", CSV_PATH);
    fetch(CSV_PATH)
      .then(response => {
          if (!response.ok) {
              throw new Error(`Network response was not ok: ${response.statusText}`);
          }
          return response.text();
      })
      .then(csvText => {
          console.log("Context: CSV text loaded, length:", csvText.length);
          const parsedData = parseCSV(csvText);
          console.log("Context: Total parsed words:", parsedData.length);
          setAllParsedWords(parsedData);
          setIsLoadingWords(false);
      })
      .catch(error => {
          console.error('Context: Error fetching/parsing CSV:', error);
          setIsLoadingWords(false); 
          setAllParsedWords([]); // 에러 발생 시 초기화
      });
  }, []);

  // 그룹 설정 및 로딩 완료 후 최종 wordList 생성
  useEffect(() => {
    if (!isLoadingWords && group && allParsedWords.length > 0) {
      console.log(`Context: Group '${group}' set. Processing ${allParsedWords.length} parsed words.`);
      const wordsByRound = { 1: [], 2: [], 3: [] };
      let processedCount = 0;
      allParsedWords.forEach((word, index) => {
          const roundNum = parseInt(word.round, 10);
          if (!isNaN(roundNum) && (roundNum === 1 || roundNum === 2 || roundNum === 3)) {
              const keywordRefinedKey = `${group}_keyword_refined`;
              const verbalCueKey = `${group}_verbal_cue`;

              // 그룹별 데이터 추출 시 JSON 파싱 추가 (데이터 형식이 JSON 문자열일 경우)
              let keywordRefinedParsed = [];
              let verbalCueParsed = word[verbalCueKey] || '';
              try {
                  // 'kss_keyword_refined' 등의 컬럼이 실제 JSON 배열 문자열이라고 가정
                  if (word[keywordRefinedKey] && typeof word[keywordRefinedKey] === 'string') {
                    keywordRefinedParsed = JSON.parse(word[keywordRefinedKey].replace(/'/g, '"')); // 작은따옴표를 큰따옴표로 변경
                  }
              } catch (e) {
                  console.error(`Failed to parse JSON for ${keywordRefinedKey} in word ${word.word}:`, word[keywordRefinedKey], e);
                  keywordRefinedParsed = []; // 파싱 실패 시 빈 배열
              }

              const groupSpecificWordData = {
                  word: word.word,
                  naver_ipa: word.naver_ipa,
                  google_ipa: word.google_ipa,
                  en_pronunciation: word.en_pronunciation,
                  meaning: word.meaning,
                  audio_path: word.audio_path,
                  ko_pronunciation: word.ko_pronunciation,
                  syllable_count: word.syllable_count,
                  word_length: word.word_length,
                  round: word.round,
                  keyword_refined: keywordRefinedParsed,
                  verbal_cue: verbalCueParsed,
              };
              wordsByRound[roundNum].push(groupSpecificWordData);
              processedCount++;
          } else {
              // 유효하지 않은 round 값 로그 (선택적)
              // console.warn(`Context: Word at index ${index} has invalid or missing round: ${word.round}`);
          }
        });
        console.log(`Context: Finished processing words. Total processed: ${processedCount}`); // 처리된 단어 수 로그 추가
        console.log("Context: Final word list processed for group:", wordsByRound); // 최종 wordList 로그
        // 각 라운드별 단어 수 로그 추가
        console.log(`Context: Round 1 count: ${wordsByRound[1].length}, Round 2 count: ${wordsByRound[2].length}, Round 3 count: ${wordsByRound[3].length}`);
        setWordList(wordsByRound);
    } else {
        // 조건 미충족 시 로그 (디버깅용)
        console.log(`Context: Word list processing skipped. isLoadingWords=${isLoadingWords}, group=${group}, allParsedWords.length=${allParsedWords.length}`);
    }
  }, [group, isLoadingWords, allParsedWords]);

  const value = {
    userId,
    setUserId,
    group,
    setGroup,
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

// 3. Custom Hook 생성
export const useExperiment = () => {
  const context = useContext(ExperimentContext);
  if (context === undefined) {
    throw new Error('useExperiment must be used within an ExperimentProvider');
  }
  return context;
}; 