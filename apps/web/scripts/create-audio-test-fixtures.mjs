// Original, quiet PCM tones for local upload/preview regression checks.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const output = join(tmpdir(), "editing-desk-audio-qa");
mkdirSync(output, { recursive: true });
writeFileSync(join(output, "损坏音频.wav"), "Not a valid WAV file");
for (const [name, frequency] of [
	["试听测试-440Hz.wav", 440],
	["試聽測試-330Hz.wav", 330],
]) {
	const sampleRate = 44100;
	const samples = sampleRate * 12;
	const wav = Buffer.alloc(44 + samples * 2);
	wav.write("RIFF", 0);
	wav.writeUInt32LE(wav.length - 8, 4);
	wav.write("WAVEfmt ", 8);
	wav.writeUInt32LE(16, 16);
	wav.writeUInt16LE(1, 20);
	wav.writeUInt16LE(1, 22);
	wav.writeUInt32LE(sampleRate, 24);
	wav.writeUInt32LE(sampleRate * 2, 28);
	wav.writeUInt16LE(2, 32);
	wav.writeUInt16LE(16, 34);
	wav.write("data", 36);
	wav.writeUInt32LE(samples * 2, 40);
	for (let i = 0; i < samples; i++) {
		const fade = Math.min(1, i / 2205, (samples - i - 1) / 2205);
		wav.writeInt16LE(
			Math.round(
				Math.sin((i * frequency * 2 * Math.PI) / sampleRate) * 1600 * fade,
			),
			44 + i * 2,
		);
	}
	const path = join(output, name);
	writeFileSync(path, wav);
	console.log(path);
}
