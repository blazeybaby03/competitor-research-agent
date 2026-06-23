"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types";
import { CheckCircle, Mail, Lock, Shield } from "lucide-react";

interface Props {
  user: User;
  profile: Profile | null;
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6 max-w-lg space-y-4">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      {children}
    </div>
  );
}

function StatusMessage({ type, message }: { type: "success" | "error"; message: string }) {
  return (
    <p
      className={`text-sm px-3 py-2 rounded-lg ${
        type === "success"
          ? "text-green-700 bg-green-50"
          : "text-red-600 bg-red-50"
      }`}
    >
      {message}
    </p>
  );
}

export default function AccountSettings({ user, profile }: Props) {
  // Profile section
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameStatus, setNameStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Email section
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Password section
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function handleNameSave(e: React.FormEvent) {
    e.preventDefault();
    setNameLoading(true);
    setNameStatus(null);

    const supabase = createClient();
    const trimmed = fullName.trim();

    const [profileResult, authResult] = await Promise.all([
      supabase.from("profiles").update({ full_name: trimmed }).eq("id", user.id),
      supabase.auth.updateUser({ data: { full_name: trimmed } }),
    ]);

    if (profileResult.error || authResult.error) {
      setNameStatus({ type: "error", message: profileResult.error?.message ?? authResult.error?.message ?? "Failed to update name." });
    } else {
      setNameStatus({ type: "success", message: "Name updated." });
    }
    setNameLoading(false);
  }

  async function handleEmailChange(e: React.FormEvent) {
    e.preventDefault();
    setEmailLoading(true);
    setEmailStatus(null);

    const supabase = createClient();
    const emailRedirectTo = `${window.location.origin}/auth/callback?next=/email-confirmed`;
    const { error } = await supabase.auth.updateUser(
      { email: newEmail.trim() },
      { emailRedirectTo }
    );

    if (error) {
      setEmailStatus({ type: "error", message: error.message });
    } else {
      const sentTo = newEmail.trim();
      setNewEmail("");
      setEmailStatus({
        type: "success",
        message: `A confirmation link has been sent to ${sentTo}. Your email will update once confirmed.`,
      });
    }
    setEmailLoading(false);
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordStatus(null);

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: "error", message: "New passwords do not match." });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordStatus({ type: "error", message: "New password must be at least 8 characters." });
      return;
    }

    setPasswordLoading(true);
    const supabase = createClient();

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });

    if (verifyError) {
      setPasswordStatus({ type: "error", message: "Current password is incorrect." });
      setPasswordLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

    if (updateError) {
      setPasswordStatus({ type: "error", message: updateError.message });
    } else {
      setPasswordStatus({ type: "success", message: "Password updated successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setPasswordLoading(false);
  }

  return (
    <div className="space-y-6">
      {/* Profile */}
      <SectionCard title="Profile">
        <form onSubmit={handleNameSave} className="space-y-4">
          <div>
            <label htmlFor="full-name" className="block text-sm font-medium text-gray-700 mb-1">
              Full name
            </label>
            <input
              id="full-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input"
              placeholder="Jane Smith"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <p className="input bg-gray-50 text-gray-500 cursor-default select-all">{user.email}</p>
            <p className="text-xs text-gray-400 mt-1">To change your email address, use the section below.</p>
          </div>
          {nameStatus && <StatusMessage type={nameStatus.type} message={nameStatus.message} />}
          <button type="submit" disabled={nameLoading} className="btn-primary">
            {nameLoading ? "Saving…" : "Save name"}
          </button>
        </form>
      </SectionCard>

      {/* Email */}
      <SectionCard title="Change email address">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Mail className="h-4 w-4 shrink-0 text-gray-400" />
          Current: <span className="font-medium text-gray-700">{user.email}</span>
        </div>
        <form onSubmit={handleEmailChange} className="space-y-4">
          <div>
            <label htmlFor="new-email" className="block text-sm font-medium text-gray-700 mb-1">
              New email address
            </label>
            <input
              id="new-email"
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="input"
              placeholder="new@example.com"
            />
          </div>
          {emailStatus && <StatusMessage type={emailStatus.type} message={emailStatus.message} />}
          <button type="submit" disabled={emailLoading} className="btn-primary">
            {emailLoading ? "Sending…" : "Send confirmation link"}
          </button>
        </form>
      </SectionCard>

      {/* Password */}
      <SectionCard title="Change password">
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-1">
              Current password
            </label>
            <input
              id="current-password"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input"
              placeholder="Your current password"
            />
          </div>
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input"
              placeholder="At least 8 characters"
              minLength={8}
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input"
              placeholder="Repeat your new password"
            />
          </div>
          {passwordStatus && <StatusMessage type={passwordStatus.type} message={passwordStatus.message} />}
          <button type="submit" disabled={passwordLoading} className="btn-primary">
            {passwordLoading ? "Updating…" : "Update password"}
          </button>
        </form>
      </SectionCard>

      {/* Sign-in methods */}
      <SectionCard title="Sign-in methods">
        <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
          <div className="flex items-center gap-3">
            <Lock className="h-4 w-4 text-gray-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">Email &amp; Password</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full">
            <CheckCircle className="h-3.5 w-3.5" />
            Active
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
          <Shield className="h-3.5 w-3.5 shrink-0" />
          Additional sign-in methods (Google, GitHub) coming soon.
        </div>
      </SectionCard>
    </div>
  );
}
