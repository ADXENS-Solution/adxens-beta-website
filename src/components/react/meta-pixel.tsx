import { useEffect, useRef } from "react";

declare global {
	interface Window {
		fbq?: (...args: unknown[]) => void;
	}
}

/** Fires Meta Pixel PageView on client navigations (Astro view transitions / soft nav). */
export default function MetaPixel() {
	const lastPath = useRef<string | null>(null);

	useEffect(() => {
		const track = () => {
			const path = window.location.pathname;
			if (lastPath.current === path) return;
			lastPath.current = path;
			window.fbq?.("track", "PageView");
		};

		track();
		document.addEventListener("astro:page-load", track);
		return () => document.removeEventListener("astro:page-load", track);
	}, []);

	return null;
}
