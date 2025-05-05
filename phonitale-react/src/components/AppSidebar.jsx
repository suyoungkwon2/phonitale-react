import React from 'react';
import { Layout } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useExperiment } from '../context/ExperimentContext';

const { Sider } = Layout;

// 피그마 디자인 기반 사이드바 스타일 (이전 스타일 복원 시도)
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
  stepIconContainerFinish: {
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
  },
  stepIconFinish: {
    fontSize: '16px',
    color: '#000000', 
  },
  stepIconContainerProcess: {
    borderColor: '#000000',
    backgroundColor: '#000000',
    color: '#FFFFFF', 
    fontWeight: 'bold',
  },
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
  const { groupCode } = useParams(); // URL에서 groupCode 가져오기
  const currentPath = location.pathname;
  // const { group } = useExperiment(); // group 상태 확인은 현재 불필요

  // --- 단계 데이터 및 상태 결정 로직 (이전 로직 복원 시도) ---
  const stepsData = [
    // 경로에서 시작하는 groupCode 부분을 제거하고 비교하기 위한 기본 경로 정의
    { key: 'consent', title: 'Consent', path: '/consent' }, // 기본 경로를 /consent로 명시
    { key: 'instruction', title: 'Instruction', path: '/instruction' },
    { key: 'round1', title: 'Round 1', path: '/round/1/start' }, // 라운드 시작 페이지 기준
    { key: 'round2', title: 'Round 2', path: '/round/2/start' },
    { key: 'round3', title: 'Round 3', path: '/round/3/start' },
    { key: 'survey', title: 'Survey', path: '/survey/start' }, // 설문 시작 페이지 기준
    { key: 'end', title: 'End', path: '/end' }, // 종료 단계 추가
  ];

  // 현재 경로에서 groupCode 부분을 제거하여 비교할 기본 경로 추출
  const basePath = groupCode ? currentPath.replace(`/${groupCode}`, '') || '/' : currentPath;
  const finalBasePath = basePath === '' ? '/' : basePath;
  console.log(`Sidebar Base Path Calculation: currentPath='${currentPath}', groupCode='${groupCode}', finalBasePath='${finalBasePath}'`);

  let currentStepIndex = stepsData.findIndex(step => {
    if (step.key === 'consent' && (finalBasePath === '/' || finalBasePath.startsWith('/consent'))) return true;
    if (step.key === 'instruction' && finalBasePath.startsWith('/instruction')) return true;
    if (step.key.startsWith('round') && finalBasePath.startsWith(`/round/${step.key.slice(-1)}`)) return true;
    if (step.key === 'survey' && finalBasePath.startsWith('/survey')) return true;
    if (step.key === 'end' && finalBasePath.startsWith('/end')) return true;
    return false;
  });

  // 유효한 경로 내에서 매칭되는 단계가 없는 경우 (예: /invalid-group)
  if (currentStepIndex === -1 && finalBasePath !== '/invalid-group') {
     // 기본값 Consent 활성화
     currentStepIndex = 0; 
     console.log("Sidebar: No specific match found for", finalBasePath, "defaulting to index 0");
   }
   // 잘못된 그룹 페이지는 currentStepIndex = -1 유지

  const getStatus = (index, currentIndex) => {
    if (currentIndex === -1) return 'wait';
    if (index < currentIndex) return 'finish';
    if (index === currentIndex) return 'process';
    return 'wait';
  };
  // --- 로직 끝 ---

  // 클릭 핸들러 (이전 로직 복원)
  const handleStepClick = (path) => {
    // 실험 진행 중 클릭 방지 로직 제거됨
    const targetPath = groupCode ? `/${groupCode}${path}` : path;
    console.log("Sidebar navigating to:", targetPath);
    navigate(targetPath);
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
            iconContent = stepNumber;
            titleStyle = { ...titleStyle, ...sidebarStyles.stepTitleProcess };
          } else { // wait
            iconContainerStyle = { ...iconContainerStyle, ...sidebarStyles.stepIconContainerWait };
            iconContent = stepNumber;
            titleStyle = { ...titleStyle, ...sidebarStyles.stepTitleWait };
          }

          return (
            <React.Fragment key={step.key}>
              {/* 상태와 관계없이 클릭 가능하도록 복원 */}
              <div style={sidebarStyles.stepItem} onClick={() => handleStepClick(step.path)}>
                <div style={iconContainerStyle}>
                  {iconContent}
                </div>
                <span style={titleStyle}>{step.title}</span>
              </div>
              {/* 마지막 단계 뒤에는 divider 없음 */}
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