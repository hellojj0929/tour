# 모바일 앱 전환 및 리팩토링 구현 계획

## 1. 개요 (Overview)
이 문서는 기존 'Kobe Tour' 웹 프로젝트를 React Native Expo 기반의 하이브리드 앱으로 전환하고, 웹 프로젝트 자체를 모바일 환경에 최적화된 구조로 리팩토링하기 위한 단계별 계획을 기술합니다.

## 2. 작업 준비 (Preparation)
### 2.1 Git 브랜치 전략
- 원본 코드를 보존하기 위해 새로운 작업 브랜치를 생성합니다.
- **브랜치명:** `feature/mobile-app-refactor`
- 모든 작업은 이 브랜치에서 진행하며, 단계별로 커밋합니다.

## 3. 상세 구현 단계 (Implementation Steps)

### Phase 1: 웹 프로젝트 리팩토링 (Web Refactoring)
앱 내에서 구동될 웹사이트를 모바일 네이티브 앱처럼 느껴지도록 최적화하는 단계입니다.

#### 1.1 Tailwind CSS 도입 및 디자인 시스템 구축
- **설치:** Tailwind CSS 및 관련 의존성(postcss, autoprefixer) 설치.
- **설정:** `tailwind.config.js`에 프로젝트 테마(컬러 팔레트, 폰트, 여백 등) 정의.
  - 기존 CSS 변수를 Tailwind 유틸리티 및 커스텀 테마로 변환.
  - **Color:** Brand Core, Background, Text 색상 정의.
  - **Typography:** 모바일 가독성을 고려한 폰트 사이즈 체계 정립.

#### 1.2 뷰포트 및 메타 태그 최적화 (User Experience)
- **확대/축소 방지:** 사용자가 손가락으로 화면을 확대하지 못하도록 `index.html`의 meta 태그 수정.
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  ```
- **터치 하이라이트 제거:** 모바일에서 탭 시 발생하는 기본 파란색 배경 제거 (`-webkit-tap-highlight-color`).

#### 1.3 TypeScript 도입 및 마이그레이션 (New!)
기존 JavaScript 코드를 TypeScript로 변환하여 안정성을 확보합니다.
- **설치:** `typescript`, `@types/react`, `@types/react-dom` 등 필수 패키지 설치.
- **설정:** `tsconfig.json` 생성 (Vite 템플릿 기준).
- **마이그레이션 단계:**
  1. **설정 파일:** `vite.config.js` -> `vite.config.ts`
  2. **진입점:** `main.jsx` -> `main.tsx`
  3. **컴포넌트:** `.jsx` 파일을 `.tsx`로 변경하고 `interface` 정의.
     - `App.jsx`, `Layout.jsx` 우선 변환.
     - 게임 컴포넌트 (`ConstellationGame` 등)의 Props 및 State 타입 정의.
  4. **Strict Mode:** 초기에는 `noImplicitAny: false`로 설정하여 빌드 오류를 최소화하고, 점진적으로 타입을 구체화(`strict: true`).

#### 1.4 반응형 레이아웃 구조 개편
- **모바일 퍼스트(Mobile-First):** 기본 스타일을 모바일 기준으로 작성하고, 태블릿(`md:`)과 데스크탑(`lg:`)은 확장 형태로 구현.
- **레이아웃 컴포넌트 (`Layout.jsx`) 재설계:**
  - `SafeArea` 고려: 상단 상태바 및 하단 홈 바 영역 침범 방지.
  - **Navigation:** 하단 탭바(Bottom Tab Bar) 또는 햄버거 메뉴 등 터치 친화적 네비게이션 적용.

#### 1.4 기존 컴포넌트 스타일 마이그레이션
- 기존 CSS/Module CSS를 Tailwind Utility Class로 변환.
- **대상 컴포넌트:**
  - `ColorMatchGame`, `ConstellationGame` 등 게임 컴포넌트의 UI를 터치하기 편한 크기로 조정.
  - 버튼 및 인터랙티브 요소의 터치 영역(Touch Target) 최소 44px 이상 확보.

---

### Phase 2: React Native Expo 프로젝트 구축 (Hybrid App)
웹뷰(WebView)를 통해 리팩토링된 웹사이트를 보여주는 껍데기(Shell) 앱을 만듭니다.

#### 2.1 Expo 프로젝트 생성
- 별도의 디렉토리(예: `kobe-mobile-app`)에 Expo 프로젝트 생성.
- **Tools:** `create-expo-app` 사용.

#### 2.2 WebView 구현
- `react-native-webview` 라이브러리 설치.
- **Main Screen:** 앱 실행 시 리팩토링된 웹사이트(Vercel 배포 URL 또는 로컬 서버 IP)를 전체 화면으로 로드.
- **통신 설정:** 필요 시 `postMessage`를 통해 앱(React Native)과 웹(React) 간 데이터 통신 구조 마련 (예: 진동, 카메라 권한 등 네이티브 기능 필요 시).

#### 2.3 네이티브 설정
- **StatusBar:** 웹 컨텐츠와 어우러지도록 상태바 스타일(Dark/Light) 설정.
- **SafeAreaView:** 노치 디자인(아이폰 등)에 컨텐츠가 가리지 않도록 처리.
- **Splash Screen:** 앱 로딩 시 보여줄 스플래시 이미지 설정.

---

### Phase 3: 테스트 및 배포 (Testing & Deployment)

#### 3.1 크로스 디바이스 테스트
- **iOS Simulator & Android Emulator:** 다양한 해상도에서 레이아웃 깨짐 확인.
- **실기기 테스트:** Expo Go를 사용하여 실제 폰에서의 터치감 및 퍼포먼스 확인.

#### 3.2 배포 파이프라인
- **웹:** Vercel을 통한 지속적 배포(CD).
- **앱:** EAS(Expo Application Services)를 통한 빌드 및 스토어(TestFlight/APK) 배포 준비.

## 4. 실행 순서
1. `git checkout -b feature/mobile-app-refactor`
2. Tailwind CSS 설치 및 설정 파일 생성
3. `index.html` 메타 태그 수정 (확대 방지)
4. 공통 레이아웃 컴포넌트 수정 (모바일 최적화)
5. 주요 페이지 Tailwind 변환 작업 진행
6. Expo 프로젝트 별도 폴더 생성 및 WebView 연동 테스트
