### **Phase 1: 백엔드 기초 구축 (Python, DynamoDB, Lambda)**

1. **DynamoDB 테이블 설계 및 생성 (Done)**: 
    - project_description.ini에 명시된 데이터 요구사항(사용자 정보, 타임스탬프, 라운드/단계별 응답, 설문 결과 등)을 충족하는 DynamoDB 테이블 스키마를 정의하고 생성합니다. 
    (예: 사용자 테이블, 응답 로그 테이블)
2. **Lambda 함수 개발(Done)**:
    - Consent 페이지에서 사용자 정보(이름, 연락처, 이메일)를 받아 DynamoDB에 저장하는 Lambda 함수를 개발합니다.
    - 각 실험 단계(Learning, Recognition, Generation, Survey)의 사용자 응답과 타임스탬프를 DynamoDB에 저장하는 Lambda 함수를 개발합니다.
3. **API Gateway 설정(Done)**: 개발된 Lambda 함수들을 트리거할 수 있도록 API Gateway 엔드포인트를 설정합니다.

### **Phase 2: 프론트엔드 기본 구조 및 페이지 구현 (Python 웹 프레임워크, Ant Design) (Done)**

1. **Python 웹 프레임워크 설정 (Done)**: Flask 또는 FastAPI와 같은 Python 웹 프레임워크를 사용하여 프로젝트를 설정합니다. -> FastAPI
2. **기본 페이지 템플릿 생성 (Done)**: 
    project_description.ini에 명시된 각 페이지(Consent, Instruction, Round 시작 안내 등)에 대한 기본 HTML 템플릿을 생성합니다.
3. **Ant Design 통합 (Done)**: Ant Design Library (v4.23.3)를 프로젝트에 통합하고 기본 레이아웃을 설정합니다.
4. **라우팅 설정 (Done)**: 웹 프레임워크 내에서 각 페이지 URL에 맞는 라우팅 규칙을 설정하여 생성된 템플릿을 렌더링합니다.

### **Phase 3: 핵심 실험 로직 구현 (Round 1)**

1. **Consent 페이지**
    - Notion 페이지 임베딩.
    - 사용자 정보 입력 폼 구현.
    - Submit 시 백엔드 API(Lambda)를 호출하여 정보 저장 및 타임스탬프 기록.
2. **Instruction 페이지**:
    - 제공될 JPG 이미지들을 표시하고 넘길 수 있는 캐러셀 또는 유사 컴포넌트 구현.
3. **Round 1 시작 안내 페이지**: 간단한 안내 문구 및 Start 버튼 구현.
4. **Round 1 - Learning 시작 안내 페이지**: 안내 문구 및 Next 버튼 구현.
5. **Round 1 - Learning 페이지**:
    - CSV에서 단어 목록 로드 (초기에는 임시 데이터 사용 가능).
    - 단어 랜덤 순서 표시 로직 구현.
    - 타이머 (30초, 15초 후 Next 버튼 활성화) 구현.
    - Ant Design Progress 컴포넌트를 사용한 진행률 표시줄 구현.
    - (오디오 재생은 Phase 5에서 통합).
    - 페이지 전환 시 1초 빈 화면 표시 및 타임스탬프 기록 (백엔드 API 호출).
6. **Round 1 - Recognition 시작 안내 페이지**: 안내 문구 및 Next 버튼 구현.
7. **Round 1 - Recognition Test 페이지**:
    - 영어 단어 표시.
    - Ant Design Input 컴포넌트를 사용한 한국어 뜻 입력 필드 구현.
    - 타이머 (30초, Next 버튼 항상 활성화) 구현.
    - Progress 컴포넌트 구현.
    - Next 버튼 클릭 시 응답 결과 및 타임스탬프 저장 (백엔드 API 호출).
8. **Round 1 - Generation 시작 안내 페이지**: 안내 문구 및 Next 버튼 구현.
9. **Round 1 - Generation Test 페이지**:
    - 한국어 뜻 표시.
    - Ant Design Input 컴포넌트를 사용한 영어 단어 입력 필드 구현.
    - 타이머 (30초, Next 버튼 항상 활성화) 구현.
    - Progress 컴포넌트 구현.
    - Next 버튼 클릭 시 응답 결과 및 타임스탬프 저장 (백엔드 API 호출).

### **Phase 4: 라운드 반복 및 설문 조사 구현**

1. **라운드 반복 로직**: Phase 3의 실험 단계(3-1 ~ 3-7)를 총 3번 반복하고, 각 라운드마다 화면에 표시되는 라운드 번호를 업데이트하는 로직을 구현합니다.
2. **설문 조사 시작 안내 페이지**: 안내 문구 및 Next 버튼 구현.
3. **설문 조사 페이지**:
    - 36개 단어 표시.
    - Ant Design Rate 컴포넌트를 사용한 별점(helpfulness) 평가 기능 구현.
    - Progress 컴포넌트 구현.
    - 응답 결과 저장 (백엔드 API 호출).
4. **실험 종료 페이지**: 종료 메시지 표시 및 최종 타임스탬프 기록 (백엔드 API 호출).

### **Phase 5: 통합, 디자인 적용 및 테스트**

1. **오디오 파일 통합**: DB에서 단어 발음 오디오 파일을 불러와 Learning 및 Recognition 단계에서 재생하는 기능을 구현합니다. (Lambda 함수 또는 다른 방식 필요)
2. **Figma 디자인 적용**: MCP 사용 또는 Ant Design 컴포넌트를 커스터마이징하여 Figma 시안에 맞게 UI를 구체화합니다. (project_description.ini의 Figma 링크 참조)
3. **CSV 데이터 연동**: 실제 실험에 사용할 단어 목록 CSV 파일을 프론트엔드에서 로드하도록 구현합니다.
4. **전체 흐름 테스트**: 모든 기능이 정상적으로 작동하는지, 데이터가 정확히 저장되는지 등을 종합적으로 테스트합니다.
5. **배포 준비**: 필요시 AWS Amplify, S3+CloudFront 등을 이용한 배포 환경을 설정합니다.

### 우선순위 제안

- **가장 먼저**: Phase 1 (백엔드 기초)과 Phase 2 (프론트엔드 기본 구조)를 진행하여 기본적인 틀을 잡는 것이 좋습니다. 특히 DynamoDB 설계는 초반에 확정하는 것이 중요합니다.
- **그 다음**: Phase 3 (Round 1 핵심 로직)을 구현하여 실험의 주요 기능을 만듭니다.
- **이후**: Phase 4 (라운드 반복, 설문)와 Phase 5 (통합, 디자인)를 진행합니다.



