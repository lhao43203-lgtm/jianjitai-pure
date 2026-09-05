"use client";

import { useLocalStorage } from "@/hooks/storage/use-local-storage";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";
import { PRODUCT_NAME } from "@/components/product-brand";
import { EmptyEditorGuide } from "./empty-editor-guide";

export function Onboarding() {
	const [seen, setSeen] = useLocalStorage({
		key: "editing-desk-pure-onboarding-v1",
		defaultValue: false,
	});
	const close = () => setSeen({ value: true });
	return (
		<Dialog
			open={!seen}
			onOpenChange={(open) => {
				if (!open) close();
			}}
		>
			<DialogContent className="sm:max-w-md">
				<DialogTitle>Welcome to {PRODUCT_NAME}</DialogTitle>
				<DialogDescription>Pure editing edition</DialogDescription>
				<DialogBody>
					<EmptyEditorGuide />
					<Button onClick={close}>Start editing</Button>
				</DialogBody>
			</DialogContent>
		</Dialog>
	);
}
