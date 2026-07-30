"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <nav aria-label="Language" className="locale-switcher">
      {routing.locales.map((loc) => (
        <Link
          key={loc}
          href={pathname}
          locale={loc}
          aria-current={loc === locale ? "page" : undefined}
          className={loc === locale ? "locale-switcher__link is-active" : "locale-switcher__link"}
        >
          {loc}
        </Link>
      ))}
    </nav>
  );
}
