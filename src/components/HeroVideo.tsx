"use client";

import { useEffect, useRef, useState } from "react";

const PAUSE_KEY = "hero-video-paused";
const SPEED = 0.85; // a touch slower than the source, calmer behind text

function storedPause() {
  try {
    return localStorage.getItem(PAUSE_KEY) === "1";
  } catch {
    return false;
  }
}

// Decorative looping scene. Playback starts from JS (not the autoplay attribute) so it
// can respect reduced motion, Save-Data and a remembered pause, and so it stops while
// scrolled out of view. Without JS, or when motion is off, the poster frame shows.
export function HeroVideo({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const userPaused = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = (navigator as { connection?: { saveData?: boolean } }).connection?.saveData;
    userPaused.current = storedPause();
    setAllowed(true);
    if (reduce || saveData) {
      userPaused.current = true;
      return;
    }
    v.muted = true; // SSR doesn't emit the muted attribute; browsers require it to autoplay.
    v.defaultPlaybackRate = v.playbackRate = SPEED;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !userPaused.current) v.play().catch(() => {});
      else v.pause();
    });
    io.observe(v);
    return () => io.disconnect();
  }, []);

  function toggle() {
    const v = ref.current;
    if (!v) return;
    userPaused.current = !v.paused;
    try {
      localStorage.setItem(PAUSE_KEY, userPaused.current ? "1" : "0");
    } catch {}
    if (v.paused) {
      v.muted = true;
      v.playbackRate = SPEED;
      v.play().catch(() => {});
    } else v.pause();
  }

  return (
    <figure className={`relative m-0 overflow-hidden bg-[#b9a9c9] ${className}`}>
      {/* The poster frame, behind the video. An <img> rather than the video's poster
          attribute so phones can pick the 800 px file via srcset. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- static file, sized by srcset */}
      <img
        src="/video/prithvi-highway-poster.webp"
        srcSet="/video/prithvi-highway-poster-800.webp 800w, /video/prithvi-highway-poster.webp 1600w"
        sizes="100vw"
        alt=""
        aria-hidden="true"
        decoding="async"
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover object-[50%_100%]"
      />
      <video
        ref={ref}
        className="absolute inset-0 h-full w-full object-cover object-[50%_100%]"
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
        tabIndex={-1}
        disablePictureInPicture
        disableRemotePlayback
        controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
        draggable={false}
        onLoadedMetadata={(e) => (e.currentTarget.playbackRate = SPEED)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      >
        <source src="/video/prithvi-highway.av1.mp4" type='video/mp4; codecs="av01.0.08M.08"' />
        <source src="/video/prithvi-highway.mp4" type="video/mp4" />
      </video>
      {/* Transparent shield: no picture-in-picture hover button, drag or "save video" menu. */}
      <div className="absolute inset-0" onContextMenu={(e) => e.preventDefault()} aria-hidden="true" />
      <figcaption className="absolute bottom-3 left-3 hidden bg-ink px-2 py-1 font-mono text-[11px] text-paper sm:block">
        Prithvi Highway · Nepal
      </figcaption>
      {allowed && (
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pause background animation" : "Play background animation"}
          className="absolute right-3 bottom-3 cursor-pointer border border-ink bg-paper px-2.5 py-1 font-mono text-[11px] text-ink hover:bg-ink hover:text-paper"
        >
          {playing ? "❚❚ Pause" : "▶ Play"}
        </button>
      )}
    </figure>
  );
}
