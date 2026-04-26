import { createClient } from '@supabase/supabase-js';

// GitHub Secrets veya yerel değişkenlerden veriyi çeker
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Bağlantıyı oluşturur
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Hata ayıklama için: Eğer anahtarlar boşsa konsola uyarı basar
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase bağlantı anahtarları eksik! GitHub Secrets ayarlarını kontrol edin.");
}
