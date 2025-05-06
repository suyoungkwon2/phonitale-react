import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
// import PhaseStartContent from '../components/PhaseStartContent'; // 제거
import BlueButton from '../components/BlueButton';

const LearningStartPage = () => {
  const { roundNumber, groupCode } = useParams();
  const navigate = useNavigate();

  const phaseTitle = "학습"; // 현재 단계 이름

  const instructions = [
    '기기의 소리를 켜 주세요.',
    '영어 발음이 2초, 7초 시점에 두 번 재생됩니다.',
    '각 단어마다 30초 동안 학습할 수 있습니다.',
    '15초 이후부터 직접 다음으로 넘어갈 수 있습니다.',
    '이전 단어로는 돌아갈 수 없습니다.'
  ];

  // Start 버튼 클릭 핸들러
  const handleStartClick = () => {
      navigate(`/${groupCode}/round/${roundNumber}/learning`); // groupCode 추가
  };

  // --- 새로고침 방지 --- 
  useEffect(() => {
      const handleBeforeUnload = (event) => {
          event.preventDefault();
          event.returnValue = ''; 
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => {
          window.removeEventListener('beforeunload', handleBeforeUnload);
  };
  }, []);

  // 현재 활성 스텝
  const activeStep = phaseTitle; // '학습'

  return (
    <MainLayout>
       {/* RoundStartPage와 유사한 스타일 정의 */}
      <style>{`
        .phase-start-container { /* 클래스 이름 변경 */
          width: 100%;
          max-width: 685px;
          margin: auto;
          padding: 50px 0 40px;
        }
        .phase-start-header { /* 클래스 이름 변경 */
          background-color: #000000;
          color: white;
          padding: 16px 24px;
          font-size: 20px;
          font-weight: bold;
          text-align: left;
        }
        .phase-instructions-wrapper { /* 클래스 이름 변경 */
          padding: 24px 24px 0;
        }
        .phase-instructions p { /* 클래스 이름 변경 */
          font-size: 14px;
          line-height: 1.6;
          color: #000000;
          margin-bottom: 8px;
        }
        .step-indicator-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-top: 32px; /* 간격 유지 */
          padding: 0 24px;
        }
        .step-indicator {
          border-radius: 50px;
          padding: 10px 30px;
          font-size: 16px;
          font-weight: bold;
          text-align: center;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 2px solid #000000;
          background-color: #F3F4FB; /* 기본 배경 */
          color: #000000;
        }
        .step-indicator.active { /* 활성 스타일 */
          background-color: #000000;
          color: white;
          border: 2px solid #000000;
        }
        .step-plus {
          font-size: 16px;
          font-weight: bold;
          color: #000000;
        }
        .start-button-wrapper {
          display: flex;
          justify-content: flex-end;
          margin-top: 40px;
          padding: 0 24px;
        }
        .star-icon {
          font-size: 14px;
          line-height: 1;
        }
      `}</style>

      <div className="phase-start-container"> {/* 클래스 이름 변경 */}
        {/* 헤더 */}
        <div className="phase-start-header"> {/* 클래스 이름 변경 */}
           ⭐ 영어 단어 학습 시작
        </div>

        {/* 안내 문구 (Bullet 추가) */}
        <div className="phase-instructions-wrapper"> {/* 클래스 이름 변경 */}
          <div className="phase-instructions"> {/* 클래스 이름 변경 */}
            {instructions.map((line, index) => <p key={index}>{`• ${line}`}</p>)}
          </div>
        </div>

        {/* 스텝 인디케이터 ('학습' 활성화) */}
        <div className="step-indicator-wrapper">
          <div className={`step-indicator ${activeStep === '학습' ? 'active' : ''}`}>
            {activeStep === '학습' && <span className="star-icon">⭐</span>} 학습
          </div>
          <span className="step-plus">+</span>
          <div className={`step-indicator ${activeStep === '한국어 뜻 적기' ? 'active' : ''}`}>
             한국어 뜻 적기
          </div>
          <span className="step-plus">+</span>
          <div className={`step-indicator ${activeStep === '영어 단어 적기' ? 'active' : ''}`}>
             영어 단어 적기
          </div>
        </div>

        {/* 시작 버튼 */}
        <div className="start-button-wrapper">
          <BlueButton
            text="Start"
            onClick={handleStartClick} // 핸들러 연결
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default LearningStartPage; 