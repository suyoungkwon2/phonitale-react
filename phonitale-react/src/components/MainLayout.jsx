import React from 'react';
import { Layout } from 'antd';
import AppHeader from './AppHeader';
import AppSidebar from './AppSidebar';
import { useLocation } from 'react-router-dom';

const { Header, Content, Sider } = Layout;

const MainLayout = ({ children }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  // 헤더 높이 (AppHeader의 실제 높이에 맞게 조정 필요)
  const headerHeight = 64; 

  // 페이지 경로에 따라 배경색 결정
  const taskPagePaths = [
    '/learning',
    '/recognition',
    '/generation',
    '/survey' // Survey 관련 경로 포함
  ];

  // 시작 안내 페이지 경로들
  const startPageSuffixes = ['/start']; 
  
  // 현재 경로가 task 페이지이면서 시작 안내 페이지가 아닌 경우 #F3F4FB
  // 그 외 (Consent, Instruction, 각 라운드/설문 시작 안내, 종료 페이지 등)는 #FAF9F5
  const isActualTaskPage = taskPagePaths.some(basePath => currentPath.includes(basePath)) && 
                         !startPageSuffixes.some(suffix => currentPath.endsWith(suffix));

  const contentBgColor = isActualTaskPage ? '#F3F4FB' : '#FAF9F5';
  const layoutBgColor = isActualTaskPage ? '#F3F4FB' : '#FAF9F5';

  return (
    <Layout style={{ minHeight: '100vh', background: layoutBgColor }}>
      {/* 변경: 헤더 스타일 추가 (고정) */}
      <Header 
        style={{
          position: 'fixed', // 고정 위치
          zIndex: 1000,         // 다른 요소 위에 표시 (값 수정)
          width: '100%',     // 전체 너비
          top: 0,            // 상단에 고정
          left: 0,           // 좌측에 고정
          padding: 0,        // 내부 패딩 제거 (AppHeader에서 관리)
          height: `${headerHeight}px`, // 헤더 높이 지정
          background: '#fff', // 배경색 지정 (필요시)
          borderBottom: '1px solid #E5E7EB' // AppHeader에서 이미 적용했지만, 일관성을 위해 유지하거나 제거
        }}
      >
        <AppHeader />
      </Header>
      <Layout>
        <Sider width={200} theme="light">
          <AppSidebar />
        </Sider>
        {/* 변경: 콘텐츠 스타일 추가 (헤더 높이만큼 패딩) */}
        <Layout style={{ 
          padding: '0', // 패딩 제거 (Content에서 관리)
          marginTop: `${headerHeight}px`, 
          background: layoutBgColor // Layout 배경색 적용
        }}>
          <Content
            style={{
              padding: 24,
              margin: 0,
              minHeight: `calc(100vh - ${headerHeight}px - 48px)`, // 헤더 높이와 패딩 제외한 높이
              background: contentBgColor, // 동적 배경색 적용
              display: 'flex', // Flexbox 사용하여 중앙 정렬 용이하게
              justifyContent: 'center', // 가로 중앙 정렬
              alignItems: 'flex-start' // 세로 상단 정렬 (내용 많아지면 스크롤됨)
            }}
          >
             {/* 콘텐츠를 감싸는 div 추가하여 너비 제한 및 중앙 정렬 */}
             <div style={{ width: '100%', maxWidth: '1000px' }}> 
                {children} 
             </div>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default MainLayout; 