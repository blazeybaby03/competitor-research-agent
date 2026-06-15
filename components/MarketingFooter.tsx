import Link from "next/link";

const legalLinks = [
  { href: "/legal", label: "Legal" },
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/cookies", label: "Cookies" },
  { href: "/legal/refunds", label: "Refunds" },
  { href: "/legal/acceptable-use", label: "Acceptable Use" },
  { href: "/legal/disclaimer", label: "Disclaimer" },
  { href: "/legal/subprocessors", label: "Subprocessors" }
];

export default function MarketingFooter() {
  return (
    <footer className="border-t border-gray-100 bg-white py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link href="/" className="text-sm font-bold text-brand-600">
              CompeteIQ
            </Link>
            <p className="mt-1 max-w-md text-xs text-gray-400">
              Public-source competitor intelligence for founders, operators, and small teams.
            </p>
          </div>
          <nav className="flex max-w-3xl flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500">
            {legalLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-gray-900">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} CompeteIQ. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
