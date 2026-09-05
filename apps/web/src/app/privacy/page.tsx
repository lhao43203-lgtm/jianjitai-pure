import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy - Editing Desk" };

export default function PrivacyPage() {
	return (
		<div>
			<Header />
			<main className="mx-auto max-w-3xl space-y-6 px-6 py-12">
				<h1 className="text-3xl font-semibold">Privacy Policy</h1>
				<h2 className="text-xl font-semibold">Browser storage</h2>
				<p>
					Projects and imported media are stored in this browser. Clearing site
					data removes locally stored projects and media.
				</p>
				<p>
					Different ports and websites have separate browser storage. This
					edition does not migrate projects from another installation.
				</p>
				<h2 className="text-xl font-semibold">Media processing</h2>
				<p>
					Video preview, subtitle file processing, and export run locally in the
					browser.
				</p>
				<p>This edition does not call AI services or download AI models.</p>
				<h2 className="text-xl font-semibold">Optional connections</h2>
				<p>
					Online asset searches send search terms to the configured asset
					provider. Loading online fonts, stickers, or media contacts their
					providers.
				</p>
				<p>
					Account services, cloud synchronization, and analytics require
					separate site configuration. They are not required for local editing.
				</p>
			</main>
			<Footer />
		</div>
	);
}
