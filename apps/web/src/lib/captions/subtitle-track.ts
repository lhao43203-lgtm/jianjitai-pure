import { DEFAULT_TEXT_ELEMENT } from "@/constants/text-constants";
import type { TextTrack } from "@/types/timeline";
import { generateUUID } from "@/utils/id";
import { type SubtitleCue, validateSubtitleCue } from "./subtitle-file";

export function buildSubtitleTrack(
	cues: SubtitleCue[],
	name: string,
	canvasHeight: number,
): TextTrack {
	cues.forEach(validateSubtitleCue);
	return {
		id: generateUUID(),
		type: "text",
		name,
		hidden: false,
		elements: cues.map((cue) => ({
			...structuredClone(DEFAULT_TEXT_ELEMENT),
			id: generateUUID(),
			name: cue.text,
			content: cue.text,
			startTime: cue.start,
			duration: cue.end - cue.start,
			fontSize: 6,
			transform: {
				scale: 1,
				rotate: 0,
				position: { x: 0, y: canvasHeight * 0.36 },
			},
			background: {
				...DEFAULT_TEXT_ELEMENT.background,
				enabled: true,
				color: "#000000",
				paddingX: 12,
				paddingY: 6,
			},
		})),
	};
}
