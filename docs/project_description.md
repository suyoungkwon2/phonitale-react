1. 목적
- 내가 진행중인 연구의 평가를 위해 사용될 웹사이트를 만들고 싶습니다.
- 실험 참여자들에게 웹사이트 링크를 보내고, 응답 결과를 수집합니다. 

2. 설정
- 내 컴퓨터는 맥북입니다.
- 저는 개발 경험이 없는 디자이너입니다. 
- github: https://github.com/suyoungkwon2/phonitale-evaluation

3. 사용 기술
- Dynamo DB, Lambda, Python을 이용해 Backend를 구축하고,
- 일부 Ant Design Library version 4.23.3과, 직접 디자인한 프론트엔드를 구현하고 싶습니다.
- python으로 간단한 웹사이트를 만들고 싶습니다.
- MCP를 사용해 Figma 디자인을 코드로 변환하고 싶습니다.
- 각 페이지 전환 시 타임스탬프는 저장됩니다
- 각 페이지에서 보여지는 단어는 Frontend에서 csv로 저장되어있는 데이터를 불러옵니다. 
- 각 페이지에서 들려주는 단어 발음 파일은 DB에서 불러옵니다.


4. 상세
- 깔끔하고 잘 동작하는 웹사이트를 만들고 싶습니다.
- 주로 PC에서 사용될 웹사이트입니다.
- 모든 유저의 응답은 구분해서 분석이 가능해야 합니다. 이를 고려해서 dynamo db 테이블을 설계해야 합니다.


5. 실험용 웹사이트 플로우
(1) Consent
- 모든 실험 참여자들은 실험 참가 동의서를 읽고 동의를 체크하고, 이름과 핸드폰 번호, 이메일 주소를 입력해야 실험을 시작할 수 있습니다. 
- 실험 참가 동의서는 notion으로 만들어진 사이트를 web embedding 하여 보여줍니다. 
- 사용자가 작성한 이름과 핸드폰 번호, 이메일 주소는 DB에 저장됩니다.
- Submit 버튼을 누르면 실험이 시작됩니다.
- 시작 시점의 타임스탬프는 저장됩니다.
(2) Instruction
- 실험 참여자들은 실험에 대한 안내를 확인합니다.
- 실험 안내는 jpg 파일로 제공되며, 5장의 이미지를 넘겨보며 확인할 수 있습니다.
- Next 버튼을 누르면 실험이 시작됩니다.
(3-1) Round 1 시작 안내
- 실험 Round 1이 곧 시작됨을 안내하는 페이지입니다.
- Start 버튼을 누르면 실험이 시작됩니다.
- 모든 페이지 전환은 타임스탬프로 저장됩니다. Round Number - Learning or Recognition or Generation - Words(영어 단어가 Key가 됩니다)) - 응답(입력) 결과 -  Timestamp 로 저장됩니다.
    (3-2) Round 1 - Learning 시작 안내
    - 실험 Round 1의 Learning 단계 (영어 단어 학습)가 곧 시작됨을 안내하는 페이지입니다.
    - Next 버튼을 누르면 Learning 단계가 시작됩니다.
    (3-3) Round 1 - Learning 단계
    - 영어 단어 학습 페이지입니다.
    - 12개의 영어 단어를 학습합니다. 
    - 각 영어 단어 페이지는 최대 30초 동안 보여지며, 15초가 지나면 비활성화 상태였던 Next 버튼이 활성화 되며 사용자가 버튼을 클릭하면 다음 페이지로 넘어갑니다.
    - 타이머를 통해 진입 시점으로 부터 시간이 줄어들고 있음을 알려줍니다.
    - 각 영어 단어 페이지 진입 후 2초, 7초 시점에 영어 단어의 발음 파일을 재생합니다. 
    - 각 영어 단어 사이 전환 순간에 1초간 빈 화면을 보여줌으로써 다음 단어로 전환되는것을 명확히 느껴지게 합니다.
    - 프로그레스 바를 통해 12개 중 몇개의 단어를 학습했는지 표현합니다. 
    - 12개의 영어 단어가 제공되는 순서는 매번 랜덤으로 바뀝니다. 
    - 12개의 단어를 모두 학습하면 다음 단계로 넘어갑니다.
    (3-4) Round 1 - Recognition 시작 안내
    - 실험 Round 1의 Recognition Test (한국어 뜻 적기 테스트) 단계가 곧 시작됨을 안내하는 페이지입니다.
    - Next 버튼을 누르면 Recognition Test 단계가 시작됩니다.
    (3-5) Round 1 - Recognition Test 단계
    - 영어 단어를 보고, 한국어 뜻을 입력하는 페이지입니다.
    - Input 창을 클릭하면 한국어를 입력할 수 있고, 입력한 한국어는 화면에 보여집니다.
    - 12개의 영어 단어를 테스트합니다. 
    - 각 단어 페이지는 최대 30초 동안 보여지며, 사용자가 원하면 언제든 Next 버튼을 클릭하여 다음 페이지로 넘어갈 수 있습니다.
    - 타이머를 통해 진입 시점으로 부터 시간이 줄어들고 있음을 알려줍니다.
    - 각 단어 페이지 진입 후 2초, 7초 시점에 영어 단어의 발음 파일을 재생합니다. 
    - 각 단어 사이 전환 순간에 1초간 빈 화면을 보여줌으로써 다음 단어로 전환되는것을 명확히 느껴지게 합니다.
    - 프로그레스 바를 통해 12개 중 몇개의 단어를 테스트했는지 표현합니다. 
    - 12개의 단어를 모두 테스트하면 다음 단계로 넘어갑니다.
    (3-6) Round 1 - Generation 시작 안내
    - 실험 Round 1의 Generation Test (영어 단어 적기 테스트) 단계가 곧 시작됨을 안내하는 페이지입니다.
    - Next 버튼을 누르면 Generation Test 단계가 시작됩니다.
    (3-7) Round 1 - Generation Test 단계
    - 한국어 뜻을 보고, 영어 단어를 입력하는 페이지입니다.
    - Input 창을 클릭하면 영어 단어를 입력할 수 있고, 입력한 영어 단어는 화면에 보여집니다.
    - 12개의 한국어 단어를 테스트합니다. 
    - 각 단어 페이지는 최대 30초 동안 보여지며, 사용자가 원하면 언제든 Next 버튼을 클릭하여 다음 페이지로 넘어갈 수 있습니다.
    - 타이머를 통해 진입 시점으로 부터 시간이 줄어들고 있음을 알려줍니다. 
    - 각 단어 사이 전환 순간에 1초간 빈 화면을 보여줌으로써 다음 단어로 전환되는것을 명확히 느껴지게 합니다.
    - 프로그레스 바를 통해 12개 중 몇개의 단어를 테스트했는지 표현합니다. 
    - 12개의 단어를 모두 테스트하면 다음 단계로 넘어갑니다.
