"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("expired") === "1") {
      setError("Your reset link has expired. Enter your email below to receive a new one.");
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="card p-8 max-w-md w-full">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold text-brand-600">
            CompeteIQ
          </Link>
          <p className="mt-2 text-sm text-gray-500">Reset your password</p>
        </div>

        {submitted ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-700">
              If an account exists for <strong>{email}</strong>, you&apos;ll
              receive a password reset link shortly. Check your inbox.
            </p>
            <Link
              href="/login"
              className="inline-block text-sm text-brand-600 font-medium hover:underline"
            >
              Back to log in
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-6">
              Enter your email address and we&apos;ll send you a link to reset
              your password.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="jane@example.com"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Remember your password?{" "}
              <Link href="/login" className="text-brand-600 font-medium hover:underline">
                Log in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
