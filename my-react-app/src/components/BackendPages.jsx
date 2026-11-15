import { useEffect, useRef, useState } from 'react';
import { getReelMessages, sendReel } from '../lib/backend.js';

export function ProfilePage({ profile, onSave, busy }) {
  const [name, setName] = useState(profile?.name || '');
  const [age, setAge] = useState(profile?.age || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [interests, setInterests] = useState(profile?.interests?.join(', ') || '');
  const [avatar, setAvatar] = useState(profile?.avatar || '🫠');
  return <section className="backend-page profile-page">
    <p className="backend-kicker">REELMATE / PROFILE</p>
    <h1>{profile ? 'Your profile' : 'Find your brain rot soulmate.'}</h1>
    <p className="backend-muted">18+ hackathon demo. Please use fictional details. No email required.</p>
    <form onSubmit={e => { e.preventDefault(); onSave({ name, age, bio, avatar, interests: interests.split(',').map(x => x.trim()).filter(Boolean).slice(0,12) }); }}>
      <div className="backend-avatars" aria-label="Choose an avatar">
        {['🫠','🐱','🐶','🦝','🐸','🦜','👽','🤡'].map(a => <button type="button" key={a} aria-label={`Avatar ${a}`} aria-pressed={a === avatar} className={a === avatar ? 'chosen' : ''} onClick={() => setAvatar(a)}>{a}</button>)}
      </div>
      <label>Display name<input required maxLength={60} value={name} onChange={e => setName(e.target.value)} placeholder="Your name" /></label>
      <label>Age<input required type="number" min={18} max={99} value={age} onChange={e => setAge(e.target.value)} placeholder="18+" /></label>
      <label>Bio<textarea maxLength={300} value={bio} onChange={e => setBio(e.target.value)} placeholder="My love language is sending reels..." /></label>
      <label>Interests (comma-separated)<input maxLength={250} value={interests} onChange={e => setInterests(e.target.value)} placeholder="Cats, gaming, memes" /></label>
      <button className="backend-primary" disabled={busy || !name.trim()} type="submit">{busy ? 'Saving…' : profile ? 'Save profile' : 'Start doomscrolling →'}</button>
    </form>
  </section>;
}

function useClock() {
  const [now,setNow] = useState(Date.now());
  useEffect(() => { const t=setInterval(() => setNow(Date.now()),1000); return () => clearInterval(t); },[]);
  return now;
}
function timeLeft(until,now) {
  const seconds=Math.max(0,Math.ceil((new Date(until || 0).getTime()-now)/1000));
  if (!seconds) return '';
  const d=Math.floor(seconds/86400), h=Math.floor(seconds%86400/3600), m=Math.floor(seconds%3600/60), s=seconds%60;
  return d ? `${d}d ${h}h ${m}m` : h ? `${h}h ${m}m` : m ? `${m}m ${s}s` : `${s}s`;
}
function MatchActions({target,status,incoming,rouletteStates,onSpin,onDismiss,busy,now,onOpen}) {
  const state=rouletteStates.find(s=>s.target_id===target.id);
  const addLock=timeLeft(state?.add_locked_until,now), rejectLock=timeLeft(state?.locked_until,now);
  return <div className="roulette-actions">
    {(!status || (status==='pending' && incoming)) ? <button className="backend-primary" disabled={busy || !!addLock} onClick={()=>onSpin(target,'add')}>{addLock ? `Add locked · ${addLock}` : incoming ? '🎰 Gamble to accept' : '🎰 Gamble to add'}</button> : status==='accepted' && onOpen ? <button className="backend-primary" onClick={onOpen}>Send reels ♡</button> : <p className="backend-muted">{status==='accepted'?'Connected ♡':status==='pending'?'Request pending': 'Request declined'}</p>}
    {status!=='declined' && <button className="backend-secondary" disabled={busy || !!rejectLock} onClick={()=>onSpin(target,'reject')}>{rejectLock?`Reject locked · ${rejectLock}`:'🎲 Reject roulette'}</button>}
    <button className="quiet-block" disabled={busy} onClick={()=>onDismiss(target.id)}>{incoming && status==='pending'?'Decline / block privately':'Hide / block privately'}</button>
  </div>;
}
export function MatchesPage({matches,rouletteStates,onSpin,onDismiss,onScroll,busy,reels}) {
  const now=useClock();
  return <section className="backend-page">
    <p className="backend-kicker">THE ALGORITHM HAS SPOKEN</p><h1>Your vibe matches</h1>
    <p className="backend-muted">67% or higher. Finding love was never supposed to be this easy.</p>
    {!matches.length ? <div className="backend-card"><h2>No matches yet 🫠</h2><p>Like at least two reels to give the algorithm something to work with.</p><button className="backend-primary" onClick={onScroll}>Back to doomscrolling</button></div> :
      <div className="backend-grid">{matches.map(m => <article className="backend-card" key={m.id}>
        <div className="backend-match-head"><span className="backend-avatar">{m.avatar}</span><strong className="backend-score">{m.score}%</strong></div>
        <h2>{m.name}, {m.age}{m.is_demo && <small className="backend-demo">Demo profile</small>}</h2>
        <p>{m.bio}</p><div className="backend-tags">{m.interests.map((i,n) => <span key={n}>{i}</span>)}</div>
        <p className="backend-muted">{m.shared_reels.length} shared likes</p>
        <div className="backend-shared">{m.shared_reels.map(id => { const r = reels.find(x => String(x.id) === id); return <span key={id} title={r?.caption || 'Reel'}>{r?.emoji || '🎬'}</span>; })}</div>
        <MatchActions target={m} status={m.connection_status} rouletteStates={rouletteStates} onSpin={onSpin} onDismiss={onDismiss} busy={busy} now={now}/>
      </article>)}</div>}
  </section>;
}
function MiniReel({reel}) {
  if(!reel) return <div className="chat-preview">🎬 Reel unavailable</div>;
  return <div className="chat-preview">{reel.video ? <video src={reel.video} controls playsInline preload="metadata"/> : <div className="chat-emoji">{reel.emoji || '🎬'}</div>}<p>{reel.caption}</p></div>;
}
function ReelChat({connection,profile,reels,draftReel,clearDraft}) {
  const [messages,setMessages]=useState([]),[selected,setSelected]=useState(draftReel||''),[sending,setSending]=useState(false),[error,setError]=useState(''),[loaded,setLoaded]=useState(false);
  const sendLock=useRef(false),requestVersion=useRef(0),active=useRef(true);
  useEffect(()=>{active.current=true;return()=>{active.current=false;};},[]);
  useEffect(()=>{
    let cancelled=false;
    async function load(){ const version=++requestVersion.current;try{const rows=await getReelMessages(connection.other_id);if(!cancelled && version===requestVersion.current){setMessages(rows||[]);setLoaded(true);}}catch(e){if(!cancelled)setError(e.message);}}
    load();const t=setInterval(load,2500);return()=>{cancelled=true;clearInterval(t);};
  },[connection.other_id]);
  async function send(){
    if(sendLock.current || !reels.some(r=>String(r.id)===selected))return;
    sendLock.current=true;setSending(true);setError('');
    try{await sendReel(connection.other_id,selected);if(!active.current)return;setSelected('');clearDraft();const version=++requestVersion.current;const rows=await getReelMessages(connection.other_id);if(active.current && version===requestVersion.current){setMessages(rows||[]);setLoaded(true);}}
    catch(e){if(active.current)setError(e.message);}finally{sendLock.current=false;if(active.current)setSending(false);}
  }
  return <div className="backend-card reel-chat">
    <h2>{connection.avatar} {connection.name}{connection.is_demo && <small className="backend-demo">Fictional profile · automated reel replies</small>}</h2>
    <div className="chat-history" aria-live="polite">{!loaded ? <p className="backend-muted">Loading reels…</p>:!messages.length?<p className="backend-muted">Break the ice with a reel. Words are forbidden.</p>:messages.map(m=><div className={`chat-bubble ${m.sender_id===profile.id?'mine':'theirs'}`} key={m.id}><MiniReel reel={reels.find(r=>String(r.id)===m.reel_id)}/><small>{new Date(m.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</small></div>)}</div>
    <div className="chat-disabled">🔒 <s>Type a message...</s><small>Please express your feelings in MP4 format.</small></div>
    {error && <p className="backend-error" role="alert">{error}</p>}
    <label>Choose a reel<select value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Select your emotional support reel</option>{reels.map(r=><option key={r.id} value={String(r.id)}>{r.emoji||'🎬'} {r.caption}</option>)}</select></label>
    <button className="backend-primary" disabled={!selected||sending} onClick={send}>{sending?'Sending…':'Send reel 💌'}</button>
  </div>;
}
export function ConnectionsPage({connections,rouletteStates,onSpin,onDismiss,onRefresh,busy,profile,reels,draftReel,clearDraft}) {
  const [selected,setSelected]=useState(null),now=useClock();
  const connection=connections.find(c=>c.other_id===selected && c.status==='accepted');
  return <section className="backend-page"><p className="backend-kicker">VERBAL COMMUNICATION NOT SUPPORTED</p><h1>Messages</h1><p className="backend-muted">You may only communicate with your rotmates through reels.</p>
    {draftReel && !connection && <p className="backend-card">Choose a connected rotmate to send your reel.<button className="backend-secondary" onClick={clearDraft}>Cancel send</button></p>}
    {connection ? <><button className="backend-secondary" onClick={()=>setSelected(null)}>← All rotmates</button><ReelChat key={connection.other_id} connection={connection} profile={profile} reels={reels} draftReel={draftReel} clearDraft={clearDraft}/><MatchActions target={{...connection,id:connection.other_id}} status="accepted" rouletteStates={rouletteStates} onSpin={onSpin} onDismiss={onDismiss} busy={busy} now={now}/></> : <>
      <button className="backend-secondary" onClick={onRefresh} disabled={busy}>Refresh connections</button>
      {!connections.length && <div className="backend-card">No connections yet. Gamble for a match first.</div>}
      {connections.map(c=><article className="backend-card" key={c.id}><div className="backend-request"><span className="backend-avatar">{c.avatar}</span><div><h2>{c.name}{c.is_demo && <small className="backend-demo">Demo profile</small>}</h2><p className="backend-muted">{c.status==='pending'?(c.incoming?'Incoming request':'Request sent'):c.status}</p></div></div><MatchActions target={{...c,id:c.other_id}} status={c.status} incoming={c.incoming} rouletteStates={rouletteStates} onSpin={onSpin} onDismiss={onDismiss} busy={busy} now={now} onOpen={()=>setSelected(c.other_id)}/></article>)}
    </>}
  </section>;
}
