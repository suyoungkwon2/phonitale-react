import React, { useState, useEffect } from 'react';
import { Layout } from 'antd';

const { Header } = Layout;

const AppHeader = () => {
  const [userName, setUserName] = useState(null);

  useEffect(() => {
    // 크롬 익스텐션에서는 sessionStorage 대신 chrome.storage.local 사용 고려
    // 우선 기존 로직 유지, 추후 수정
    const storedName = sessionStorage.getItem('userName');
    if (storedName) {
      setUserName(storedName);
    } else {
      console.log('User name not found in sessionStorage.');
    }
  }, []);

  return (
    <Header className="app-header" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      background: 'white',
      borderBottom: '1px solid #868686'
    }}>
       <div className="app-logo" style={{ display: 'flex', alignItems: 'center' }}>
          {/* 이미지 경로는 public 폴더 기준으로 설정 필요 */}
          <img 
              src="/icon.png" // Vite에서는 public 폴더가 루트가 됨
              alt="Phonitale Icon"
              style={{ height: '32px', marginRight: '10px' }} // 스타일 직접 추가
          />
          <span style={{ fontSize: '20px', fontWeight: 'bold' }}>PHONITALE</span>
       </div>
       <div className="app-user-name" style={{ fontSize: '16px' }}>{userName || 'User Name'}</div>
    </Header>
  );
}

export default AppHeader; 