"use client";

import { useState, useRef, useEffect } from "react";
import {
  Share2,
  Mail,
  Copy,
  MessageSquare,
  FileText,
  CheckSquare,
  ChevronDown,
} from "lucide-react";

interface Props {
  title: string;
  /** Full report rendered as plain text — used for clipboard and app paste. */
  text: string;
  /** Short summary used for the email body (falls back to the full text). */
  summary?: string;
}

interface ShareTarget {
  name: string;
  url: string;
}

export default function ShareMenu({ title, text, summary }: Props) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [hasNativeShare, setHasNativeShare] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHasNativeShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  }

  async function copyText(): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  async function handleCopy() {
    const ok = await copyText();
    showToast(
      ok
        ? "Report copied to clipboard."
        : "Couldn't copy — your browser blocked clipboard access."
    );
    setOpen(false);
  }

  function handleEmail() {
    const body = [
      title,
      "",
      summary && summary.trim() ? summary : text.slice(0, 1500),
      "",
      "— Shared from CompeteIQ",
    ].join("\n");
    const subject = `Competitor report: ${title}`;
    // Keep the mailto within safe URL length limits for mail clients.
    const mailto = `mailto:?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body.slice(0, 1800))}`;
    window.location.href = mailto;
    setOpen(false);
  }

  async function handleAppShare(target: ShareTarget) {
    const ok = await copyText();
    window.open(target.url, "_blank", "noopener,noreferrer");
    showToast(
      ok
        ? `Report copied — paste it into ${target.name}.`
        : `Opening ${target.name} — copy the report manually to paste it in.`
    );
    setOpen(false);
  }

  async function handleNativeShare() {
    setOpen(false);
    if (navigator.share) {
      try {
        await navigator.share({ title, text });
      } catch {
        /* user dismissed the share sheet */
      }
    }
  }

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="btn-secondary text-sm flex items-center gap-1.5"
      >
        <Share2 className="h-4 w-4" aria-hidden="true" />
        Share report
        <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-100 bg-white shadow-lg z-20 py-1"
        >
          <MenuItem
            icon={<Mail className="h-4 w-4" aria-hidden="true" />}
            label="Email"
            onClick={handleEmail}
          />
          <MenuItem
            icon={<MessageSquare className="h-4 w-4" aria-hidden="true" />}
            label="Slack"
            onClick={() =>
              handleAppShare({ name: "Slack", url: "https://app.slack.com/client" })
            }
          />
          <MenuItem
            icon={<FileText className="h-4 w-4" aria-hidden="true" />}
            label="Notion"
            onClick={() =>
              handleAppShare({ name: "Notion", url: "https://www.notion.so" })
            }
          />
          <MenuItem
            icon={<CheckSquare className="h-4 w-4" aria-hidden="true" />}
            label="Asana"
            onClick={() =>
              handleAppShare({ name: "Asana", url: "https://app.asana.com" })
            }
          />
          <div className="my-1 border-t border-gray-100" />
          <MenuItem
            icon={<Copy className="h-4 w-4" aria-hidden="true" />}
            label="Copy to clipboard"
            onClick={handleCopy}
          />
          {hasNativeShare && (
            <MenuItem
              icon={<Share2 className="h-4 w-4" aria-hidden="true" />}
              label="More options…"
              onClick={handleNativeShare}
            />
          )}
        </div>
      )}

      {toast && (
        <div
          role="status"
          className="absolute right-0 mt-2 w-64 rounded-lg bg-gray-900 text-white text-xs px-3 py-2 shadow-lg z-30"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
    >
      <span className="text-gray-400">{icon}</span>
      {label}
    </button>
  );
}
