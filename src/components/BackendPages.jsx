import { useEffect, useRef, useState } from 'react';
import { getReelMessages, sendReel } from '../lib/backend.js';
import '../chat-picker.css';
import '../inbox.css';
import '../profile-matches.css';
import Avatar, { avatarOptions, normalizeAvatar } from './Avatar.jsx';

export function ProfilePage({ profile, onSave, busy, reels = [], profileReels = [], onRemove, onScroll }) {
  const [name, setName] = useState(profile?.name || '');
  const [age, setAge] = useState(profile?.age || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [interests, setInterests] = useState(profile?.interests?.join(', ') || '');
  const [avatar, setAvatar] = useState(() => normalizeAvatar(profile?.avatar));
  const tags = interests.split(',').map(x => x.trim()).filter(Boolean).slice(0,12);
  const pinned = profileReels.filter(entry => reels.some(r => String(r.id) === String(entry.reel_id)));
  return <section className={`backend-page profile-page rl-profile-page${profile ? '' : ' rl-new-profile'}`}>
    <header className="rl-page-title"><h1>{profile ? 'ur profile' : 'make ur profile'}</h1></header>
    <div className="rl-profile-layout">
      <form className="rl-profile-form" onSubmit={e => { e.preventDefault(); onSave({ name, age, bio, avatar, interests: tags }); }}>
        <div className="rl-profile-identity"><Avatar value={avatar} className="rl-profile-large-avatar"/><div><h2>{name.trim() || 'ur name'}{age ? `, ${age}` : ''}</h2><p>profile picture</p></div></div>
        <div className="backend-avatars" aria-label="pick an avatar">
          {avatarOptions.map((a, i) => <button type="button" key={a} aria-label={`profile picture ${i + 1}`} aria-pressed={a === avatar} className={a === avatar ? 'chosen' : ''} onClick={() => setAvatar(a)}><Avatar value={a} /></button>)}
        </div>
        <div className="rl-profile-fields">
          <label>display name<input required maxLength={60} value={name} onChange={e => setName(e.target.value)} placeholder="ur name" /></label>
          <label>age<input required type="number" min={18} max={99} value={age} onChange={e => setAge(e.target.value)} placeholder="ur age" /></label>
          <label className="rl-profile-wide">bio<textarea maxLength={300} value={bio} onChange={e => setBio(e.target.value)} placeholder="a lil abt urself" /></label>
          <label className="rl-profile-wide">interests<input maxLength={250} value={interests} onChange={e => setInterests(e.target.value)} placeholder="cats, gaming, memes" /><small>separate with commas</small></label>
        </div>
        {!!tags.length && <div className="backend-tags rl-profile-tags">{tags.map((t,i)=><span key={i}>{t}</span>)}</div>}
        <button className="backend-primary rl-profile-save" disabled={busy || !name.trim()} type="submit">{busy ? 'saving…' : profile ? 'save profile' : 'start scrolling →'}</button>
      </form>
      {profile && <section className="backend-card rl-profile-gallery"><header><div><h2>ur reels</h2><p>reels that are literally u</p></div><span>{pinned.length}</span></header><ProfileReels entries={pinned} reels={reels} onRemove={onRemove} busy={busy}/><button type="button" className="backend-secondary rl-find-reels" onClick={onScroll}>find reels to add →</button></section>}
    </div>
  </section>;
}

function ProfileReels({entries, reels, onRemove, busy}) {
  const available = entries.map(entry => ({entry, reel: reels.find(x => String(x.id) === String(entry.reel_id))})).filter(x => x.reel);
  if (!available.length) return <p className="backend-muted profile-reels-empty">no reels yet</p>;
  return <div className="rl-gallery-grid">{available.map(({entry,reel:r}) => <article className="rl-gallery-tile" key={entry.reel_id}>
    <div className="rl-reel-media">{r.video ? <video src={`${r.video}#t=0.1`} controls playsInline preload="metadata" aria-label={r.handle || 'reel'}/> : <span>{r.emoji || '🎬'}</span>}</div>
    <p title={r.caption}>{r.handle || r.caption}</p>
    {onRemove && <button type="button" className="rl-remove-reel" disabled={busy} onClick={() => onRemove(entry.reel_id)}>remove</button>}
  </article>)}</div>;
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
  return <section className="backend-page rm-matches-page rl-matches-page">
    <header className="rm-matches-header"><h1>matches</h1><span>{matches.length} {matches.length === 1 ? 'match' : 'matches'}</span></header>
    {!matches.length ? <div className="backend-card rm-empty-matches"><h2>no matches yet</h2><p>like more reels to find ur matches</p><button className="backend-primary" onClick={onScroll}>browse reels</button></div> :
      <div className="rl-match-grid">{matches.map(m => {
        const shared = (m.shared_reels || []).filter(id=>reels.some(r=>String(r.id)===String(id))).map(reel_id=>({reel_id}));
        const pinned = profileReels.filter(r => r.user_id === m.id && reels.some(v=>String(v.id)===String(r.reel_id)));
        return <article className="backend-card rl-match-card" key={m.id}>
          <header className="rl-match-identity"><Avatar value={m.avatar} className="rl-match-avatar"/><div className="rl-match-name"><h2>{m.name}</h2><p>{m.age}{m.is_demo ? ' · automated' : ''}</p></div><div className="rl-match-score"><strong>{m.score}%</strong><span>match</span></div></header>
          <div className="rl-match-meter" role="meter" aria-label="compatibility" aria-valuemin={0} aria-valuemax={100} aria-valuenow={m.score}><span style={{width:`${Math.max(0,Math.min(100,m.score))}%`}} /></div>
          <div className="rl-match-about">{m.bio && <p>{m.bio}</p>}{!!m.interests?.length && <div className="backend-tags">{m.interests.map((i,n) => <span key={n}>{i}</span>)}</div>}</div>
          <div className="rl-match-reels"><section><h3>in common <span>{shared.length}</span></h3><ProfileReels entries={shared} reels={reels}/></section><section><h3>their reels <span>{pinned.length}</span></h3><ProfileReels entries={pinned} reels={reels}/></section></div>
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
function ReelChat({connection,profile,reels,draftReel,clearDraft,actions,onBack}) {
  const [messages,setMessages]=useState([]),[selected,setSelected]=useState(draftReel||''),[sending,setSending]=useState(false),[error,setError]=useState(''),[loaded,setLoaded]=useState(false);
  const sendLock=useRef(false),requestVersion=useRef(0),active=useRef(true);
  const historyRef=useRef(null), stickToBottom=useRef(true);
  const lastId=messages.at(-1)?.id;
  useEffect(()=>{
    const history=historyRef.current;
    if(history && stickToBottom.current) history.scrollTop=history.scrollHeight;
  },[lastId,loaded]);
  useEffect(()=>{active.current=true;return()=>{active.current=false;};},[]);
  useEffect(()=>{
    let cancelled=false;
    async function load(){ const version=++requestVersion.current;try{const rows=await getReelMessages(connection.other_id);if(!cancelled && version===requestVersion.current){setMessages(rows||[]);setLoaded(true);}}catch(e){if(!cancelled)setError(e.message);}}
    load();const t=setInterval(load,2500);return()=>{cancelled=true;clearInterval(t);};
  },[connection.other_id]);
  async function send(){
    if(sendLock.current || !reels.some(r=>String(r.id)===selected))return;
    sendLock.current=true;setSending(true);setError('');
    try{await sendReel(connection.other_id,selected);if(!active.current)return;setSelected('');clearDraft();stickToBottom.current=true;const version=++requestVersion.current;const rows=await getReelMessages(connection.other_id);if(active.current && version===requestVersion.current){setMessages(rows||[]);setLoaded(true);}}
    catch(e){if(active.current)setError(e.message);}finally{sendLock.current=false;if(active.current)setSending(false);}
  }
  return <div className="reel-chat rl-conversation">
    <header className="rl-chat-header">
      <button type="button" className="rl-chat-back" onClick={onBack} aria-label="back to messages">←</button>
      <Avatar value={connection.avatar} className="rl-chat-avatar" />
      <div className="rl-chat-identity"><h2>{connection.name}</h2><small>{connection.is_demo ? 'automated' : 'connected'}</small></div>
      <div className="rl-chat-actions">{actions}</div>
    </header>
    <div className="chat-history" ref={historyRef} onScroll={e=>{const el=e.currentTarget;stickToBottom.current=el.scrollHeight-el.scrollTop-el.clientHeight<100;}} aria-live="polite">
      {!loaded ? <p className="rl-chat-empty">loading reels…</p> : !messages.length ? <div className="rl-chat-empty"><Avatar value={connection.avatar} className="rl-empty-avatar" /><strong>{connection.name}</strong><p>send them a reel lol</p></div> : messages.map(m=><div className={`chat-bubble ${m.sender_id===profile.id?'mine':'theirs'}`} key={m.id}><MiniReel reel={reels.find(r=>String(r.id)===String(m.reel_id))}/><small>{new Date(m.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</small></div>)}
    </div>
    <div className="rl-composer">
      <div className="rl-chat-notice"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg><s>type a message...</s><span>no texting, reels only</span></div>
      {error && <p className="backend-error" role="alert">{error}</p>}
      <ReelPicker reels={reels} selected={selected} onSelect={setSelected} sending={sending} onSend={send}/>
    </div>
  </div>;
}
export function ConnectionsPage({connections,rouletteStates,onSpin,onDismiss,onRefresh,busy,profile,reels,draftReel,clearDraft}) {
  const [selected,setSelected]=useState(null),now=useClock();
  const connection=connections.find(c=>c.other_id===selected && c.status==='accepted');
  const accepted=connections.filter(c=>c.status==='accepted');
  const requests=connections.filter(c=>c.status==='pending');
  const target=connection && {...connection,id:connection.other_id};
  const rejectedUntil=target && rouletteStates.find(s=>s.target_id===target.id)?.locked_until;
  const rejectLock=timeLeft(rejectedUntil,now);
  return <section className="backend-page rl-inbox-page">
    <div className="rl-inbox-title"><h1>messages</h1><span>{accepted.length} {accepted.length===1?'connection':'connections'}</span></div>
    <div className={`rl-inbox-shell${connection?' rl-has-chat':''}`}>
      <aside className="rl-inbox-list" aria-label="conversations">
        <header className="rl-inbox-list-header"><h2>inbox</h2><button type="button" className="rl-refresh" disabled={busy} onClick={onRefresh} aria-label="refresh connections" title="refresh"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.5 8A7 7 0 0 1 17 5.5L20 9M4 15l3 3.5A7 7 0 0 0 18.5 16"/></svg></button></header>
        {draftReel && !connection && <div className="rl-draft-notice">who r u sending this to?<button className="rl-text-button" onClick={clearDraft}>cancel</button></div>}
        <div className="rl-inbox-scroll">
          {!accepted.length && <p className="rl-inbox-empty">no chats yet</p>}
          {accepted.map(c=><button type="button" className={`rl-inbox-person${connection?.other_id===c.other_id?' is-active':''}`} key={c.id} onClick={()=>setSelected(c.other_id)} aria-pressed={connection?.other_id===c.other_id}>
            <Avatar value={c.avatar} className="rl-inbox-avatar"/><span className="rl-person-copy"><strong>{c.name}</strong><small>{c.is_demo?'automated':'connected'}</small></span><span className="rl-person-arrow" aria-hidden="true">›</span>
          </button>)}
          {!!requests.length && <section className="rl-inbox-requests"><h3>requests</h3>{requests.map(c=><article className="rl-request" key={c.id}><div className="rl-request-person"><Avatar value={c.avatar} className="rl-inbox-avatar"/><div className="rl-person-copy"><strong>{c.name}</strong><small>{c.incoming?'incoming request':'request sent'}</small></div></div><MatchActions target={{...c,id:c.other_id}} status={c.status} incoming={c.incoming} rouletteStates={rouletteStates} onSpin={onSpin} onDismiss={onDismiss} busy={busy} now={now}/></article>)}</section>}
        </div>
      </aside>
      <main className="rl-inbox-main" aria-label="chat">
        {connection ? <ReelChat key={connection.other_id} connection={connection} profile={profile} reels={reels} draftReel={draftReel} clearDraft={clearDraft} onBack={()=>setSelected(null)} actions={<>
          <button type="button" className="backend-secondary rl-reject-button" disabled={busy||!!rejectLock} onClick={()=>onSpin(target,'reject')}>{rejectLock?`reject locked · ${rejectLock}`:'spin to reject'}</button>
          {!connection.is_demo && <button type="button" className="rm-stop-contact rl-text-button" disabled={busy} onClick={()=>onDismiss(target.id)}>stop contact</button>}
        </>}/> : <div className="rl-no-chat"><svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 3 3 10l7 3 3 8 8-18zM10 13 21 3"/></svg><h2>{accepted.length?'pick a chat':'no connections yet'}</h2><p>{accepted.length?'send ur match a reel':'go spin to add someone'}</p></div>}
      </main>
    </div>
  </section>;
}
