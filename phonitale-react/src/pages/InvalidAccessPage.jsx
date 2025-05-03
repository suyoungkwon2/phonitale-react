import React from 'react';
import { Result, Typography } from 'antd';
import MainLayout from '../components/MainLayout';

const { Title, Paragraph } = Typography;

const InvalidAccessPage = () => {
  return (
    <MainLayout>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 128px)' }}> {/* 헤더 높이 제외, 수직 중앙 정렬 */}
        <Result
          status="warning" // 경고 아이콘 사용
          title={
            <Title level={3} style={{ marginBottom: '8px' }}>
              올바른 실험 링크로 접속해 주세요
            </Title>
          }
          subTitle={
            <Paragraph style={{ fontSize: '16px', color: '#555' }}>
              참여하신 실험은 전용 링크를 통해서만 접근하실 수 있습니다.
              <br />
              안내 메일에 포함된 링크를 확인하시고, 다시 접속해 주세요 😊
            </Paragraph>
          }
        />
      </div>
    </MainLayout>
  );
};

export default InvalidAccessPage; 