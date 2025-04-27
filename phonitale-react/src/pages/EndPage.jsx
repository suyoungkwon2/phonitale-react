import React from 'react';
import MainLayout from '../components/MainLayout';
import { Result } from 'antd'; // Use Result component for a standard end page look

const EndPage = () => {
  const endMessage = `실험에 참여해 주셔서 감사합니다.\n리워드는 실험 종료 후 2~3주 이내에 작성하신 휴대폰 번호로 문자 발송될 예정입니다.`;

  // TODO: Potentially add a final timestamp recording API call here in a useEffect

  return (
    <MainLayout>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 64px - 48px)' }}>
          <Result
            status="success"
            title="실험 종료"
            subTitle={<div style={{ whiteSpace: 'pre-line', textAlign: 'center', fontSize: '16px' }}>{endMessage}</div>}
            // No extra buttons needed
          />
      </div>
    </MainLayout>
  );
};

export default EndPage; 