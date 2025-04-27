import React, { useState, useEffect } from 'react';
import { Layout, Form, Input, Button, Checkbox, Row, Col, Typography } from 'antd';
import { useNavigate } from 'react-router-dom'; // 페이지 이동을 위해 사용
import BlueButton from '../components/BlueButton';
import MainLayout from '../components/MainLayout'; // MainLayout import

const { Title, Paragraph } = Typography;

const ConsentPage = () => {
  const [form] = Form.useForm();
  const [isSubmittable, setIsSubmittable] = useState(false);
  const navigate = useNavigate(); // Hook for navigation

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
    const apiUrl = 'https://2ml24s4a3jfj5hqx4y644cgzbq0jbzmt.lambda-url.us-east-2.on.aws/consent'; // API Gateway 엔드포인트 사용

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            // 서버리스 백엔드에서 consent_agreed 필드를 기대할 수 있음 (Lambda 확인 필요)
            consent_agreed: formData.agree // `agree` 필드를 `consent_agreed`로 매핑 (백엔드에 맞게 조정)
        }),
      });

      if (response.ok) {
        const result = await response.json(); // 응답 본문 파싱 (필요시)
        console.log('Consent submitted successfully:', result);
        // 사용자 이름을 sessionStorage 또는 chrome.storage에 저장 (추후 storage API로 전환)
        sessionStorage.setItem('userName', formData.name);
        navigate('/instruction'); // Navigate to the instruction page
      } else {
        console.error('Failed to submit consent', response.status, await response.text());
        alert('제출에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('Error submitting consent:', error);
      alert('오류가 발생했습니다. 네트워크 연결을 확인하거나 잠시 후 다시 시도해주세요.');
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
                 {/* window.BlueButton 대신 import한 BlueButton 사용 */}
                <BlueButton text="Submit" htmlType="submit" disabled={!isSubmittable} />
              </Form.Item>
            </Form>
        </div>
    </MainLayout>
  );
}

export default ConsentPage; 