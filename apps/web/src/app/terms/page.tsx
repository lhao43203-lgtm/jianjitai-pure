import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service - Editing Desk" };

export default function TermsPage() {
	return (
		<div>
			<Header />
			<main className="mx-auto max-w-3xl space-y-6 px-6 py-12">
				<h1 className="text-3xl font-semibold">Terms of use</h1>
				<p>
					Editing Desk is a pure video editor for importing, editing, and
					exporting media.
				</p>
				<h2 className="text-xl font-semibold">Open-source licenses</h2>
				<p>
					The editor is derived from OpenCut-AI and OpenCut. Their copyright and
					MIT license notices are retained. Third-party components remain
					subject to their own licenses.
				</p>
				<p>
					<a
						className="underline"
						href="https://github.com/Ekaanth/OpenCut-AI/blob/main/LICENSE"
						target="_blank"
						rel="noreferrer"
					>
						Upstream MIT license
					</a>
				</p>
				<h2 className="text-xl font-semibold">Your media</h2>
				<p>
					You are responsible for the rights to media, music, fonts, and other
					materials you upload or publish.
				</p>
				<p>
					Online sound searches allow only verified CC0 results. Library audio
					with missing or unsupported license information is blocked at export.
				</p>
				<h2 className="text-xl font-semibold">Local editing</h2>
				<p>This edition does not call AI services or download AI models.</p>
				<p>
					Project data is stored in your browser. Keep copies of important media
					and exported work.
				</p>
				<h2 className="text-xl font-semibold">Software warranty</h2>
				<p>
					The software is provided as is, without warranty, under the applicable
					open-source licenses.
				</p>
			</main>
			<Footer />
		</div>
	);
}
