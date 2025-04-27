import React, { useState, useRef, useEffect } from 'react';
import { Layout, Carousel } from 'antd';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import BlueButton from '../components/BlueButton';

const InstructionPage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [canProceed, setCanProceed] = useState(false);
  const carouselRef = useRef();
  const navigate = useNavigate();
  const totalSlides = 5;

  // 이미지 경로는 Vite의 public 폴더를 기준으로 합니다.
  const instructionImages = [
      '/images/instruction-1.jpg', // /public/images/ 폴더에 이미지가 있다고 가정
      '/images/instruction-2.jpg',
      '/images/instruction-3.jpg',
      '/images/instruction-4.jpg',
      '/images/instruction-5.jpg',
  ];

  const handleAfterChange = (current) => {
    console.log('Current slide:', current);
    setCurrentSlide(current);
    setCanProceed(current === totalSlides - 1);
  };

  const handleNext = () => {
    console.log('Navigating to Round 1 Start...');
    navigate('/round/1/start'); // Use navigate hook
  };

  return (
    <MainLayout>
      <style>{`
        /* 기존 화살표 아이콘 숨기기 */
        .instruction-carousel .slick-prev::before,
        .instruction-carousel .slick-next::before {
          content: '' !important;
          display: none;
        }

        /* 화살표 버튼 자체 스타일링 */
        .instruction-carousel .slick-prev,
        .instruction-carousel .slick-next {
          background-color: rgba(0, 0, 0, 0.3) !important; /* 배경 투명도 조절 */
          width: 30px !important;
          height: 30px !important;
          border-radius: 50%;
          z-index: 1;
          display: flex !important;
          align-items: center;
          justify-content: center;
        }

        /* CSS로 화살표 모양 추가 */
        .instruction-carousel .slick-prev::after,
        .instruction-carousel .slick-next::after {
          content: '';
          display: block;
          border-style: solid;
          border-color: white !important;
          border-width: 0 3px 3px 0 !important; /* 화살표 두께 증가 */
          padding: 5px !important;
        }

        .instruction-carousel .slick-prev::after {
          transform: rotate(135deg);
          margin-left: 5px;
        }

        .instruction-carousel .slick-next::after {
          transform: rotate(-45deg);
          margin-right: 5px;
        }

        /* 점 인디케이터 스타일 */
        .instruction-carousel .slick-dots li {
          margin: 0 5px !important; /* 점 간격 추가 */
        }
        .instruction-carousel .slick-dots li button {
          background: #999999 !important;
          width: 8px !important;
          height: 8px !important;
          border-radius: 50%;
        }

        .instruction-carousel .slick-dots li.slick-active button {
          background: #1890ff !important;
          width: 10px !important;
          height: 10px !important;
        }

        /* 화살표 위치 조정 */
        .instruction-carousel .slick-prev {
          left: -35px !important; /* 위치 조정 활성화 */
        }
        .instruction-carousel .slick-next {
          right: -35px !important; /* 위치 조정 활성화 */
        }
      `}</style>
      <div className="instruction-title-bar" style={{ 
          backgroundColor: '#394A7F', 
          color: 'white', 
          padding: '16px 24px', 
          fontSize: '24px', 
          fontWeight: 'bold', 
          textAlign: 'center', 
          borderRadius: '8px 8px 0 0' 
      }}>
          실험 안내
      </div>
      <div className="instruction-content-card" style={{
          background: '#fff',
          padding: '40px',
          border: '1px solid #f0f0f0',
          borderRadius: '0 0 8px 8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)',
          marginBottom: '24px',
          minHeight: '400px'
      }}>
          <Carousel
            ref={carouselRef}
            afterChange={handleAfterChange}
            dots={true}
            arrows={true}
            infinite={false}
            className="instruction-carousel"
            style={{ width: '100%', maxWidth: '700px', height: '440px', margin: '0 auto' }}
          >
            {instructionImages.map((imgSrc, index) => (
              <div 
                key={index} 
                style={{
                  textAlign: 'center', 
                  background: '#fff',
                  height: '440px',      // Set height explicitly
                  display: 'flex',       // Use flex to center content
                  alignItems: 'center',  // Center vertically
                  justifyContent: 'center' // Center horizontally
                }}
              > 
                <img 
                  src={imgSrc} 
                  alt={`Instruction ${index + 1}`} 
                  style={{ 
                    maxWidth: '100%', 
                    height: 'auto',      // Let height adjust automatically
                    maxHeight: '100%',   // Ensure it doesn't exceed the container height
                    margin: 'auto', 
                    display: 'block', 
                    objectFit: 'contain' 
                  }} 
                />
              </div>
            ))}
          </Carousel>
      </div>
      <div className="navigation-footer" style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 0' }}>
          <BlueButton
              text="Next"
              onClick={handleNext}
              disabled={!canProceed}
          />
      </div>
    </MainLayout>
  );
};

export default InstructionPage; 