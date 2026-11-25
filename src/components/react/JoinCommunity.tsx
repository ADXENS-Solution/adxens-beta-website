import MainBtn from "./MainBtn";

const dialogId = "contact-team-dialog";

type ButtonProps = {
	label?: string;
};

export default function JoinCommunityButton({ label = "Request Early Access" }: ButtonProps) {
	function openContact() {
		const dialog = document.getElementById(dialogId);
		if (dialog instanceof HTMLDialogElement) dialog.showModal();
	}

	return (
		<MainBtn aria-haspopup="dialog" aria-controls={dialogId} onClick={openContact}>
			{label}
		</MainBtn>
	);
}

type DialogProps = {
	whatsappUrl?: string;
	telegramUrl?: string;
};

export function ContactTeamDialog({
	whatsappUrl = "https://wa.me/message/4LJX46RLL52CG1",
	telegramUrl = "https://t.me/Adxens_Media",
}: DialogProps) {
	return (
		<dialog
			id={dialogId}
			className="support-dialog"
			aria-labelledby="contact-team-title"
			onClick={(event) => {
				if (event.target === event.currentTarget) event.currentTarget.close();
			}}
		>
			<div className="support-panel">
				<div className="support-top">
					<img src="/adxens-logo.png" alt="Adxens" width={105} height={24} className="support-brand" />
					<form method="dialog">
						<button className="support-close" aria-label="Close">
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
								<path
									d="m4 4 8 8m0-8-8 8"
									stroke="currentColor"
									strokeWidth="1.6"
									strokeLinecap="round"
								/>
							</svg>
						</button>
					</form>
				</div>
				<h2 id="contact-team-title">Contact support</h2>
				<div className="support-channels">
					<a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
						<img src="/whatsapp.webp" alt="" width={32} height={32} /> WhatsApp
					</a>
					<a href={telegramUrl} target="_blank" rel="noopener noreferrer">
						<svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
							<circle cx="16" cy="16" r="16" fill="#229ED9" />
							<path
								d="m7.5 15.6 16-6.2c.7-.3 1 .1.9.8l-2.7 12.6c-.2.8-.7 1-1.3.6l-4.9-3.6-2.3 2.2.4-4.6 8.3-7-10.2 6.3-4.2-1.2Z"
								fill="#fff"
							/>
						</svg>
						Telegram
					</a>
				</div>
			</div>
		</dialog>
	);
}
