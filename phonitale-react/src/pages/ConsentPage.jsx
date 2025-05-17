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
    return;
  };

  const onFinishFailed = (errorInfo) => {
    return;
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
                    <BlueButton text="Submit" htmlType="submit" disabled={false} loading={isLoading} style={{cursor:'not-allowed', backgroundColor:'#f5f5f5', borderColor:'#d9d9d9', color:'rgba(0,0,0,0.25)'}} />
                  </Form.Item>
                </Form>
             </div>

            {error && <Alert message="오류" description={error} type="error" showIcon style={{ marginTop: '0', margin: '0 24px 16px 24px', padding: '8px 15px' }}/>}
        </div>
    </MainLayout>
  );
}

export default ConsentPage; 