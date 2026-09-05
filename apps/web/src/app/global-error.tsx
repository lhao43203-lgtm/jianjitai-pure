"use client";

import {
	RecoveryScreen,
	useRecoveryLocale,
} from "@/components/errors/error-recovery";

export default function GlobalError() {
	const locale = useRecoveryLocale();
	return (
		<html lang={locale} translate="no" className="notranslate">
			<head>
				<meta name="google" content="notranslate" />
				<link rel="icon" href="/favicon-commercial.svg" />
			</head>
			<body style={{ margin: 0 }}>
				<RecoveryScreen locale={locale} />
			</body>
		</html>
	);
}
