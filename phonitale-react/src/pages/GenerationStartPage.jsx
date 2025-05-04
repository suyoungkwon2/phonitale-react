import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
// import PhaseStartContent from '../components/PhaseStartContent'; // 제거
import BlueButton from '../components/BlueButton'; // BlueButton 사용

const GenerationStartPage = () => {
  const { roundNumber, groupCode } = useParams();
  const navigate = useNavigate();

  // 타이틀은 헤더에서 직접 설정
  // const phaseTitle = "영어 단어 쓰기 테스트";

  const instructions = [
    '답변 시간은 단어당 30초입니다.',
    '원할 때 다음 단어로 이동 가능하지만, 이전 단어로는 돌아갈 수 없습니다.'
  ];

  // 버튼 클릭 핸들러
  const handleNextClick = () => {
      navigate(`/${groupCode}/round/${roundNumber}/generation`); // groupCode 추가
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
  const activeStep = "영어 단어 적기"; // 활성 스텝 변경

  return (
    <MainLayout>
       {/* 이전 StartPage들과 동일한 스타일 사용 */}
      <style>{`
        .phase-start-container {
          width: 100%;
          max-width: 685px;
          margin: auto;
          padding: 50px 0 40px;
        }
        .phase-start-header {
          background-color: #000000;
          color: white;
          padding: 16px 24px;
          font-size: 20px;
          font-weight: bold;
          text-align: left;
        }
        .phase-instructions-wrapper {
          padding: 24px 24px 0;
        }
        .phase-instructions p {
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
          margin-top: 32px;
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
        .start-button-wrapper { /* 클래스명 유지 */
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

      <div className="phase-start-container">
        {/* 헤더 */}
        <div className="phase-start-header">
           ⭐ 영어 단어 적기 테스트 시작 {/* 변경된 타이틀 */}
        </div>

        {/* 안내 문구 (Bullet 추가 및 내용 변경) */}
        <div className="phase-instructions-wrapper">
          <div className="phase-instructions">
            {instructions.map((line, index) => <p key={index}>{`• ${line}`}</p>)}
          </div>
        </div>

        {/* 스텝 인디케이터 ('영어 단어 적기' 활성화) */}
        <div className="step-indicator-wrapper">
          <div className={`step-indicator ${activeStep === '학습' ? 'active' : ''}`}>
            {activeStep === '학습' && <span className="star-icon">⭐</span>} 학습
          </div>
          <span className="step-plus">+</span>
          <div className={`step-indicator ${activeStep === '한국어 뜻 적기' ? 'active' : ''}`}>
             {activeStep === '한국어 뜻 적기' && <span className="star-icon">⭐</span>} 한국어 뜻 적기
          </div>
          <span className="step-plus">+</span>
          <div className={`step-indicator ${activeStep === '영어 단어 적기' ? 'active' : ''}`}>
             {activeStep === '영어 단어 적기' && <span className="star-icon">⭐</span>} 영어 단어 적기
          </div>
        </div>

        {/* Next 버튼 */}
        <div className="start-button-wrapper"> {/* 클래스명 유지 */}
          <BlueButton
            text="Next"
            onClick={handleNextClick} // 핸들러 연결
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default GenerationStartPage; 