import { Logo, ReelsIcon, HeartIcon, MessageIcon, ProfileIcon } from './Icons.jsx';
const items = [
  { key: 'reels', label: 'Reels', Icon: ReelsIcon },
  { key: 'matches', label: 'Matches', Icon: HeartIcon },
  { key: 'messages', label: 'Messages', Icon: MessageIcon },
  { key: 'profile', label: 'Profile', Icon: ProfileIcon },
];
export default function Sidebar({ active, onNavigate, matchCount = 0 }) {
  return <aside className="sidebar backend-sidebar"><div className="brand"><Logo />ReelMate</div>{items.map(({ key, label, Icon }) => <button key={key} className={`nav-item${active === key ? ' active' : ''}`} onClick={() => onNavigate(key)} aria-current={active === key ? 'page' : undefined}><span className="icon-wrap"><Icon />{key === 'matches' && matchCount > 0 && <span className="badge">{matchCount}</span>}</span><span>{label}</span></button>)}</aside>;
}
