"use client";

import { useState } from "react";

export default function CopyLinkButton({ value }: { value: string }) {
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

  return (
    <button
      type="button"
      onClick={copyLink}
      className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#214e34] px-5 text-sm font-black text-white transition hover:bg-[#2f7c5b]"
    >
      {copied ? "Link copiado" : "Copiar link"}
    </button>
  );
}
