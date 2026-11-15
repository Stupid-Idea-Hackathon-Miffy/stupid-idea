import { useEffect, useRef, useState } from "react";

function ReelMeta({ reel }) {
    return (
      <div className="reel-meta">
        <div className="author">
          <span className="avatar-sm">{reel.avatar}</span>
          <span>({reel.handle}, {reel.totalLikes} likes)</span>
        </div>
        <p className="caption">{reel.caption}</p>
      </div>
    );
  }

// Instagram-style overlay drawn on top of the video: avatar, handle, follow, caption, audio.
function InstaMeta({ reel }) {
    return (
      <div className="ig-meta">
        <div className="ig-author">
          <span className="ig-avatar">
            {reel.avatarImg ? <img src={reel.avatarImg} alt="" /> : <span>{reel.avatar}</span>}
          </span>
          <strong>{reel.handle.replace(/^@/, '')}</strong>
          <span className="ig-follow">Follow</span>
        </div>
        <p className="ig-caption">{reel.caption}</p>
        {reel.audio && <p className="ig-audio">♫ {reel.audio}</p>}
      </div>
    );
  }

export default function ReelCard({ reel, onDoubleClick }) {
    // The video autoplays muted straight away; sound only comes on once you've stopped on
    // this reel (SETTLE_MS) and it's in view. Scrolling, the reel leaving the screen or the
    // tab being hidden cuts the sound. A tap on the video toggles sound.
    // Browsers block sound before the person has interacted with the page; if that happens
    // the sound comes on at their first click/tap/keypress instead.
    const videoRef = useRef(null);
    const wantSound = useRef(true);
    const applyRef = useRef(() => {});
    const [muted, setMuted] = useState(true);
    const [landscape, setLandscape] = useState(false); // wide videos are letterboxed, not cropped

    useEffect(() => {
      const v = videoRef.current;
      if (!v) return;
      const SETTLE_MS = 600;
      let settled = false, inView = true, blocked = false, settleTimer;

      const apply = () => {
        const showing = inView && document.visibilityState === 'visible';
        if (!showing) { v.muted = true; v.pause(); setMuted(true); return; }
        const sound = settled && wantSound.current && !blocked;
        v.muted = !sound;
        setMuted(!sound);
        v.play().catch(() => {
          if (!sound) return;
          blocked = true; // no page interaction yet: keep playing muted until there is one
          v.muted = true; setMuted(true);
          v.play().catch(() => {});
        });
      };
      applyRef.current = apply;

      const settleSoon = () => {
        clearTimeout(settleTimer);
        settleTimer = setTimeout(() => { settled = true; apply(); }, SETTLE_MS);
      };
      const onWheel = e => {
        if (Math.abs(e.deltaY) < 40) return; // same threshold the feed uses to change reels
        settled = false; apply(); settleSoon();
      };
      const onGesture = e => {
        if (!blocked) return;
        blocked = false;
        if (e.target !== v) apply(); // a tap on the video itself goes through toggleSound
      };
      const observer = new IntersectionObserver(([entry]) => {
        inView = entry.intersectionRatio >= 0.6;
        apply();
      }, { threshold: [0, 0.6, 1] });

      const gestures = ['pointerdown', 'keydown', 'touchstart'];
      gestures.forEach(g => document.addEventListener(g, onGesture, { capture: true }));
      window.addEventListener('wheel', onWheel, { passive: true });
      document.addEventListener('visibilitychange', apply);
      observer.observe(v);
      apply();
      settleSoon();

      return () => {
        clearTimeout(settleTimer);
        observer.disconnect();
        gestures.forEach(g => document.removeEventListener(g, onGesture, { capture: true }));
        window.removeEventListener('wheel', onWheel);
        document.removeEventListener('visibilitychange', apply);
        applyRef.current = () => {};
        v.muted = true;
        v.pause();
      };
    }, [reel.video]);

    const toggleSound = e => {
      e.stopPropagation();
      wantSound.current = videoRef.current.muted; // muted now → user wants sound
      applyRef.current();
    };

    return (
      <article className={`reel${reel.instaStyle ? ' reel-insta' : ''}`} onDoubleClick={onDoubleClick}>
        {reel.video ? (
          <>
            <video
              ref={videoRef}
              className={`reel-media${landscape ? ' is-landscape' : ''}`}
              src={reel.video}
              onLoadedMetadata={e => setLandscape(e.target.videoWidth > e.target.videoHeight)}
              loop playsInline
              onClick={toggleSound}
            />
            {reel.instaStyle && (
              <span className="ig-sound" aria-hidden="true">{muted ? '🔇' : '🔊'}</span>
            )}
          </>
        ) : (
          <>
            <div className="reel-media" />
            <div className="reel-placeholder">{reel.emoji}</div>
          </>
        )}
        {reel.instaStyle ? <InstaMeta reel={reel} /> : <ReelMeta reel={reel} />}
      </article>
    );
  }
