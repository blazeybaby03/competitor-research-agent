"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const tabs = [
  { href: "/settings/account", label: "Account" },
  { href: "/settings/billing", label: "Billing" },
];

export default function SettingsTabs() {
  const pathname = usePathname();

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex gap-6">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              "pb-3 text-sm font-medium border-b-2 transition-colors",
              pathname.startsWith(tab.href)
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
