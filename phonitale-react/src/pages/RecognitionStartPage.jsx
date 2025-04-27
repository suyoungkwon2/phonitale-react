import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import PhaseStartContent from '../components/PhaseStartContent';

const RecognitionStartPage = () => {
  const { roundNumber } = useParams();
  const navigate = useNavigate();

  const recognitionPhaseProps = {
    roundNumber: roundNumber,
    phaseTitle: "한국어 뜻 적기 테스트", // 사용자 요청 타이틀
    titleBackgroundColor: "#78AD74", // Figma color
    instructions: `기기의 소리를 켜 주세요.\n영어 발음이 2초, 7초 시점에 두 번 재생됩니다.\n답변 시간은 단어당 30초입니다.\n원할 때 다음 단어로 이동 가능하지만, 이전 단어로는 돌아갈 수 없습니다.`,
    // nextPageUrl prop 제거
  };

  const handleNextClick = () => {
      navigate(`/round/${roundNumber}/recognition`);
  };

  return (
    <MainLayout>
      <PhaseStartContent 
        {...recognitionPhaseProps} 
        onNextClick={handleNextClick} 
      />
    </MainLayout>
  );
};

export default RecognitionStartPage; 