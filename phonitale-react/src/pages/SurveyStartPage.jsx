import React, { useEffect } from 'react';
// import { Typography } from 'antd'; // 사용하지 않음 -> Table, Typography, Divider 추가
import { Table, Typography, Divider } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import BlueButton from '../components/BlueButton';

// const { Text } = Typography; // 제거

// --- SurveyPage에서 가져온 Helper Functions, Data, Columns ---

// formatVerbalCue 함수 수정 (색상 변경)
function formatVerbalCue(text, isTextFlashing = false) {
    // isTextFlashing은 이 페이지에서 항상 false이지만, 로직은 유지
    if (!text) return text;
    const parts = [];
    let lastIndex = 0;
    const regex = /(\/([^\/]+?)\/)|(\{([^\}]+?)\})/g;
    let match;
    try {
        while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parts.push(text.substring(lastIndex, match.index));
            }
            const isItalic = match[2] !== undefined;
            const isBold = match[4] !== undefined;
            const content = isItalic ? match[2] : match[4];
            if (content && content.trim()) {
                // isTextFlashing이 false일 때 모든 특수 서식 텍스트 색상을 #000000으로 변경
                const textColor = isTextFlashing ? '#FFFFFF' : '#000000';
                const style = { color: textColor, fontWeight: 'bold' };
                parts.push(<strong key={`part-${match.index}`} style={style}>{content}</strong>);
            }
            lastIndex = regex.lastIndex;
        }
        if (lastIndex < text.length) {
            parts.push(text.substring(lastIndex));
        }
        return React.createElement(React.Fragment, null, ...parts.map((part, index) =>
            React.isValidElement(part) ? part : <React.Fragment key={`text-${index}`}>{part}</React.Fragment>
        ));
    } catch (error) {
        console.error("Error formatting verbal cue:", error, "Text:", text);
        return text;
    }
}

// formatRubricText 함수는 색상 변경 불필요
function formatRubricText(text) {
    if (!text) return text;
    const parts = text.split(/({.*?})/g);
    return parts.map((part, index) => {
        if (part.startsWith('{') && part.endsWith('}')) {
            const content = part.slice(1, -1);
            return <strong key={index}><em>{content}</em></strong>;
        }
        return part;
    });
}

// Rubric 컬럼 정의 수정 (색상 변경)
const rubricColumns = [
    {
        title: <span style={{ color: '#000000' }}>점수</span>, // 색상 변경
        dataIndex: 'score', key: 'score', width: '60px', align: 'center',
        render: (text) => <Typography.Text style={{ color: '#000000', fontWeight: 'bold' }}>{text}</Typography.Text>, // 색상 변경
        onHeaderCell: () => ({ style: { backgroundColor: '#f5f5f5' } })
    },
    {
        title: <span style={{ color: '#000000' }}>설명</span>, // 색상 변경
        dataIndex: 'description', key: 'description', width: '240px',
        render: (text) => (<Typography.Text style={{ color: '#000000', whiteSpace: 'pre-line' }}>{formatRubricText(text)}</Typography.Text>), // 색상 변경
        onHeaderCell: () => ({ style: { backgroundColor: '#f5f5f5' } })
    },
    {
        title: <span style={{ color: '#000000' }}>예시</span>, // 색상 변경
        dataIndex: 'example', key: 'example', width: '320px',
        render: (text) => (<Typography.Text style={{ color: '#000000', whiteSpace: 'pre-line' }}>{formatVerbalCue(text, false)}</Typography.Text>), // 색상 변경
        onHeaderCell: () => ({ style: { backgroundColor: '#f5f5f5' } })
    }
];
const helpfulnessData = [
    { key: 'h5', score: '5점', description: `구조적으로 잘 연관되어 있고, 반복 학습 없이도 단어의 의미를 쉽게 떠올릴 수 있음` },
    { key: 'h3', score: '3점', description: `단서와 의미 사이에 약한 연결 고리가 있으나, 기억에 오래 남기엔 부족함` },
    { key: 'h1', score: '1점', description: `단어의 뜻과 단서 사이에 직접적 연결이 거의 없어 기억하거나 학습하는 데 실질적인 도움이 되지 않음` },
];
const imageabilityData = [
    { key: 'i5', score: '5점', description: `익숙한 이미지로 쉽게 시각화되며 장면이 구체적으로 떠오름`, example: `- 키워드: {스니커즈}\n        - 연상 문장: 새벽에 {스니커즈}를 신고 {몰래} 나가다가 들키다.` },
    { key: 'i3', score: '3점', description: `단어와 관련된 이미지가 조금 있으나 모호하거나 약함`, example: `- 키워드: {스님}\n        - 연상 문장: {스님} {몰래} 절을 나갔다.` },
    { key: 'i1', score: '1점', description: `장면이나 상황이 전혀 그려지지 않음`, example: `- 키워드: {스노우볼}\n        - 연상 문장: 나는 {스노우볼}을 보며 겨울을 {떠올렸다}.` }
];
const coherenceData = [
    { key: 'c5', score: '5점', description: `논리, 어휘, 의미 흐름이 매끄럽고 자연스럽게 구성됨`, example: `- 키워드: {토플}\n        - 연상 문장: 나는 너무 긴장한 나머지 {토플} 시험장에서 {몰래} 넘어졌다.` },
    { key: 'c3', score: '3점', description: `비교적 자연스럽지만, 문법이나 논리 흐름에서 약간 부자연스러움`, example: `- 키워드: {탑}, {풀}\n        - 연상 문장: {풀}을 바르지 않아 {탑}이 {넘어졌다.}` },
    { key: 'c1', score: '1점', description: `문장이 어색하고 단어 해석과 연결성이 부족함`, example: `- 키워드: {돛}, {풀}\n        - 연상 문장: {돛}이 {풀}을 {쓰러트렸다}.` }
];

