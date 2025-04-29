import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import { submitTotalDuration } from '../utils/api';

const EndPage = () => {
    const navigate = useNavigate();
    const [error, setError] = useState(null);

    useEffect(() => {
        const submitDuration = async () => {
            const userEmail = sessionStorage.getItem('userEmail');
            const userName = sessionStorage.getItem('userName');
            const consentTimestamp = sessionStorage.getItem('consentTimestamp');
            const endTimestamp = new Date().toISOString();

            if (!userEmail || !userName) {
                console.error("User Email or User Name not found in sessionStorage.");
                setError("필수 세션 정보를 가져올 수 없어 실험 결과를 최종 저장하지 못했습니다.");
                return;
            }
            if (!consentTimestamp) {
                 console.warn("Consent timestamp not found in sessionStorage, cannot log start time.");
            }

            try {
                console.log(`Experiment End. Email: ${userEmail}, Name: ${userName}, End Timestamp: ${endTimestamp}`);
                const summaryData = {
                    email: userEmail,
                    name: userName,
                    page_type: 'final_summary',
                    test_end_timestamp: endTimestamp
                };
                await submitTotalDuration(summaryData);
                console.log("Final summary submission request sent successfully.");
            } catch (apiError) {
                console.error("Failed to submit final summary:", apiError);
                setError(`최종 실험 요약 저장 실패: ${apiError.message}`);
            }
        };

        submitDuration();

        const preventGoBack = () => {
            history.pushState(null, "", location.href);
        };
        history.pushState(null, "", location.href);
        window.addEventListener("popstate", preventGoBack);
        return () => window.removeEventListener("popstate", preventGoBack);

    }, []);

    const messages = [
        '실험에 참여해 주셔서 감사합니다.',
        '리워드는 실험 종료 후 2~3주 이내에 작성하신 휴대폰 번호로 문자 발송될 예정입니다.'
    ];

    return (
        <MainLayout>
          <style>{`
            .end-page-container {
              width: 100%;
              max-width: 685px;
              margin: auto;
              padding: 50px 0 40px;
            }
            .end-page-header {
              background-color: #000000;
              color: white;
              padding: 16px 24px;
              font-size: 20px;
              font-weight: bold;
              text-align: left;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .end-page-content-wrapper {
              padding: 24px 24px 0;
            }
            .end-page-content p {
              font-size: 14px;
              line-height: 1.6;
              color: #000000;
              margin-bottom: 8px;
            }
             .error-message {
                color: red;
                margin-top: 16px;
                font-size: 14px;
                text-align: center;
             }
          `}</style>

          <div className="end-page-container">
            <div className="end-page-header">
              🎉 실험 종료
            </div>

            <div className="end-page-content-wrapper">
              <div className="end-page-content">
                {messages.map((line, index) => <p key={index}>{`• ${line}`}</p>)}
              </div>
               {error && <p className="error-message">오류가 발생했습니다: {error}</p>}
            </div>
          </div>
        </MainLayout>
    );
};

export default EndPage; 