import { useCallback, useEffect, useRef, useState } from 'react';
import { reels } from './data/reels.js';
import Sidebar from './components/Sidebar.jsx';
import ReelCard from './components/ReelCard.jsx';
import ActionRail from './components/ActionRail.jsx';
import VibeMatch from './components/VibeMatch.jsx';
import Pager from './components/Pager.jsx';
import { ProfilePage, MatchesPage, ConnectionsPage } from './components/BackendPages.jsx';
import { getProfile, saveProfile, getLikes, setLike, getMatches, getConnections, sendConnection, respondConnection } from './lib/backend.js';
import './backend.css';

export default function App() {
  const [index, setIndex] = useState(0);
  const [page, setPage] = useState('reels');
  const [profile, setProfile] = useState(null);
  const [likedIds, setLikedIds] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [matches, setMatches] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);

  const refresh = useCallback(async () => {
    const [found, requests] = await Promise.all([getMatches(), getConnections()]);
    setMatches(found || []); setConnections(requests || []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await getProfile();
        if (cancelled) return;
        if (p) {
          const [likes, found, requests] = await Promise.all([getLikes(), getMatches(), getConnections()]);
          if (cancelled) return;
          setLikedIds(likes); setMatches(found || []); setConnections(requests || []); setProfile(p);
        } else setPage('profile');
      } catch (e) { if (!cancelled) setError(e.message); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  async function run(task) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { await task(); }
    catch (e) { setError(e.message); }
    finally { lock.current = false; setBusy(false); }
  }

  function navigate(next) {
    if (!profile) return;
    setPage(next === 'home' ? 'reels' : next);
    if (next === 'matches' || next === 'messages') run(refresh);
  }
  const go = useCallback(delta => setIndex(i => (i + delta + reels.length) % reels.length), []);
  useEffect(() => {
    if (page !== 'reels' || !profile || !reels.length) return;
    let locked = false; let timer;
    const onKey = e => {
      if (e.target.closest('input, textarea, select, button')) return;
      if (e.key === 'ArrowDown') go(1);
      if (e.key === 'ArrowUp') go(-1);
    };
    const onWheel = e => {
      if (locked || Math.abs(e.deltaY) < 40) return;
      locked = true; go(e.deltaY > 0 ? 1 : -1); timer = setTimeout(() => { locked = false; }, 400);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('wheel', onWheel); clearTimeout(timer); };
  }, [go,page,profile]);

  // Refresh incoming requests while a visitor is on a relevant screen.
  useEffect(() => {
    if (!profile || !['matches','messages'].includes(page)) return;
    const timer = setInterval(() => { if (!lock.current) run(refresh); }, 5000);
    return () => clearInterval(timer);
  }, [profile,page,refresh]);

  const reel = reels[index];
  const reelId = String(reel?.id);
  const liked = likedIds.includes(reelId);
  const saved = savedIds.includes(reelId);
  const toggleLike = () => run(async () => {
    if (!reel) return;
    const next = !liked;
    await setLike(reelId,next);
    setLikedIds(old => next ? [...new Set([...old,reelId])] : old.filter(id => id !== reelId));
    await refresh();
  });
  const toggleSave = () => setSavedIds(old => old.includes(reelId) ? old.filter(id => id !== reelId) : [...old,reelId]);
  const onSave = values => run(async () => { const p = await saveProfile(values); setProfile(p); setPage('reels'); await refresh(); });
  const onConnect = id => run(async () => { await sendConnection(id); await refresh(); });
  const onRespond = (id,accept) => run(async () => { await respondConnection(id,accept); await refresh(); });

  if (loading) return <div className="backend-loading">Loading ReelMate… 🫠</div>;
  if (!profile && error && page !== 'profile') return <div className="backend-loading"><p role="alert">{error}</p><button className="backend-primary" onClick={() => window.location.reload()}>Try again</button></div>;
  if (!profile) return <div className="backend-onboarding">{error && <div className="backend-error" role="alert">{error}</div>}<ProfilePage onSave={onSave} busy={busy} /></div>;

  return <div className="app backend-app">
    <Sidebar active={page} onNavigate={navigate} matchCount={matches.length} />
    {error && <div className="backend-error backend-toast" role="alert">{error}<button onClick={() => setError('')} aria-label="Dismiss error">×</button></div>}
    {page === 'profile' ? <main className="backend-page-wrap"><ProfilePage key={profile.id} profile={profile} onSave={onSave} busy={busy} /></main>
    : page === 'matches' ? <main className="backend-page-wrap"><MatchesPage matches={matches} onConnect={onConnect} onScroll={() => navigate('reels')} busy={busy} reels={reels} /></main>
    : page === 'messages' ? <main className="backend-page-wrap"><ConnectionsPage connections={connections} onRespond={onRespond} onRefresh={() => run(refresh)} busy={busy} /></main>
    : <main className="stage backend-stage">
      <VibeMatch match={matches[0]} likeCount={likedIds.length} onOpen={() => navigate('matches')} />
      {reel ? <><ReelCard key={reelId} reel={reel} onDoubleClick={() => { if (!liked) toggleLike(); }} />
      <ActionRail likes={Number(reel.likes || 0) + (liked ? 1 : 0)} liked={liked} saved={saved} onLike={toggleLike} onSave={toggleSave} />
      <Pager onPrev={() => go(-1)} onNext={() => go(1)} /></> : <p>No reels yet.</p>}
      <button className="backend-mobile-match" onClick={() => navigate('matches')}>{matches.length ? `${matches.length} vibe match(es) ♡` : `${likedIds.length} reels liked`}</button>
    </main>}
  </div>;
}
