import { useEffect, useRef } from "react";

type PingPongVideoProps = {
  className?: string;
  src: string;
};

export default function PingPongVideo({ className, src }: PingPongVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let isReversing = false;
    let frameId = 0;
    let previousTime = 0;
    let started = false;

    const playForward = () => {
      isReversing = false;
      previousTime = 0;
      video.currentTime = 0;
      void video.play();
    };

    const rewind = (timestamp: number) => {
      if (!isReversing) return;
      if (!previousTime) previousTime = timestamp;

      const elapsed = (timestamp - previousTime) / 1000;
      previousTime = timestamp;
      const nextTime = video.currentTime - elapsed;

      if (nextTime <= 0) {
        playForward();
        return;
      }

      video.currentTime = nextTime;
      frameId = requestAnimationFrame(rewind);
    };

    const startReverse = () => {
      if (isReversing) return;
      isReversing = true;
      video.pause();
      video.currentTime = Math.max(0, video.currentTime - 1 / 30);
      previousTime = 0;
      frameId = requestAnimationFrame(rewind);
    };

    const reverseNearEnd = () => {
      const reversalLeadTime = Math.min(0.28, video.duration * 0.08);
      if (video.duration && video.duration - video.currentTime < reversalLeadTime) startReverse();
    };

    const begin = () => {
      if (started) return;
      started = true;
      observer.disconnect();
      video.preload = "auto";
      video.src = src;
      if (!reduceMotion) {
        video.addEventListener("ended", startReverse);
        video.addEventListener("timeupdate", reverseNearEnd);
      }
      void video.play().catch(() => {});
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) begin();
      },
      { rootMargin: "480px 0px" },
    );
    observer.observe(video);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameId);
      video.removeEventListener("ended", startReverse);
      video.removeEventListener("timeupdate", reverseNearEnd);
    };
  }, [src]);

  return <video ref={videoRef} className={className} muted playsInline preload="none" aria-hidden="true" />;
}
