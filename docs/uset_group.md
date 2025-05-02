# 사용자 그룹 식별 및 데이터 분기

## 목적

실험 참가자를 여러 그룹(kss, naive, phonitale, og)으로 나누어, 각 그룹별로 다른 학습 자료(키워드, 연상 단서)를 제공하고, 참가자의 그룹 정보를 응답 데이터와 함께 기록하기 위함입니다.

## 구현 방식: URL 경로 코드를 이용한 그룹 식별

참가자 그룹 정보가 URL에 직접 노출되는 것을 방지하고, 사용자 입력 오류를 최소화하기 위해 각 그룹별로 고유한 코드를 부여하여 URL 경로에 사용합니다.

### 그룹 코드 매핑

| 실제 그룹명 | URL 경로 코드 | 관련 파일 | 위치 |
| :---------- | :------------ | :-------- | :--- |
| kss         | `tksdk`       | `App.jsx` | `GROUP_CODE_MAP` |
| naive       | `wodnr`       | `App.jsx` | `GROUP_CODE_MAP` |
| phonitale   | `audtjr`      | `App.jsx` | `GROUP_CODE_MAP` |
| og          | `tndud`       | `App.jsx` | `GROUP_CODE_MAP` |

**예시 URL:**

*   KSS 그룹 참가자: `https://[your-domain]/tksdk/consent`
*   OG 그룹 참가자: `https://[your-domain]/tndud/learning`

### 프론트엔드 (React) 구현

1.  **라우팅 설정 (`App.jsx`):** React Router를 사용하여 URL 경로에서 그룹 코드를 동적 파라미터(`/:groupCode/*`)로 추출합니다. 루트 경로(`/`)나 유효하지 않은 그룹 코드 접근 시 안내/오류 메시지를 표시합니다.
2.  **코드-그룹명 변환 및 Context 설정 (`App.jsx` - `GroupWrapper`):**
    *   `GroupWrapper` 컴포넌트가 `useParams` 훅으로 URL에서 `groupCode`를 가져옵니다.
    *   `GROUP_CODE_MAP`을 참조하여 실제 그룹명(예: 'kss', 'og')으로 변환합니다.
    *   변환된 실제 그룹명을 `useExperiment` 훅의 `setGroup` 함수를 통해 `ExperimentContext`의 `group` 상태에 저장합니다.
3.  **그룹별 데이터 로딩 및 처리 (`ExperimentContext.jsx`):**
    *   `papaparse` 라이브러리를 사용하여 `words_data_test_full.csv` 파일을 파싱합니다.
    *   `useEffect` 훅에서 `group` 상태가 설정되고 데이터 로딩(`allParsedWords`)이 완료되면, 현재 `group` 상태를 기반으로 동적으로 컬럼 키(`keywordRefinedKey = \`\${group}_keyword_refined\``, `verbalCueKey = \`\${group}_verbal_cue\``)를 생성합니다.
    *   **키 이름 유연성:** 파싱된 객체에서 키를 찾을 때, 만약을 대비해 `Object.keys(word).find(key => key.trim() === keywordRefinedKey)` 와 같이 앞뒤 공백을 제거하고 비교하여 실제 키를 찾아 사용하는 로직을 포함합니다. (이는 'og' 그룹 디버깅 과정에서 키 이름 불일치 가능성을 고려하여 추가됨)
    *   `_keyword_refined` 컬럼의 문자열 데이터는 작은따옴표를 큰따옴표로 바꾼 후 `JSON.parse()`를 사용하여 배열 객체로 변환합니다.
    *   최종적으로 각 그룹에 맞는 데이터(`keyword_refined`, `verbal_cue` 등)를 포함하는 `wordList` 객체(라운드별 분류)를 생성하여 상태를 업데이트합니다.
