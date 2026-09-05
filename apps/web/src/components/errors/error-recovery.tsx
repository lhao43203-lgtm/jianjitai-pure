"use client";

import { useEffect, useState } from "react";
import {
	normalizeLocale,
	translateText,
	type AppLocale,
} from "@/i18n/translate";

// Recovery must work even if the normal locale or editor providers have failed.
export function useRecoveryLocale(): AppLocale {
	const [locale, setLocale] = useState<AppLocale>("en");
	useEffect(() => {
		let preferred = document.documentElement.dataset.locale;
		try {
			preferred = localStorage.getItem("opencut.locale") || preferred;
		} catch {
			// Site storage can be unavailable; the browser language is still usable.
		}
		setLocale(normalizeLocale(preferred || navigator.language));
	}, []);
	return locale;
}

export function RecoveryScreen({ locale }: { locale: AppLocale }) {
	const t = (source: string) => translateText(source, locale);
	return (
		<main
			lang={locale}
			translate="no"
			className="notranslate"
			style={{
				minHeight: "100dvh",
				display: "grid",
				placeItems: "center",
				padding: 24,
				boxSizing: "border-box",
				background: "#fafafa",
				color: "#202024",
				fontFamily: "system-ui, sans-serif",
				lineHeight: 1.6,
			}}
		>
			<section style={{ maxWidth: 560 }}>
				<p>{t("Editing Desk")}</p>
				<div role="alert">
					<h1 style={{ fontSize: 26, lineHeight: 1.3 }}>
						{t("This page could not continue")}
					</h1>
					<p>
						{t(
							"Reload to return to the last saved state. Unsaved changes may be lost.",
						)}
					</p>
				</div>
				<p>
					{t(
						"If browser translation is enabled, turn it off for this site and use the language switch in the upper right.",
					)}
				</p>
				<p>
					{t(
						"Do not clear site data: projects and imported media are stored in this browser.",
					)}
				</p>
				<div
					style={{
						display: "flex",
						flexWrap: "wrap",
						gap: 20,
						alignItems: "center",
						marginTop: 24,
					}}
				>
					<button
						type="button"
						onClick={() => window.location.reload()}
						style={{
							background: "#242428",
							color: "#fff",
							border: 0,
							borderRadius: 8,
							padding: "12px 18px",
							cursor: "pointer",
							font: "inherit",
						}}
					>
						{t("Reload saved project")}
					</button>
					<a
						href="/projects"
						style={{ color: "#34343a", textDecoration: "underline" }}
					>
						{t("Back to projects")}
					</a>
				</div>
			</section>
		</main>
	);
}

export default function ErrorRecovery() {
	return <RecoveryScreen locale={useRecoveryLocale()} />;
}
