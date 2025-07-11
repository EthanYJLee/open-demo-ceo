-- 레이아웃 저장을 위한 테이블 생성
CREATE TABLE IF NOT EXISTS layouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id TEXT NOT NULL UNIQUE,
  template_id TEXT NOT NULL,
  elements JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) 설정
ALTER TABLE layouts ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기/쓰기 가능하도록 정책 설정 (개발용)
CREATE POLICY "Enable all access for authenticated users" ON layouts
  FOR ALL USING (auth.role() = 'authenticated');

-- 또는 더 제한적인 정책을 원한다면:
-- CREATE POLICY "Users can view their own layouts" ON layouts
--   FOR SELECT USING (auth.uid()::text = branch_id);

-- CREATE POLICY "Users can insert their own layouts" ON layouts
--   FOR INSERT WITH CHECK (auth.uid()::text = branch_id);

-- CREATE POLICY "Users can update their own layouts" ON layouts
--   FOR UPDATE USING (auth.uid()::text = branch_id);

-- updated_at 자동 업데이트를 위한 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_layouts_updated_at 
  BEFORE UPDATE ON layouts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 