(3-8) 위 3-1 ~ 3-7 단계를 총 3번 반복합니다.
- Round가 바뀔 때 마다, 화면의 Round 번호도 바뀝니다. 
(4-1) 설문 조사 시작 안내
- 모든 Round가 끝나면, 설문 조사 시작 안내 페이지가 보여집니다.
- Next 버튼을 누르면 설뭉 단계가 시작됩니다.
(4-2) 설문 조사 단계    
- 36개의 단어에 대한 설문 조사가 진행됩니다.
- 프로그레스 바를 통해 36개 중 몇개의 단어를 응답했는지 표현합니다. 
- 각 단어별로 5개의 별표를 설정하게 해서 응답자가 해당 단어에 대한 helpfulness를 표현합니다.
- 응답 결과는 위의 words 키에 해당하는 테이블에 저장됩니다.
(5) 실험 종료
- 모든 실험이 끝나면, 실험 종료 페이지가 보여집니다.
- 종료 시점의 타임스탬프는 저장됩니다.


6.  각 페이지별 피그마 스크린 링크

(1) Consent: @https://www.figma.com/design/QGsNYF4xyZQfLALancYV02/-Soundle--Screen?node-id=111-4952&t=feVFkhevwGuhoTxs-4 
(2) Instruction: @https://www.figma.com/design/QGsNYF4xyZQfLALancYV02/-Soundle--Screen?node-id=111-4999&t=feVFkhevwGuhoTxs-4 
- 실험 안내 jpg 파일: 추후 첨부
(3-1) Round 1 시작 안내: @https://www.figma.com/design/QGsNYF4xyZQfLALancYV02/-Soundle--Screen?node-id=111-4897&t=feVFkhevwGuhoTxs-4 
(3-2) Round 1 - Learning 시작 안내: @https://www.figma.com/design/QGsNYF4xyZQfLALancYV02/-Soundle--Screen?node-id=111-4853&t=feVFkhevwGuhoTxs-4 
(3-3) Round 1 - Learning 단계: @https://www.figma.com/design/QGsNYF4xyZQfLALancYV02/-Soundle--Screen?node-id=111-4804&t=feVFkhevwGuhoTxs-4 
(3-4) Round 1 - Recognition 시작 안내: @https://www.figma.com/design/QGsNYF4xyZQfLALancYV02/-Soundle--Screen?node-id=111-5091&t=feVFkhevwGuhoTxs-4 
(3-5) Round 1 - Recognition Test 단계: @https://www.figma.com/design/QGsNYF4xyZQfLALancYV02/-Soundle--Screen?node-id=111-5185&t=feVFkhevwGuhoTxs-4 
(3-6) Round 1 - Generation 시작 안내: @https://www.figma.com/design/QGsNYF4xyZQfLALancYV02/-Soundle--Screen?node-id=111-5112&t=feVFkhevwGuhoTxs-4 
(3-7) Round 1 - Generation Test 단계: @https://www.figma.com/design/QGsNYF4xyZQfLALancYV02/-Soundle--Screen?node-id=111-5216&t=feVFkhevwGuhoTxs-4 
(4-1) 설문 조사 시작 안내: @https://www.figma.com/design/QGsNYF4xyZQfLALancYV02/-Soundle--Screen?node-id=111-4874&t=feVFkhevwGuhoTxs-4 
(4-2) 설문 조사 단계: @https://www.figma.com/design/QGsNYF4xyZQfLALancYV02/-Soundle--Screen?node-id=111-5133&t=feVFkhevwGuhoTxs-4 
(5) 실험 종료: @https://www.figma.com/design/QGsNYF4xyZQfLALancYV02/-Soundle--Screen?node-id=111-4886&t=feVFkhevwGuhoTxs-4 
- 단어 페이지 공통 모듈 variation 참고: @https://www.figma.com/design/QGsNYF4xyZQfLALancYV02/-Soundle--Screen?node-id=111-5243&t=feVFkhevwGuhoTxs-4 

