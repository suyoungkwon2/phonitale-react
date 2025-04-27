import React from 'react';
import { Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import BlueButton from '../components/BlueButton';

const { Text } = Typography;

const SurveyStartPage = () => {
  const navigate = useNavigate();

  const handleStartClick = () => {
    navigate('/survey'); // Navigate to the survey page
  };

  const instructions = `• 모든 학습과 테스트가 완료되었습니다.\n• 이제 학습 중 제공된 키워드와 힌트 문장이 얼마나 도움이 되었는지 평가해 주세요.\n• 1~5점 척도로 선택해 주세요.\n  • 1점: 매우 불만족\n  • 5점: 매우 만족`;

  return (
    <MainLayout>
      <div className="survey-start-content" style={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '40px',
          background: '#fff',
          borderRadius: '8px',
          textAlign: 'center',
          margin: 'auto' 
      }}>
        <div className="survey-title-box" style={{
            backgroundColor: '#324496',
            color: 'white',
            padding: '20px 40px',
            borderRadius: '10px',
            marginBottom: '30px',
            fontFamily: 'BBTreeGo_R, sans-serif',
            fontSize: '36px',
            fontWeight: 'bold',
            display: 'inline-block'
        }}>
          학습 종료
        </div>
        <div className="survey-instructions" style={{
            fontFamily: 'BBTreeGo_R, sans-serif',
            fontSize: '20px',
            lineHeight: 1.6,
            color: '#333',
            marginBottom: '40px',
            whiteSpace: 'pre-line',
            textAlign: 'left',
            width: '100%',
            paddingLeft: '20%',
            boxSizing: 'border-box'
        }}>
            {instructions.split('\n').map((line, index) => <React.Fragment key={index}>{line}<br /></React.Fragment>)}
        </div>
        <BlueButton
          text="Start"
          onClick={handleStartClick}
        />
      </div>
    </MainLayout>
  );
};

export default SurveyStartPage; 