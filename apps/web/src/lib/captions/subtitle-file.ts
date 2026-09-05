export interface SubtitleCue {
	start: number;
	end: number;
	text: string;
}

export function parseSubtitleTime(value: string): number {
	const match = /^(?:(\d{2,}):)?(\d{2}):(\d{2})[.,](\d{3})$/.exec(value);
	if (!match || Number(match[2]) > 59 || Number(match[3]) > 59) {
		throw new Error("Invalid subtitle timecode");
	}
	return (
		Number(match[1] ?? 0) * 3600 +
		Number(match[2]) * 60 +
		Number(match[3]) +
		Number(match[4]) / 1000
	);
}

export function validateSubtitleCue(cue: SubtitleCue): void {
	if (
		!Number.isFinite(cue.start) ||
		!Number.isFinite(cue.end) ||
		cue.start < 0 ||
		cue.end <= cue.start ||
		!cue.text.trim()
	) {
		throw new Error("Enter subtitle text and a valid start and end time");
	}
}

export function parseSubtitleFile(source: string): SubtitleCue[] {
	const normalized = source
		.replace(/^\uFEFF/, "")
		.replace(/\r\n?/g, "\n")
		.trim();
	const blocks = normalized.split(/\n[ \t]*\n/);
	const cues: SubtitleCue[] = [];
	for (const block of blocks) {
		if (/^(WEBVTT|NOTE|STYLE|REGION)(?:\s|$)/.test(block)) continue;
		const lines = block.split("\n");
		const timeIndex = lines.findIndex((line) => line.includes("-->"));
		if (timeIndex < 0 || timeIndex > 1)
			throw new Error("Invalid subtitle file");
		const match = /^(\S+)\s+-->\s+(\S+)(?:\s+.*)?$/.exec(
			lines[timeIndex].trim(),
		);
		if (!match) throw new Error("Invalid subtitle timecode");
		const cue = {
			start: parseSubtitleTime(match[1]),
			end: parseSubtitleTime(match[2]),
			text: lines
				.slice(timeIndex + 1)
				.join("\n")
				.replace(/<[^>]*>/g, "")
				.trim(),
		};
		validateSubtitleCue(cue);
		cues.push(cue);
	}
	if (!cues.length) throw new Error("No subtitles found");
	return cues.sort((a, b) => a.start - b.start);
}

function formatTime(seconds: number, separator: string): string {
	const ms = Math.round(seconds * 1000);
	const hours = Math.floor(ms / 3600000)
		.toString()
		.padStart(2, "0");
	const minutes = Math.floor((ms / 60000) % 60)
		.toString()
		.padStart(2, "0");
	const secs = Math.floor((ms / 1000) % 60)
		.toString()
		.padStart(2, "0");
	return `${hours}:${minutes}:${secs}${separator}${(ms % 1000).toString().padStart(3, "0")}`;
}

export function serializeSubtitles(
	cues: SubtitleCue[],
	format: "srt" | "vtt",
): string {
	const separator = format === "srt" ? "," : ".";
	const body = [...cues]
		.sort((a, b) => a.start - b.start)
		.map((cue, index) => {
			validateSubtitleCue(cue);
			return `${index + 1}\n${formatTime(cue.start, separator)} --> ${formatTime(cue.end, separator)}\n${cue.text.trim()}`;
		})
		.join("\n\n");
	return `${(format === "vtt" ? "WEBVTT\n\n" : "") + body}\n`;
}
