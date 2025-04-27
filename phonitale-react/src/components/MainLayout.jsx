import React from 'react';
import { Layout, Space } from 'antd';
import AppHeader from './AppHeader';
import AppSidebar from './AppSidebar';

const { Header, Content, Sider } = Layout;

const MainLayout = ({ children }) => {
  // 헤더 높이 (AppHeader의 실제 높이에 맞게 조정 필요)
  const headerHeight = 64; 

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 변경: 헤더 스타일 추가 (고정) */}
      <Header 
        style={{
          position: 'fixed', // 고정 위치
          zIndex: 1,         // 다른 요소 위에 표시
          width: '100%',     // 전체 너비
          top: 0,            // 상단에 고정
          left: 0,           // 좌측에 고정
          padding: 0,        // 내부 패딩 제거 (AppHeader에서 관리)
          height: `${headerHeight}px`, // 헤더 높이 지정
          background: '#fff', // 배경색 지정 (필요시)
          boxShadow: '0 2px 8px #f0f1f2' // 그림자 추가 (선택사항)
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
          padding: '24px', 
          marginTop: `${headerHeight}px` // 헤더 높이만큼 상단 마진 추가
        }}>
          <Content
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
              background: '#fff', // 필요시 배경색 지정
              borderRadius: 8,   // 필요시 모서리 둥글게
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