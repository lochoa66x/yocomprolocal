"use client";

import { useState } from "react";

type ProductCopySuggestions = {
  title: string;
  description: string;
  whatsappMessage: string;
  socialCaption: string;
  tags: string[];
};

type ProductAiAssistantProps = {
  formId: string;
};

function getFormFieldValue(form: HTMLFormElement, fieldName: string) {
  const formData = new FormData(form);
  return String(formData.get(fieldName) ?? "").trim();
}

function setFormFieldValue(formId: string, fieldName: string, value: string) {
  const form = document.getElementById(formId);

  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  const field = form.elements.namedItem(fieldName);

  if (
    field instanceof HTMLInputElement ||
    field instanceof HTMLTextAreaElement
  ) {
    field.value = value;
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

async function copyText(value: string) {
  if (!navigator.clipboard) {
    return;
  }

  await navigator.clipboard.writeText(value);
}

export default function ProductAiAssistant({ formId }: ProductAiAssistantProps) {
  const [suggestions, setSuggestions] =
    useState<ProductCopySuggestions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function generateSuggestions() {
    const form = document.getElementById(formId);

    if (!(form instanceof HTMLFormElement)) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/ai/product-copy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sellerSlug: getFormFieldValue(form, "sellerSlug"),
          title: getFormFieldValue(form, "title"),
          price: getFormFieldValue(form, "price"),
          category: getFormFieldValue(form, "category"),
          description: getFormFieldValue(form, "description"),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          typeof data.error === "string"
            ? data.error
            : "No pudimos generar sugerencias."
        );
        return;
      }

      setSuggestions(data as ProductCopySuggestions);
    } catch {
      setMessage("No pudimos conectar con la IA. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-lg border border-[#dbe5d6] bg-[#fbfbf7] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c05635]">
            IA
          </p>
          <h2 className="mt-1 text-lg font-black text-[#1f3429]">
            Mejora tu copy de venta
          </h2>
        </div>
        <button
          type="button"
          onClick={generateSuggestions}
          disabled={isLoading}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#f6c55f] px-5 text-sm font-black text-[#1c261f] shadow-sm transition hover:bg-[#ffd77a] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Generando..." : "Mejorar con IA"}
        </button>
      </div>

      {message && (
        <p className="mt-4 rounded-lg bg-[#fff1ec] p-3 text-sm font-semibold leading-6 text-[#a74429]">
          {message}
        </p>
      )}

      {suggestions && (
        <div className="mt-5 space-y-4">
          <article className="rounded-lg border border-[#dbe5d6] bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#567164]">
                  Título sugerido
                </p>
                <p className="mt-2 text-lg font-black text-[#1f3429]">
                  {suggestions.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setFormFieldValue(formId, "title", suggestions.title)
                }
                className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full border border-[#cddcc9] px-4 text-sm font-black text-[#214e34] transition hover:bg-[#eef5ec]"
              >
                Usar título
              </button>
            </div>
          </article>

          <article className="rounded-lg border border-[#dbe5d6] bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#567164]">
                  Descripción
                </p>
                <p className="mt-2 text-sm leading-6 text-[#53645a]">
                  {suggestions.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setFormFieldValue(
                    formId,
                    "description",
                    suggestions.description
                  )
                }
                className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full border border-[#cddcc9] px-4 text-sm font-black text-[#214e34] transition hover:bg-[#eef5ec]"
              >
                Usar descripción
              </button>
            </div>
          </article>

          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-lg border border-[#dbe5d6] bg-white p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#567164]">
                WhatsApp
              </p>
              <p className="mt-2 text-sm leading-6 text-[#53645a]">
                {suggestions.whatsappMessage}
              </p>
              <button
                type="button"
                onClick={() => copyText(suggestions.whatsappMessage)}
                className="mt-3 inline-flex min-h-10 items-center justify-center rounded-full border border-[#cddcc9] px-4 text-sm font-black text-[#214e34] transition hover:bg-[#eef5ec]"
              >
                Copiar
              </button>
            </article>

            <article className="rounded-lg border border-[#dbe5d6] bg-white p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#567164]">
                Redes
              </p>
              <p className="mt-2 text-sm leading-6 text-[#53645a]">
                {suggestions.socialCaption}
              </p>
              <button
                type="button"
                onClick={() => copyText(suggestions.socialCaption)}
                className="mt-3 inline-flex min-h-10 items-center justify-center rounded-full border border-[#cddcc9] px-4 text-sm font-black text-[#214e34] transition hover:bg-[#eef5ec]"
              >
                Copiar
              </button>
            </article>
          </div>

          <div className="flex flex-wrap gap-2">
            {suggestions.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#e6f1e8] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#214e34]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
