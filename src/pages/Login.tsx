import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { ROUTE_PATHS } from '@/lib/index';
import { Delete, Shield, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'juror' | 'admin'>('juror');
  const navigate = useNavigate();
  const login = useAuth((s) => s.login);

  const handleKey = (val: string) => {
    if (pin.length < 6) setPin((p) => p + val);
  };

  const handleDelete = () => setPin((p) => p.slice(0, -1));

  const handleLogin = async () => {
    if (pin.length < 4) {
      toast.error('Lütfen PIN kodunuzu girin');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'admin') {
        const { data, error } = await supabase
          .from('admin_config')
          .select('admin_pin')
          .single();
        if (error) throw error;
        if (data.admin_pin === pin) {
          login({ type: 'admin', juror: null });
          navigate(ROUTE_PATHS.ADMIN);
        } else {
          toast.error('Hatalı admin PIN kodu');
          setPin('');
        }
      } else {
        const { data, error } = await supabase
          .from('jurors')
          .select('id, name, pin, max_score, group_name')
          .eq('pin', pin)
          .single();
        if (error || !data) {
          toast.error('Hatalı PIN kodu. Lütfen tekrar deneyin.');
          setPin('');
          return;
        }
        login({
          type: 'juror',
          juror: {
            id: data.id,
            name: data.name,
            max_score: data.max_score,
            group_name: data.group_name,
          },
        });
        navigate(ROUTE_PATHS.JUROR);
      }
    } catch {
      toast.error('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Jüri Puanlama Sistemi</h1>
          <p className="text-muted-foreground text-sm mt-1">PIN kodunuzla giriş yapın</p>
        </motion.div>

        {/* Mode Toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex rounded-xl bg-muted p-1 mb-6 gap-1"
        >
          <button
            onClick={() => { setMode('juror'); setPin(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              mode === 'juror'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-4 h-4" />
            Jüri Girişi
          </button>
          <button
            onClick={() => { setMode('admin'); setPin(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              mode === 'admin'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Shield className="w-4 h-4" />
            Admin Girişi
          </button>
        </motion.div>

        {/* PIN Display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-2xl p-6 mb-4 shadow-sm"
        >
          <div className="flex items-center justify-center gap-3 mb-6 min-h-[40px]">
            {pin.length === 0 ? (
              <p className="text-muted-foreground text-sm">PIN giriniz...</p>
            ) : (
              Array.from({ length: pin.length }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-4 h-4 rounded-full bg-accent"
                />
              ))
            )}
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-3">
            {keys.map((key, idx) => {
              if (key === '') return <div key={idx} />;
              if (key === 'del') {
                return (
                  <button
                    key={idx}
                    onClick={handleDelete}
                    className="flex items-center justify-center h-14 rounded-xl bg-muted hover:bg-secondary text-muted-foreground hover:text-foreground transition-all duration-150 active:scale-95"
                  >
                    <Delete className="w-5 h-5" />
                  </button>
                );
              }
              return (
                <button
                  key={idx}
                  onClick={() => handleKey(key)}
                  className="flex items-center justify-center h-14 rounded-xl bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground font-mono text-xl font-semibold transition-all duration-150 active:scale-95"
                >
                  {key}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Login Button */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={handleLogin}
          disabled={loading || pin.length < 4}
          className="w-full py-4 rounded-xl bg-accent text-accent-foreground font-semibold text-base transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
        >
          {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </motion.button>

        <p className="text-center text-xs text-muted-foreground mt-6">
          {mode === 'juror'
            ? 'Her jüri kendi PIN kodu ile giriş yapar'
            : 'Admin paneli tüm puanları gösterir'}
        </p>
      </div>
    </div>
  );
}
