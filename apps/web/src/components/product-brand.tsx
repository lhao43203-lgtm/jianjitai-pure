import { COMMERCIAL_MODE } from "@/lib/commercial-mode";

export const PRODUCT_NAME = COMMERCIAL_MODE ? "Editing Desk" : "OpenCut AI";

export function ProductLogo({ size = 26 }: { size?: number }) {
	if (COMMERCIAL_MODE) {
		return (
			<svg
				width={size}
				height={size}
				viewBox="0 0 48 48"
				fill="none"
				className="text-primary shrink-0"
				aria-hidden="true"
			>
				<rect x="4" y="7" width="40" height="34" rx="8" fill="currentColor" />
				<path d="M20 16L20 32L33 24L20 16Z" fill="white" />
				<path d="M11 13V17M11 22V26M11 31V35M37 13V17M37 22V26M37 31V35" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
			</svg>
		);
	}

	return <OpenCutAILogo size={size} />;
}

function OpenCutAILogo({ size = 26 }: { size?: number }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 48 48"
			fill="none"
			className="shrink-0"
			aria-hidden="true"
		>
			<defs>
				<linearGradient id="oc-bg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
					<stop offset="0%" stopColor="#2567EC" />
					<stop offset="100%" stopColor="#37B6F7" />
				</linearGradient>
				<linearGradient id="oc-spark" x1="32" y1="4" x2="44" y2="18" gradientUnits="userSpaceOnUse">
					<stop offset="0%" stopColor="#FFF" />
					<stop offset="100%" stopColor="#FFD96A" />
				</linearGradient>
			</defs>
			<rect x="2" y="2" width="44" height="44" rx="13" fill="url(#oc-bg)" />
			<rect x="2" y="2" width="44" height="22" rx="13" fill="white" opacity="0.07" />
			<path d="M19 14L19 34L35 24L19 14Z" fill="white" />
			<path d="M38.5 7L40 11.5L44 13L40 14.5L38.5 19L37 14.5L33 13L37 11.5L38.5 7Z" fill="url(#oc-spark)" />
			<circle cx="9" cy="8" r="1.5" fill="white" opacity="0.4" />
		</svg>
	);
}
