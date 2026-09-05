"use client";

import type { EffectElement } from "@/types/timeline";
import { getEffect } from "@/lib/effects/registry";
import { useEditor } from "@/hooks/use-editor";
import {
	Section,
	SectionContent,
	SectionHeader,
	SectionFields,
	SectionTitle,
} from "./section";
import { EffectParamField } from "./effect-param-field";
import { Button } from "@/components/ui/button";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function EffectProperties({
	element,
	trackId,
}: {
	element: EffectElement;
	trackId: string;
}) {
	const editor = useEditor();
	const definition = getEffect({ effectType: element.effectType });

	const previewParam =
		({ key }: { key: string }) =>
		(value: number | string | boolean) =>
			editor.timeline.previewElements({
				updates: [
					{
						trackId,
						elementId: element.id,
						updates: { params: { ...element.params, [key]: value } },
					},
				],
			});

	return (
		<Section showTopBorder={false}>
			<SectionHeader
				trailing={
					<Button
						variant="ghost"
						size="icon"
						className="text-destructive hover:text-destructive"
						aria-label="Delete effect"
						onClick={() =>
							editor.timeline.deleteElements({
								elements: [{ trackId, elementId: element.id }],
							})
						}
					>
						<HugeiconsIcon icon={Delete02Icon} />
					</Button>
				}
			>
				<SectionTitle>{definition.name}</SectionTitle>
			</SectionHeader>
			<SectionContent>
				<SectionFields>
					{definition.params.map((param) => (
						<EffectParamField
							key={param.key}
							param={param}
							value={element.params[param.key] ?? param.default}
							onPreview={previewParam({ key: param.key })}
							onCommit={() => editor.timeline.commitPreview()}
						/>
					))}
				</SectionFields>
			</SectionContent>
		</Section>
	);
}
