import { useEffect, useRef, useState, type ComponentType } from "react";

type GlassProps = {
	text: string;
	videoSrc: string;
	intensity: number;
};

export default function FooterBrandArt() {
	const ref = useRef<HTMLDivElement>(null);
	const [Glass, setGlass] = useState<ComponentType<GlassProps> | null>(null);

	useEffect(() => {
		const node = ref.current;
		if (!node) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry?.isIntersecting) return;
				observer.disconnect();
				void import("./LiquidGlassText").then((mod) => {
					setGlass(() => mod.default);
				});
			},
			{ rootMargin: "280px 0px" },
		);
		observer.observe(node);
		return () => observer.disconnect();
	}, []);

	const Word = Glass;

	return (
		<div ref={ref} className="footer-brand-art">
			{Word ? (
				<Word text="Adxens" videoSrc="/footer-bg.mp4" intensity={12} />
			) : (
				<div className="footer-brand-placeholder" aria-hidden="true" />
			)}
		</div>
	);
}
