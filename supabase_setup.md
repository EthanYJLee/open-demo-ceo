# Supabase 설정 가이드

## 1. Supabase 프로젝트 접속

1. [Supabase](https://supabase.com)에 로그인
2. 해당 프로젝트 선택

## 2. 기존 테이블 확인 및 수정

레이아웃 에디터는 기존에 생성된 `space_layouts` 테이블을 사용합니다.

### space_layouts 테이블 구조 (업데이트 필요)

기존 테이블에 `floor` 컬럼을 추가해야 합니다:

```sql
-- 기존 테이블에 floor 컬럼 추가
ALTER TABLE public.space_layouts
ADD COLUMN IF NOT EXISTS floor INTEGER DEFAULT 1;

-- floor 컬럼에 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_space_layouts_floor
ON public.space_layouts(branch_id, floor);
```

### 완전한 space_layouts 테이블 구조

```sql
CREATE TABLE public.space_layouts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  branch_id uuid,
  name text NOT NULL,
  description text,
  layout_data jsonb NOT NULL,
  background_image text,
  width integer NOT NULL,
  height integer NOT NULL,
  floor integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT space_layouts_pkey PRIMARY KEY (id),
  CONSTRAINT space_layouts_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id)
);
```

## 3. RLS 정책 설정

1. Table Editor → space_layouts 테이블 선택
2. "RLS" 탭에서 "Enable RLS" 체크
3. "New Policy" 클릭
4. Policy Name: "Enable all access for all users"
5. Target roles: `authenticated`, `anon`
6. Using expression: `true`
7. Save

## 4. 확인

1. Table Editor에서 `space_layouts` 테이블이 존재하는지 확인
2. `floor` 컬럼이 추가되었는지 확인
3. 앱에서 층 관리 기능 테스트

## 문제 해결

### 404 오류가 발생하는 경우:

1. `space_layouts` 테이블이 존재하는지 확인
2. `floor` 컬럼이 추가되었는지 확인
3. RLS 정책이 올바르게 설정되었는지 확인
4. 환경 변수 `REACT_APP_SUPABASE_URL`과 `REACT_APP_SUPABASE_ANON_KEY`가 올바른지 확인

### 권한 오류가 발생하는 경우:

1. RLS 정책을 임시로 비활성화하거나
2. 더 개방적인 정책으로 변경:

```sql
DROP POLICY IF EXISTS "Enable all access for all users" ON space_layouts;
CREATE POLICY "Enable all access for all users" ON space_layouts
  FOR ALL USING (true);
```

### 데이터 구조 확인:

레이아웃 데이터는 `layout_data` JSONB 컬럼에 다음과 같은 구조로 저장됩니다:

```json
{
  "elements": [...],
  "templateId": "template_name",
  "floor": 1,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### 층 관리 기능:

- 각 층별로 독립적인 레이아웃 저장
- 층 추가/삭제 기능
- 층 간 전환 시 저장되지 않은 변경사항 확인
- 최소 1개 층 유지 보장
