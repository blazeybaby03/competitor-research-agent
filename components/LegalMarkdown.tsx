import Link from "next/link";
import type { ReactNode } from "react";
import { MD_BASENAME_TO_SLUG } from "@/lib/legal";

/**
 * Minimal, dependency-free markdown renderer for CompeteIQ's legal documents.
 *
 * It supports exactly the constructs those documents use: ATX headings,
 * paragraphs, bold, inline code, links, blockquotes, ordered/unordered lists,
 * horizontal rules and GFM tables. Cross-document `.md` links are resolved to
 * `/legal/*` routes; links to internal-only documents render as plain text.
 */

function resolveHref(href: string): string | null {
  if (/^https?:\/\//i.test(href) || href.startsWith("mailto:")) return href;
  if (href.startsWith("/")) return href;
  if (href.endsWith(".md")) {
    const base = href.split("/").pop()!.replace(/\.md$/, "");
    const slug = MD_BASENAME_TO_SLUG[base];
    return slug ? `/legal/${slug}` : null; // null => not published, render as text
  }
  return href;
}

/** Parse inline markdown: links, bold, inline code. */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // Matches: [text](url)  |  **bold**  |  `code`
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const key = `${keyPrefix}-i${i++}`;
    if (m[1] !== undefined) {
      const href = resolveHref(m[2]);
      if (href === null) {
        nodes.push(<span key={key}>{m[1]}</span>);
      } else if (href.startsWith("/")) {
        nodes.push(
          <Link key={key} href={href} className="text-brand-600 underline hover:text-brand-700">
            {m[1]}
          </Link>
        );
      } else {
        nodes.push(
          <a
            key={key}
            href={href}
            className="text-brand-600 underline hover:text-brand-700"
            {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {m[1]}
          </a>
        );
      }
    } else if (m[3] !== undefined) {
      nodes.push(<strong key={key} className="font-semibold text-gray-900">{m[3]}</strong>);
    } else if (m[4] !== undefined) {
      nodes.push(
        <code key={key} className="rounded bg-gray-100 px-1 py-0.5 text-[0.85em] text-gray-800">
          {m[4]}
        </code>
      );
    }
    last = re.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function splitRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split("|").map((c) => c.trim());
}

const isTableSep = (line: string) => /^\s*\|?[\s:|-]+\|?\s*$/.test(line) && line.includes("-");

export default function LegalMarkdown({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;
  const nextKey = () => `b${key++}`;

  while (i < lines.length) {
    let line = lines[i];

    // Blank line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Horizontal rule
    if (/^---+\s*$/.test(line.trim())) {
      blocks.push(<hr key={nextKey()} className="my-8 border-gray-200" />);
      i++;
      continue;
    }

    // Heading
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const txt = renderInline(h[2], nextKey());
      const k = nextKey();
      if (level === 1) {
        blocks.push(<h1 key={k} className="text-3xl font-bold text-gray-900 mt-2 mb-4">{txt}</h1>);
      } else if (level === 2) {
        blocks.push(<h2 key={k} className="text-2xl font-semibold text-gray-900 mt-10 mb-3">{txt}</h2>);
      } else if (level === 3) {
        blocks.push(<h3 key={k} className="text-xl font-semibold text-gray-900 mt-8 mb-2">{txt}</h3>);
      } else {
        blocks.push(<h4 key={k} className="text-lg font-semibold text-gray-900 mt-6 mb-2">{txt}</h4>);
      }
      i++;
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      blocks.push(
        <blockquote
          key={nextKey()}
          className="my-6 border-l-4 border-brand-200 bg-brand-50 px-4 py-3 text-sm text-gray-700"
        >
          {renderInline(buf.join(" "), nextKey())}
        </blockquote>
      );
      continue;
    }

    // Table
    if (line.includes("|") && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const header = splitRow(line);
      i += 2; // skip header + separator
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim() !== "") {
        rows.push(splitRow(lines[i]));
        i++;
      }
      blocks.push(
        <div key={nextKey()} className="my-6 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {header.map((c, ci) => (
                  <th
                    key={ci}
                    className="border border-gray-200 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-900"
                  >
                    {renderInline(c, `${nextKey()}-h${ci}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri}>
                  {r.map((c, ci) => (
                    <td key={ci} className="border border-gray-200 px-3 py-2 align-top text-gray-700">
                      {renderInline(c, `${nextKey()}-r${ri}c${ci}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Unordered list
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push(
        <ul key={nextKey()} className="my-4 list-disc space-y-2 pl-6 text-gray-700">
          {items.map((it, ii) => (
            <li key={ii}>{renderInline(it, `${nextKey()}-li${ii}`)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push(
        <ol key={nextKey()} className="my-4 list-decimal space-y-2 pl-6 text-gray-700">
          {items.map((it, ii) => (
            <li key={ii}>{renderInline(it, `${nextKey()}-oli${ii}`)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Paragraph (gather consecutive plain lines)
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,6})\s+/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^[-*]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i]) &&
      !/^---+\s*$/.test(lines[i].trim()) &&
      !(lines[i].includes("|") && i + 1 < lines.length && isTableSep(lines[i + 1]))
    ) {
      para.push(lines[i]);
      i++;
    }
    if (para.length) {
      blocks.push(
        <p key={nextKey()} className="my-4 leading-relaxed text-gray-700">
          {renderInline(para.join(" "), nextKey())}
        </p>
      );
      line = "";
    }
  }

  return <div className="legal-prose">{blocks}</div>;
}
