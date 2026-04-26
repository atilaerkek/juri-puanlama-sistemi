import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { Juror, Score } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { ROUTE_PATHS, normalizeScore, computeFinalScore, formatScore, getRankBadge } from '@/lib/index';
import type { ArtworkResult, ScoreEntry } from '@/lib/index';
import {
  LogOut, Download, Trophy, Users, BarChart3, RefreshCw,
  ChevronUp, ChevronDown, Eye, EyeOff, Settings, Save, X
} from 'lucide-react';
import { toast } from 'sonner';

type SortField = 'rank' | 'artwork' | 'score' | 'scored_count';
type SortDir = 'asc' | 'desc';
type TabType = 'results' | 'detail' | 'jurors' | 'settings';

export default function AdminPanel() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [jurors, setJurors] = useState<Juror[]>([]);
  const [allScores, setAllScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabType>('results');
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [showScores, setShowScores] = useState(true);
  const [editingJuror, setEditingJuror] = useState<Juror | null>(null);
  const [editPin, setEditPin] = useState('');
  const [editMaxScore, setEditMaxScore] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [newAdminPin, setNewAdminPin] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [jurorsRes, scoresRes] = await Promise.all([
      supabase.from('jurors').select('*').order('group_name'),
      supabase.from('scores').select('*'),
    ]);
    if (jurorsRes.error) toast.error('Jüriler yüklenemedi');
    else setJurors(jurorsRes.data || []);
    if (scoresRes.error) toast.error('Puanlar yüklenemedi');
    else setAllScores(scoresRes.data || []);
    setLoading(false);
  };

  // Build artwork results
  const artworkResults = useCallback((): ArtworkResult[] => {
    const map: Record<number, { scores: ScoreEntry[] }> = {};
    for (let i = 1; i <= 50; i++) map[i] = { scores: [] };

    allScores.forEach((s) => {
      const j = jurors.find((jj) => jj.id === s.juror_id);
      if (!j) return;
      map[s.artwork_number].scores.push({
        id: s.id,
        juror_id: s.juror_id,
        juror_name: j.name,
        artwork_number: s.artwork_number,
        score: s.score,
        max_score: j.max_score,
        normalized: normalizeScore(s.score, j.max_score),
        note: s.note,
        created_at: s.created_at,
        updated_at: s.updated_at,
      });
    });

    const results: ArtworkResult[] = Object.entries(map).map(([num, val]) => ({
      artwork_number: parseInt(num),
      scores: val.scores,
      final_score: computeFinalScore(val.scores.map((s) => ({ score: s.score, max_score: s.max_score }))),
      scored_count: val.scores.length,
      rank: 0,
    }));

    // Sort by final score desc and assign rank (only for scored items)
    const scored = results.filter((r) => r.scored_count > 0).sort((a, b) => b.final_score - a.final_score);
    scored.forEach((r, i) => { r.rank = i + 1; });

    return results;
  }, [allScores, jurors]);

  const sortedResults = useCallback(() => {
    const results = artworkResults().filter((r) => r.scored_count > 0 || tab === 'results');
    return [...results].sort((a, b) => {
      let diff = 0;
      if (sortField === 'rank') diff = (a.rank || 999) - (b.rank || 999);
      else if (sortField === 'artwork') diff = a.artwork_number - b.artwork_number;
      else if (sortField === 'score') diff = b.final_score - a.final_score;
      else if (sortField === 'scored_count') diff = b.scored_count - a.scored_count;
      return sortDir === 'asc' ? diff : -diff;
    });
  }, [artworkResults, sortField, sortDir, tab]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 opacity-20" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-accent" /> : <ChevronDown className="w-3 h-3 text-accent" />;
  };

  // Stats
  const totalScored = allScores.length;
  const totalPossible = 50 * jurors.length;
  const completedArtworks = artworkResults().filter((r) => r.scored_count === jurors.length).length;
  const topArtwork = artworkResults().filter((r) => r.scored_count > 0).sort((a, b) => b.final_score - a.final_score)[0];

  // Export CSV
  const exportCSV = () => {
    const results = artworkResults().filter((r) => r.scored_count > 0).sort((a, b) => a.rank - b.rank);
    const header = ['Sıra', 'Eser No', 'Final Puan (100 üzerinden)', 'Puanlayan Jüri Sayısı',
      ...jurors.map((j) => `${j.name} (${j.max_score} üzerinden)`)].join(',');
    const rows = results.map((r) => {
      const jurorScores = jurors.map((j) => {
        const s = r.scores.find((sc) => sc.juror_id === j.id);
        return s ? `${s.score}/${j.max_score}` : '-';
      });
      return [r.rank, r.artwork_number, formatScore(r.final_score), r.scored_count, ...jurorScores].join(',');
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `juri_puanlama_sonuclari_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV dosyası indirildi');
  };

  // Save juror settings
  const saveJurorEdit = async () => {
    if (!editingJuror) return;
    setSavingSettings(true);
    const updates: Record<string, unknown> = {};
    if (editPin.trim()) updates.pin = editPin.trim();
    if (editMaxScore.trim()) {
      const n = parseInt(editMaxScore);
      if (isNaN(n) || n < 1 || n > 100) { toast.error('Geçersiz puan limiti'); setSavingSettings(false); return; }
      updates.max_score = n;
    }
    const { error } = await supabase.from('jurors').update(updates).eq('id', editingJuror.id);
    if (error) toast.error('Güncelleme başarısız');
    else { toast.success('Jüri bilgileri güncellendi'); fetchAll(); setEditingJuror(null); }
    setSavingSettings(false);
  };

  const saveAdminPin = async () => {
    if (newAdminPin.length < 4) { toast.error('PIN en az 4 haneli olmalıdır'); return; }
    setSavingSettings(true);
    const { error } = await supabase.from('admin_config').update({ admin_pin: newAdminPin }).neq('id', '');
    if (error) toast.error('Admin PIN güncellenemedi');
    else { toast.success('Admin PIN güncellendi'); setNewAdminPin(''); setAdminPin(''); }
    setSavingSettings(false);
  };

  const handleLogout = () => { logout(); navigate(ROUTE_PATHS.HOME); };

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'results', label: 'Sıralama', icon: Trophy },
    { id: 'detail', label: 'Detay', icon: BarChart3 },
    { id: 'jurors', label: 'Jüriler', icon: Users },
    { id: 'settings', label: 'Ayarlar', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/90 border-b border-border backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
              <Trophy className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Admin Paneli</p>
              <p className="text-xs text-muted-foreground">{totalScored} / {totalPossible} puan girildi</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAll}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Yenile"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">CSV İndir</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Çıkış</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Toplam Puan', value: totalScored, sub: `/ ${totalPossible}`, color: 'text-primary' },
            { label: 'Tam Puanlanan', value: completedArtworks, sub: '/ 50 eser', color: 'text-green-500' },
            { label: 'Jüri Sayısı', value: jurors.length, sub: '6 jüri', color: 'text-accent' },
            { label: 'Birinci Eser', value: topArtwork ? `#${topArtwork.artwork_number}` : '-', sub: topArtwork ? `${formatScore(topArtwork.final_score)} puan` : 'Henüz yok', color: 'text-amber-500' },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4">
              <p className={`text-2xl font-mono font-bold ${s.color}`}>{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="text-xs text-muted-foreground/60">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-xl p-1 mb-6 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                tab === t.id ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Results (Ranking) */}
        {tab === 'results' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="font-semibold text-foreground">Final Sıralaması</h2>
                <button
                  onClick={() => setShowScores((v) => !v)}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showScores ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showScores ? 'Puanları Gizle' : 'Puanları Göster'}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                        <button onClick={() => toggleSort('rank')} className="flex items-center gap-1 hover:text-foreground">
                          Sıra <SortIcon field="rank" />
                        </button>
                      </th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                        <button onClick={() => toggleSort('artwork')} className="flex items-center gap-1 hover:text-foreground">
                          Eser No <SortIcon field="artwork" />
                        </button>
                      </th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                        <button onClick={() => toggleSort('score')} className="flex items-center gap-1 hover:text-foreground">
                          Final Puan <SortIcon field="score" />
                        </button>
                      </th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                        <button onClick={() => toggleSort('scored_count')} className="flex items-center gap-1 hover:text-foreground">
                          Jüri <SortIcon field="scored_count" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={4} className="text-center py-12 text-muted-foreground">Yükleniyor...</td></tr>
                    ) : sortedResults().filter(r => r.scored_count > 0).length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-12 text-muted-foreground">Henüz puan girilmedi</td></tr>
                    ) : (
                      sortedResults().filter(r => r.scored_count > 0).map((r) => (
                        <tr key={r.artwork_number} className={`border-t border-border/50 hover:bg-muted/30 transition-colors ${r.rank <= 3 ? 'bg-accent/5' : ''}`}>
                          <td className="px-4 py-3 font-mono font-bold text-lg">
                            <span>{getRankBadge(r.rank)}</span>
                          </td>
                          <td className="px-4 py-3 font-mono font-semibold text-foreground">#{r.artwork_number}</td>
                          <td className="px-4 py-3">
                            {showScores ? (
                              <div className="flex items-center gap-3">
                                <span className="font-mono font-bold text-accent text-base">{formatScore(r.final_score)}</span>
                                <div className="flex-1 max-w-[120px] bg-muted rounded-full h-2">
                                  <div className="h-2 rounded-full bg-accent" style={{ width: `${r.final_score}%` }} />
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">••••</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`font-mono text-sm ${r.scored_count === jurors.length ? 'text-green-500' : 'text-amber-500'}`}>
                              {r.scored_count}/{jurors.length}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab: Detail */}
        {tab === 'detail' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-border">
                <h2 className="font-semibold text-foreground">Jüri Bazlı Detay</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Her jürinin puanladığı eserler</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium w-20">Eser</th>
                      {jurors.map((j) => (
                        <th key={j.id} className="text-left px-3 py-3 text-muted-foreground font-medium min-w-[120px]">
                          <div className="truncate max-w-[120px]" title={j.name}>{j.name.split(' ')[0]}</div>
                          <div className="text-xs opacity-60">/{j.max_score}</div>
                        </th>
                      ))}
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">Final</th>
                    </tr>
                  </thead>
                  <tbody>
                    {artworkResults()
                      .filter((r) => r.scored_count > 0)
                      .sort((a, b) => a.rank - b.rank)
                      .map((r) => (
                        <tr key={r.artwork_number} className="border-t border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-2.5 font-mono font-bold text-foreground">#{r.artwork_number}</td>
                          {jurors.map((j) => {
                            const s = r.scores.find((sc) => sc.juror_id === j.id);
                            return (
                              <td key={j.id} className="px-3 py-2.5">
                                {s ? (
                                  <span className="font-mono text-accent font-medium">{formatScore(s.score, 1)}</span>
                                ) : (
                                  <span className="text-muted-foreground/40">—</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-4 py-2.5 font-mono font-bold text-accent">{formatScore(r.final_score)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab: Jurors */}
        {tab === 'jurors' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {jurors.map((j) => {
              const jScores = allScores.filter((s) => s.juror_id === j.id);
              const pct = Math.round((jScores.length / 50) * 100);
              return (
                <div key={j.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
                    <span className="font-bold text-primary-foreground text-sm">{j.group_name}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{j.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex-1 bg-muted rounded-full h-1.5 max-w-[160px]">
                        <div className="h-1.5 rounded-full bg-accent" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground">{jScores.length}/50</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm text-muted-foreground">Maks. Puan</p>
                    <p className="font-mono font-bold text-foreground">{j.max_score}</p>
                  </div>
                  <button
                    onClick={() => { setEditingJuror(j); setEditPin(''); setEditMaxScore(String(j.max_score)); }}
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Tab: Settings */}
        {tab === 'settings' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-md space-y-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-1">Admin PIN Değiştir</h3>
              <p className="text-xs text-muted-foreground mb-4">Mevcut admin şifresini güncelleyin</p>
              <input
                type="password"
                placeholder="Yeni admin PIN (min. 4 hane)"
                value={newAdminPin}
                onChange={(e) => setNewAdminPin(e.target.value)}
                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm font-mono text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 mb-3"
              />
              <button
                onClick={saveAdminPin}
                disabled={savingSettings || newAdminPin.length < 4}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 transition-all"
              >
                <Save className="w-4 h-4" />
                {savingSettings ? 'Kaydediliyor...' : 'Admin PIN Güncelle'}
              </button>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-1">Veri Dışa Aktarma</h3>
              <p className="text-xs text-muted-foreground mb-4">Tüm puanlama verilerini CSV formatında indirin</p>
              <button
                onClick={exportCSV}
                className="w-full py-3 rounded-xl bg-accent text-accent-foreground font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all"
              >
                <Download className="w-4 h-4" />
                CSV İndir (Excel'de Açılır)
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Edit Juror Modal */}
      {editingJuror && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={(e) => { if (e.target === e.currentTarget) setEditingJuror(null); }}
        >
          <motion.div
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs text-muted-foreground">JÜRİ AYARLARI</p>
                <h3 className="font-semibold text-foreground text-lg mt-0.5">{editingJuror.name}</h3>
              </div>
              <button onClick={() => setEditingJuror(null)} className="p-2 rounded-xl hover:bg-muted text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Yeni PIN <span className="text-muted-foreground font-normal">(boş bırakırsanız değişmez)</span></label>
                <input
                  type="text"
                  placeholder="Yeni PIN..."
                  value={editPin}
                  onChange={(e) => setEditPin(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 font-mono text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Maksimum Puan</label>
                <input
                  type="number"
                  value={editMaxScore}
                  onChange={(e) => setEditMaxScore(e.target.value)}
                  min={1}
                  max={100}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 font-mono text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditingJuror(null)} className="flex-1 py-3 rounded-xl bg-muted text-muted-foreground font-medium text-sm">İptal</button>
              <button
                onClick={saveJurorEdit}
                disabled={savingSettings}
                className="flex-1 py-3 rounded-xl bg-accent text-accent-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40"
              >
                <Save className="w-4 h-4" />
                {savingSettings ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
