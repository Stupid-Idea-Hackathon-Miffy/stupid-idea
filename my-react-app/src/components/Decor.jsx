// Purely decorative background: woven texture, starfish and a vertical tagline.
const stars = [
  { top: '7%', right: '4%', size: 46, rot: 15 },
  { top: '40%', left: '-14px', size: 44, rot: -20 },
  { bottom: '14%', left: '17%', size: 40, rot: 10 },
  { bottom: '3%', right: '9%', size: 54, rot: -12 },
  { top: '66%', right: '2.5%', size: 34, rot: 25 },
];

export default function Decor() {
  return (
    <div className="decor" aria-hidden="true">
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <symbol id="rl-star" viewBox="-26 -26 52 52">
            <polygon
              points="0,-20 5.29,-7.28 19.02,-6.18 8.56,2.78 11.76,16.18 0,9 -11.76,16.18 -8.56,2.78 -19.02,-6.18 -5.29,-7.28"
              fill="#e0524a" stroke="#e0524a" strokeWidth="7" strokeLinejoin="round"
            />
          </symbol>
        </defs>
      </svg>
      <div className="decor-weave" />
      {stars.map(({ size, rot, ...pos }, i) => (
        <svg
          key={i}
          className={`decor-star${i % 2 ? ' rev' : ''}`}
          width={size} height={size} viewBox="-26 -26 52 52"
          style={{ ...pos, '--rot': `${rot}deg` }}
        >
          <use href="#rl-star" x="-26" y="-26" width="52" height="52" />
        </svg>
      ))}
      <span className="decor-tagline">Find love doomscrolling</span>
    </div>
  );
}
