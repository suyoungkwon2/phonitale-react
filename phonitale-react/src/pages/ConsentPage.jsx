import React, { useState, useEffect } from 'react';
import { Layout, Form, Input, Button, Checkbox, Row, Col, Typography, Alert, message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom'; // useParams 추가
import BlueButton from '../components/BlueButton';
import MainLayout from '../components/MainLayout'; // MainLayout import
import { useExperiment } from '../context/ExperimentContext'; // useExperiment 훅 임포트
import { submitConsent } from '../utils/api'; // API 유틸리티 임포트

const { Title, Paragraph, Text } = Typography;

const ConsentPage = () => {
  const [form] = Form.useForm();
  const [isSubmittable, setIsSubmittable] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태 추가
  const [error, setError] = useState(null); // 에러 상태 추가
  const navigate = useNavigate();
  const { setUserId, group } = useExperiment(); // group 상태 가져오기
  const { groupCode } = useParams(); // groupCode 가져오기
  const notionEmbedUrl = "https://rattle-concrete-594.notion.site/ebd/1d859a3ef1888016aa73f7ea7fc944a1";

  const values = Form.useWatch([], form);
  useEffect(() => {
    form.validateFields({ validateOnly: true }).then(
      () => {
        if (values && values.agree && values.name && values.phone && values.email) {
           console.log('Setting isSubmittable to TRUE (from 4420b91 logic)');
           setIsSubmittable(true);
        } else {
           console.log('Setting isSubmittable to FALSE (from 4420b91 logic) - Fields missing or not agreed');
           setIsSubmittable(false);
        }
      },
      () => {
        console.log('Setting isSubmittable to FALSE (from 4420b91 logic) - Validation failed');
        setIsSubmittable(false);
      },
    );
  }, [values, form]);

  const onFinish = async (formData) => {
    console.log('Received values of form: ', formData);
    setIsLoading(true); // 로딩 시작
    setError(null); // 이전 에러 초기화

    try {
      const consentData = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        consent_agreed: formData.agree
      };
      console.log('Sending consent data:', consentData, 'for group:', group);

      const response = await submitConsent(consentData, group);

      console.log('Consent submitted successfully:', response);

      // 응답 데이터에서 userId 같은 식별자 처리 (백엔드 응답 형식 확인 필요)
      if (response && response.userId) {
        setUserId(response.userId); // 전역 상태 업데이트
        sessionStorage.setItem('userId', response.userId); // 세션 스토리지에도 저장 (백업/새로고침 대비)
        console.log('Global userId set:', response.userId);
      } else {
        // userId가 응답에 없다면 임시 ID 생성 또는 다른 처리 방식 고려
        console.warn('userId not found in response, proceeding without setting global userId.');
      }

      // sessionStorage에 사용자 이름 저장 (기존과 동일)
      sessionStorage.setItem('userName', formData.name);
      sessionStorage.setItem('userEmail', formData.email); // email 저장
      sessionStorage.setItem('consentTimestamp', response.consentTimestamp); // 시작 timestamp 저장
      navigate(`/${groupCode}/instruction`); // groupCode 추가

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

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
    message.error('Please fill in all required fields and agree to the consent.');
  };

  // 브라우저 뒤로가기 방지
  useEffect(() => {
    const preventGoBack = () => {
      history.pushState(null, "", location.href);
      console.log("Prevented back navigation on Consent Page.");
    };
    history.pushState(null, "", location.href);
    window.addEventListener("popstate", preventGoBack);
    return () => window.removeEventListener("popstate", preventGoBack);
  }, []);

  return (
    <MainLayout>
        <div style={{ width: '100%', maxWidth: '685px', margin: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '50px' }}>
            <div style={{ backgroundColor: '#000000', color: 'white', padding: '16px 24px', textAlign: 'left' }}>
                <Title level={4} style={{ color: 'white', margin: 0, fontWeight: 'bold' }}>실험 참가 동의서</Title>
            </div>

            <div style={{ padding: '0 24px' }}>
                <Paragraph style={{ margin: 0, color: '#000000', fontSize: '14px', lineHeight: '1.6' }}>
                    실험에 참여해 주셔서 감사합니다. 동의서를 읽고 서명해 주세요.<br />
                    ※ 동의하지 않으시면 실험에 참여하실 수 없습니다.
                </Paragraph>
            </div>

            <div style={{ backgroundColor: '#F0F0F0', padding: '20px', minHeight: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                 <iframe
                   src={notionEmbedUrl}
                   style={{ width: '100%', height: '600px', border: 'none' }}
                   title="Experiment Consent Form"
                 ></iframe>
            </div>

            <div style={{ padding: '0 24px' }}>
                <Form
                  form={form}
                  layout="horizontal"
                  onFinish={onFinish}
                  onFinishFailed={onFinishFailed}
                  labelCol={{ span: 4 }}
                  wrapperCol={{ span: 18 }}
                  style={{ maxWidth: 600, margin: 'auto' }}
                  autoComplete="off"
                  colon={false}
                  requiredMark={false}
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
                          value ? Promise.resolve() : Promise.reject(new Error('동의가 필요합니다.'))
                      }]}
                    >
                      <Checkbox>동의합니다.</Checkbox>
                    </Form.Item>
                  <Form.Item wrapperCol={{ offset: 4, span: 18 }} style={{ textAlign: 'right' }}>
                    <BlueButton text="Submit" htmlType="submit" disabled={!isSubmittable || isLoading} loading={isLoading} />
                  </Form.Item>
                </Form>
             </div>

            {error && <Alert message="오류" description={error} type="error" showIcon style={{ marginTop: '0', margin: '0 24px 16px 24px', padding: '8px 15px' }}/>}
        </div>
    </MainLayout>
  );
}

export default ConsentPage; 