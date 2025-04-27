import React from 'react';
import { Layout } from 'antd';
import AppHeader from './AppHeader';
import AppSidebar from './AppSidebar';

const { Content } = Layout;

const MainLayout = ({ children }) => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppHeader />
      <Layout>
        <AppSidebar />
        <Content style={{
            marginLeft: 200,
            padding: '24px 16px 0',
            background: '#f0f2f5',
            overflow: 'initial' 
          }}>
          <div style={{ 
              padding: 24, 
              background: '#fff', 
              minHeight: 'calc(100vh - 64px - 48px)'
            }}>
            {children}
          </div>
        </Content>
        {/* Footer는 필요에 따라 추가 */}
        {/* <Footer style={{ textAlign: 'center' }}>Phonitale Experiment ©2024</Footer> */}
      </Layout>
    </Layout>
  );
};

export default MainLayout; 