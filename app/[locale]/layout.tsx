import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Newsreader, Noto_Sans_KR, Noto_Serif_KR, Source_Sans_3 } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const notoSerifKr = Noto_Serif_KR({
  variable: "--font-noto-serif-kr",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "SETESS 남미연합성결신학교",
  description: "Academic portal for seminary campus",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${sourceSans.variable} ${newsreader.variable} ${notoSansKr.variable} ${notoSerifKr.variable}`}
    >
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
