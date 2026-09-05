"use client";

import { useId } from "react";
import { ChevronDown, Languages } from "lucide-react";
import { useI18n } from "./i18n-provider";
import type { AppLocale } from "./translate";
import { cn } from "@/utils/ui";

const localeOptions: Array<{ value: AppLocale; label: string }> = [
	{ value: "zh-CN", label: "简体中文" },
	{ value: "zh-TW", label: "繁體中文" },
	{ value: "en", label: "English" },
];

const accessibleLabels: Record<AppLocale, string> = {
	en: "Interface language",
	"zh-CN": "界面语言",
	"zh-TW": "介面語言",
};

export function LanguageSwitcher({ className }: { className?: string }) {
	const { locale, setLocale } = useI18n();
	const label = accessibleLabels[locale];
	const selectId = useId();

	return (
		<div
			className={cn(
				"flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-border bg-background px-2 text-foreground",
				className,
			)}
			data-i18n-ignore
		>
			<Languages className="size-4 text-muted-foreground" aria-hidden="true" />
			<label className="sr-only" htmlFor={selectId}>
				{label}
			</label>
			<div className="relative flex items-center">
				<select
					id={selectId}
					className="h-7 cursor-pointer appearance-none bg-transparent pr-4 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					value={locale}
					onChange={(event) => setLocale(event.target.value as AppLocale)}
					aria-label={label}
					title={label}
				>
					{localeOptions.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
				<ChevronDown
					className="pointer-events-none absolute right-0 size-3 text-muted-foreground"
					aria-hidden="true"
				/>
			</div>
		</div>
	);
}
