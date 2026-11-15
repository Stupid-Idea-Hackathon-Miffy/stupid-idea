export default function VibeMatch({ match, likeCount, onOpen }) {
  return <button type="button" className="match backend-vibe" onClick={onOpen} aria-label="See your vibe matches">
    <h3>{match ? 'It’s a Vibe Match!' : 'Finding your vibe…'}</h3>
    <div className="match-photo"><div className="blur" /><div className="backend-vibe-avatar">{match?.avatar || '🫠'}</div><div className="match-score"><strong>{match ? `${match.score}%` : `${likeCount} liked`}</strong><span>{match ? `${match.name}${match.is_demo ? ' · Demo' : ''}` : 'Like more reels'}</span></div></div>
    <span className="backend-vibe-link">{match ? 'See match →' : 'View matches →'}</span>
  </button>;
}
