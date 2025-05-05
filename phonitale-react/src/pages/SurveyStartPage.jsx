import React, { useEffect } from 'react';
// import { Typography } from 'antd'; // 사용하지 않음
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import BlueButton from '../components/BlueButton';

// const { Text } = Typography; // 사용하지 않음

const SurveyStartPage = () => {
  const navigate = useNavigate();
  const { groupCode } = useParams();

  const handleStartClick = () => {
    navigate(`/${groupCode}/survey`);
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

  // 안내 문구 배열 (들여쓰기 필요)
  const instructions = [
    '모든 학습과 테스트가 완료되었습니다.',
    '학습 중 제공된 키워드와 연상 문장이 얼마나 도움이 되었는지 평가해 주세요.',
    '1~5점 척도로 선택해 주세요.',
    '  • 1점: 매우 불만족', // 들여쓰기 표현
    '  • 5점: 매우 만족'  // 들여쓰기 표현
  ];

  return (
    <MainLayout>
       {/* 다른 StartPage들과 유사한 스타일 사용 */}
      <style>{`
        .survey-start-container { /* 클래스 이름 변경 */
          width: 100%;
          max-width: 685px;
          margin: auto;
          padding: 50px 0 40px;
        }
        .survey-start-header { /* 클래스 이름 변경 */
          background-color: #000000;
          color: white;
          padding: 16px 24px;
          font-size: 20px;
          font-weight: bold;
          text-align: left;
        }
        .survey-instructions-wrapper { /* 클래스 이름 변경 */
          padding: 24px 24px 0;
        }
        .survey-instructions p { /* 클래스 이름 변경 */
          font-size: 14px;
          line-height: 1.6;
          color: #000000;
          margin-bottom: 8px;
          white-space: pre-wrap; /* 들여쓰기 공백 유지 */
        }
        .start-button-wrapper { /* 공통 클래스 사용 */
          display: flex;
          justify-content: flex-end;
          margin-top: 40px; /* 안내문구와의 간격 */
          padding: 0 24px;
        }
      `}</style>

      <div className="survey-start-container">
        {/* 헤더 */}
        <div className="survey-start-header">
          ✨ 학습 종료 / 설문 시작 {/* 변경된 타이틀 */}
        </div>

        {/* 안내 문구 (Bullet 추가 및 내용 변경) */}
        <div className="survey-instructions-wrapper">
          <div className="survey-instructions">
            {/* 각 줄 앞에 • 추가, 들여쓰기는 문자열 내 공백 사용 */}
            {instructions.map((line, index) => {
              const isIndented = line.trim().startsWith('•');
              const content = isIndented ? line.trim().substring(1).trim() : line;
              const bullet = isIndented ? '    • ' : '• '; // 들여쓰기용 공백 추가
              return <p key={index}>{bullet}{content}</p>;
            })}
          </div>
        </div>

        {/* 스텝 인디케이터는 이 페이지에 없음 */}

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

export default SurveyStartPage; 