// 테이블별 컬럼 배열 생성 로직은 컴포넌트 내부로 이동
/*
const helpfulnessColumns = rubricColumns
    .filter(col => col.key !== 'example')
    // ... (rest of the definition removed from here)
const imageabilityColumns = rubricColumns.map(col => {
    // ... (definition removed from here)
});
const coherenceColumns = rubricColumns.map(col => {
    // ... (definition removed from here)
});
*/

// --- SurveyStartPage Component ---

const SurveyStartPage = () => {
  const navigate = useNavigate();
  const { groupCode } = useParams();

  // 테이블별 컬럼 배열 생성을 컴포넌트 내부로 이동
  const helpfulnessColumns = rubricColumns
    .filter(col => col.key !== 'example')
    .map(col => {
        if (col.key === 'score') { return { ...col, width: '60px' }; }
        return col;
    });
  const imageabilityColumns = rubricColumns.map(col => {
    if (col.key === 'score') { return { ...col, width: '60px' }; }
    if (col.key === 'example') { return { ...col, title: <span style={{ color: '#000000' }}>예시 (sneak: 몰래 움직이다. 몰래하다)</span> }; }
    return col;
  });
  const coherenceColumns = rubricColumns.map(col => {
    if (col.key === 'score') { return { ...col, width: '60px' }; }
    if (col.key === 'example') { return { ...col, title: <span style={{ color: '#000000' }}>예시 (topple: 쓰러트리다, 넘어지다)</span> }; }
    return col;
  });

  const handleStartClick = () => {
    navigate(`/${groupCode}/survey`);
  };

  // --- 새로고침 방지 ---
  useEffect(() => {
      const handleBeforeUnload = (event) => {
          event.preventDefault();
          event.returnValue = '';
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => {
          window.removeEventListener('beforeunload', handleBeforeUnload);
      };
  }, []);

  // 안내 문구 배열 수정 (1~5점 척도 관련 내용 제거)
  const instructions = [
    '모든 학습과 테스트가 완료되었습니다.',
    '학습 중 제공된 키워드와 연상 문장이 얼마나 도움이 되었는지 평가해 주세요.',
    '아래 평가 기준을 참고하여 설문을 진행해주세요.', // 문구 변경
  ];

  return (
    <MainLayout>
       {/* 다른 StartPage들과 유사한 스타일 사용 */}
      <style>{`
        .survey-start-container { /* 클래스 이름 변경 */
          width: 100%;
          max-width: 685px;
          margin: auto;
          padding: 50px 0 40px;
        }
        .survey-start-header { /* 클래스 이름 변경 */
          background-color: #000000;
          color: white;
          padding: 16px 24px;
          font-size: 20px;
          font-weight: bold;
          text-align: left;
        }
        .survey-instructions-wrapper { /* 클래스 이름 변경 */
          padding: 24px 24px 0;
        }
        .survey-instructions p { /* 클래스 이름 변경 */
          font-size: 14px;
          line-height: 1.6;
          color: #000000;
          margin-bottom: 8px;
          white-space: pre-wrap; /* 들여쓰기 공백 유지 */
        }
        .start-button-wrapper { /* 공통 클래스 사용 */
          display: flex;
          justify-content: flex-end;
          margin-top: 40px; /* 루브릭 섹션과의 간격 */
          padding: 0 24px;
        }
        /* 루브릭 섹션 스타일 (SurveyPage와 동일하게 유지) */
        .rubric-section {
          width: 100%;
          max-width: 685px;
          padding-bottom: 40px; /* 하단 여백 */
          margin-top: 32px; /* 안내 문구와의 간격 */
        }
      `}</style>

      <div className="survey-start-container">
        {/* 헤더 */}
        <div className="survey-start-header">
          🗳️ 설문을 진행해주세요. (필수) {/* 타이틀 유지 */}
        </div>

        {/* 안내 문구 (수정됨) */}
        <div className="survey-instructions-wrapper">
          <div className="survey-instructions">
            {instructions.map((line, index) => (
              <p key={index}>{`• ${line}`}</p>
            ))}
          </div>
        </div>

        {/* === 상세 평가 기준 (Rubric) Section === */}
        <div
            className="rubric-section"
        >
            {/* Divider 추가 */}
            <Divider
                dashed
                style={{
                    width: '100%',
                    maxWidth: '685px',
                    margin: '24px 0', // 상하 여백 조정 (기존 안내문구 하단 패딩 없음 + 루브릭 상단 마진 고려)
                    borderColor: '#b0b0b0',
                    borderWidth: '1px 0 0 0',
                    borderStyle: 'dashed'
                }}
            />

            <Typography.Title level={5} style={{ color: '#000000', marginBottom: '8px' }}> {/* 색상 변경 */}
                &lt;평가 기준&gt;
            </Typography.Title>
            <Typography.Paragraph style={{ color: '#000000', marginBottom: '24px' }}> {/* 색상 변경 */}
                아래는 5점 척도에서 일관적인 점수를 부여할 수 있도록 돕기 위한 예시 문장입니다.
                <br />
                각각의 평가 항목에 대해 1점, 3점, 5점의 사례를 참고하여 점수를 선택하세요.
            </Typography.Paragraph>

            {/* 1. Helpfulness Rubric */}
            <div style={{ marginBottom: '32px' }}>
                <Typography.Title level={5} style={{ color: '#000000', marginBottom: '16px' }}> {/* 색상 변경 */}
                    1. 유익함 (Helpfulness)
                </Typography.Title>
                <Table
                    columns={helpfulnessColumns}
                    dataSource={helpfulnessData}
                    pagination={false}
                    bordered
                    size="small"
                    rowKey="key"
                />
            </div>

            {/* 2. Imageability Rubric */}
            <div style={{ marginBottom: '32px' }}>
                <Typography.Title level={5} style={{ color: '#000000', marginBottom: '16px' }}> {/* 색상 변경 */}
                    2. 이미지화 가능성 (Imageability)
                </Typography.Title>
                <Table
                    columns={imageabilityColumns}
                    dataSource={imageabilityData}
                    pagination={false}
                    bordered
                    size="small"
                    rowKey="key"
                />
            </div>

            {/* 3. Coherence Rubric */}
            <div style={{ marginBottom: '32px' }}>
                <Typography.Title level={5} style={{ color: '#000000', marginBottom: '16px' }}> {/* 색상 변경 */}
                    3. 논리적 연결성 (Coherence)
                </Typography.Title>
                <Table
                    columns={coherenceColumns}
                    dataSource={coherenceData}
                    pagination={false}
                    bordered
                    size="small"
                    rowKey="key"
                />
            </div>
        </div>
        {/* === 상세 평가 기준 (Rubric) Section 끝 === */}


        {/* 시작 버튼 */}
        <div className="start-button-wrapper">
          <BlueButton
            text="Start"
            onClick={handleStartClick}
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default SurveyStartPage; 