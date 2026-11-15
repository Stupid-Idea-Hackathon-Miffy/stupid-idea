import { useCallback, useEffect, useRef, useState } from 'react';
import { reels } from './data/reels.js';
import Sidebar from './components/Sidebar.jsx';
import ReelCard from './components/ReelCard.jsx';
import ActionRail from './components/ActionRail.jsx';
import VibeMatch from './components/VibeMatch.jsx';
import Pager from './components/Pager.jsx';
import { ProfilePage, MatchesPage, ConnectionsPage } from './components/BackendPages.jsx';
import { getProfile, saveProfile, getLikes, setLike, getMatches, getConnections, getRouletteState, spinAdd, spinRejection, dismissMatch, getProfileReels, setProfileReel } from './lib/backend.js';
import { RouletteModal } from './components/RouletteModal.jsx';
import './backend.css';
import './reel-layout.css';

export default function App() {
  const [index, setIndex] = useState(0);
  const [page, setPage] = useState('reels');
  const [profile, setProfile] = useState(null);
  const [likedIds, setLikedIds] = useState([]);
  const [profileReels, setProfileReels] = useState([]);
  const [matches, setMatches] = useState([]);
  const [connections, setConnections] = useState([]);
  const [rouletteStates, setRouletteStates] = useState([]);
  const [roulette, setRoulette] = useState(null);
  const [draftReel, setDraftReel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);

  const refresh = useCallback(async () => {
    const [found, requests, states, pins] = await Promise.all([getMatches(), getConnections(), getRouletteState(), getProfileReels()]);
    setProfileReels(pins || []);
    setRouletteStates(states || []);
    setMatches(found || []); setConnections(requests || []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await getProfile();
        if (cancelled) return;
        if (p) {
          const [likes, found, requests, states, pins] = await Promise.all([getLikes(), getMatches(), getConnections(), getRouletteState(), getProfileReels()]);
          if (cancelled) return;
          setProfileReels(pins || []); setRouletteStates(states || []); setLikedIds(likes); setMatches(found || []); setConnections(requests || []); setProfile(p);
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
    if (['matches', 'messages', 'profile'].includes(next)) run(refresh);
  }
  const go = useCallback(delta => setIndex(i => (i + delta + reels.length) % reels.length), []);
  useEffect(() => {
    if (page !== 'reels' || !profile || !reels.length || roulette) return;
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
  }, [go,page,profile,roulette]);

  // Refresh incoming requests while a visitor is on a relevant screen.
  useEffect(() => {
    if (!profile || !['matches','messages'].includes(page)) return;
    const timer = setInterval(() => { if (!lock.current) run(refresh); }, 5000);
    return () => clearInterval(timer);
  }, [profile,page,refresh]);

  const reel = reels[index];
  const reelId = String(reel?.id);
  const liked = likedIds.includes(reelId);
  const ownReels = profileReels.filter(r => r.user_id === profile?.id);
  const pinned = ownReels.some(r => r.reel_id === reelId);
  const toggleProfileReel = (id, add) => run(async () => {
    await setProfileReel(id, add);
    setProfileReels(await getProfileReels() || []);
  });
  const toggleLike = () => run(async () => {
    if (!reel) return;
    const next = !liked;
    await setLike(reelId,next);
    setLikedIds(old => next ? [...new Set([...old,reelId])] : old.filter(id => id !== reelId));
    await refresh();
  });
  const onSave = values => run(async () => { const p = await saveProfile(values); setProfile(p); setPage('reels'); await refresh(); });
  const onSpin = (target, action) => setRoulette({target, action});
  const doSpin = async () => {
    const result = await (roulette.action === 'add' ? spinAdd : spinRejection)(roulette.target.id);
    try { await refresh(); } catch (e) { setError(e.message); }
    return result;
  };
  const onDismiss = id => { if (window.confirm('stop contact with this person?')) run(async () => { await dismissMatch(id); await refresh(); }); };
  const onSendFromFeed = () => { setDraftReel(reelId); navigate('messages'); };

  if (loading) return <div className="backend-loading">loading…</div>;
  if (!profile && error && page !== 'profile') return <div className="backend-loading"><p role="alert">{error}</p><button className="backend-primary" onClick={() => window.location.reload()}>try again</button></div>;
  if (!profile) return <div className="backend-onboarding">{error && <div className="backend-error" role="alert">{error}</div>}<ProfilePage onSave={onSave} busy={busy} /></div>;

  return <div className="app backend-app">
    <Sidebar active={page} onNavigate={navigate} matchCount={matches.length} />
    {error && <div className="backend-error backend-toast" role="alert">{error}<button onClick={() => setError('')} aria-label="dismiss error">×</button></div>}
    {page === 'profile' ? <main className="backend-page-wrap"><ProfilePage key={profile.id} profile={profile} onSave={onSave} busy={busy} reels={reels} profileReels={ownReels} onRemove={id => toggleProfileReel(id, false)} onScroll={() => navigate('reels')} /></main>
    : page === 'matches' ? <main className="backend-page-wrap"><MatchesPage matches={matches} rouletteStates={rouletteStates} onSpin={onSpin} onDismiss={onDismiss} onScroll={() => navigate('reels')} busy={busy} reels={reels} profileReels={profileReels} /></main>
    : page === 'messages' ? <main className="backend-page-wrap"><ConnectionsPage connections={connections} rouletteStates={rouletteStates} onSpin={onSpin} onDismiss={onDismiss} onRefresh={() => run(refresh)} busy={busy} profile={profile} reels={reels} draftReel={draftReel} clearDraft={() => setDraftReel(null)} /></main>
    : <main className="stage backend-stage web-reels-stage">
      <VibeMatch match={matches[0]} likeCount={likedIds.length} onOpen={() => navigate('matches')} />
      {reel ? <><div className="web-reel-focus"><ReelCard key={reelId} reel={reel} onDoubleClick={() => { if (!liked) toggleLike(); }} />
      <ActionRail likes={Number(reel.likes || 0) + (liked ? 1 : 0)} liked={liked} pinned={pinned} busy={busy} onLike={toggleLike} onSend={onSendFromFeed} onPin={() => toggleProfileReel(reelId, !pinned)} /></div>
      <Pager onPrev={() => go(-1)} onNext={() => go(1)} /></> : <p>no reels yet</p>}
      <button className="backend-mobile-match" onClick={() => navigate('matches')}>{matches.length ? `${matches.length} ${matches.length === 1 ? 'match' : 'matches'}` : `${likedIds.length} reels liked`}</button>
    </main>}
    {roulette && <RouletteModal key={`${roulette.target.id}-${roulette.action}`} action={roulette.action} target={roulette.target} onSpin={doSpin} onClose={() => setRoulette(null)} />}
  </div>;
}
