import { useEffect, useRef, useState } from 'react';
import { getReelMessages, sendReel } from '../lib/backend.js';
import '../chat-picker.css';
import Avatar, { avatarOptions, normalizeAvatar } from './Avatar.jsx';

export function ProfilePage({ profile, onSave, busy, reels = [], profileReels = [], onRemove, onScroll }) {
  const [name, setName] = useState(profile?.name || '');
  const [age, setAge] = useState(profile?.age || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [interests, setInterests] = useState(profile?.interests?.join(', ') || '');
  const [avatar, setAvatar] = useState(() => normalizeAvatar(profile?.avatar));
  return <section className="backend-page profile-page">
    
    <h1>{profile ? 'ur profile' : 'make ur profile'}</h1>
    <p className="backend-muted">18+ demo • use fake details pls</p>
    <form onSubmit={e => { e.preventDefault(); onSave({ name, age, bio, avatar, interests: interests.split(',').map(x => x.trim()).filter(Boolean).slice(0,12) }); }}>
      <div className="backend-avatars" aria-label="pick an avatar">
        {avatarOptions.map((a, i) => <button type="button" key={a} aria-label={`profile picture ${i + 1}`} aria-pressed={a === avatar} className={a === avatar ? 'chosen' : ''} onClick={() => setAvatar(a)}><Avatar value={a} /></button>)}
      </div>
      <label>display name<input required maxLength={60} value={name} onChange={e => setName(e.target.value)} placeholder="ur name" /></label>
      <label>age<input required type="number" min={18} max={99} value={age} onChange={e => setAge(e.target.value)} placeholder="18+" /></label>
      <label>bio<textarea maxLength={300} value={bio} onChange={e => setBio(e.target.value)} placeholder="tell us abt urself" /></label>
      <label>interests (separate with commas)<input maxLength={250} value={interests} onChange={e => setInterests(e.target.value)} placeholder="cats, gaming, memes" /></label>
      <button className="backend-primary" disabled={busy || !name.trim()} type="submit">{busy ? 'saving…' : profile ? 'save profile' : 'start scrolling →'}</button>
    </form>
    {profile && <section className="backend-card profile-reels-section"><div className="profile-reels-heading"><div><h2>ur reels</h2></div><span className="profile-reel-count">{profileReels.length}</span></div><p className="backend-muted">reels that are literally u</p><ProfileReels entries={profileReels} reels={reels} onRemove={onRemove} busy={busy}/>{!profileReels.length && <button type="button" className="backend-secondary" onClick={onScroll}>find reels to add →</button>}</section>}
  </section>;
}

function ProfileReels({entries, reels, onRemove, busy}) {
  if (!entries.length) return <p className="backend-muted profile-reels-empty">no reels yet</p>;
  return <div className="profile-reels-grid">{entries.map(entry => {
    const r = reels.find(x => String(x.id) === entry.reel_id);
    return <article className="profile-reel-tile" key={entry.reel_id}>
      <div className="profile-reel-media">{r?.video ? <video src={r.video} controls playsInline preload="metadata"/> : <span>{r?.emoji || '🎬'}</span>}</div>
      <p>{r?.caption || 'reel unavailable'}</p>
      {onRemove && <button type="button" className="backend-secondary profile-reel-remove" disabled={busy} onClick={() => onRemove(entry.reel_id)}>remove</button>}
    </article>;
  })}</div>;
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
function MatchActions({target,status,incoming,rouletteStates,onSpin,onDismiss,busy,now,onOpen,plainLabels=false}) {
  const state=rouletteStates.find(s=>s.target_id===target.id);
  const addLock=timeLeft(state?.add_locked_until,now), rejectLock=timeLeft(state?.locked_until,now);
  return <div className={`roulette-actions${plainLabels ? " rm-card-actions" : ""}${plainLabels && status === "accepted" ? " rm-is-connected" : ""}`}>
    {(!status || (status==='pending' && incoming)) ? <button className="backend-primary" disabled={busy || !!addLock} onClick={()=>onSpin(target,'add')}>{addLock ? `add locked · ${addLock}` : incoming ? (plainLabels ? 'spin to accept' : 'spin to accept') : (plainLabels ? 'spin to add' : 'spin to add')}</button> : status==='accepted' && onOpen ? <button className="backend-primary" onClick={onOpen}>send reels</button> : <p className={plainLabels && status === 'accepted' ? "rm-connected-pill" : "backend-muted"}>{status==='accepted'?(plainLabels ? 'connected' : 'connected'):status==='pending'?'request pending': 'request declined'}</p>}
    {status!=='declined' && <button className="backend-secondary" disabled={busy || !!rejectLock} onClick={()=>onSpin(target,'reject')}>{rejectLock?`reject locked · ${rejectLock}`:(plainLabels ? 'spin to reject' : 'spin to reject')}</button>}

    {!plainLabels && !target.is_demo && (status === "accepted" || status === "pending") && <button type="button" className="rm-stop-contact" disabled={busy} onClick={()=>onDismiss(target.id)}>stop contact</button>}

  </div>;
}
export function MatchesPage({matches,rouletteStates,onSpin,onDismiss,onScroll,busy,reels,profileReels = []}) {
  const now=useClock();
  return <section className="backend-page rm-matches-page">
    <header className="rm-matches-header"><h1>matches</h1><span>{matches.length} {matches.length === 1 ? 'match' : 'matches'}</span></header>
    {!matches.length ? <div className="backend-card rm-empty-matches"><h2>no matches yet</h2><p>like more reels to find ur matches</p><button className="backend-primary" onClick={onScroll}>browse reels</button></div> :
      <div className="rm-match-grid">{matches.map(m => {
        const shared = m.shared_reels || [];
        const pinned = profileReels.filter(r => r.user_id === m.id);
        return <article className="backend-card rm-match-card" key={m.id}>
          <div className="rm-match-identity"><Avatar value={m.avatar} className="backend-avatar" /><div className="rm-match-name"><h2>{m.name}, {m.age}</h2>{m.is_demo && <small className="backend-demo">demo profile</small>}</div><div className="rm-match-score"><strong>{m.score}%</strong><span>match</span></div></div>
          <div className="rm-match-meter" role="meter" aria-label="compatibility" aria-valuemin={0} aria-valuemax={100} aria-valuenow={m.score}><span style={{width:`${Math.max(0,Math.min(100,m.score))}%`}} /></div>
          {m.bio && <p className="rm-match-bio">{m.bio}</p>}
          {!!m.interests?.length && <div className="backend-tags rm-match-tags">{m.interests.map((i,n) => <span key={n}>{i}</span>)}</div>}
          <section className="rm-match-common"><h3>{shared.length} {shared.length === 1 ? 'reel' : 'reels'} in common</h3><div className="rm-common-strip">{shared.map(id => {
            const r = reels.find(x => String(x.id) === String(id));
            return <div className="rm-common-reel" key={id} title={r?.caption || 'reel'}>{r?.video ? <video src={r.video} controls playsInline preload="metadata"/> : <div className="rm-common-placeholder">{r?.emoji || 'reel'}</div>}<span>{r?.caption || 'reel unavailable'}</span></div>;
          })}</div></section>
          {!!pinned.length && <section className="match-profile-reels"><h3>their reels</h3><ProfileReels entries={pinned} reels={reels}/></section>}
          <div className="rm-match-footer"><MatchActions plainLabels target={m} status={m.connection_status} rouletteStates={rouletteStates} onSpin={onSpin} onDismiss={onDismiss} busy={busy} now={now}/></div>
        </article>;
      })}</div>}
  </section>;
}
function MiniReel({reel}) {
  if(!reel) return <div className="chat-preview">🎬 reel unavailable</div>;
  return <div className="chat-preview">{reel.video ? <video src={reel.video} controls playsInline preload="metadata"/> : <div className="chat-emoji">{reel.emoji || '🎬'}</div>}<p>{reel.caption}</p></div>;
}
function ReelPicker({reels, selected, onSelect, sending, onSend}) {
  const selectedReel = reels.find(r => String(r.id) === selected);
  return <section className="rm-chat-picker" aria-label="pick a reel">
    <div className="rm-picker-heading"><h3>pick a reel</h3><span>{reels.length} {reels.length === 1 ? 'reel' : 'reels'}</span></div>
    {reels.length ? <div className="rm-picker-strip" role="group" aria-label="reels to send">
      {reels.map(r => {
        const id = String(r.id), isSelected = selected === id;
        return <button key={id} type="button" className={`rm-picker-tile${isSelected ? ' is-selected' : ''}`} aria-pressed={isSelected} aria-label={`select ${r.caption || r.handle || 'reel'}`} disabled={sending} onClick={() => onSelect(isSelected ? '' : id)}>
          <span className="rm-picker-media">
            {r.video ? <video src={r.video} poster={r.poster || undefined} muted playsInline preload="metadata" aria-hidden="true"/> : <span className="rm-picker-placeholder">{r.emoji || 'reel'}</span>}
            {isSelected && <span className="rm-picker-check" aria-hidden="true">✓</span>}
          </span>
          <span className="rm-picker-caption" title={r.caption}>{r.caption || r.handle || 'reel'}</span>
        </button>;
      })}
    </div> : <p className="backend-muted">no reels yet</p>}
    <div className="rm-picker-footer">
      <span className="rm-picker-selection" aria-live="polite">{selectedReel ? selectedReel.caption || 'reel selected' : 'tap a reel to select it'}</span>
      <button type="button" className="backend-primary rm-picker-send" disabled={!selectedReel || sending} onClick={onSend}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 2 7 17M22 2l-9 20-4-9-9-4 22-7z"/></svg>
        {sending ? 'sending…' : 'send reel'}
      </button>
    </div>
  </section>;
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
    <div className="avatar-chat-heading"><Avatar value={connection.avatar} className="backend-avatar" /><div><h2>{connection.name}</h2>{connection.is_demo && <small className="backend-demo">demo profile · auto replies</small>}</div></div>
    <div className="chat-history" aria-live="polite">{!loaded ? <p className="backend-muted">loading reels…</p>:!messages.length?<p className="backend-muted">send them a reel lol</p>:messages.map(m=><div className={`chat-bubble ${m.sender_id===profile.id?'mine':'theirs'}`} key={m.id}><MiniReel reel={reels.find(r=>String(r.id)===m.reel_id)}/><small>{new Date(m.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</small></div>)}</div>
    <div className="chat-disabled">🔒 <s>type a message...</s><small>no texting, reels only</small></div>
    {error && <p className="backend-error" role="alert">{error}</p>}
    <ReelPicker reels={reels} selected={selected} onSelect={setSelected} sending={sending} onSend={send}/>
  </div>;
}
export function ConnectionsPage({connections,rouletteStates,onSpin,onDismiss,onRefresh,busy,profile,reels,draftReel,clearDraft}) {
  const [selected,setSelected]=useState(null),now=useClock();
  const connection=connections.find(c=>c.other_id===selected && c.status==='accepted');
  return <section className="backend-page"><h1>messages</h1><p className="backend-muted">reels only</p>
    {draftReel && !connection && <p className="backend-card">who r u sending this to?<button className="backend-secondary" onClick={clearDraft}>cancel</button></p>}
    {connection ? <><button className="backend-secondary" onClick={()=>setSelected(null)}>← back</button><ReelChat key={connection.other_id} connection={connection} profile={profile} reels={reels} draftReel={draftReel} clearDraft={clearDraft}/><MatchActions target={{...connection,id:connection.other_id}} status="accepted" rouletteStates={rouletteStates} onSpin={onSpin} onDismiss={onDismiss} busy={busy} now={now}/></> : <>
      <button className="backend-secondary" onClick={onRefresh} disabled={busy}>refresh</button>
      {!connections.length && <div className="backend-card">no one here yet, go spin</div>}
      {connections.map(c=><article className="backend-card" key={c.id}><div className="backend-request"><Avatar value={c.avatar} className="backend-avatar" /><div><h2>{c.name}{c.is_demo && <small className="backend-demo">demo profile</small>}</h2><p className="backend-muted">{c.status==='pending'?(c.incoming?'incoming request':'request sent'):c.status}</p></div></div><MatchActions target={{...c,id:c.other_id}} status={c.status} incoming={c.incoming} rouletteStates={rouletteStates} onSpin={onSpin} onDismiss={onDismiss} busy={busy} now={now} onOpen={()=>setSelected(c.other_id)}/></article>)}
    </>}
  </section>;
}
