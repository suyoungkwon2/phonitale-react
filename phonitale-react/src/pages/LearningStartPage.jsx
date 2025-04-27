import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import PhaseStartContent from '../components/PhaseStartContent';

const LearningStartPage = () => {
  const { roundNumber } = useParams();
  const navigate = useNavigate();

  const learningPhaseProps = {
    roundNumber: roundNumber,
    phaseTitle: "영어 단어 학습",
    titleBackgroundColor: "#7C85AF", // Figma color for Learning title
    instructions: `기기의 소리를 켜 주세요.\n영어 발음이 2초, 7초 시점에 두 번 재생됩니다.\n각 단어마다 30초 동안 학습할 수 있습니다.\n15초 이후부터 직접 다음으로 넘어갈 수 있습니다.\n이전 단어로는 돌아갈 수 없습니다.`,
    // PhaseStartContent 내부의 nextPageUrl prop은 라우팅 로직으로 대체되므로 제거
    // 대신 PhaseStartContent의 Next 버튼 클릭 시 handleNextClick 함수가 실행되도록 해야 함
    // PhaseStartContent 컴포넌트 수정 필요 (onClick prop 받도록)
  };

  // PhaseStartContent의 Next 버튼 클릭 시 호출될 함수
  const handleNextClick = () => {
      navigate(`/round/${roundNumber}/learning`);
  };

  return (
    <MainLayout>
      {/* PhaseStartContent에 onClick 핸들러 전달 */}
      <PhaseStartContent 
        {...learningPhaseProps} 
        onNextClick={handleNextClick} // onNextClick prop 추가
      />
    </MainLayout>
  );
};

export default LearningStartPage; 