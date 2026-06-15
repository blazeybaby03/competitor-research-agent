import Link from "next/link";
import { Menu } from "lucide-react";

const navLinks = [
  { href: "/use-cases", label: "Use Cases" },
  { href: "/sample-reports", label: "Sample Reports" },
  { href: "/research-sources", label: "How It Works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/legal", label: "Legal" }
];

export default function MarketingNav() {
  return (
    <nav className="border-b border-gray-100 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-bold text-brand-600">
          CompeteIQ
        </Link>

        <div className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-4 lg:flex">
          <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            Log in
          </Link>
          <Link href="/signup" className="btn-primary text-sm">
            Get started free
          </Link>
        </div>

        <details className="group relative lg:hidden">
          <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-lg border border-gray-200 text-gray-700 transition-colors hover:bg-gray-50">
            <Menu className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Open menu</span>
          </summary>
          <div className="absolute right-0 z-20 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
            <div className="flex flex-col">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {link.label}
                </Link>
              ))}
              <div className="my-2 border-t border-gray-100" />
              <Link
                href="/login"
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Log in
              </Link>
              <Link href="/signup" className="btn-primary mt-2 w-full text-sm">
                Get started free
              </Link>
            </div>
          </div>
        </details>
      </div>
    </nav>
  );
}
