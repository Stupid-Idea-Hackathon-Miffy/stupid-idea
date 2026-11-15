import { useState } from 'react';

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
export function MatchesPage({ matches, onConnect, onScroll, busy, reels }) {
  return <section className="backend-page">
    <p className="backend-kicker">THE ALGORITHM HAS SPOKEN</p><h1>Your vibe matches</h1>
    <p className="backend-muted">67% or higher. Based on the reels you both liked, not the interests you claim to have.</p>
    {!matches.length ? <div className="backend-card"><h2>No matches yet 🫠</h2><p>Like at least two reels to give the algorithm something to work with.</p><button className="backend-primary" onClick={onScroll}>Back to doomscrolling</button></div> :
      <div className="backend-grid">{matches.map(m => <article className="backend-card" key={m.id}>
        <div className="backend-match-head"><span className="backend-avatar">{m.avatar}</span><strong className="backend-score">{m.score}%</strong></div>
        <h2>{m.name}, {m.age}{m.is_demo && <small className="backend-demo">Demo profile</small>}</h2>
        <p>{m.bio}</p><div className="backend-tags">{m.interests.map((i,n) => <span key={n}>{i}</span>)}</div>
        <p className="backend-muted">{m.shared_reels.length} shared likes</p>
        <div className="backend-shared">{m.shared_reels.map(id => { const r = reels.find(x => String(x.id) === id); return <span key={id} title={r?.caption || `Reel ${id}`}>{r?.emoji || '🎬'}</span>; })}</div>
        <button className="backend-primary" disabled={busy || Boolean(m.connection_status)} onClick={() => onConnect(m.id)}>{m.connection_status === 'pending' ? 'Request pending' : m.connection_status === 'accepted' ? 'Connected ♡' : m.connection_status === 'declined' ? 'Request declined' : 'Connect ♡'}</button>
      </article>)}</div>}
  </section>;
}
export function ConnectionsPage({ connections, onRespond, onRefresh, busy }) {
  return <section className="backend-page"><p className="backend-kicker">MUTUAL BRAIN ROT</p><h1>Connections</h1><p className="backend-muted">Send and accept requests to connect with your matches.</p>
    <button className="backend-secondary" onClick={onRefresh} disabled={busy}>Refresh requests</button>
    {!connections.length && <div className="backend-card">No connection requests yet.</div>}
    {connections.map(c => <article className="backend-card backend-request" key={c.id}><span className="backend-avatar">{c.avatar}</span><div><h2>{c.name}{c.is_demo && <small className="backend-demo">Demo profile</small>}</h2><p className="backend-muted">{c.status === 'pending' ? (c.incoming ? 'Incoming request' : 'Request sent') : c.status}</p></div>{c.incoming && c.status === 'pending' && <div className="backend-actions"><button className="backend-primary" disabled={busy} onClick={() => onRespond(c.id,true)}>Accept</button><button className="backend-secondary" disabled={busy} onClick={() => onRespond(c.id,false)}>Decline</button></div>}</article>)}
  </section>;
}
