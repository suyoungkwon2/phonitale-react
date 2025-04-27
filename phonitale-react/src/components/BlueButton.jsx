import React from 'react';
import { Button } from 'antd';

const BlueButton = ({ text, onClick, disabled = false, style = {}, htmlType = "button" }) => {
  // 기본 버튼 스타일과 전달된 스타일 병합
  const buttonStyle = {
      backgroundColor: '#2049FF', // Specific blue from Figma
      borderColor: '#2049FF',
      color: 'white',
      padding: '10px 40px', // Adjust padding for size
      height: 'auto', // Allow height to adjust
      borderRadius: '10px', // Rounded corners from Figma
      fontFamily: 'Rubik, sans-serif', // Apply Rubik font if available
      fontSize: '20px',
      fontWeight: 500,
      lineHeight: '1.4em', // Match Figma
      ...style // 추가적인 스타일 적용 가능
  };

  // 비활성화 시 스타일 조정
  const disabledStyle = disabled ? {
      backgroundColor: '#f5f5f5',
      borderColor: '#d9d9d9',
      color: 'rgba(0, 0, 0, 0.25)',
      cursor: 'not-allowed'
  } : {};

  return (
      <Button
          type="primary"
          onClick={onClick}
          style={{ ...buttonStyle, ...disabledStyle }} // 기본, 커스텀, 비활성 스타일 순서로 적용
          disabled={disabled}
          htmlType={htmlType} // htmlType prop 전달
      >
          {text}
      </Button>
  );
};

export default BlueButton; 