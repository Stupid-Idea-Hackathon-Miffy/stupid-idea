import { formatCount } from "../data/reels.js";
import { HeartIcon, SendIcon } from "./Icons.jsx";

function AddProfileIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><path d="M12 8v8M8 12h8"/></svg>;
}
export default function ActionRail({ likes, liked, pinned, busy, onLike, onSend, onPin }) {
  return <div className="rail" aria-label="reel actions">
    <button type="button" className={liked ? "liked" : ""} onClick={onLike} disabled={busy} aria-pressed={liked} aria-label={liked ? "unlike" : "like"} title="like"><HeartIcon /><span>{formatCount(likes)}</span></button>
    <button type="button" aria-label="send reel" title="send reel" onClick={onSend}><SendIcon /><span>send</span></button>
    <button type="button" className={pinned ? "profile-pinned" : ""} onClick={onPin} disabled={busy} aria-pressed={pinned} aria-label={pinned ? "remove from ur profile" : "add to ur profile"} title={pinned ? "remove from ur profile" : "add to ur profile"}><AddProfileIcon /><span>{pinned ? "on ur profile" : "add to ur profile"}</span></button>
    </div>;
}
