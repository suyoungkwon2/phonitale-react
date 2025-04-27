import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import PhaseStartContent from '../components/PhaseStartContent';

const GenerationStartPage = () => {
  const { roundNumber } = useParams();
  const navigate = useNavigate();

  const generationPhaseProps = {
    roundNumber: roundNumber,
    phaseTitle: "영어 단어 쓰기 테스트", // Figma 기준 타이틀
    titleBackgroundColor: "#C0B86C", // Figma color
    instructions: `답변 시간은 단어당 30초입니다.\n원할 때 다음 단어로 이동 가능하지만, 이전 단어로는 돌아갈 수 없습니다.`,
    // nextPageUrl prop 제거
  };

  const handleNextClick = () => {
      navigate(`/round/${roundNumber}/generation`);
  };

  return (
    <MainLayout>
      <PhaseStartContent 
        {...generationPhaseProps} 
        onNextClick={handleNextClick} 
      />
    </MainLayout>
  );
};

export default GenerationStartPage; 