// common_components.js
// 이 파일은 React, ReactDOM, antd, icons 가 이미 로드된 후에 실행되어야 합니다.

console.log('common_components.js loading...');
console.log('React available:', typeof React !== 'undefined');
console.log('antd available:', typeof antd !== 'undefined');
console.log('icons available:', typeof icons !== 'undefined');

// 필요한 전역 변수 가져오기 (HTML에서 CDN으로 로드됨)
// 필수 라이브러리가 로드되지 않았으면 에러 출력
if (typeof React === 'undefined' || typeof antd === 'undefined' || typeof icons === 'undefined') {
  console.error('Error! Required global libraries (React, antd, icons) were not loaded before common_components.js');
  // 오류 상황을 명확히 하기 위해 여기서 실행을 멈추거나, 빈 컴포넌트를 반환하도록 할 수 있습니다.
  // throw new Error('Required libraries not loaded'); // 또는 오류 던지기
} else {
  console.log('Required libraries seem available. Proceeding...');

  const { Layout, Menu, Button, Carousel, Row, Col } = antd;
  const { Header, Content, Footer, Sider } = Layout;
  const { useState, useRef } = React;
  const { CheckCircleOutlined, ReadOutlined, ExperimentOutlined, FileTextOutlined } = icons;

  // 아이콘 로드 추가 확인 (선택적)
  if (!icons || typeof icons.CheckCircleOutlined === 'undefined') {
    console.error('Antd icons object seems incomplete!');
  } else {
    console.log('Antd icons seem loaded correctly.');
  }

  // --- Header 컴포넌트 ---
  window.AppHeader = function AppHeader() { // 함수를 전역 스코프에 명시적으로 할당
    return (
      <Header>
         <div className="logo">PHONITAIL</div>
         <div className="user-name">User Name</div> {/* TODO: Replace with dynamic user name */}
      </Header>
    );
  }

  // --- Sidebar 컴포넌트 ---
  window.AppSidebar = function AppSidebar() { // 함수를 전역 스코프에 명시적으로 할당
    const currentPath = window.location.pathname;
    let currentStep = 'instruction'; // Default or derive dynamically

    // Determine current step based on path
    if (currentPath === '/consent') currentStep = 'consent';
    else if (currentPath === '/instruction') currentStep = 'instruction';
    else if (currentPath.startsWith('/round/1')) currentStep = 'round1';
    else if (currentPath.startsWith('/round/2')) currentStep = 'round2';
    else if (currentPath.startsWith('/round/3')) currentStep = 'round3';
    else if (currentPath.startsWith('/survey')) currentStep = 'survey';

    const steps = [
      { key: 'consent', icon: <CheckCircleOutlined />, label: 'Consent', path: '/consent' },
      { key: 'instruction', icon: <ReadOutlined />, label: 'Instruction', path: '/instruction' },
      { key: 'round1', icon: <ExperimentOutlined />, label: 'Round 1', path: '/round/1/start' },
      { key: 'round2', icon: <ExperimentOutlined />, label: 'Round 2', path: '/round/2/start' },
      { key: 'round3', icon: <ExperimentOutlined />, label: 'Round 3', path: '/round/3/start' },
      { key: 'survey', icon: <FileTextOutlined />, label: 'Survey', path: '/survey/start' },
    ];

    const handleMenuClick = (path) => {
        console.log(`Navigating to: ${path}`);
        window.location.href = path;
    };

    const currentStepIndex = steps.findIndex(step => step.key === currentStep);
    const updatedSteps = steps.map((step, index) => ({
        ...step,
        completed: index < currentStepIndex,
        disabled: index > currentStepIndex
    }));

    return (
      <Sider width={200} theme="light">
        <Menu
          mode="inline"
          selectedKeys={[currentStep]}
          style={{ height: '100%', borderRight: 0, paddingTop: '20px' }}
        >
          {updatedSteps.map(step => (
            <Menu.Item
                key={step.key}
                icon={step.icon}
                disabled={step.disabled}
                onClick={() => !step.disabled && handleMenuClick(step.path)}
                style={step.completed ? { color: 'rgba(0, 0, 0, 0.45)', cursor: 'pointer' } : step.disabled ? {} : { cursor: 'pointer' }}
            >
              {step.label}
            </Menu.Item>
          ))}
        </Menu>
      </Sider>
    );
  }

  // --- 파란색 공통 버튼 컴포넌트 ---
  window.BlueButton = function BlueButton({ text, onClick, disabled = false, style = {}, htmlType = "button" }) { // htmlType prop 추가 (기본값 'button')
    const { Button } = antd;
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
  }

  // --- 메인 레이아웃 컴포넌트 ---
  window.MainLayout = function MainLayout({ children }) { // 함수를 전역 스코프에 명시적으로 할당
    return (
      <Layout className="layout" style={{ minHeight: '100vh' }}>
        <AppHeader />
        <Layout>
          <AppSidebar />
          <Layout style={{ padding: '24px 24px 24px' }}>
            <Content>
              {children} {/* 페이지별 컨텐츠가 여기에 렌더링됩니다 */}
            </Content>
          </Layout>
        </Layout>
        {/* Footer는 필요하다면 여기에 추가할 수 있습니다 */}
        {/* <Footer style={{ textAlign: 'center' }}>Phonitale Experiment ©2024</Footer> */}
      </Layout>
    );
  }
} 