import { useLayoutEffect, useRef } from "react";

export default function ProductNotes() {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    element.classList.add("is-armed");

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        element.classList.add("is-filling");
        observer.disconnect();
      },
      { threshold: 0.35, rootMargin: "0px 0px -12% 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="product-notes-block" ref={ref}>
      <span className="product-notes-progress" aria-hidden="true" />
      <ol className="product-notes" aria-label="Adxens V2 product roadmap">
        <li>
          <span>CHAPTER ONE</span>
          <b>V1, handled by hand.</b>
          <p>Every request went through the team, and that meant waiting.</p>
        </li>
        <li className="is-current" aria-current="step">
          <span>NOW</span>
          <b>V2 private beta, 35 testers.</b>
          <p>Thirty-five media buyers test the real-time platform first.</p>
        </li>
        <li>
          <span>NEXT</span>
          <b>Public launch</b>
          <p>Open to everyone once the private beta has shaped it.</p>
        </li>
      </ol>
    </div>
  );
}
