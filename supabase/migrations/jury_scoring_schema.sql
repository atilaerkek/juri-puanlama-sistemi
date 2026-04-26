
-- =============================================
-- JÜRİ PUANLAMA SİSTEMİ - VERİTABANI ŞEMASI
-- =============================================

-- Jüriler tablosu
CREATE TABLE IF NOT EXISTS jurors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  pin TEXT NOT NULL,
  max_score INTEGER NOT NULL,
  group_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Puanlar tablosu
CREATE TABLE IF NOT EXISTS scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  juror_id UUID REFERENCES jurors(id) ON DELETE CASCADE,
  artwork_number INTEGER NOT NULL CHECK (artwork_number >= 1 AND artwork_number <= 50),
  score NUMERIC(5,2) NOT NULL,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(juror_id, artwork_number)
);

-- Admin yapılandırma tablosu
CREATE TABLE IF NOT EXISTS admin_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_pin TEXT NOT NULL DEFAULT '9999'
);

-- Mevcut veri varsa temizle
DELETE FROM jurors;
DELETE FROM admin_config;

-- Jüri verilerini ekle (PIN'ler başlangıçta basit, sonradan değiştirilebilir)
INSERT INTO jurors (name, pin, max_score, group_name) VALUES
  ('Mustafa TEKDEMİR', '1111', 70, 'A'),
  ('Oğuzhan BİNGÜL', '2222', 70, 'A'),
  ('Selda BİNGÜL', '3333', 70, 'A'),
  ('Aysar GÜVEN', '4444', 30, 'B'),
  ('Lütfiye KATIK', '5555', 30, 'B'),
  ('Betül YILMAZ', '6666', 30, 'B');

-- Admin PIN ekle
INSERT INTO admin_config (admin_pin) VALUES ('0000');

-- RLS (Satır Düzeyinde Güvenlik) aktif et
ALTER TABLE jurors ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;

-- Politikalar: uygulama seviyesinde auth yapıyoruz
CREATE POLICY "jurors_policy" ON jurors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "scores_policy" ON scores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "admin_config_policy" ON admin_config FOR ALL USING (true) WITH CHECK (true);

-- updated_at otomatik güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger ekle
DROP TRIGGER IF EXISTS update_scores_updated_at ON scores;
CREATE TRIGGER update_scores_updated_at
  BEFORE UPDATE ON scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
