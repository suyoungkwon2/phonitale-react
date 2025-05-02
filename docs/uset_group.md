# 사용자 그룹 식별 및 데이터 분기

## 목적

실험 참가자를 여러 그룹(kss, naive, phonitale, og)으로 나누어, 각 그룹별로 다른 학습 자료(키워드, 연상 단서)를 제공하고, 참가자의 그룹 정보를 응답 데이터와 함께 기록하기 위함입니다.

## 구현 방식: URL 경로 코드를 이용한 그룹 식별

참가자 그룹 정보가 URL에 직접 노출되는 것을 방지하고, 사용자 입력 오류를 최소화하기 위해 각 그룹별로 고유한 코드를 부여하여 URL 경로에 사용합니다.

### 그룹 코드 매핑

| 실제 그룹명 | URL 경로 코드 |
| :---------- | :------------ |
| kss         | `tksdk`       |
| naive       | `wodnr`       |
| phonitale   | `audtjr`      |
| og          | `tndud`       |

**예시 URL:**

*   KSS 그룹 참가자: `https://[your-domain]/tksdk/consent`
*   Naive 그룹 참가자: `https://[your-domain]/wodnr/consent`

### 프론트엔드 (React) 구현

1.  **라우팅 설정:** React Router 등을 사용하여 URL 경로에서 그룹 코드를 동적 파라미터로 추출합니다. (예: `/:groupCode/consent`)
2.  **코드-그룹명 변환:** 컴포넌트 내에서 `useParams` 훅 등으로 `groupCode`를 가져온 후, 위의 매핑 테이블을 참조하여 실제 그룹명(e.g., 'kss', 'naive')으로 변환합니다.
3.  **데이터 접근:** 변환된 실제 그룹명을 사용하여 `words_data_test_full.csv` 데이터에서 해당 그룹의 `_keyword_refined`, `_verbal_cue` 컬럼 데이터를 선택합니다.
4.  **백엔드 통신:** 사용자 응답 데이터를 백엔드(Lambda)로 전송할 때, URL 코드(`groupCode`)가 아닌 **변환된 실제 그룹명**을 `user_group` 필드에 담아 전송합니다. 이는 DynamoDB에 저장되는 데이터의 가독성을 높이기 위함입니다.

### 백엔드 (Lambda + DynamoDB) 구현

1.  **데이터 수신:** 프론트엔드에서 API 요청 시 전송된 `user_group` (실제 그룹명) 값을 받습니다.
2.  **데이터 저장:** `phonitale-user-responses` DynamoDB 테이블에 새로운 속성(Attribute)으로 `user_group`을 추가하고, 수신된 실제 그룹명 값을 저장합니다. 백엔드에서는 URL 코드를 직접 알 필요가 없습니다.

## 데이터 파일 준비

*   `frontend/static/words/words_data_test_full.csv` 파일에 모든 그룹(`kss`, `naive`, `phonitale`, `og`)에 대한 `_keyword_refined`, `_verbal_cue` 컬럼이 존재해야 합니다.
*   `phonitale` 및 `og` 그룹 데이터가 아직 준비되지 않았더라도 해당 컬럼은 미리 생성되어 있어야 합니다. (빈 값 또는 임시 값)
