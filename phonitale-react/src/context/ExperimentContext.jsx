import React, { createContext, useState, useContext, useEffect } from 'react';
import Papa from 'papaparse'; // papaparse import

// --- 기존 CSV 파싱 함수 제거 또는 주석 처리 ---
/*
function parseCSV(csvText) {
    // ... 기존 코드 ...
}
*/
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
    // console.log("Context: Attempting to load CSV from:", CSV_PATH);
    fetch(CSV_PATH)
      .then(response => {
          if (!response.ok) {
              throw new Error(`Network response was not ok: ${response.statusText}`);
          }
          return response.text();
      })
      .then(csvText => {
          // console.log("Context: CSV text loaded, length:", csvText.length);
          Papa.parse(csvText, {
              header: true, 
              skipEmptyLines: true,
              transformHeader: header => header.trim(), 
              complete: (results) => {
                  // console.log("Context: PapaParse completed. Parsed rows:", results.data.length);
                  if (results.errors.length > 0) {
                      console.error("Context: PapaParse errors:", results.errors);
                  }
                  /* // 샘플 확인 로그 제거
                  const sampleWord = results.data.find(w => w.word === 'meddlesome');
                  if (sampleWord) {
                       console.log('[Context PapaParse] Sample word (meddlesome):', JSON.stringify(sampleWord));
                       console.log('[Context PapaParse] Sample word og_keyword_refined:', sampleWord['og_keywords_refined']);
                  }
                  */
                  setAllParsedWords(results.data);
                  setIsLoadingWords(false);
              },
              error: (error) => {
                  console.error('Context: PapaParse critical error:', error);
                  setIsLoadingWords(false); 
                  setAllParsedWords([]);
              }
          });
      })
      .catch(error => {
          console.error('Context: Error fetching CSV:', error);
          setIsLoadingWords(false); 
          setAllParsedWords([]); 
      });
  }, []);

  // 그룹 설정 및 로딩 완료 후 최종 wordList 생성
  useEffect(() => {
    // console.log(`[Context Effect Run] Current group state: ${group}, isLoadingWords: ${isLoadingWords}, allParsedWords length: ${allParsedWords.length}`);

    if (!isLoadingWords && group && allParsedWords.length > 0) {
      // console.log(`Context: Group '${group}' set. Processing ${allParsedWords.length} parsed words.`);
      const wordsByRound = { 1: [], 2: [], 3: [] };
      let processedCount = 0;
      allParsedWords.forEach((word, index) => {
          const roundNum = parseInt(word.round, 10);
          if (!isNaN(roundNum) && (roundNum === 1 || roundNum === 2 || roundNum === 3)) {
              const keywordRefinedKey = `${group}_keyword_refined`;
              const verbalCueKey = `${group}_verbal_cue`;

              let actualKeywordRefinedKey = keywordRefinedKey;
              const foundKey = Object.keys(word).find(key => key.trim() === keywordRefinedKey);
              if (foundKey) {
                  actualKeywordRefinedKey = foundKey;
              } else if (group === 'og') { 
                  // console.error(`[Context Key NOT Found] Could not find key matching '${keywordRefinedKey}' in word object for '${word.word}'`); // 에러 로그는 남겨둘 수 있음 (선택)
              }
              const rawKeywordData = word[actualKeywordRefinedKey]; 
              // console.log(`Context: Processing word '${word.word}', group '${group}'. Raw ${actualKeywordRefinedKey}:`, rawKeywordData); // 제거
              
              let keywordRefinedParsed = [];
              let verbalCueParsed = word[verbalCueKey] || '';
              
              if (rawKeywordData && typeof rawKeywordData === 'string') {
                  try {
                      const jsonString = rawKeywordData.replace(/'/g, '"');
                      keywordRefinedParsed = JSON.parse(jsonString); 
                  } catch (e) {
                      console.error(`Context: Failed to parse JSON for ${actualKeywordRefinedKey} in word ${word.word}. Input:`, rawKeywordData, 'Error:', e);
                      keywordRefinedParsed = [];
                  }
              } else if (rawKeywordData) { 
                  console.warn(`Context: ${actualKeywordRefinedKey} for word '${word.word}' is not a string:`, rawKeywordData);
                  keywordRefinedParsed = [];
              } else { 
                  keywordRefinedParsed = [];
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
              }; // word 사용 복구 (객체 전체)
              wordsByRound[roundNum].push(groupSpecificWordData);
              processedCount++;
          } else {
              // console.warn(`Context: Word at index ${index} has invalid or missing round: ${word.round}`);
          }
        });
        // console.log(`Context: Finished processing words. Total processed: ${processedCount}`);
        // console.log(`Context: Final Round counts: R1=${wordsByRound[1].length}, R2=${wordsByRound[2].length}, R3=${wordsByRound[3].length}`);
        setWordList(wordsByRound);
    } else {
       // console.log(`Context: Word list processing skipped.`);
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