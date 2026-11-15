import { ChevronUp, ChevronDown } from "./Icons.jsx";

export default function Pager({ onPrev, onNext }) {
  return (
    <div className="pager">
      <button onClick={onPrev} aria-label="previous reel"><ChevronUp /></button>
      <button onClick={onNext} aria-label="next reel"><ChevronDown /></button>
    </div>
  );
}