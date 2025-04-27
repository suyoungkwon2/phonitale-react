import React from 'react';
import { Typography, Space } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import BlueButton from '../components/BlueButton';

const { Text } = Typography;

const RoundStartPage = () => {
  const navigate = useNavigate();
  const { roundNumber } = useParams(); // Get round number from URL parameter

  const handleStartClick = () => {
    navigate(`/round/${roundNumber}/learning/start`);
  };

  const instructions = `• 각 라운드는 다음 순서로 진행됩니다.\n• 총 3회 반복되며, 구성은 모두 동일합니다.`;

  return (
    <MainLayout>
      <div className="round-start-content" style={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '40px',
          background: '#fff',
          borderRadius: '8px',
          textAlign: 'center',
          margin: 'auto' 
      }}>
        <div className="round-title-box" style={{
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
          Round {roundNumber} 시작
        </div>
        <div className="round-instructions" style={{
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
        <div className="step-indicator-box" style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            marginBottom: '50px'
        }}>
          <div className="step-indicator" style={{ backgroundColor: '#7C85AF', color: 'white', padding: '15px 25px', borderRadius: '10px', fontFamily: 'BBTreeGo_R, sans-serif', fontSize: '22px', fontWeight: 'bold' }}>학습</div>
          <span className="step-plus" style={{ fontFamily: 'BBTreeGo_R, sans-serif', fontSize: '24px', fontWeight: 'bold', color: '#333' }}>+</span>
          <div className="step-indicator" style={{ backgroundColor: '#78AD74', color: 'white', padding: '15px 25px', borderRadius: '10px', fontFamily: 'BBTreeGo_R, sans-serif', fontSize: '22px', fontWeight: 'bold' }}>한국어 뜻 적기</div>
          <span className="step-plus" style={{ fontFamily: 'BBTreeGo_R, sans-serif', fontSize: '24px', fontWeight: 'bold', color: '#333' }}>+</span>
          <div className="step-indicator" style={{ backgroundColor: '#C0B86C', color: 'white', padding: '15px 25px', borderRadius: '10px', fontFamily: 'BBTreeGo_R, sans-serif', fontSize: '22px', fontWeight: 'bold' }}>영어 단어 적기</div>
        </div>
        <BlueButton
          text="Start"
          onClick={handleStartClick}
        />
      </div>
    </MainLayout>
  );
};

export default RoundStartPage; 