## 실험 웹사이트 화면 흐름 및 공통 요소 분석

### 1. 화면 흐름

1.  **Consent (동의):** 실험 참가 동의서 확인, 개인 정보 입력 및 동의 체크 후 Submit.
2.  **Instruction (안내):**  실험 전체 과정 안내. Next 클릭.
3.  **Round 1 시작 안내:**  Round 1 시작 알림. Start 클릭.
4.  **Round 1 - Learning 시작 안내:** Learning 단계 시작 알림. Next 클릭.
5.  **Round 1 - Learning 단계:**  영어 단어, Key Words, Verbal Cue, 한국어 뜻 등 학습. 타이머 작동, Next로 다음 단어 이동 (12개 반복).
6.  **Round 1 - Recognition 시작 안내:** Recognition Test 시작 알림. Start 클릭.
7.  **Round 1 - Recognition Test 단계:** 영어 단어 보고 한국어 뜻 입력. 타이머 작동, Next로 다음 단어 이동 (12개 반복).
8.  **Round 1 - Generation 시작 안내:** Generation Test 시작 알림. Start 클릭.
9.  **Round 1 - Generation Test 단계:** 한국어 뜻 보고 영어 단어 입력. 타이머 작동, Next로 다음 단어 이동 (12개 반복).
10. **Round 2, 3 반복:** 위 3~9 단계 반복 (사이드바에 현재 라운드 표시).
11. **Survey 시작 안내 (학습 종료):** 모든 라운드 종료 및 설문 시작 알림. Start 클릭.
12. **Survey (설문) 단계:** 단어별 Helpfulness 별점 평가. Next로 다음 단어 이동 (36개 반복).
13. **실험 종료:**  최종 종료 메시지 확인.

### 2. 공통적으로 반복되는 화면

*   **시작 안내 페이지:** 각 라운드 및 단계 시작 전 화면. 중앙 제목 블록, 설명 텍스트, 시작/다음 버튼 구조 공유.
*   **실험 단계 페이지 (학습/테스트/설문):** Learning, Recognition, Generation, Survey 단계 화면. 좌측 사이드바, 상단 헤더(진행률 포함), 중앙 콘텐츠 영역, 하단 네비게이션 버튼(Next) 레이아웃 공유. 콘텐츠 영역만 단계별로 변경.

### 3. 공통적으로 반복되는 컴포넌트

*   **사이드바 (Sidebar):** 전체 단계 표시 및 현재 단계 강조 (거의 모든 화면).
*   **헤더 (Header):** 로고 및 사용자 이름 표시 (거의 모든 화면).
*   **진행률 표시줄 (Progress Bar):** 단계 내 진행 상태 표시 .
*   **콘텐츠 카드 (Content Card):** 단어, 의미, 입력 필드, 평가 등 컨텐츠 영역.
*   **입력 필드 (Input Field):** 사용자 정보, 테스트 답안 입력.
*   **버튼 (Button):** 주요 액션 버튼 (파란색): Next, Start, Submit 등 (대부분의 화면).
*   **타이머 (Timer):** 제한 시간 표시 .
*   **중앙 제목 블록 (Title Block):** 시작/종료 페이지 제목 영역.
*   **별점 평가 (Rate):** Helpfulness 평가.
*   **체크박스 (Checkbox):** 동의 여부 확인.
*   **캐러셀 화살표 (Carousel Arrows):** 이미지 슬라이드 네비게이션
