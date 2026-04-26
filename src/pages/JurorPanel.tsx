import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { ROUTE_PATHS, ARTWORKS, formatScore } from '@/lib/index';
import type { Score } from '@/lib/supabase';
import {
  LogOut, CheckCircle2, Clock, AlertCircle, Search,
  ChevronLeft, ChevronRight, Save, Edit2, X, Filter
} from 'lucide-react';
import { toast } from 'sonner';

type FilterType = 'all' | 'scored' | 'unscored';

export default function JurorPanel() {
  const { juror, logout } = useAuth();
  const navigate = useNavigate();
  const [scores, setScores] = useState<Record<number, Score>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [editingArtwork, setEditingArtwork] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [noteValue, setNoteValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 25;

  useEffect(() => {
    if (!juror) { navigate(ROUTE_PATHS.HOME); return; }
    fetchScores();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [juror]);

  const fetchScores = async () => {
    if (!juror) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('juror_id', juror.id);
    if (error) { toast.error('Puanlar yüklenemedi'); }
    else {
      const map: Record<number, Score> = {};
      (data || []).forEach((s) => { map[s.artwork_number] = s; });
      setScores(map);
    }
    setLoading(false);
  };

  const filteredArtworks = useCallback(() => {
    let list = ARTWORKS;
    if (search.trim()) {
      const n = parseInt(search.trim());
      if (!isNaN(n)) list = list.filter((a) => a === n);
      else list = [];
    }
    if (filter === 'scored') list = list.filter((a) => scores[a]);
    if (filter === 'unscored') list = list.filter((a) => !scores[a]);
    return list;
  }, [search, filter, scores]);

  const paginatedArtworks = useCallback(() => {
    const all = filteredArtworks();
    return all.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  }, [filteredArtworks, page]);

  const totalPages = Math.ceil(filteredArtworks().length / PAGE_SIZE);

  const openEdit = (artworkNum: number) => {
    const existing = scores[artworkNum];
    setInputValue(existing ? String(existing.score) : '');
    setNoteValue(existing?.note || '');
    setEditingArtwork(artworkNum);
  };

  const handleSave = async () => {
    if (!juror || editingArtwork === null) return;
    const numVal = parseFloat(inputValue);
    if (isNaN(numVal) || numVal < 0 || numVal > juror.max_score) {
      toast.error(`Puan 0 ile ${juror.max_score} arasında olmalıdır`);
      return;
    }
    setSaving(true);
    const existing = scores[editingArtwork];
    if (existing) {
      const { error } = await supabase
        .from('scores')
        .update({ score: numVal, note: noteValue })
        .eq('id', existing.id);
      if (error) { toast.error('Güncelleme başarısız'); }
      else {
        toast.success(`Eser #${editingArtwork} puanı güncellendi`);
        fetchScores();
        setEditingArtwork(null);
      }
    } else {
      const { error } = await supabase
        .from('scores')
        .insert({ juror_id: juror.id, artwork_number: editingArtwork, score: numVal, note: noteValue });
      if (error) { toast.error('Kayıt başarısız'); }
      else {
        toast.success(`Eser #${editingArtwork} puanlandı`);
        fetchScores();
        setEditingArtwork(null);
      }
    }
    setSaving(false);
  };

  const scoredCount = Object.keys(scores).length;
  const progress = Math.round((scoredCount / 50) * 100);

  const handleLogout = () => { logout(); navigate(ROUTE_PATHS.HOME); };

  if (!juror) return null;

  const artworksToShow = paginatedArtworks();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/90 border-b border-border backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-bold text-sm">{juror.group_name}</span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground text-sm truncate">{juror.name}</p>
              <p className="text-xs text-muted-foreground">Maks. {juror.max_score} puan</p>
            </div>
          </div>

          {/* Progress */}
          <div className="hidden sm:flex items-center gap-3 flex-1 max-w-xs">
            <div className="flex-1 bg-muted rounded-full h-2">
              <motion.div
                className="h-2 rounded-full bg-accent"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap font-mono">
              {scoredCount}/50
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors px-3 py-1.5 rounded-lg hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Çıkış</span>
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Puanlanan', value: scoredCount, icon: CheckCircle2, color: 'text-green-500' },
            { label: 'Bekleyen', value: 50 - scoredCount, icon: Clock, color: 'text-amber-500' },
            { label: 'Tamamlanma', value: `%${progress}`, icon: AlertCircle, color: 'text-primary' },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <stat.icon className={`w-5 h-5 ${stat.color} shrink-0`} />
              <div>
                <p className="text-xl font-bold font-mono text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
            {(['all', 'unscored', 'scored'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => { setFilter(f); setPage(0); }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === f ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f === 'all' ? 'Tümü' : f === 'scored' ? '✓ Puanlananlar' : '○ Bekleyenler'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2 flex-1 max-w-xs">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="number"
              placeholder="Eser numarası ara..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="bg-transparent text-sm outline-none w-full text-foreground placeholder:text-muted-foreground"
              min={1}
              max={50}
            />
          </div>
          {search && (
            <button onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Artwork Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-6">
              {artworksToShow.map((num) => {
                const s = scores[num];
                const isScored = !!s;
                return (
                  <motion.button
                    key={num}
                    onClick={() => openEdit(num)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className={`relative rounded-xl border-2 p-4 text-left transition-colors duration-200 ${
                      isScored
                        ? 'bg-card border-accent/40 hover:border-accent'
                        : 'bg-muted/50 border-border hover:border-primary/50 hover:bg-card'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs text-muted-foreground font-medium">ESER</span>
                      {isScored && (
                        <span className="w-2 h-2 rounded-full bg-accent shrink-0 mt-0.5" />
                      )}
                    </div>
                    <p className="font-mono font-bold text-2xl text-foreground mb-1">#{num}</p>
                    {isScored ? (
                      <div>
                        <p className="font-mono font-semibold text-accent text-sm">
                          {formatScore(s.score, 1)} / {juror.max_score}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Edit2 className="w-3 h-3" /> Düzenle
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Puanlanmadı</p>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-2 rounded-lg bg-card border border-border disabled:opacity-40 hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-muted-foreground">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  className="p-2 rounded-lg bg-card border border-border disabled:opacity-40 hover:bg-muted transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {filteredArtworks().length === 0 && (
              <div className="text-center py-16">
                <Filter className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Sonuç bulunamadı</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Score Modal */}
      <AnimatePresence>
        {editingArtwork !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            onClick={(e) => { if (e.target === e.currentTarget) setEditingArtwork(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-0.5">ESER NUMARASI</p>
                  <h2 className="text-3xl font-mono font-bold text-foreground">#{editingArtwork}</h2>
                </div>
                <button
                  onClick={() => setEditingArtwork(null)}
                  className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Puan <span className="text-muted-foreground font-normal">(0 – {juror.max_score})</span>
                </label>
                <input
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={`0 – ${juror.max_score}`}
                  min={0}
                  max={juror.max_score}
                  step={0.5}
                  autoFocus
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 font-mono text-xl font-bold text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                />
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Not <span className="text-muted-foreground font-normal">(isteğe bağlı)</span>
                </label>
                <textarea
                  value={noteValue}
                  onChange={(e) => setNoteValue(e.target.value)}
                  placeholder="Bu eser hakkında not ekleyebilirsiniz..."
                  rows={2}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setEditingArtwork(null)}
                  className="flex-1 py-3 rounded-xl bg-muted text-muted-foreground hover:text-foreground font-medium text-sm transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || inputValue === ''}
                  className="flex-1 py-3 rounded-xl bg-accent text-accent-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] disabled:opacity-40 transition-all"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Kaydediliyor...' : scores[editingArtwork] ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
