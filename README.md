# Trip Template D

숙박 업소용 정적 사이트 템플릿. `standard-template-data.json`에 데이터를 입력하면 각 페이지에 자동 매핑됩니다.

## 시작하기

```bash
git clone <레포 URL>
cd trip-template-D
npm install
```

> VS Code 사용 시 [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) 익스텐션 설치 필요 (저장 시 자동 포맷)

## 페이지 구성

| 파일 | 페이지 |
|------|--------|
| `index.html` | 홈 (인트로) |
| `main.html` | 메인 |
| `room-list.html` | 객실 목록 |
| `room.html` | 객실 상세 |
| `facility.html` | 부대시설 |
| `reservation.html` | 이용안내 |
| `directions.html` | 오시는 길 |
| `nearby-attractions.html` | 주변 관광지 |
| `layout-map.html` | 배치도 |
| `404.html` | 404 에러 |

공통 헤더/푸터는 `common/header.html`, `common/footer.html`에서 관리합니다.

## 디렉토리 구조

```
trip-template-D/
├── common/
│   ├── header.html
│   └── footer.html
├── js/
│   ├── common.js              # 페이지 공통 스크립트 (Swiper, 헤더 인터랙션)
│   ├── header-footer-loader.js # 헤더/푸터 fetch 로더
│   ├── image-helpers.js
│   ├── preview-handler.js
│   ├── kakao-maps-sdk.js
│   └── data-mapper/
│       ├── core/
│       │   └── base-mapper.js  # 매퍼 베이스 클래스
│       └── pages/              # 페이지별 데이터 매퍼
├── styles/
│   ├── reset.css
│   ├── theme.css              # 폰트 및 색상 변수 (테마 변경은 여기서)
│   ├── common.css             # 공통 스타일
│   ├── main.css               # 메인 페이지 스타일
│   └── sub.css                # 서브 페이지 스타일
└── standard-template-data.json # 숙소 데이터 입력 파일
```

## 데이터 입력

`standard-template-data.json`에 숙소 정보를 입력하면 각 페이지 매퍼가 자동으로 DOM에 반영합니다.

`enabled: false`로 설정된 섹션은 해당 페이지 접근 시 `404.html`로 리다이렉트됩니다.

## 테마 변경

`styles/theme.css`에서 폰트와 색상 변수를 수정하면 전체 테마가 변경됩니다.

```css
:root {
  --color-primary: #30353e;
  --color-secondary: #ffbc00;
  --font-ko-main: 'Noto Sans KR', sans-serif;
  --font-en-main: 'Questrial', sans-serif;
}
```

## 개발 도구

```bash
npm run lint          # JS + CSS + HTML 전체 린트
npm run lint:js       # ESLint
npm run lint:css      # Stylelint
npm run lint:html     # HTMLHint
npm run format        # Prettier 포맷 적용
npm run format:check  # Prettier 포맷 검사
```