4.  **백엔드 통신 (`utils/api.js`, 페이지 컴포넌트):**
    *   `submitConsent`, `submitResponse` 등 API 호출 함수들이 `group` (실제 그룹명) 인자를 받도록 수정되었습니다.
    *   API 요청 본문에 `user_group` 필드를 추가하여 실제 그룹명을 백엔드(Lambda)로 전송합니다.
    *   각 페이지 컴포넌트(`ConsentPage`, `LearningPage`, `SurveyPage` 등)는 `useExperiment` 훅을 통해 `group` 상태를 가져와 API 호출 시 전달합니다.
5.  **페이지 이동 및 사이드바 (`AppSidebar.jsx`, 페이지 컴포넌트):**
    *   페이지 간 이동(버튼 클릭, 사이드바 메뉴 클릭) 시 URL 경로에 `groupCode`가 유지되도록 모든 `navigate` 함수 호출이 수정되었습니다.
    *   사이드바는 현재 경로에서 `groupCode`를 제외한 기본 경로를 기준으로 활성 단계를 표시하도록 수정되었습니다.

### 백엔드 (Lambda + DynamoDB) 구현

1.  **데이터 수신:** 프론트엔드에서 API 요청(`/consent`, `/responses`) 시 전송된 JSON 본문에서 `user_group` (실제 그룹명) 값을 추출합니다.
2.  **데이터 저장:**
    *   `/consent` 엔드포인트: `phonitale-user-consent` DynamoDB 테이블에 `put_item` 시 `user_group` 속성을 추가하여 저장합니다.
    *   `/responses` 엔드포인트: `phonitale-user-responses` DynamoDB 테이블에 `update_item` 시 `user_group` 속성을 업데이트 표현식에 추가하여 저장합니다.
    *   백엔드에서는 URL 경로의 `groupCode`를 직접 처리할 필요 없이, 프론트엔드가 제공하는 `user_group` 값을 사용합니다.
    *   숫자형 데이터(예: `duration`, `round_number`)는 DynamoDB 저장 전 명시적으로 `int()` 변환 처리를 하고, 오류 발생 시 상세 로깅을 위한 `try...except ClientError` 구문이 추가되었습니다.

## 데이터 파일 준비

*   `phonitale-react/public/words/words_data_test_full.csv` 파일에 모든 그룹(`kss`, `naive`, `phonitale`, `og`)에 대한 `_keyword_refined`, `_verbal_cue` 컬럼이 포함되어야 합니다.
*   **주의:** 컬럼 이름은 정확해야 합니다. 예를 들어, `og_keyword_refined` 대신 `og_keywords_refined` 와 같이 오타가 있으면 해당 그룹의 데이터 로딩에 실패합니다. (디버깅 사례)

## 주요 디버깅 및 해결 과정 요약

*   **'og' 그룹 데이터 미표시 문제:**
    *   **원인:** CSV 파일의 컬럼명이 `og_keyword_refined` 가 아닌 `og_keywords_refined` 로 오타가 있었음.
    *   **해결:** CSV 파일의 컬럼명을 수정하여 해결.
    *   **관련 조치:** `ExperimentContext`에서 키를 찾을 때 `trim()`을 사용하여 약간의 이름 차이를 허용하는 로직은 유지함.
*   **CSV 파싱 문제 의심 및 라이브러리 도입:**
    *   초기 디버깅 과정에서 직접 구현한 CSV 파서의 잠재적 오류 가능성 제기됨.
    *   안정적인 파싱을 위해 `papaparse` 라이브러리를 도입함.
*   **GitHub Actions 빌드 오류:**
    *   **원인:** `papaparse` 라이브러리가 `package.json`의 `dependencies`에 누락되어 빌드 환경에서 설치되지 않음.
    *   **해결:** 로컬에서 `npm install papaparse --save` (또는 `yarn add papaparse`) 명령을 실행하여 `package.json` 및 `package-lock.json` (또는 `yarn.lock`)을 업데이트하고, 변경 사항을 커밋/푸시하여 해결.
