import React from 'react';
import { Layout } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons'; // CheckCircleOutlined 사용
import { useLocation, useNavigate, useParams } from 'react-router-dom'; // useParams 추가
import { useExperiment } from '../context/ExperimentContext'; // group 상태 확인용 (선택적)

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
  const { groupCode } = useParams(); // URL에서 groupCode 가져오기
  const currentPath = location.pathname;
  const { group } = useExperiment(); // Context에서 group 정보 확인 (선택적)

  // --- 단계 데이터 및 상태 결정 로직 수정 ---
  const stepsData = [
    // 경로에서 시작하는 groupCode 부분을 제거하고 비교하기 위한 기본 경로 정의
    { key: 'consent', title: 'Consent', path: '/consent' }, // 기본 경로를 /consent로 명시
    { key: 'instruction', title: 'Instruction', path: '/instruction' },
    { key: 'round1', title: 'Round 1', path: '/round/1/start' },
    { key: 'round2', title: 'Round 2', path: '/round/2/start' },
    { key: 'round3', title: 'Round 3', path: '/round/3/start' },
    { key: 'survey', title: 'Survey', path: '/survey/start' },
  ];

  // 현재 경로에서 groupCode 부분을 제거하여 비교할 기본 경로 추출
  // groupCode가 없거나 루트 경로('/')인 경우도 처리
  const basePath = groupCode ? currentPath.replace(`/${groupCode}`, '') || '/' : currentPath;
  // basePath가 빈 문자열이 되면 '/'로 처리 (예: /tksdk 만 입력 시)
  const finalBasePath = basePath === '' ? '/' : basePath;
  console.log(`Sidebar Base Path Calculation: currentPath='${currentPath}', groupCode='${groupCode}', finalBasePath='${finalBasePath}'`); // 디버깅 로그 강화

  let currentStepIndex = stepsData.findIndex(step => {
    // /consent 경로는 / 또는 /consent 둘 다 매칭 (finalBasePath 기준)
    if (step.key === 'consent' && (finalBasePath === '/' || finalBasePath === '/consent')) return true;
    // instruction 경로는 정확히 /instruction 매칭
    if (step.key === 'instruction' && finalBasePath === '/instruction') return true;
    // 라운드 경로는 /round/:num 으로 시작하는 경우 매칭
    if (step.key.startsWith('round') && finalBasePath.startsWith(`/round/${step.key.slice(-1)}`)) return true;
    // 서베이 경로는 /survey 로 시작하는 경우 매칭
    if (step.key === 'survey' && finalBasePath.startsWith('/survey')) return true;

    return false; // 그 외는 매칭 안됨
  });

  // 종료 페이지(/end) 또는 잘못된 그룹 페이지(/invalid-group) 처리
  if (finalBasePath === '/end') {
    currentStepIndex = stepsData.length; // 모든 단계 완료 처리
  } else if (finalBasePath === '/invalid-group') {
      currentStepIndex = -1; // 잘못된 그룹 페이지는 활성 단계 없음
  } else if (currentStepIndex === -1) {
    // 유효한 경로 내에서 매칭되는 단계가 없는 경우 (예: /round/1/learning)
    // 상위 단계 (예: /round/1/start) 를 기준으로 찾아야 함
    // 라운드 내부 페이지 처리
    const roundMatch = finalBasePath.match(/^\/round\/(\d+)/);
    if (roundMatch) {
        const roundNum = roundMatch[1];
        currentStepIndex = stepsData.findIndex(step => step.key === `round${roundNum}`);
    } else if (finalBasePath.startsWith('/survey') && finalBasePath !== '/survey/start') {
        // 서베이 내부 페이지 처리
        currentStepIndex = stepsData.findIndex(step => step.key === 'survey');
    } else if (finalBasePath === '/instruction') {
        currentStepIndex = stepsData.findIndex(step => step.key === 'instruction');
    } else {
        // 그래도 못 찾으면 Consent 활성화 (기본값)
        currentStepIndex = 0; 
        console.log("Sidebar: No specific match found for", finalBasePath, "defaulting to index 0");
    }
  }


  const getStatus = (index, currentIndex) => {
    if (currentIndex === -1) return 'wait'; // 잘못된 그룹 등 활성 단계 없으면 모두 wait
    if (index < currentIndex) return 'finish';
    if (index === currentIndex) return 'process';
    return 'wait';
  };
  // --- 로직 끝 ---

  const handleStepClick = (path) => {
    // groupCode가 존재하고 유효한 경우에만 경로 앞에 붙여줌
    // path가 /consent인 경우 루트(/)로 취급할지 여부 확인 필요 -> 여기서는 path 그대로 사용
    const targetPath = groupCode ? `/${groupCode}${path}` : path;
    console.log("Sidebar navigating to:", targetPath); // 디버깅용 로그
    navigate(targetPath);
  };

  return (
    <Sider width={200} theme="light" style={sidebarStyles.sider}>
      <div> 
        {/* group 상태 표시 (디버깅용, 선택적) */}
        {/* <div style={{ padding: '10px', fontSize: '12px', color: '#888' }}>Group: {group || 'Not Set'}</div> */}
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
              {/* 상태가 wait가 아닐 때만 클릭 가능하도록 하거나, 항상 가능하도록 둘 수 있음 */}
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