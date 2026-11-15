import '../avatars.css';

export const avatarOptions = ['pfp1', 'pfp2', 'pfp4', 'pfp5', 'pfp7', 'pfp8', 'pfp9', 'pfp10'];
const legacy = { '🫠': 'pfp1', '🐱': 'pfp7', '🐶': 'pfp8', '🦝': 'pfp2', '🐸': 'pfp9', '🦜': 'pfp10', '👽': 'pfp5', '🤡': 'pfp4' };
export function normalizeAvatar(value) {
  return avatarOptions.includes(value) ? value : (value === 'pfp6' ? 'pfp5' : legacy[value] || 'pfp1');
}
export default function Avatar({ value, className = '' }) {
  const id = normalizeAvatar(value);
  return <span className={`profile-photo ${className}`}><img src={`${import.meta.env.BASE_URL}avatars/${id}.jpg`} alt="" draggable={false} /></span>;
}
