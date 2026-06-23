"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, FileText, LogOut, Settings, Menu, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types";
import clsx from "clsx";
import { useState } from "react";

interface Props {
  user: User;
  profile: Profile | null;
}

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3, exact: true },
  { href: "/reports", label: "Reports", icon: FileText, exact: false },
  { href: "/settings", label: "Settings", icon: Settings, exact: false },
];

export default function DashboardNav({ user, profile }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const planLabel =
    profile?.subscription_status === "active"
      ? profile.plan === "starter"
        ? "Starter"
        : "Pro"
      : "Trial";

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="bg-white border-b border-gray-200 no-print">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-lg font-bold text-brand-600 shrink-0">
            CompeteIQ
          </Link>
          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  (link.exact ? pathname === link.href : pathname.startsWith(link.href))
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {profile && (
            <span
              className={
                profile.subscription_status === "active"
                  ? "badge-active"
                  : "badge-trial"
              }
            >
              {planLabel}
            </span>
          )}
          <span className="hidden sm:block text-sm text-gray-500 truncate max-w-[160px]">
            {user.email}
          </span>
          <button
            onClick={handleSignOut}
            aria-label="Sign out"
            className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="sm:hidden flex items-center justify-center p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                (link.exact ? pathname === link.href : pathname.startsWith(link.href))
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <link.icon className="h-4 w-4 shrink-0" />
              {link.label}
            </Link>
          ))}
          <div className="border-t border-gray-100 pt-2 mt-2">
            <p className="px-3 py-1 text-xs text-gray-400 truncate">{user.email}</p>
            <button
              onClick={() => { setMobileOpen(false); handleSignOut(); }}
              aria-label="Sign out"
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
