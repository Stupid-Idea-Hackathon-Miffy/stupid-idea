import { useEffect, useRef, useState } from 'react';

export function RouletteModal({ action, target, onSpin, onClose }) {
  const add = action === 'add';
  const chance = 1;
  const [result, setResult] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [error, setError] = useState('');
  const timer = useRef(null);
  const mounted = useRef(true);
  const inFlight = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; clearTimeout(timer.current); }; }, []);
  async function spin() {
    if (inFlight.current || result) return;
    inFlight.current = true; setSpinning(true); setError('');
    try {
      const answer = await onSpin();
      if (!mounted.current) return;
      if (answer.outcome === 'locked') { setResult(answer); setSpinning(false); return; }
      const arc = chance * 3.6;
      const angle = answer.outcome === 'won' ? arc / 2 : (arc + 360) / 2;
      setRotation(1800 + (360 - angle));
      timer.current = setTimeout(() => { setResult(answer); setSpinning(false); }, 2400);
    } catch(e) { if (mounted.current) { setError(e.message); setSpinning(false); inFlight.current = false; } }
  }
  return <div className="roulette-overlay" role="presentation"><section className="roulette-dialog" role="dialog" aria-modal="true" aria-label={add ? 'Add roulette' : 'Reject roulette'}>
    <button className="roulette-close" aria-label="Close roulette" disabled={spinning} onClick={onClose}>×</button>
    <p className="backend-kicker">THE ALGORITHM DECIDES</p>
    <h1>{add ? 'ADD ROULETTE' : 'REJECT ROULETTE'}</h1>
    <p>{target.avatar} {target.name} · {chance}% chance of success</p>
    <div className="roulette-wheel-wrap"><div className="roulette-pointer"/><div className="roulette-wheel" style={{background:`conic-gradient(#25a56a 0deg ${chance*3.6}deg, #d62e49 ${chance*3.6}deg 360deg)`,transform:`rotate(${rotation}deg)`}}><span className="roulette-hub">🎰</span></div></div>
    <div className="roulette-legend"><span>🟢 {chance}% {add ? 'Add' : 'Reject'}</span><span>🔴 {100-chance}% Denied</span></div>
    {error && <p className="backend-error" role="alert">{error}</p>}
    {result ? <div aria-live="polite"><h2>{result.outcome === 'won' ? (add ? 'THE ALGORITHM APPROVES!' : 'FREEDOM GRANTED!') : (add ? 'LOVE REQUEST DENIED' : 'REJECTION DENIED')}</h2><p>{result.outcome === 'won' ? (add ? 'Your connection has been requested or accepted.' : 'You escaped the algorithm.') : (add ? 'The algorithm said not yet. Try again after 30 seconds.' : 'Your free will subscription has expired for seven days.')}</p>{result.locked_until && <p className="backend-muted">Retry after {new Date(result.locked_until).toLocaleString()}</p>}</div> : <button className="backend-primary" disabled={spinning} onClick={spin}>{spinning ? 'Consulting the algorithm…' : add ? 'Gamble for love' : 'Gamble for freedom'}</button>}
    {result && <button className="backend-secondary" onClick={onClose}>Continue</button>}
    <small className="backend-muted">No real money. Hide/block is always available.</small>
  </section></div>;
}
