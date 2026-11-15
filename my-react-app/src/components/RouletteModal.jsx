import { useEffect, useRef, useState } from 'react';
import '../roulette-polish.css';

import '../mock-checkout.css';

const COST = '$50.00';

// Local test-only checkout. Never sends, saves, or accepts real card details.
const TEST = { name: 'alex morgan', card: '4242424242424242', expiry: '1230', cvc: '123' };
const digits = value => value.replace(/[^0-9]/g, '');
const formatCard = value => value.match(/.{1,4}/g)?.join(' ') || '';
const formatExpiry = value => value.length > 2 ? `${value.slice(0, 2)} / ${value.slice(2)}` : value;

function MockCheckout({ action, target, onPay, onBack }) {
  const [fields, setFields] = useState({ name: '', card: '', expiry: '', cvc: '' });
  const [notice, setNotice] = useState('');
  const valid = fields.name.toLowerCase().trim() === TEST.name && fields.card === TEST.card && fields.expiry === TEST.expiry && fields.cvc === TEST.cvc;
  function update(key, raw) {
    const value = key === 'name' ? raw : digits(raw);
    const candidate = key === 'name' ? value.toLowerCase() : value;
    // Retain only prefixes of the predetermined fictional test values.
    if (!TEST[key].startsWith(candidate)) {
      setNotice('check ur card details');
      return;
    }
    setNotice('');
    setFields(old => ({ ...old, [key]: value }));
  }
  function pay(e) {
    e.preventDefault();
    if (valid) onPay();
  }
  return <form className="rl-checkout" onSubmit={pay} autoComplete="off">
    <div className="rl-checkout-top"><button type="button" onClick={onBack}>← back</button></div>
    <h1>checkout</h1>
    <div className="rl-checkout-order"><div><strong>{action === 'add' ? 'add' : 'reject'} roulette</strong><small>{target.name} · 1 spin</small></div><strong>{COST}</strong></div>
    <div className="rl-checkout-fields">
      <label>name on card<input value={fields.name} onChange={e=>update('name',e.target.value)} placeholder="name on card" autoComplete="off" spellCheck={false} /></label>
      <label>card number<input value={formatCard(fields.card)} onChange={e=>update('card',e.target.value)} placeholder="0000 0000 0000 0000" inputMode="numeric" autoComplete="off" /></label>
      <div className="rl-checkout-pair"><label>expiry<input value={formatExpiry(fields.expiry)} onChange={e=>update('expiry',e.target.value)} placeholder="mm / yy" inputMode="numeric" autoComplete="off" /></label><label>cvc<input value={fields.cvc} onChange={e=>update('cvc',e.target.value)} placeholder="000" inputMode="numeric" autoComplete="off" /></label></div>
    </div>
    {notice && <small className="rl-checkout-error" role="alert">{notice}</small>}
    <div className="rl-checkout-total"><span>total</span><strong>{COST} CAD</strong></div>
    <button type="submit" className="backend-primary" disabled={!valid}>pay {COST} &amp; spin</button>
  </form>;
}

export function RouletteModal({ action, target, onSpin, onClose }) {
  const add = action === 'add';
  const chance = 1;
  const win = add ? '#wifedat' : 'ur free';
  const lose = add ? 'chud4life' : 'ur stuck';
  const [result, setResult] = useState(null);
  const [checkout, setCheckout] = useState(false);
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
    inFlight.current = true; setCheckout(false); setSpinning(true); setError('');
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
      {checkout ? <MockCheckout action={action} target={target} onPay={spin} onBack={()=>setCheckout(false)} /> : <>
      <div className="rm-wheel-header"><h1>{add ? 'add roulette' : 'reject roulette'}</h1><p>{target.name} · 1% odds</p><p className="rl-spin-price">{COST} per spin</p></div>
      <div className="rm-wheel-wrap">
        <div className="rm-wheel-pointer" aria-hidden="true" />
        <button type="button" className="rm-spin-wheel" onClick={()=>setCheckout(true)} disabled={spinning || !!result} aria-label="open checkout for fifty dollars" aria-busy={spinning}>
          <span className="rm-wheel-disc" style={{background:`conic-gradient(#b9d87e 0deg ${chance*3.6}deg, #dc6585 ${chance*3.6}deg 360deg)`,transform:`rotate(${rotation}deg)`}} />
          <span className="rm-wheel-hub">{spinning ? '...' : result ? (won ? 'won' : 'rip') : '$50'}</span>
        </button>
      </div>
      <div className="rm-wheel-legend"><span><i className="rm-win-dot" />1% {win}</span><span><i className="rm-lose-dot" />99% {lose}</span></div>
      {error && <p className="backend-error" role="alert">{error}</p>}
      <div className="rm-wheel-result" aria-live="polite">
        {result ? <><h2 className={won ? 'rm-won' : ''}>{locked ? 'not yet' : won ? win : lose}</h2><p>{won ? (add ? 'ur request went through' : 'u got out') : remaining ? `try again in ${wait}` : 'try again'}</p></> : <p>{spinning ? 'spinning...' : 'tap the wheel to pay $50'}</p>}
      </div>
      {result && <button type="button" className="backend-secondary rm-wheel-done" onClick={onClose}>done</button>}
      </>}
    </section>
  </div>;
}
