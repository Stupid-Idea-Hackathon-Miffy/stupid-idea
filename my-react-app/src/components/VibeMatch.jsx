import Avatar from './Avatar.jsx';
export default function VibeMatch({ match, likeCount, onOpen }) {
  return <button type="button" className="match backend-vibe" onClick={onOpen} aria-label="see ur matches">
    <h3>{match ? 'u matched!' : 'finding ur matches…'}</h3>
    <div className="match-photo"><div className="blur" /><div className="backend-vibe-avatar"><Avatar value={match?.avatar} /></div><div className="match-score"><strong>{match ? `${match.score}%` : `${likeCount} liked`}</strong><span>{match ? `${match.name}${match.is_demo ? ' · demo' : ''}` : 'keep liking reels'}</span></div></div>
    <span className="backend-vibe-link">{match ? 'see match →' : 'see matches →'}</span>
  </button>;
}
