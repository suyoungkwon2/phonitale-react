# 1. 설명
- 이 문서는 Frontend 화면 고도화를 위한 가이드를 제공합니다.
- @development_roadmap.md 문서 내 순서에 따라 개발을 진행 하고 있습니다.
- @project_description.md 문서 내 기술된 설명과 초기 피그마 자료로 개발된 Frontend 화면을 고도화 하는 단계입니다.
- 피그마 파일 내 디자인이 업데이트 되었습니다. 
- 동작 조건은 동일합니다. 


# 2.  각 페이지별 피그마 updated 스크린 링크

(1) Consent: https://www.figma.com/design/QGsNYF4xyZQfLALancYV02/-Soundle--Screen?node-id=326-1269&t=EyKQ8JhMOtDKhWXM-4
(2) Instruction: https://www.figma.com/design/QGsNYF4xyZQfLALancYV02/-Soundle--Screen?node-id=326-1320&t=EyKQ8JhMOtDKhWXM-4
(3-1) Round 1 시작 안내: https://www.figma.com/design/QGsNYF4xyZQfLALancYV02/-Soundle--Screen?node-id=326-1251&t=EyKQ8JhMOtDKhWXM-4
(3-2) Round 1 - Learning 시작 안내: https://www.figma.com/design/QGsNYF4xyZQfLALancYV02/-Soundle--Screen?node-id=326-1216&t=EyKQ8JhMOtDKhWXM-4
(3-3) Round 1 - Learning 단계: https://www.figma.com/design/QGsNYF4xyZQfLALancYV02/-Soundle--Screen?node-id=326-1170&t=EyKQ8JhMOtDKhWXM-4
(3-4) Round 1 - Recognition 시작 안내: https://www.figma.com/design/QGsNYF4xyZQfLALancYV02/-Soundle--Screen?node-id=332-3963&t=EyKQ8JhMOtDKhWXM-4
(3-5) Round 1 - Recognition Test 단계: https://www.figma.com/design/QGsNYF4xyZQfLALancYV02/-Soundle--Screen?node-id=332-3613&t=EyKQ8JhMOtDKhWXM-4
(3-6) Round 1 - Generation 시작 안내: https://www.figma.com/design/QGsNYF4xyZQfLALancYV02/-Soundle--Screen?node-id=332-3613&t=EyKQ8JhMOtDKhWXM-4
(3-7) Round 1 - Generation Test 단계: https://www.figma.com/design/QGsNYF4xyZQfLALancYV02/-Soundle--Screen?node-id=332-3858&t=EyKQ8JhMOtDKhWXM-4
(4-1) 설문 조사 시작 안내: https://www.figma.com/design/QGsNYF4xyZQfLALancYV02/-Soundle--Screen?node-id=332-4164&t=EyKQ8JhMOtDKhWXM-4
(4-2) 설문 조사 단계: https://www.figma.com/design/QGsNYF4xyZQfLALancYV02/-Soundle--Screen?node-id=326-1405&t=EyKQ8JhMOtDKhWXM-4
(5) 실험 종료: https://www.figma.com/design/QGsNYF4xyZQfLALancYV02/-Soundle--Screen?node-id=332-4727&t=EyKQ8JhMOtDKhWXM-4


# 3. 변경 기록

- **Header & Sidebar 스타일 업데이트 (YYYY-MM-DD)**:
    - Header: 하단 border 추가 (`#E5E7EB`).
    - Sidebar: 배경색 흰색(`FFFFFF`), 우측 border 추가 (`#868686`), 그림자 제거.
    - Sidebar Steps: 피그마 디자인 기반으로 아이콘(완료: 검정 체크, 진행: 검정 원+흰색 숫자, 대기: 회색 테두리+회색 숫자), 텍스트 색상, 구분선 스타일 직접 구현. 각 단계 클릭 시 페이지 이동 기능 활성화.
    - Sidebar 내용 좌측 패딩 조정 (시각적 중앙 정렬).
- **Layout 배경색 변경**:
    - 학습/테스트/설문(실제 진행) 페이지: `#F3F4FB`
    - 그 외 모든 페이지(Consent, Instruction, 시작 안내, 종료 등): `#FAF9F5`