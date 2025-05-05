import React, { useState, useEffect } from 'react';
// import { Carousel } from 'antd'; // Ant Design Carousel 제거
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import BlueButton from '../components/BlueButton';
import { Button, message, Typography } from 'antd'; // Typography 추가
// SVG 아이콘을 일반 URL로 임포트
import icnLeftUrl from '/images/icn_left.svg';
import icnRightUrl from '/images/icn_right.svg';

const { Text } = Typography; // Text 사용

// 아이콘이 없다면 CSS로 간단히 구현할 수도 있습니다. 아래 코드에서는 CSS 방식을 사용합니다.

const InstructionPage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [soundTestClicked, setSoundTestClicked] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null); // 피드백 메시지 상태 추가
  const navigate = useNavigate();
  const { groupCode } = useParams();
  const totalSlides = 5; // 이미지 개수 확인 필요

  const instructionImages = [
      '/images/instruction-1.jpg',
      '/images/instruction-2.jpg',
      '/images/instruction-3.jpg',
      '/images/instruction-4.jpg',
      '/images/instruction-5.jpg',
  ];

  // 다음 페이지 이동 함수 (수정: feedbackMessage 상태 사용)
  const handleNext = () => {
    // message.error('handleNext called - This message SHOULD appear!'); // 테스트 메시지 제거
    console.log('[handleNext] Clicked!');
    console.log(`[handleNext] Current states: canProceed=${canProceed}, isLastSlide=${isLastSlide}, soundTestClicked=${soundTestClicked}`);

    if (!canProceed) {
        console.log('[handleNext] Condition !canProceed is TRUE');
        let msg = null;
        if (!soundTestClicked && !isLastSlide) {
            console.log('[handleNext] Reason: Sound test NOT done AND NOT last slide');
            msg = '사운드 테스트를 완료하고, 실험 안내를 끝까지 확인해주세요.';
        } else if (!soundTestClicked) {
            console.log('[handleNext] Reason: Sound test NOT done');
            msg = '사운드 테스트를 완료해주세요.';
        } else if (!isLastSlide) {
            console.log('[handleNext] Reason: NOT last slide');
            msg = '실험 안내를 끝까지 확인해주세요.';
        }
        setFeedbackMessage(msg); // 상태 업데이트로 메시지 표시
        // message.warning(...) 대신 사용
        return; // 네비게이션 방지
    } else {
        setFeedbackMessage(null); // 진행 가능하면 메시지 숨김
    }

    console.log('[handleNext] Condition !canProceed is FALSE, proceeding to navigate...');
    console.log('Navigating to Round 1 Start...');
    navigate(`/${groupCode}/round/1/start`);
  };

  // 커스텀 슬라이드 이동 함수 (수정: feedbackMessage 초기화)
  const handlePrevSlide = () => {
    setFeedbackMessage(null); // 슬라이드 이동 시 메시지 숨김
    setCurrentSlide(prev => Math.max(0, prev - 1));
  };

  const handleNextSlide = () => {
    setFeedbackMessage(null); // 슬라이드 이동 시 메시지 숨김
    setCurrentSlide(prev => Math.min(totalSlides - 1, prev + 1));
  };

  // 사운드 테스트 버튼 클릭 핸들러 (수정: feedbackMessage 초기화)
  const handleSoundTest = () => {
    setFeedbackMessage(null); // 테스트 시 메시지 숨김
    try {
        const audio = new Audio('/audio/system/speaker_test.mp3');
        audio.play()
            .then(() => {
                console.log("Sound test played successfully.");
                // message.success('Sound test successful! This message SHOULD appear.'); // 테스트 메시지 제거
                setSoundTestClicked(true);
            })
            .catch(error => {
                console.error("Error playing sound test:", error);
                // message.error("사운드 재생 중 오류가 발생했습니다. 스피커 또는 브라우저 설정을 확인해 주세요.");
                setFeedbackMessage("사운드 재생 중 오류가 발생했습니다. 스피커 또는 브라우저 설정을 확인해 주세요.");
            });
    } catch (error) {
        console.error("Error creating Audio object:", error);
        setFeedbackMessage("오디오 파일을 로드할 수 없습니다.");
    }
  };

  // 마지막 슬라이드인지 여부 확인
  const isLastSlide = currentSlide === totalSlides - 1;
  // Next 버튼 활성화 조건 변경
  const canProceed = isLastSlide && soundTestClicked;

  return (
    <MainLayout>
      {/* 커스텀 CSS 스타일 */}
      <style>{`
        .instruction-container {
          width: 100%;
          max-width: 685px; /* 전체 컨테이너 너비 */
          margin: auto;
          padding-top: 50px; /* 상단 여백 */
          padding-bottom: 40px; /* 하단 여백 추가 */
        }
        .instruction-title-bar {
          background-color: #000000;
          color: white;
          padding: 16px 24px;
          font-size: 20px;
          font-weight: bold;
          text-align: left;
        }
        /* 섹션 구분 스타일 */
        .instruction-section {
          margin-top: 24px; /* 섹션 간 간격 */
          padding: 0 24px; /* 좌우 패딩 */
        }
        .instruction-section p {
            font-size: 14px;
            line-height: 1.6;
            color: #000000;
            margin-bottom: 8px;
        }
        .sound-test-button-wrapper {
            margin-top: 16px; /* 안내 문구와의 간격 */
            text-align: left; /* 버튼 왼쪽 정렬 */
        }
        .instruction-content-card {
          padding: 0;
          border: none;
          box-shadow: none;
          margin-bottom: 0;
          position: relative;
          min-height: auto;
          /* margin-top 제거 (instruction-section에서 관리) */
        }
        .instruction-image-wrapper {
            position: relative;
            width: 100%;
            padding-top: 63.5%;
            overflow: hidden;
        }
        .instruction-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: block;
          object-fit: contain;
        }
        .slide-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background-color: transparent;
          border: none;
          border-radius: 0;
          width: auto;
          height: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          padding: 0;
          transition: opacity 0.3s;
        }
        .slide-arrow.prev {
          left: 16px;
        }
        .slide-arrow.next {
          right: 16px;
        }
        .slide-arrow:disabled {
          opacity: 0.3;
          cursor: default;
        }
         .slide-arrow img {
            width: 36px;
            height: 37px;
            display: block;
         }
        .navigation-footer {
          display: flex;
          justify-content: flex-end;
          padding: 0 24px; /* 좌우 패딩 추가 */
          margin-top: 32px; /* 캐러셀과의 간격 */
        }
      `}</style>

      <div className="instruction-container">
        {/* 헤더 */}
        <div className="instruction-title-bar">
            실험 안내
        </div>

        {/* 1. 웹 환경 섹션 */} 
        <div className="instruction-section">
            <p>1. 웹 환경에서 실험을 진행해주세요.</p>
        </div>

        {/* 2. 사운드 테스트 섹션 */} 
        <div className="instruction-section">
            <p>2. 기기의 스피커를 켜주세요. 🔊</p>
            <p>(필수) 사운드 테스트 버튼을 눌러, 소리가 정상적으로 들리는지 확인해 주세요.</p>
            <div className="sound-test-button-wrapper">
                 <Button onClick={handleSoundTest} icon={<span role="img" aria-label="play">▶️</span>}>
                     사운드 테스트
                 </Button>
            </div>
        </div>

        {/* 3. 이미지 캐러셀 섹션 */} 
        <div className="instruction-section">
            <p>3. 우측 화살표 버튼을 눌러, 실험 안내 사항을 끝까지 확인해 주세요.</p>
            <div className="instruction-content-card">
              {/* 이전 화살표 */} 
              <button
                className="slide-arrow prev"
                onClick={handlePrevSlide}
                disabled={currentSlide === 0}
                aria-label="Previous Slide"
              >
                <img src={icnLeftUrl} alt="Previous" />
              </button>
              {/* 이미지 래퍼 */} 
               <div className="instruction-image-wrapper">
                    <img
                        src={instructionImages[currentSlide]}
                        alt={`Instruction ${currentSlide + 1}`}
                        className="instruction-image"
                     />
                </div>

              {/* 다음 화살표 */} 
              <button
                className="slide-arrow next"
                onClick={handleNextSlide}
                disabled={isLastSlide}
                aria-label="Next Slide"
              >
                 <img src={icnRightUrl} alt="Next" />
              </button>
            </div>
        </div>

        {/* 하단 Next 버튼 및 피드백 메시지 */} 
        <div className="navigation-footer" style={{ flexDirection: 'column', alignItems: 'flex-end' }}> {/* 정렬 방향 변경 */}
            {/* 피드백 메시지 표시 영역 */} 
            {feedbackMessage && (
                <Text type="danger" style={{ marginBottom: '8px' }}>
                    {feedbackMessage}
                </Text>
            )}
            {/* BlueButton */} 
            <BlueButton
                text="Next"
                onClick={handleNext}
                style={{
                    cursor: !canProceed ? 'not-allowed' : 'pointer',
                    opacity: !canProceed ? 0.5 : 1,
                }}
            />
        </div>
      </div>
    </MainLayout>
  );
};

export default InstructionPage; 