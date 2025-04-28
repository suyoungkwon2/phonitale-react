# 현재 시스템 분석
1. 프로젝트 목적: 연구 평가를 위한 웹사이트로, 실험 참가자의 응답을 수집합니다. 원래 크롬 익스텐션을 목표로 했으나, 현재는 웹 애플리케이션 형태로 구현되어 있습니다.
2. 프론트엔드:
    - FastAPI와 Jinja2 템플릿을 사용하여 HTML 위주로 개발되었습니다.
    - Ant Design (v4.23.3) UI 라이브러리를 CDN을 통해 로드하여 사용합니다.
    - React 코드는 HTML 템플릿 내의 <script type="text/babel"> 태그 안에 작성되어 있으며, CDN으로 로드된 React, ReactDOM, Babel을 통해 브라우저에서 직접 변환됩니다. 공통 컴포넌트는 common_components.js  파일에 정의되어 있습니다.
    - FastAPI가 페이지 라우팅을 담당합니다.
    - 실험 단어 데이터는 CSV 파일 (/static/words/words_data_test.csv)에서 로드합니다.
    - 실험 흐름은 동의(Consent) → 안내(Instruction) → 학습(Learning)/인지(Recognition)/생성(Generation) (3 라운드 반복) → 설문(Survey) → 종료(End) 순서로 진행됩니다.
3. 백엔드:
    - Python과 FastAPI 프레임워크를 사용합니다.
    - AWS Lambda (lambda_function.py )와 API Gateway를 통해 데이터 처리를 수행합니다.
    - 사용자 응답 데이터는 AWS DynamoDB (phonitale-user-responses 테이블 )에 저장됩니다. Lambda 함수가 DynamoDB 업데이트 로직을 담당합니다.


# React 기반 크롬 익스텐션으로 전환 가이드
- 현재 시스템은 서버(FastAPI)가 HTML을 렌더링하는 방식이지만, React 기반 크롬 익스텐션은 클라이언트 측에서 UI를 렌더링하고 상태를 관리해야 합니다. 전환을 위한 단계는 다음과 같습니다.

1. React 프로젝트 설정:
    - Create React App 이나 Vite 같은 도구를 사용하여 새로운 React 프로젝트를 생성합니다. 이를 통해 표준 React 개발 환경(JSX 변환, 모듈 번들링 등)을 설정합니다.
2. 컴포넌트 마이그레이션:
    - 기존 HTML 템플릿  내 <script type="text/babel"> 태그 안의 React 코드와 common_components.js  파일의 컴포넌트들을 새 React 프로젝트 내의 개별 .jsx 또는 .js 파일로 분리하여 옮깁니다.
    - 페이지별 컴포넌트(Consent, Learning 등)와 공통 컴포넌트(Header, Sidebar, Button 등)로 구조화합니다.
3. 클라이언트 사이드 라우팅 구현:
    - React Router 라이브러리를 설치하고 설정하여, FastAPI 라우팅  대신 React 애플리케이션 내에서 페이지 이동을 처리하도록 구현합니다. 각 실험 단계(Consent, Instruction, Round 1, ...)에 대한 경로(Route)를 정의합니다.
4. 상태 관리 재설계:
    - Jinja2 템플릿 변수나 간단한 인라인 스크립트로 처리되던 상태(현재 라운드 번호, 단어 인덱스, 사용자 응답, 타이머 등)를 React의 상태 관리 방식(예: useState, useContext, useReducer 또는 Redux/Zustand 같은 라이브러리)으로 변경하여 관리합니다.
5. API 연동 방식 변경:
    - 기존 HTML에서 직접 호출되던 백엔드 API(예: Consent 데이터 전송 /api/consent, 라운드/설문 데이터 저장 로직)를 React 컴포넌트 내에서 Workspace나 axios를 사용하여 비동기적으로 호출하도록 수정합니다. AWS API Gateway 엔드포인트 를 직접 호출해야 합니다.
6. 크롬 익스텐션 구조 설정 (manifest.json):
    - 크롬 익스텐션의 핵심 설정 파일인 manifest.json 파일을 생성합니다.
    - 필수 정보: manifest_version (3 사용 권장), name, version을 정의합니다.
    - 권한 (permissions): 백엔드 API 엔드포인트에 접근하기 위한 권한 (host_permissions 사용), 사용자 상태 등을 저장하기 위한 storage 권한 등을 명시합니다.
    - 실행 방식 결정:
        - 팝업 (Action API): 익스텐션 아이콘 클릭 시 작은 팝업 창에서 실험이 진행되도록 설정합니다. action 속성에서 default_popup에 React 앱의 빌드 결과물인 index.html을 지정합니다.
        - 새 탭 페이지: 익스텐션이 새 탭에서 React 앱을 열도록 설정할 수 있습니다. 이는 chrome.tabs.create API를 사용하여 구현할 수 있습니다.
        - 이 프로젝트의 경우, 실험이 여러 단계로 구성되므로 팝업보다는 새 탭 페이지에서 전체 화면으로 진행하는 것이 사용자 경험에 더 적합할 수 있습니다.
