import React, { useState, useEffect } from 'react';
// import { Carousel } from 'antd'; // Ant Design Carousel 제거
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import BlueButton from '../components/BlueButton';
// SVG 아이콘을 일반 URL로 임포트
import icnLeftUrl from '/images/icn_left.svg';
import icnRightUrl from '/images/icn_right.svg';

// 아이콘이 없다면 CSS로 간단히 구현할 수도 있습니다. 아래 코드에서는 CSS 방식을 사용합니다.

const InstructionPage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
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

  // 다음 페이지 이동 함수 (이름 변경 없음)
  const handleNext = () => {
    console.log('Navigating to Round 1 Start...');
    navigate(`/${groupCode}/round/1/start`);
  };

  // 커스텀 슬라이드 이동 함수
  const handlePrevSlide = () => {
    setCurrentSlide(prev => Math.max(0, prev - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlide(prev => Math.min(totalSlides - 1, prev + 1));
  };

  // 마지막 슬라이드인지 여부 확인 (canProceed 상태 제거)
  const isLastSlide = currentSlide === totalSlides - 1;

  return (
    <MainLayout>
      {/* 커스텀 CSS 스타일 */}
      <style>{`
        .instruction-container {
          width: 100%;
          max-width: 685px; /* 전체 컨테이너 너비 */
          margin: auto;
          padding-top: 50px; /* 상단 여백 */
        }
        .instruction-title-bar {
          background-color: #000000;
          color: white;
          padding: 16px 24px;
          font-size: 20px;
          font-weight: bold;
          text-align: left;
          /* borderRadius 제거됨 */
        }
        .instruction-content-card {
          padding: 0;
          border: none;
          box-shadow: none;
          margin-bottom: 0;
          position: relative;
          min-height: auto;
          margin-top: 24px; /* 헤더와의 간격 */
        }
        .instruction-image-wrapper {
            position: relative;
            width: 100%;
            padding-top: 63.5%; /* Aspect Ratio: (Image Height / Image Width) * 100% */
                                /* 예: (435px / 685px) * 100% */
            overflow: hidden;
            /* background-color: #eee; */ /* 임시 배경색 제거 */
        }
        .instruction-image {
          position: absolute; /* 래퍼 기준 위치 */
          top: 0;
          left: 0;
          width: 100%;
          height: 100%; /* 래퍼 높이 채우기 */
          display: block;
          object-fit: contain; /* 비율 유지 */
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
          padding: 0;
          margin-top: 16px;
        }
      `}</style>

      <div className="instruction-container">
        {/* 헤더 */}
        <div className="instruction-title-bar">
            실험 안내
        </div>

        {/* 이미지 및 화살표 영역 */}
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

        {/* 하단 Next 버튼 */}
        <div className="navigation-footer">
            <BlueButton
                text="Next"
                onClick={handleNext}
                disabled={!isLastSlide}
            />
        </div>
      </div>
    </MainLayout>
  );
};

export default InstructionPage; 