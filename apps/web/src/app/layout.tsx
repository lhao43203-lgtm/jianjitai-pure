import { ThemeProvider } from "next-themes";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "../components/ui/sonner";
import { TooltipProvider } from "../components/ui/tooltip";
import { baseMetaData } from "./metadata";
import { BotIdClient } from "botid/client";
import { webEnv } from "@opencut-ai/env/web";
import { Inter } from "next/font/google";
import { JsonLd } from "@/components/seo/json-ld";
import { GoogleAnalytics } from "@/components/seo/google-analytics";
import { I18nProvider } from "@/i18n/i18n-provider";

const siteFont = Inter({ subsets: ["latin"] });

export const metadata = baseMetaData;

const protectedRoutes = [
	{
		path: "/none",
		method: "GET",
	},
];

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			translate="no"
			className="notranslate"
			suppressHydrationWarning
		>
			<head>
				<meta name="google" content="notranslate" />
				<Script id="opencut-locale" strategy="beforeInteractive">
					{`try{var s=localStorage.getItem("opencut.locale");var l=s||(navigator.languages&&navigator.languages[0])||navigator.language||"en";l=/^zh-(tw|hk|mo)|^zh-hant/i.test(l)?"zh-TW":/^zh/i.test(l)?"zh-CN":"en";document.documentElement.lang=l;document.documentElement.dataset.locale=l}catch(e){}`}
				</Script>
				<BotIdClient protect={protectedRoutes} />
				<JsonLd />
				<GoogleAnalytics />
				{process.env.NODE_ENV === "development" &&
					process.env.NEXT_PUBLIC_ENABLE_REACT_SCAN === "true" && (
						<Script
							src="//unpkg.com/react-scan/dist/auto.global.js"
							crossOrigin="anonymous"
							strategy="beforeInteractive"
						/>
					)}
			</head>
			<body
				className={`${siteFont.className} font-sans antialiased`}
				suppressHydrationWarning
			>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					disableTransitionOnChange={true}
				>
					<I18nProvider>
						<TooltipProvider>
							<Toaster />
							{process.env.NEXT_PUBLIC_DATABUDDY_CLIENT_ID && (
								<Script
									src="https://cdn.databuddy.cc/databuddy.js"
									strategy="afterInteractive"
									async
									data-client-id={process.env.NEXT_PUBLIC_DATABUDDY_CLIENT_ID}
									data-disabled={webEnv.NODE_ENV === "development"}
									data-track-attributes={false}
									data-track-errors={true}
									data-track-outgoing-links={false}
									data-track-web-vitals={false}
									data-track-sessions={false}
								/>
							)}
							{children}
						</TooltipProvider>
					</I18nProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
