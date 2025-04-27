import React, { useState, useEffect } from 'react';
import { Layout, Form, Input, Button, Checkbox, Row, Col, Typography, Alert } from 'antd';
import { useNavigate } from 'react-router-dom'; // 페이지 이동을 위해 사용
import axios from 'axios'; // axios 임포트
import BlueButton from '../components/BlueButton';
import MainLayout from '../components/MainLayout'; // MainLayout import
import { useExperiment } from '../context/ExperimentContext'; // useExperiment 훅 임포트

const { Title, Paragraph } = Typography;

const ConsentPage = () => {
  const [form] = Form.useForm();
  const [isSubmittable, setIsSubmittable] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태 추가
  const [error, setError] = useState(null); // 에러 상태 추가
  const navigate = useNavigate(); // Hook for navigation
  const { setUserId } = useExperiment(); // setUserId 함수 가져오기

  // Watch form values to enable/disable submit button
  const values = Form.useWatch([], form);
  useEffect(() => {
    form.validateFields({ validateOnly: true }).then(
      () => {
        if (values && values.agree && values.name && values.phone && values.email) {
           setIsSubmittable(true);
        } else {
           setIsSubmittable(false);
        }
      },
      () => {
        setIsSubmittable(false);
      },
    );
  }, [values, form]);

  const onFinish = async (formData) => {
    console.log('Received values of form: ', formData);
    // API 엔드포인트 URL (API Gateway 호출 URL + 경로)
    const apiUrl = 'https://wstvol0isg.execute-api.us-east-2.amazonaws.com/dev/consent';

    setIsLoading(true); // 로딩 시작
    setError(null); // 이전 에러 초기화

    try {
      const payload = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        consent_agreed: formData.agree
      };
      console.log('Sending payload:', payload);

      const response = await axios.post(apiUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('Consent submitted successfully:', response.data);

      // 응답 데이터에서 userId 같은 식별자 처리 (백엔드 응답 형식 확인 필요)
      // 예시: 백엔드가 { userId: 'some-unique-id' } 형태로 응답한다고 가정
      if (response.data && response.data.userId) {
        setUserId(response.data.userId); // 전역 상태 업데이트
        sessionStorage.setItem('userId', response.data.userId); // 세션 스토리지에도 저장 (백업/새로고침 대비)
        console.log('Global userId set:', response.data.userId);
      } else {
        // userId가 응답에 없다면 임시 ID 생성 또는 다른 처리 방식 고려
        console.warn('userId not found in response, proceeding without setting global userId.');
      }

      // sessionStorage에 사용자 이름 저장 (기존과 동일)
      sessionStorage.setItem('userName', formData.name);
      navigate('/instruction'); // 다음 페이지로 이동

    } catch (err) {
      console.error('Error submitting consent:', err);
      // 상세 에러 메시지 표시
      let errorMessage = '제출 중 오류가 발생했습니다. 다시 시도해주세요.';
      if (err.response) {
        // 서버 응답 에러 (e.g., 4xx, 5xx)
        console.error('Server responded with status:', err.response.status);
        console.error('Response data:', err.response.data);
        errorMessage = `서버 오류 (${err.response.status}): ${err.response.data.message || '내용 없음'}`;
      } else if (err.request) {
        // 요청은 보냈으나 응답 없음 (e.g., 네트워크 오류)
        console.error('No response received:', err.request);
        errorMessage = '서버 응답을 받을 수 없습니다. 네트워크 연결을 확인해주세요.';
      } else {
        // 요청 설정 중 오류
        console.error('Error setting up request:', err.message);
        errorMessage = `요청 설정 오류: ${err.message}`;
      }
      setError(errorMessage); // 에러 상태 업데이트
    } finally {
      setIsLoading(false); // 로딩 종료
    }
  };

  return (
    <MainLayout> {/* MainLayout으로 감싸기 */}
        <div className="site-layout-content" style={{ background: '#fff', padding: '40px', borderRadius: '8px', width: '100%', margin: 'auto' }}>
            <Row justify="center" style={{ marginBottom: '24px' }}>
               <Col>
                  <div style={{ backgroundColor: '#394A7F', color: 'white', padding: '16px 24px', borderRadius: '8px', textAlign: 'center', fontSize: '24px', fontWeight: 'bold' }}>
                     실험 참가 동의서
                  </div>
               </Col>
            </Row>

            <Paragraph>실험에 참여해 주셔서 감사합니다. 아래 링크에서 참가 동의서를 읽고 서명해 주세요.</Paragraph>
            <Paragraph>※ 동의하지 않으면 실험에 참여하실 수 없습니다.</Paragraph>

            {/* Notion Embed */}
            <div style={{ border: '1px solid #d9d9d9', borderRadius: '2px', padding: '20px', marginBottom: '24px', backgroundColor: '#fafafa' }}>
               <iframe src="https://rattle-concrete-594.notion.site/ebd/1d859a3ef1888016aa73f7ea7fc944a1" width="100%" height="400px" frameBorder="0" allowFullScreen style={{display: 'block', margin: 'auto'}}></iframe>
            </div>

            {/* 에러 메시지 표시 영역 */} 
            {error && <Alert message="오류" description={error} type="error" showIcon style={{ marginBottom: '24px', maxWidth: 600, margin: 'auto' }}/>}

            {/* User Info Form */}
            <Form
              form={form}
              layout="horizontal"
              onFinish={onFinish}
              labelCol={{ span: 4 }}
              wrapperCol={{ span: 18 }}
              style={{ maxWidth: 600, margin: 'auto' }}
              autoComplete="off"
            >
              <Form.Item
                  name="name"
                  label="이름"
                  rules={[{ required: true, message: '이름을 입력해주세요!' }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="phone"
                  label="핸드폰 번호"
                  rules={[{ required: true, message: '핸드폰 번호를 입력해주세요!' }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="email"
                  label="이메일 주소"
                  rules={[
                      { required: true, message: '이메일 주소를 입력해주세요!' },
                      { type: 'email', message: '유효한 이메일 주소를 입력해주세요!'}
                  ]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="agree"
                  valuePropName="checked"
                  wrapperCol={{ offset: 4, span: 18 }}
                  rules={[{
                      validator: (_, value) =>
                      value ? Promise.resolve() : Promise.reject(new Error('동의가 필요합니다.')),
                  }]}
                >
                  <Checkbox>동의합니다.</Checkbox>
                </Form.Item>
              <Form.Item wrapperCol={{ offset: 4, span: 18 }} style={{ textAlign: 'right' }}>
                <BlueButton text="Submit" htmlType="submit" disabled={!isSubmittable || isLoading} loading={isLoading} /> {/* 로딩 상태 반영 */} 
              </Form.Item>
            </Form>
        </div>
    </MainLayout>
  );
}

export default ConsentPage; 