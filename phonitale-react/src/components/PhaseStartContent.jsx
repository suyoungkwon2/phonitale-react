import React from 'react';
import { Typography } from 'antd';
import BlueButton from './BlueButton'; // Import BlueButton

const { Text } = Typography;

const PhaseStartContent = ({ roundNumber, phaseTitle, titleBackgroundColor, instructions, onNextClick }) => {

  const instructionLines = instructions ? instructions.split('\n') : [];

  return (
      <div className="phase-start-content" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '40px',
          background: '#fff',
          borderRadius: '8px',
          margin: '40px auto', // 여백 추가
          textAlign: 'center'
      }}>
          {/* 단계 표시기 - 이 부분은 각 페이지별로 다를 수 있으므로, 필요시 props로 받거나 제거 고려 */}
          <div className="step-indicator-box" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginBottom: '40px' }}>
              <div className="step-indicator" style={{ backgroundColor: '#7C85AF', color: 'white', padding: '15px 25px', borderRadius: '10px', fontFamily: 'BBTreeG_B, sans-serif', fontSize: '22px', fontWeight: 'bold' }}>학습</div>
              <span className="step-plus" style={{ fontFamily: 'BBTreeG_B, sans-serif', fontSize: '24px', fontWeight: 'bold', color: '#333' }}>+</span>
              <div className="step-indicator" style={{ backgroundColor: '#78AD74', color: 'white', padding: '15px 25px', borderRadius: '10px', fontFamily: 'BBTreeG_B, sans-serif', fontSize: '22px', fontWeight: 'bold' }}>한국어 뜻 적기</div>
              <span className="step-plus" style={{ fontFamily: 'BBTreeG_B, sans-serif', fontSize: '24px', fontWeight: 'bold', color: '#333' }}>+</span>
              <div className="step-indicator" style={{ backgroundColor: '#C0B86C', color: 'white', padding: '15px 25px', borderRadius: '10px', fontFamily: 'BBTreeG_B, sans-serif', fontSize: '22px', fontWeight: 'bold' }}>영어 단어 적기</div>
          </div>

          <div className="phase-title-box" style={{
              backgroundColor: titleBackgroundColor || '#7C85AF', // 기본값 설정
              color: 'white',
              padding: '20px 40px',
              borderRadius: '10px',
              marginBottom: '30px',
              fontFamily: 'BBTreeG_B, sans-serif',
              fontSize: '36px',
              fontWeight: 'bold',
              display: 'inline-block'
          }}>
              [ {phaseTitle} ] 시작
          </div>

          <div className="phase-instructions" style={{
              fontFamily: 'BBTreeGo_R, sans-serif',
              fontSize: '20px',
              lineHeight: 1.6,
              color: '#333',
              marginBottom: '40px',
              textAlign: 'left',
              whiteSpace: 'pre-line',
              width: '100%',
              paddingLeft: '15%',
              boxSizing: 'border-box'
          }}>
               {instructionLines.map((line, index) => (
                  <React.Fragment key={index}>{line.startsWith('•') ? '' : '• '}{line}<br /></React.Fragment>
              ))}
          </div>

          <BlueButton
              text="Next"
              onClick={onNextClick}
          />
      </div>
  );
};

export default PhaseStartContent; 