import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardNav from "@/components/DashboardNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav user={user} profile={profile} />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="border-t border-gray-200 py-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-5 gap-y-2 px-4 text-xs text-gray-400 sm:px-6 lg:px-8">
          <Link href="/legal/terms" className="hover:text-gray-700">Terms</Link>
          <Link href="/legal/privacy" className="hover:text-gray-700">Privacy</Link>
          <Link href="/legal/cookies" className="hover:text-gray-700">Cookies</Link>
          <Link href="/legal/refunds" className="hover:text-gray-700">Refunds</Link>
          <Link href="/legal/acceptable-use" className="hover:text-gray-700">Acceptable Use</Link>
          <Link href="/legal/disclaimer" className="hover:text-gray-700">Disclaimer</Link>
        </div>
      </footer>
    </div>
  );
}
