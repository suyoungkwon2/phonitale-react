import React from 'react';
import { Layout } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons'; // CheckCircleOutlined 사용
import { useLocation, useNavigate } from 'react-router-dom';

const { Sider } = Layout;

// 피그마 디자인 기반 사이드바 스타일
const sidebarStyles = {
  sider: {
    background: '#FFFFFF',
    overflow: 'auto',
    height: 'calc(100vh - 64px)',
    position: 'fixed',
    left: 0,
    top: 64, 
    bottom: 0,
    zIndex: 9,
    borderRight: '1px solid #868686',
    padding: '40px 0px 40px 40px',
  },
  stepItem: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px',
    cursor: 'pointer',
  },
  // 아이콘 컨테이너 기본 스타일 (테두리, 크기 등)
  stepIconContainerBase: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '12px', 
    fontSize: '14px',
  },
  // 완료 상태 아이콘 컨테이너
  stepIconContainerFinish: {
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
  },
  // 완료 상태 아이콘 (체크)
  stepIconFinish: {
    fontSize: '16px',
    color: '#000000', 
  },
  // 진행 상태 아이콘 컨테이너
  stepIconContainerProcess: {
    borderColor: '#000000',
    backgroundColor: '#000000',
    color: '#FFFFFF', 
    fontWeight: 'bold',
  },
  // 대기 상태 아이콘 컨테이너
  stepIconContainerWait: {
    borderColor: '#8D8D8D',
    backgroundColor: '#FFFFFF',
    color: '#8D8D8D',
  },
  stepTitle: {
    fontSize: '14px',
    lineHeight: '20px',
  },
  stepTitleFinish: {
    color: '#000000',
  },
  stepTitleProcess: {
    color: '#000000', 
    fontWeight: 'bold',
  },
  stepTitleWait: {
    color: '#8D8D8D', // 대기 텍스트 색상 변경
  },
  divider: {
    height: '24px',
    width: '1px',
    backgroundColor: '#E5E7EB',
    margin: '4px 0 4px 11.5px',
  },
};

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  // --- 단계 데이터 및 상태 결정 로직 (기존과 동일) ---
  const stepsData = [
    { key: 'consent', title: 'Consent', path: '/' },
    { key: 'instruction', title: 'Instruction', path: '/instruction' },
    { key: 'round1', title: 'Round 1', path: '/round/1/start' },
    { key: 'round2', title: 'Round 2', path: '/round/2/start' },
    { key: 'round3', title: 'Round 3', path: '/round/3/start' },
    { key: 'survey', title: 'Survey', path: '/survey/start' },
  ];

   let currentStepIndex = stepsData.findIndex(step => {
     const basePath = step.path.substring(0, step.path.lastIndexOf('/')); // '/start' 제외한 기본 경로
     if (step.key === 'consent' && (currentPath === '/' || currentPath === '/consent')) return true;
     // 라운드 및 서베이의 경우, 해당 섹션의 모든 하위 경로에서 활성화
     if (step.key.startsWith('round') && currentPath.startsWith(`/round/${step.key.slice(-1)}`)) return true;
     if (step.key === 'instruction' && currentPath === '/instruction') return true;
     if (step.key === 'survey' && currentPath.startsWith('/survey')) return true;
      // 종료 페이지 처리
      if (currentPath === '/end') return false; 
 
     return false;
   });
 
   // 종료 페이지일 경우 모든 단계를 완료 처리
    if (currentPath === '/end') {
      currentStepIndex = stepsData.length;
    } else if (currentStepIndex === -1 && currentPath !== '/end') {
        currentStepIndex = 0; // 매칭 안되면 Consent 활성화
    }
 
   const getStatus = (index, currentIndex) => {
     if (index < currentIndex) return 'finish';
     if (index === currentIndex) return 'process';
     return 'wait';
   };
  // --- 로직 끝 ---

  const handleStepClick = (path) => {
    navigate(path);
  };

  return (
    <Sider width={200} theme="light" style={sidebarStyles.sider}>
      <div> 
        {stepsData.map((step, index) => {
          const status = getStatus(index, currentStepIndex);
          const stepNumber = index + 1;

          let iconContainerStyle = sidebarStyles.stepIconContainerBase;
          let iconContent;
          let titleStyle = sidebarStyles.stepTitle;

          if (status === 'finish') {
            iconContainerStyle = { ...iconContainerStyle, ...sidebarStyles.stepIconContainerFinish };
            iconContent = <CheckCircleOutlined style={sidebarStyles.stepIconFinish} />;
            titleStyle = { ...titleStyle, ...sidebarStyles.stepTitleFinish };
          } else if (status === 'process') {
            iconContainerStyle = { ...iconContainerStyle, ...sidebarStyles.stepIconContainerProcess };
            iconContent = stepNumber; // 숫자 표시
            titleStyle = { ...titleStyle, ...sidebarStyles.stepTitleProcess };
          } else { // wait
            iconContainerStyle = { ...iconContainerStyle, ...sidebarStyles.stepIconContainerWait };
            iconContent = stepNumber; // 숫자 표시
            titleStyle = { ...titleStyle, ...sidebarStyles.stepTitleWait };
          }

          return (
            <React.Fragment key={step.key}>
              {/* stepItem div에 onClick 핸들러 추가 */}
              <div style={sidebarStyles.stepItem} onClick={() => handleStepClick(step.path)}>
                <div style={iconContainerStyle}> {/* 상태별 스타일 적용된 컨테이너 */}
                  {iconContent} {/* 상태별 아이콘 또는 숫자 */} 
                </div>
                <span style={titleStyle}>{step.title}</span>
              </div>
              {index < stepsData.length - 1 && (
                <div style={sidebarStyles.divider}></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </Sider>
  );
};

export default AppSidebar; 