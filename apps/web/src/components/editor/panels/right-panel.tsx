"use client";

import { PropertiesPanel } from "./properties";

export function RightPanel({ className }: { className?: string }) {
	return (
		<div className={className}>
			<PropertiesPanel />
		</div>
	);
}
