import { Fragment, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Segment = {
  text: string;
  className?: string;
  breakBefore?: boolean;
};

type RevealTitleProps = {
  segments: string | Segment[];
  className?: string;
};

export default function RevealTitle({ segments, className }: RevealTitleProps) {
  const ref = useRef<HTMLHeadingElement>(null);
  const parts = typeof segments === "string" ? [{ text: segments }] : segments;

  useEffect(() => {
    const element = ref.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const letters = element.querySelectorAll<HTMLElement>("[data-reveal-letter]");
    const lockVerticalPosition = element.classList.contains("reveal-title-position-locked");
    const context = gsap.context(() => {
      gsap.fromTo(
        letters,
        {
          opacity: 0,
          yPercent: lockVerticalPosition ? 0 : 55,
          skewX: -12,
          scaleY: lockVerticalPosition ? 1 : 1.25,
          filter: "blur(6px)",
          textShadow: "-0.08em 0 rgba(255,60,0,0.55), 0.08em 0 rgba(0,150,255,0.55)",
        },
        {
          opacity: 1,
          yPercent: 0,
          skewX: 0,
          scaleY: 1,
          filter: "blur(0px)",
          textShadow: "0em 0 rgba(255,60,0,0), 0em 0 rgba(0,150,255,0)",
          transformOrigin: "50% 100%",
          stagger: 0.11,
          ease: "power1.out",
          scrollTrigger: {
            trigger: element,
            start: "top 95%",
            end: "top 40%",
            scrub: 0.85,
          },
        },
      );
    }, element);

    return () => context.revert();
  }, []);

  return (
    <h2 ref={ref} className={`reveal-title${className ? ` ${className}` : ""}`} aria-label={parts.map((part) => part.text).join(" ")}>
      {parts.map((part, partIndex) => (
        <Fragment key={`${part.text}-${partIndex}`}>
          {part.breakBefore ? <br /> : partIndex > 0 ? " " : null}
          <span className={`reveal-title-segment${part.className ? ` ${part.className}` : ""}`} aria-hidden="true">
            {part.text.split(" ").map((word, wordIndex, words) => (
              <Fragment key={`${word}-${wordIndex}`}>
                <span className="reveal-title-word">
                  {word.split("").map((letter, letterIndex) => (
                    <span className="reveal-title-letter" data-reveal-letter key={`${letter}-${letterIndex}`}>
                      {letter}
                    </span>
                  ))}
                </span>
                {wordIndex < words.length - 1 && " "}
              </Fragment>
            ))}
          </span>
        </Fragment>
      ))}
    </h2>
  );
}
