# 스타일 가이드

이 프로젝트는 SCSS를 사용하여 모듈화된 스타일 시스템을 구축했습니다.

## 파일 구조

```
src/styles/
├── README.md                 # 이 파일
├── main.scss                 # 메인 SCSS 파일 (모든 스타일 import)
├── _variables.scss           # SCSS 변수 정의
├── _mixins.scss              # SCSS 믹스인 정의
├── _base.scss                # 기본 스타일 (리셋, 타이포그래피 등)
├── _layout.scss              # 레이아웃 관련 스타일
├── _components.scss          # 공통 컴포넌트 스타일
├── _pages.scss               # 페이지별 스타일
├── Toolbar.scss              # 툴바 컴포넌트 스타일
├── Canvas.scss               # 캔버스 컴포넌트 스타일
└── PropertiesPanel.scss      # 속성 패널 컴포넌트 스타일
```

## 사용법

### 1. 메인 스타일 파일 import

모든 컴포넌트에서 스타일을 사용하려면 `main.scss`를 import하세요:

```javascript
import "../styles/main.scss";
```

### 2. SCSS 변수 사용

`_variables.scss`에 정의된 변수들을 사용할 수 있습니다:

```scss
.my-component {
  color: $primary-500;
  padding: $spacing-4;
  border-radius: $border-radius;
}
```

### 3. SCSS 믹스인 사용

`_mixins.scss`에 정의된 믹스인들을 사용할 수 있습니다:

```scss
.my-button {
  @include button-primary;
  @include flex-center;
}
```

## 스타일 클래스 네이밍 규칙

### BEM 방법론 사용

- **Block**: 컴포넌트의 최상위 요소
- **Element**: Block의 하위 요소 (이중 언더스코어 `__`)
- **Modifier**: 상태나 변형 (이중 하이픈 `--`)

예시:

```scss
.card {
  &__header {
    &--active {
      // 활성 상태
    }
  }

  &__body {
    // 카드 본문
  }
}
```

### 컴포넌트별 네이밍

- **LayoutEditor**: `layout-editor`
- **Dashboard**: `dashboard`
- **BranchManagement**: `branch-management`
- **Sidebar**: `sidebar`
- **Form**: `form`
- **Modal**: `modal`
- **Button**: `btn`
- **Card**: `card`

## 주요 스타일 클래스

### 레이아웃

- `.app`: 메인 앱 컨테이너
- `.main-content`: 메인 콘텐츠 영역
- `.sidebar`: 사이드바
- `.page`: 페이지 컨테이너

### 컴포넌트

- `.btn`: 버튼 기본 스타일
- `.btn--primary`: 주요 버튼
- `.btn--secondary`: 보조 버튼
- `.btn--danger`: 위험 버튼
- `.card`: 카드 기본 스타일
- `.form`: 폼 컨테이너
- `.modal`: 모달 컨테이너

### 상태

- `.loading`: 로딩 상태
- `.error`: 에러 상태
- `.active`: 활성 상태

## 반응형 디자인

`_mixins.scss`의 `@mixin responsive()` 믹스인을 사용하여 반응형 스타일을 작성할 수 있습니다:

```scss
.my-component {
  // 기본 스타일

  @include responsive(md) {
    // 중간 화면 (768px 이상)
  }

  @include responsive(lg) {
    // 큰 화면 (1024px 이상)
  }
}
```

## 색상 시스템

프로젝트에서 사용하는 주요 색상들:

- **Primary**: `$primary-500` (#3b82f6) - 주요 액션
- **Gray**: `$gray-50` ~ `$gray-900` - 텍스트, 배경
- **Red**: `$red-500` ~ `$red-700` - 에러, 삭제
- **Green**: `$green-500` ~ `$green-600` - 성공
- **Blue**: `$blue-500` ~ `$blue-600` - 정보
- **Purple**: `$purple-500` ~ `$purple-600` - 특별한 액션
- **Orange**: `$orange-500` ~ `$orange-600` - 경고

## 스페이싱 시스템

일관된 간격을 위해 `$spacing-*` 변수를 사용합니다:

- `$spacing-1`: 0.25rem (4px)
- `$spacing-2`: 0.5rem (8px)
- `$spacing-4`: 1rem (16px)
- `$spacing-6`: 1.5rem (24px)
- `$spacing-8`: 2rem (32px)

## 새로운 컴포넌트 스타일 추가

1. 컴포넌트별 SCSS 파일 생성 (예: `_MyComponent.scss`)
2. `main.scss`에 import 추가
3. BEM 방법론에 따라 클래스 작성
4. 필요한 경우 믹스인과 변수 활용

## 주의사항

- 인라인 스타일 대신 SCSS 클래스 사용
- Tailwind CSS 클래스와 SCSS 클래스 혼용 가능
- 컴포넌트별로 스타일 파일 분리 권장
- 변수와 믹스인을 적극 활용하여 일관성 유지
