import { useEffect, useRef, useState } from "react";

type TocItem = { id: string; label: string };

function SunIcon() {
	return (
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<circle cx="12" cy="12" r="4" />
			<path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
		</svg>
	);
}

function MoonIcon() {
	return (
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
		</svg>
	);
}

function Contents({
	items,
	activeId,
	onNavigate,
}: {
	items: TocItem[];
	activeId: string;
	onNavigate?: () => void;
}) {
	return (
		<ol>
			{items.map((item) => (
				<li key={item.id}>
					<a
						className={item.id === activeId ? "is-active" : undefined}
						href={`#${item.id}`}
						onClick={onNavigate}
					>
						{item.label}
					</a>
				</li>
			))}
		</ol>
	);
}

export function LegalHero({ title, updated }: { title: string; updated?: string }) {
	function toggleTheme() {
		const root = document.querySelector<HTMLElement>(".legal-root");
		if (!root) return;
		const explicit = root.dataset.theme;
		const effective =
			explicit === "light" || explicit === "dark"
				? explicit
				: window.matchMedia("(prefers-color-scheme: dark)").matches
					? "dark"
					: "light";
		const next = effective === "dark" ? "light" : "dark";
		root.dataset.theme = next;
		document.cookie = `adxens-legal-theme=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
	}

	return (
		<header className="legal-hero">
			<div className="legal-in">
				<button className="legal-theme" type="button" onClick={toggleTheme}>
					<span className="legal-theme-to-light">
						<SunIcon /> Light
					</span>
					<span className="legal-theme-to-dark">
						<MoonIcon /> Dark
					</span>
				</button>
				<h1>{title}</h1>
				{updated ? <p className="legal-meta">Updated {updated}</p> : null}
			</div>
		</header>
	);
}

export function LegalToc() {
	const menuRef = useRef<HTMLDetailsElement>(null);
	const [items, setItems] = useState<TocItem[]>([{ id: "overview", label: "Overview" }]);
	const [activeId, setActiveId] = useState("overview");
	const activeLabel = items.find((item) => item.id === activeId)?.label ?? "Contents";

	useEffect(() => {
		const article = document.querySelector(".legal-doc");
		if (!article) return;

		const toc: TocItem[] = [{ id: "overview", label: "Overview" }];
		article.querySelectorAll("h2").forEach((heading, index) => {
			const text = heading.textContent?.replace(/#$/, "").trim() || `Section ${index + 1}`;
			if (/^overview$/i.test(text)) {
				heading.id = "overview";
				return;
			}
			const id = `s${toc.length}`;
			heading.id = id;
			toc.push({ id, label: text });
		});
		setItems(toc);

		const targets = [
			...Array.from(document.querySelectorAll<HTMLElement>(".legal-root #overview")),
			...Array.from(article.querySelectorAll<HTMLElement>("h2")),
		];
		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries
					.filter((entry) => entry.isIntersecting)
					.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
				if (visible?.target.id) setActiveId(visible.target.id);
			},
			{ rootMargin: "-90px 0px -70% 0px" },
		);
		targets.forEach((el) => observer.observe(el));
		return () => observer.disconnect();
	}, []);

	return (
		<>
			<nav className="legal-toc" aria-label="Table of contents">
				<Contents items={items} activeId={activeId} />
			</nav>
			<details className="legal-mobile" ref={menuRef}>
				<summary>{activeLabel}</summary>
				<nav aria-label="Table of contents">
					<Contents
						items={items}
						activeId={activeId}
						onNavigate={() => menuRef.current?.removeAttribute("open")}
					/>
				</nav>
			</details>
		</>
	);
}
