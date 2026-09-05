import { readFileSync } from "node:fs";
import { ALL_FORMATS, BufferSource, Input } from "mediabunny";

const input = new Input({
	source: new BufferSource(readFileSync(process.argv[2])),
	formats: ALL_FORMATS,
});
try {
	const tracks = await input.getAudioTracks();
	if (tracks.length === 0) throw new Error("Export has no audio track");
	console.log(
		JSON.stringify({
			duration: await input.computeDuration(),
			audioTracks: tracks.length,
			codecs: tracks.map((track) => track.codec),
		}),
	);
} finally {
	input.dispose();
}
