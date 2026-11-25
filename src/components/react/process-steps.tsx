import { useEffect, useRef } from "react";

const steps = [
  {
    number: "01",
    title: "Apply",
    body: "Contact our team on WhatsApp or Telegram to request early access.",
  },
  {
    number: "02",
    title: "Get selected",
    body: <>We pick 35 testers across agencies, affiliate buyers, e-commerce brands and solo advertisers. Shortlisted applicants get a short call. If you&apos;re in, you&apos;ll hear from us within <strong>[48 hours]</strong>.</>,
  },
  {
    number: "03",
    title: "Test & shape V2",
    body: "Join your group of six, run the tasks on live campaigns, and tell us what works.",
  },
];

export default function ProcessSteps() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      element.classList.add("is-filled");
      return;
    }

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
    <div className="steps" ref={ref}>
      {steps.map((step) => (
        <div className="step" key={step.number}>
          <span>{step.number}</span>
          <i />
          <h3>{step.title}</h3>
          <p>{step.body}</p>
        </div>
      ))}
      <span className="steps-progress" aria-hidden="true" />
    </div>
  );
}
