import { useState } from "react";

export type FaqItem = {
	question: string;
	answer: string;
};

export default function FaqList({ items }: { items: FaqItem[] }) {
	const [open, setOpen] = useState(0);

	return (
		<div className="faq-list">
			{items.map((item, index) => {
				const isOpen = open === index;
				const panelId = `faq-panel-${index}`;
				return (
					<div className={isOpen ? "faq-item is-open" : "faq-item"} key={item.question}>
						<button
							type="button"
							aria-expanded={isOpen}
							aria-controls={panelId}
							onClick={() => setOpen(isOpen ? -1 : index)}
						>
							{item.question}
							<span aria-hidden="true">+</span>
						</button>
						<div className="faq-panel" id={panelId} aria-hidden={isOpen ? undefined : true}>
							<div>
								<p>{item.answer}</p>
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}
