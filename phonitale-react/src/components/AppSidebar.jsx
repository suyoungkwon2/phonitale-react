import React from 'react';
import { Layout, Steps } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom'; // useNavigate 추가

const { Sider } = Layout;

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate(); // useNavigate 훅 사용
  const currentPath = location.pathname;

  console.log("AppSidebar component rendering...");
  console.log("Current location pathname:", currentPath);

  let currentStepKey = 'consent'; // Default step

  // Determine current step key based on the path from useLocation
  if (currentPath === '/instruction') {
    currentStepKey = 'instruction';
  } else if (currentPath.startsWith('/round/1')) {
    currentStepKey = 'round1';
  } else if (currentPath.startsWith('/round/2')) {
    currentStepKey = 'round2';
  } else if (currentPath.startsWith('/round/3')) {
    currentStepKey = 'round3';
  } else if (currentPath.startsWith('/survey')) {
    currentStepKey = 'survey';
  } else if (currentPath === '/end') {
    currentStepKey = 'end';
  } else if (currentPath === '/' || currentPath === '/consent') { // Handle root and explicit consent paths
      currentStepKey = 'consent';
  }
  
  console.log(`Determined step key: ${currentStepKey}`);

  const stepsData = [
    { key: 'consent', title: 'Consent', path: '/' }, // 경로 추가
    { key: 'instruction', title: 'Instruction', path: '/instruction' }, // 경로 추가
    { key: 'round1', title: 'Round 1', path: '/round/1/start' }, // 경로 추가 (라운드 시작 페이지)
    { key: 'round2', title: 'Round 2', path: '/round/2/start' }, // 경로 추가
    { key: 'round3', title: 'Round 3', path: '/round/3/start' }, // 경로 추가
    { key: 'survey', title: 'Survey', path: '/survey/start' }, // 경로 추가 (설문 시작 페이지)
    // 'End' step is not visually represented in the Steps component itself
  ];

  let displayStepIndex = stepsData.findIndex(step => step.key === currentStepKey);
  
  // Special handling for the end page to mark all steps as finished
  if (currentStepKey === 'end') {
      displayStepIndex = stepsData.length; // Set index beyond the last step
  }

  console.log(`Current step index for status calculation: ${displayStepIndex}`);

  const determineStatus = (index, currentIndex, currentKey) => {
      if (currentKey === 'end') {
          return 'finish'; // Mark all as finish on the end page
      }
      if (index < currentIndex) return 'finish';
      if (index === currentIndex) return 'process';
      return 'wait';
  };

  // 네비게이션 함수
  const handleStepClick = (path) => {
      console.log(`Navigating to: ${path}`);
      navigate(path);
  };

  return (
    <Sider width={200} theme="light" style={{
         background: '#fff',
         overflow: 'auto',
         height: 'calc(100vh - 64px)', // Header height excluded
         position: 'fixed',
         left: 0,
         top: 64, // Below header
         bottom: 0,
         zIndex: 9
     }}>
      <Steps
        className="figma-steps" // Keep class for potential global styling
        direction="vertical"
        current={displayStepIndex} // `current` prop controls the active step highlight
        style={{ padding: '24px' }} // Add padding
      >
        {stepsData.map((step, index) => {
          const status = determineStatus(index, displayStepIndex, currentStepKey);
          
          let stepIcon;
          if (status === 'finish') {
              stepIcon = <CheckCircleOutlined />;
          } else {
              // Use default number icon for 'process' and 'wait' unless customized
          }

          return (
            <Steps.Step
              key={step.key}
              title={step.title}
              status={status} // Use status to control styling (finish, process, wait)
              icon={stepIcon}
              onClick={() => handleStepClick(step.path)} // 클릭 핸들러 추가
              style={{ cursor: 'pointer' }} // 클릭 가능 표시
            />
          );
        })}
      </Steps>
    </Sider>
  );
};

export default AppSidebar; 