# Open Demo CEO

지점 관리 및 레이아웃 편집을 위한 CEO/관리자 웹 애플리케이션입니다.

## 기능

- 🏢 **지점 관리**: 지점 등록, 수정, 삭제
- 📐 **레이아웃 편집**: 드래그 앤 드롭으로 공간 배치도 편집
- 📊 **대시보드**: 지점 현황 및 통계 확인
- 🎨 **시각적 편집**: Konva.js를 사용한 직관적인 레이아웃 편집

## 기술 스택

- React 19
- TypeScript
- Tailwind CSS
- React Konva (Konva.js)
- Supabase
- React Router

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# App Configuration
REACT_APP_NAME=Open Demo CEO
REACT_APP_VERSION=1.0.0
```

**Supabase 설정 방법:**

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. 프로젝트 설정 → API에서 URL과 anon key 복사
3. 위의 `.env` 파일에 붙여넣기

### 3. 개발 서버 실행

```bash
npm start
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 앱을 확인하세요.

## 사용법

### 지점 관리

1. 사이드바에서 "지점 관리" 클릭
2. "새 지점 등록" 버튼으로 지점 추가
3. 각 지점의 "레이아웃" 버튼으로 배치도 편집

### 레이아웃 편집

1. 지점 관리에서 "레이아웃" 버튼 클릭
2. 툴바에서 "방 추가" 버튼으로 방 생성
3. 방을 드래그하여 위치 조정
4. 속성 패널에서 방 정보 수정
5. "저장" 버튼으로 변경사항 저장

## 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── common/         # 공통 컴포넌트 (Sidebar 등)
│   ├── BranchManager/  # 지점 관리 컴포넌트
│   └── LayoutEditor/   # 레이아웃 편집 컴포넌트
├── pages/              # 페이지 컴포넌트
├── services/           # API 서비스
└── utils/              # 유틸리티 함수
```

## 빌드

프로덕션 빌드를 위해:

```bash
npm run build
```

## 문제 해결

### 환경 변수 오류

- `.env` 파일이 프로젝트 루트에 있는지 확인
- Supabase URL과 anon key가 올바른지 확인
- 앱을 재시작

### 모듈 오류

- `npm install`로 의존성 재설치
- node_modules 삭제 후 재설치

## 라이선스

MIT License
