import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function EmailConfirmedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="card p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <Link href="/" className="text-2xl font-bold text-brand-600">
            CompeteIQ
          </Link>
        </div>

        <div className="flex justify-center mb-4">
          <CheckCircle className="h-12 w-12 text-green-500" />
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Email address updated
        </h1>

        {user?.email ? (
          <p className="text-sm text-gray-500 mb-8">
            Your email address has been successfully updated to{" "}
            <strong className="text-gray-900">{user.email}</strong>.
          </p>
        ) : (
          <p className="text-sm text-gray-500 mb-8">
            Your email address has been successfully updated.
          </p>
        )}

        <Link href="/dashboard" className="btn-primary w-full">
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
