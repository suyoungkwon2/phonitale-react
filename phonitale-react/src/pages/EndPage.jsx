import React, { useEffect } from 'react';
import { Result, Spin, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import BlueButton from '../components/BlueButton';
import { submitTotalDuration } from '../utils/api';
import { useState } from 'react';

const EndPage = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const submitDuration = async () => {
            // sessionStorage에서 필요한 정보 가져오기
            const userEmail = sessionStorage.getItem('userEmail'); 
            const userName = sessionStorage.getItem('userName'); 
            // userId는 이제 직접 사용하지 않음
            // const userId = sessionStorage.getItem('userId');
            const consentTimestamp = sessionStorage.getItem('consentTimestamp'); // 시작 시간 기록용 (선택적 로깅)
            const endTimestamp = new Date().toISOString(); // 종료 시간 (test_end_timestamp로 전달)

            // email 또는 name이 없으면 진행 불가
            if (!userEmail || !userName) { 
                console.error("User Email or User Name not found in sessionStorage.");
                setError("Could not retrieve session information (Email or Name) to finalize the experiment.");
                setIsLoading(false);
                return;
            }
            if (!consentTimestamp) {
                 console.warn("Consent timestamp not found in sessionStorage, cannot log start time.");
                 // 오류로 처리하지 않고 진행은 가능
            }

            try {
                // total_duration 계산 로직 제거 (백엔드에서 계산)
                // const durationInSeconds = Math.round((new Date(endTimestamp) - new Date(consentTimestamp)) / 1000);
                console.log(`Experiment End. Email: ${userEmail}, Name: ${userName}, End Timestamp: ${endTimestamp}`);
                
                // submitTotalDuration에 전달할 데이터 구조 변경
                const summaryData = {
                    email: userEmail,        // email 전달
                    name: userName,          // name 전달
                    page_type: 'final_summary',
                    test_end_timestamp: endTimestamp // 종료 시각 전달
                };

                await submitTotalDuration(summaryData); // 변경된 함수 호출
                console.log("Final summary submission request sent successfully.");
                // 세션 스토리지 클리어 (선택 사항)
                // sessionStorage.clear(); 

            } catch (apiError) {
                console.error("Failed to submit final summary:", apiError);
                setError(`Failed to save the final experiment summary: ${apiError.message}`);
                // message.error(...) 를 사용하여 사용자에게 알릴 수도 있음
            } finally {
                setIsLoading(false);
            }
        };

        submitDuration();

        // 브라우저 뒤로가기 방지
        const preventGoBack = () => {
            history.pushState(null, "", location.href);
        };
        history.pushState(null, "", location.href);
        window.addEventListener("popstate", preventGoBack);
        return () => window.removeEventListener("popstate", preventGoBack);

    }, []);

    const handleExit = () => {
        // 필요한 경우 추가 종료 로직
        console.log("Exiting experiment application.");
        // window.close(); // 탭 닫기 (브라우저 설정에 따라 작동 안 할 수 있음)
        navigate('/'); // 또는 초기 페이지로 이동
    };

    return (
        <MainLayout>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: 'calc(100vh - 120px)' // 헤더/푸터 높이 제외
            }}>
                {isLoading ? (
                    <Spin size="large" tip="Finalizing results..." />
                ) : error ? (
                     <Result
                        status="error"
                        title="Submission Failed"
                        subTitle={`An error occurred: ${error}`}
                        extra={[
                            <BlueButton key="exit" text="Exit" onClick={handleExit} />,
                        ]}
                    />
                ) : (
                    <Result
                        status="success"
                        title="Experiment Complete!"
                        subTitle="Thank you for your participation. Your responses have been recorded."
                        extra={[
                            <BlueButton key="exit" text="Exit" onClick={handleExit} />,
                        ]}
                    />
                )}
            </div>
        </MainLayout>
    );
};

export default EndPage; 