7. 빌드 및 로드:
    - React 프로젝트를 빌드합니다 (npm run build 또는 yarn build).
    - manifest.json 파일이 빌드된 React 앱 파일을 올바르게 참조하도록 경로를 설정합니다.
    - Chrome 브라우저에서 '확장 프로그램 관리'(chrome://extensions/) 페이지를 열고, '압축해제된 확장 프로그램을 로드합니다' 버튼을 클릭하여 빌드된 프로젝트 폴더를 선택해 로드합니다.
8. 테스트 및 디버깅:
    - 크롬 익스텐션 환경에서 모든 기능(라우팅, 상태 관리, API 호출, UI 렌더링)이 정상적으로 작동하는지 철저히 테스트합니다.
    - 크롬 익스텐션의 개발자 도구(팝업이나 백그라운드 스크립트 검사)를 사용하여 오류를 디버깅합니다.
    - sessionStorage  대신 chrome.storage API를 사용하여 익스텐션 환경에 맞게 데이터를 저장하는 방식을 고려합니다.


# 요청 프롬프트
- 안녕하세요, Cursor AI. 'Phonitale Experiment' 프로젝트 리팩토링을 도와주세요.

1. 현재 상태:
    - Python/FastAPI 백엔드가 Jinja2 HTML 템플릿을 서빙하는 웹 애플리케이션입니다.
    - HTML 템플릿 내에 <script type='text/babel'> 태그와 frontend/static/js/common_components.js 파일을 통해 React 컴포넌트가 포함되어 있으며, CDN으로 로드된 React, ReactDOM, Babel을 사용해 브라우저에서 변환됩니다.
    - Ant Design (v4.23.3) 라이브러리를 CDN으로 로드하여 사용합니다.
    - 백엔드는 AWS Lambda 및 DynamoDB를 사용하며, API Gateway (https://2ml24s4a3jfj5hqx4y644cgzbq0jbzmt.lambda-url.us-east-2.on.aws/)를 통해 통신합니다.
    - (첨부된 프로젝트 전체 코드를 참조해주세요.)

2. 목표:
    - 이 프로젝트를 최신 React 기반의 크롬 익스텐션으로 전환하고 싶습니다.

3. 예정 요청 사항:
    - 아래 요청 사항을 순차적으로 진행 할 것입니다. 미리보기를 제공합니다. 
    - 현재 프로젝트 코드 전체(frontend, backend, docs, infrastructure 폴더)를 분석하여 이 리팩토링 과정에 필요한 초기 단계와 코드 수정을 제안해주세요.
    - 마이그레이션 과정에서 기존에 작동 중인 것을 보존하며, 안전하게 마이그레이션을 시도해주세요.
    - 깃헙은 "@https://github.com/suyoungkwon2/phonitale-react "로 진행해주세요

    (1) React 프로젝트 설정 (완료): Vite (선호) 또는 Create React App을 사용하여 새로운 React 프로젝트 구조를 설정해주세요. 
    (2) 컴포넌트 마이그레이션 (완료): 기존 frontend/static/js/common_components.js와 frontend/templates/ 내 HTML 파일들에 포함된 React 컴포넌트들을 새로운 프로젝트 구조의 개별 .jsx 파일로 마이그레이션하는 것을 도와주세요.
    (3) 클라이언트 라우팅 설정 (완료): React Router를 사용하여 FastAPI 라우팅을 대체하고, 모든 실험 단계(Consent, Instruction, Round 1-3 Learning/Recognition/Generation, Survey, End)에 대한 클라이언트 사이드 라우팅을 설정해주세요.
    (4) 상태 관리 재설계 (완료): 현재 분산된 상태 관리 방식을 표준 React 상태 관리(예: useState, useContext)로 전환하는 방법을 안내해주세요.
    (5) API 호출 리팩토링 (진행중): 기존 API 호출 로직(예: consent.html의 /api/consent 호출)을 React 컴포넌트 내에서 fetch 또는 axios를 사용하여 AWS API Gateway 엔드포인트(https://2ml24s4a3jfj5hqx4y644cgzbq0jbzmt.lambda-url.us-east-2.on.aws/)를 직접 호출하도록 수정하는 방법을 보여주세요.
    핵심 로직 구현 및 상태 관리 구체화:
        - API 호출과 연동하여 각 페이지의 세부 기능(타이머, 프로그레스 바, 오디오 재생, 사용자 입력 처리 등)을 구현합니다.
        - 필요에 따라 useState와 useExperiment 훅을 사용하여 지역 및 전역 상태를 관리합니다.
    (6) Vercel 배포 설정 (완료)):
        - 어느 정도 기능 구현이 진행된 후, 개발 중인 React 앱을 쉽게 확인하고 테스트하기 위해 Vercel 배포를 설정할 수 있습니다. GitHub 저장소 연결만으로 간단하게 설정 가능합니다.
    (7) Figma 디자인 맞추기:
        기능 구현이 안정화된 후, Figma 디자인을 보면서 CSS 스타일, Ant Design 컴포넌트 사용 등을 조정하여 UI를 개선합니다.


