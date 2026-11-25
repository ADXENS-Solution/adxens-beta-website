import { useEffect, useRef } from "react";

const PLAYBACK_RATE = 0.65;
const SRC = "/footer-bg.mp4";

export default function FooterVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const applyRate = () => {
      video.playbackRate = PLAYBACK_RATE;
    };
    applyRate();
    video.addEventListener("loadedmetadata", applyRate);
    video.addEventListener("play", applyRate);

    const start = () => {
      observer.disconnect();
      if (video.getAttribute("src")) return;
      video.preload = "auto";
      video.src = SRC;
      video.load();
      void video.play().catch(() => {});
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) start();
      },
      { rootMargin: "800px 0px" },
    );
    observer.observe(video);

    return () => {
      observer.disconnect();
      video.removeEventListener("loadedmetadata", applyRate);
      video.removeEventListener("play", applyRate);
    };
  }, []);

  return (
    <video ref={videoRef} className="footer-video" autoPlay muted loop playsInline preload="none" aria-hidden="true" />
  );
}
