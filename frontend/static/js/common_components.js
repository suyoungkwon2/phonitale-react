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

  const { Layout, Menu, Button, Carousel, Row, Col, Typography, Steps } = antd;
  const { Header, Content, Footer, Sider } = Layout;
  const { useState, useRef, useEffect } = React;
  const { CheckCircleOutlined, ReadOutlined, ExperimentOutlined, FileTextOutlined } = icons;
  const { Text } = Typography;

  // 아이콘 로드 추가 확인 (선택적)
  if (!icons || typeof icons.CheckCircleOutlined === 'undefined') {
    console.error('Antd icons object seems incomplete!');
  } else {
    console.log('Antd icons seem loaded correctly.');
  }

  // --- Header 컴포넌트 ---
  window.AppHeader = function AppHeader() {
    const [userName, setUserName] = useState(null);

    useEffect(() => {
      const storedName = sessionStorage.getItem('userName');
      if (storedName) {
        setUserName(storedName);
      } else {
        console.log('User name not found in sessionStorage.');
      }
    }, []);

    return (
      <Header className="app-header">
         <div className="app-logo">
            <img 
                src="/static/images/icon.png" 
                alt="Phonitale Icon"
            />
            PHONITALE
         </div>
         <div className="app-user-name">{userName || 'User Name'}</div>
      </Header>
    );
  }

  // --- Sidebar 컴포넌트 ---
  window.AppSidebar = function AppSidebar() {
    console.log("AppSidebar component rendering...");

    const currentPath = window.location.pathname;
    let currentStepKey = 'consent';
    // Determine current step key based on path
    if (currentPath === '/instruction') currentStepKey = 'instruction';
    else if (currentPath.startsWith('/round/1')) currentStepKey = 'round1';
    else if (currentPath.startsWith('/round/2')) currentStepKey = 'round2';
    else if (currentPath.startsWith('/round/3')) currentStepKey = 'round3';
    else if (currentPath.startsWith('/survey')) currentStepKey = 'survey';
    else if (currentPath === '/end') currentStepKey = 'end';
    console.log(`Current path: ${currentPath}, Determined step key: ${currentStepKey}`);

    const stepsData = [
      { key: 'consent', title: 'Consent' },
      { key: 'instruction', title: 'Instruction' },
      { key: 'round1', title: 'Round 1' },
      { key: 'round2', title: 'Round 2' },
      { key: 'round3', title: 'Round 3' },
      { key: 'survey', title: 'Survey' },
    ];

    let displayStepIndex = stepsData.findIndex(step => step.key === currentStepKey);
    if (currentPath === '/end') {
        displayStepIndex = stepsData.length; // 모든 단계를 완료한 것으로 간주
    }
    console.log(`Current step index for status calculation: ${displayStepIndex}`);

    const determineStatus = (index, currentIndex, path) => {
        if (path === '/end') {
            return 'finish'; // /end 경로에서는 무조건 finish 반환
        }
        // 기존 로직 유지
        if (index < currentIndex) return 'finish';
        if (index === currentIndex) return 'process';
        return 'wait';
    };
    
    return (
      <Sider width={200} theme="light" style={{ /* 기존 Sider 스타일 유지 */
           background: '#fff',
           overflow: 'auto',
           height: '100vh',
           position: 'fixed',
           left: 0,
           top: 64,
           bottom: 0,
           zIndex: 9
       }}>
        <Steps
          className="figma-steps"
          direction="vertical"
          current={displayStepIndex}
        >
          {stepsData.map((step, index) => {
            const status = determineStatus(index, displayStepIndex, currentPath);
            const stepClassName = `figma-step-${status}`;
            
            let stepIcon;
            if (status === 'finish') {
                stepIcon = <CheckCircleOutlined />;
            } else {
                stepIcon = <span className={`figma-step-icon ${stepClassName}`}>{index + 1}</span>;
            }

            return (
              <Steps.Step
                className={stepClassName}
                key={step.key}
                title={step.title}
                status={status}
                icon={stepIcon}
              />
            );
          })}
        </Steps>
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

  // --- 단계 시작 안내 페이지 공통 콘텐츠 컴포넌트 ---
  window.PhaseStartContent = function PhaseStartContent({ roundNumber, phaseTitle, titleBackgroundColor, instructions, nextPageUrl }) {
    const { Button, Typography } = antd;
    const { Text } = Typography;

    const handleNextClick = () => {
        if (nextPageUrl) {
            window.location.href = nextPageUrl;
        }
    };

    // instruction 텍스트를 줄바꿈 기준으로 배열로 만듭니다.
    const instructionLines = instructions.split('\n');

    return (
        <div className="phase-start-content" style={{ /* 스타일은 round_start.html의 것을 기반으로 하되, 일부 조정 가능 */
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '40px',
            background: '#fff',
            borderRadius: '8px',
            maxWidth: '800px',
            margin: 'auto',
            textAlign: 'center'
        }}>
            {/* 단계 표시기 (round_start와 동일하게 유지) */}
            <div className="step-indicator-box" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginBottom: '40px' }}>
                <div className="step-indicator" style={{ backgroundColor: '#7C85AF', color: 'white', padding: '15px 25px', borderRadius: '10px', fontFamily: 'BBTreeG_B, sans-serif', fontSize: '22px', fontWeight: 'bold' }}>학습</div>
                <span className="step-plus" style={{ fontFamily: 'BBTreeG_B, sans-serif', fontSize: '24px', fontWeight: 'bold', color: '#333' }}>+</span>
                <div className="step-indicator" style={{ backgroundColor: '#78AD74', color: 'white', padding: '15px 25px', borderRadius: '10px', fontFamily: 'BBTreeG_B, sans-serif', fontSize: '22px', fontWeight: 'bold' }}>한국어 뜻 적기</div>
                <span className="step-plus" style={{ fontFamily: 'BBTreeG_B, sans-serif', fontSize: '24px', fontWeight: 'bold', color: '#333' }}>+</span>
                <div className="step-indicator" style={{ backgroundColor: '#C0B86C', color: 'white', padding: '15px 25px', borderRadius: '10px', fontFamily: 'BBTreeG_B, sans-serif', fontSize: '22px', fontWeight: 'bold' }}>영어 단어 적기</div>
            </div>

            {/* 제목 박스 (배경색은 prop으로 받음) */}
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

            {/* 안내 문구 (줄바꿈 처리) */}
            <div className="phase-instructions" style={{
                fontFamily: 'BBTreeGo_R, sans-serif',
                fontSize: '20px',
                lineHeight: 1.6,
                color: '#333',
                marginBottom: '40px',
                textAlign: 'left',
                whiteSpace: 'pre-line', // CSS로 줄바꿈 처리
                width: '100%',
                paddingLeft: '15%', // 들여쓰기 조정
                boxSizing: 'border-box'
            }}>
                 {instructionLines.map((line, index) => (
                    // 각 줄 앞에 불릿 포인트(•) 추가 (필요하다면)
                    <React.Fragment key={index}>{line.startsWith('•') ? '' : '• '}{line}<br /></React.Fragment>
                ))}
            </div>

            {/* 다음 버튼 */}
            <window.BlueButton
                text="Next"
                onClick={handleNextClick}
            />
        </div>
    );
  }

  // --- 메인 레이아웃 컴포넌트 ---
  window.MainLayout = function MainLayout({ children }) {
    const headerHeight = 64; // header.css 에서 정의한 높이와 일치시킴
    const siderWidth = 200;

    return (
      <Layout className="layout" style={{ minHeight: '100vh' }}>
        <AppHeader />
        <Layout style={{ 
            // 헤더 높이만큼 상단 패딩 추가 (고정 헤더 공간 확보)
            paddingTop: headerHeight, 
         }}>
          <AppSidebar />
          <Layout style={{ 
              // 사이드바 너비만큼 왼쪽 마진 추가 (고정 사이드바 공간 확보)
              padding: '24px 24px 24px',
              marginLeft: siderWidth,
              minHeight: `calc(100vh - ${headerHeight}px)`
           }}>
            <Content
                // Add a class for potential content-specific styling
                // className="main-content"
            >
              {children} 
            </Content>
          </Layout>
        </Layout>
      </Layout>
    );
  }
} 