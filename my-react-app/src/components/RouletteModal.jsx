import { useEffect, useRef, useState } from 'react';
import '../roulette-polish.css';

export function RouletteModal({ action, target, onSpin, onClose }) {
  const add = action === 'add';
  const chance = 1;
  const win = add ? '#wifedat' : 'ur free';
  const lose = add ? 'chud4life' : 'ur stuck';
  const [result, setResult] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [error, setError] = useState('');
  const [clock, setClock] = useState(Date.now());
  const timer = useRef(null);
  const mounted = useRef(true);
  const inFlight = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; clearTimeout(timer.current); }; }, []);

  useEffect(() => {
    if (!result?.locked_until) return;
    setClock(Date.now());
    const tick = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(tick);
  }, [result]);

  async function spin() {
    if (inFlight.current || result) return;
    inFlight.current = true; setSpinning(true); setError('');
    try {
      const answer = await onSpin();
      if (!mounted.current) return;
      if (answer.outcome === 'locked') { setResult(answer); setSpinning(false); return; }
      if (!['won', 'lost'].includes(answer.outcome)) throw new Error('could not spin, try again');
      const arc = chance * 3.6;
      const angle = answer.outcome === 'won' ? arc / 2 : arc + 12 + Math.random() * (360 - arc - 24);
      setRotation(1800 + 360 - angle);
      timer.current = setTimeout(() => { setResult(answer); setSpinning(false); }, 2400);
    } catch(e) { if (mounted.current) { setError(e.message); setSpinning(false); inFlight.current = false; } }
  }
  const locked = result?.outcome === 'locked';
  const won = result?.outcome === 'won';
  const retry = result?.locked_until ? new Date(result.locked_until) : null;
  const remaining = retry ? Math.max(0, Math.ceil((retry.getTime() - clock) / 1000)) : 0;
  const wait = remaining >= 86400 ? `${Math.ceil(remaining / 86400)}d` : remaining >= 60 ? `${Math.ceil(remaining / 60)}m` : `${remaining}s`;
  return <div className="roulette-overlay" role="presentation">
    <section className="roulette-dialog rm-wheel-dialog" role="dialog" aria-modal="true" aria-label={add ? 'add roulette' : 'reject roulette'}>
      <button type="button" className="roulette-close" aria-label="close roulette" disabled={spinning} onClick={onClose}>×</button>
      <div className="rm-wheel-header"><h1>{add ? 'add roulette' : 'reject roulette'}</h1><p>{target.name} · 1% odds</p></div>
      <div className="rm-wheel-wrap">
        <div className="rm-wheel-pointer" aria-hidden="true" />
        <button type="button" className="rm-spin-wheel" onClick={spin} disabled={spinning || !!result} aria-label="spin the wheel" aria-busy={spinning}>
          <span className="rm-wheel-disc" style={{background:`conic-gradient(#b9d87e 0deg ${chance*3.6}deg, #dc6585 ${chance*3.6}deg 360deg)`,transform:`rotate(${rotation}deg)`}} />
          <span className="rm-wheel-hub">{spinning ? '...' : result ? (won ? 'won' : 'rip') : 'spin'}</span>
        </button>
      </div>
      <div className="rm-wheel-legend"><span><i className="rm-win-dot" />1% {win}</span><span><i className="rm-lose-dot" />99% {lose}</span></div>
      {error && <p className="backend-error" role="alert">{error}</p>}
      <div className="rm-wheel-result" aria-live="polite">
        {result ? <><h2 className={won ? 'rm-won' : ''}>{locked ? 'not yet' : won ? win : lose}</h2><p>{won ? (add ? 'ur request went through' : 'u got out') : remaining ? `try again in ${wait}` : 'try again'}</p></> : <p>{spinning ? 'spinning...' : 'tap the wheel to spin'}</p>}
      </div>
      {result && <button type="button" className="backend-secondary rm-wheel-done" onClick={onClose}>done</button>}
      <small className="backend-muted rm-wheel-footnote">no real money</small>
    </section>
  </div>;
}
