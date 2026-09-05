import type { Effect } from "@/types/effects";

export type EffectIndicatorKind = "all-enabled" | "partially-enabled" | "all-disabled";

export interface EffectIndicatorState {
	total: number;
	enabled: number;
	label: string;
	kind: EffectIndicatorKind;
}

export function getEffectIndicatorState(
	effects: Effect[] | undefined,
): EffectIndicatorState | null {
	if (!effects?.length) return null;

	const enabled = effects.filter((effect) => effect.enabled).length;
	const total = effects.length;
	return {
		total,
		enabled,
		label: enabled === total ? String(total) : `${enabled}/${total}`,
		kind:
			enabled === total
				? "all-enabled"
				: enabled === 0
					? "all-disabled"
					: "partially-enabled",
	};
}
