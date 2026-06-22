"use client";

import { useState } from "react";

export default function CopyLinkButton({
  copiedLabel = "Link copiado",
  label = "Copiar link",
  value,
  variant = "primary",
}: {
  copiedLabel?: string;
  label?: string;
  value: string;
  variant?: "primary" | "secondary";
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  const className =
    variant === "secondary"
      ? "inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#214e34]/20 bg-white px-5 text-center text-sm font-black leading-5 text-[#214e34] transition hover:border-[#214e34]/35 hover:bg-[#f7fbf4]"
      : "inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#214e34] px-5 text-center text-sm font-black leading-5 text-white transition hover:bg-[#2f7c5b]";

  return (
    <button
      type="button"
      onClick={copyLink}
      className={className}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
