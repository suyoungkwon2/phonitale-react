import React from 'react';
// import { Typography, Space } from 'antd'; // 사용하지 않음
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import BlueButton from '../components/BlueButton';

// Text 컴포넌트 사용 제거

const RoundStartPage = () => {
  const navigate = useNavigate();
  const { roundNumber } = useParams();

  const handleStartClick = () => {
    // navigate 경로 끝에 '/start' 추가
    navigate(`/round/${roundNumber}/learning/start`);
  };

  const instructions = [
    '각 라운드는 다음 순서로 진행됩니다.',
    '총 3회 반복되며, 구성은 모두 동일합니다.'
  ];

  // activeStep 로직 제거 (모두 비활성 상태)

  return (
    <MainLayout>
      <style>{`
        .round-start-container {
          width: 100%;
          max-width: 685px; /* 페이지 최대 너비 */
          margin: auto;
          padding: 50px 0 40px; /* 상하 패딩 */
        }
        .round-start-header {
          background-color: #000000;
          color: white;
          padding: 16px 24px;
          font-size: 20px;
          font-weight: bold;
          text-align: left;
        }
        .round-instructions-wrapper {
          padding: 24px 24px 0; /* 상하좌우 패딩 (하단은 0) */
        }
        .round-instructions p {
          font-size: 14px;
          line-height: 1.6;
          color: #000000;
          margin-bottom: 8px; /* 줄 간격 */
        }
        .step-indicator-wrapper {
          display: flex;
          align-items: center;
          justify-content: center; /* 중앙 정렬 */
          gap: 16px; /* 요소 간 간격 */
          margin-top: 32px; /* 텍스트 블록과의 간격 수정 */
          padding: 0 24px; /* 좌우 패딩 */
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
          border: 2px solid #000000; /* 검은색 2px 테두리 */
          background-color: #F3F4FB; /* 기본 배경 수정 */
          color: #000000; /* 기본 글자 검은색 */
        }
        /* 활성 상태 스타일 (이 페이지에서는 사용되지 않음) */
        .step-indicator.active {
          background-color: #000000;
          color: white;
          /* border: 2px solid #000000; 이미 기본 스타일에 있음 */
        }
        /* inactive 클래스 제거 또는 기본 스타일로 통합 */
        /* .step-indicator.inactive { ... } */
        .step-plus {
          font-size: 16px;
          font-weight: bold;
          color: #000000; /* 검은색으로 변경 */
        }
        .start-button-wrapper {
          display: flex;
          justify-content: flex-end;
          margin-top: 40px; /* 스텝 인디케이터와의 간격 */
          padding: 0 24px; /* 좌우 패딩 */
        }
        /* 간단한 별 아이콘 스타일 (필요시 이미지나 라이브러리 사용) */
        .star-icon {
          font-size: 14px; /* 아이콘 크기 */
          line-height: 1;
        }
      `}</style>

      <div className="round-start-container">
        {/* 헤더 */} 
        <div className="round-start-header">
          Round {roundNumber} 시작
        </div>

        {/* 안내 문구 (Bullet 추가) */} 
        <div className="round-instructions-wrapper">
          <div className="round-instructions">
            {instructions.map((line, index) => <p key={index}>{`• ${line}`}</p>)}
          </div>
        </div>

        {/* 스텝 인디케이터 (모두 기본/비활성 스타일) */} 
        <div className="step-indicator-wrapper">
          <div className="step-indicator">
             학습
          </div>
          <span className="step-plus">+</span>
          <div className="step-indicator">
             한국어 뜻 적기
          </div>
          <span className="step-plus">+</span>
          <div className="step-indicator">
             영어 단어 적기
          </div>
        </div>

        {/* 시작 버튼 */} 
        <div className="start-button-wrapper">
          <BlueButton
            text="Start"
            onClick={handleStartClick}
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default RoundStartPage; 