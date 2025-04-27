import React, { createContext, useState, useContext } from 'react';

// 1. Context 생성
const ExperimentContext = createContext();

// 2. Provider 컴포넌트 생성
export const ExperimentProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const [currentRound, setCurrentRound] = useState(1);
  // 필요에 따라 다른 전역 상태 추가 (예: wordList)
  // const [wordList, setWordList] = useState([]);

  // Context 값으로 상태와 상태 변경 함수들을 전달
  const value = {
    userId,
    setUserId,
    currentRound,
    setCurrentRound,
    // wordList,
    // setWordList,
  };

  return (
    <ExperimentContext.Provider value={value}>
      {children}
    </ExperimentContext.Provider>
  );
};

// 3. Custom Hook 생성 (사용 편의성)
export const useExperiment = () => {
  const context = useContext(ExperimentContext);
  if (context === undefined) {
    throw new Error('useExperiment must be used within an ExperimentProvider');
  }
  return context;
}; 