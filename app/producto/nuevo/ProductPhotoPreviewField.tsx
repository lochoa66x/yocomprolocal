"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { ProductImageFrame } from "@/components/product-image-frame";

type ProductPhotoPreviewFieldProps = {
  currentImageUrl?: string;
  fileHelpText: string;
  fileLabel: string;
  previewAlt: string;
  urlHelpText?: string;
  urlLabel: string;
};

function getValidImageUrl(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue || !/^https?:\/\//.test(trimmedValue)) {
    return "";
  }

  return trimmedValue;
}

export default function ProductPhotoPreviewField({
  currentImageUrl = "",
  fileHelpText,
  fileLabel,
  previewAlt,
  urlHelpText,
  urlLabel,
}: ProductPhotoPreviewFieldProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFileUrl, setSelectedFileUrl] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [imageUrlValue, setImageUrlValue] = useState(currentImageUrl);

  const validUrlPreview = getValidImageUrl(imageUrlValue);
  const previewImageUrl =
    selectedFileUrl || validUrlPreview || getValidImageUrl(currentImageUrl);
  const previewLabel = selectedFileUrl
    ? `Vista previa: ${selectedFileName}`
    : previewImageUrl
      ? "Vista previa de la foto"
      : "Vista previa pendiente";

  useEffect(() => {
    return () => {
      if (selectedFileUrl) {
        URL.revokeObjectURL(selectedFileUrl);
      }
    };
  }, [selectedFileUrl]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (selectedFileUrl) {
      URL.revokeObjectURL(selectedFileUrl);
    }

    if (!file) {
      setSelectedFileUrl("");
      setSelectedFileName("");
      return;
    }

    setSelectedFileUrl(URL.createObjectURL(file));
    setSelectedFileName(file.name);
  }

  function clearSelectedFile() {
    if (selectedFileUrl) {
      URL.revokeObjectURL(selectedFileUrl);
    }

    setSelectedFileUrl("");
    setSelectedFileName("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <section className="rounded-lg border border-[#dbe5d6] bg-[#fbfbf7] p-4">
      <div className="grid gap-4 sm:grid-cols-[0.9fr_1.1fr] sm:items-start">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#567164]">
            Foto del producto
          </p>
          <h2 className="mt-2 text-lg font-black text-[#1f3429]">
            Revisa cómo se verá.
          </h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#53645a]">
            Sube una foto clara. La acomodamos al centro para que no se corte.
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-[#dbe5d6] bg-white shadow-[0_10px_28px_rgba(31,52,41,0.05)]">
          <ProductImageFrame
            alt={previewAlt}
            badge={previewImageUrl ? "Vista previa" : "Sin foto"}
            className="aspect-[4/3]"
            imageClassName="p-5"
            imageUrl={previewImageUrl}
          />
          <p className="px-4 py-3 text-sm font-bold leading-6 text-[#53645a]">
            {previewLabel}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        <div>
          <label
            htmlFor="imageFile"
            className="block text-sm font-bold text-[#1f3429]"
          >
            {fileLabel}
          </label>
          <input
            ref={fileInputRef}
            id="imageFile"
            name="imageFile"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            className="mt-2 w-full rounded-lg border border-dashed border-[#cddcc9] bg-white px-4 py-4 text-sm text-[#53645a] outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-[#214e34] file:px-4 file:py-2 file:text-sm file:font-bold file:text-white focus:border-[#2f7c5b] focus:ring-2 focus:ring-[#2f7c5b]/20"
          />
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold leading-5 text-[#6a7a70]">
              {fileHelpText}
            </p>
            {selectedFileUrl && (
              <button
                type="button"
                onClick={clearSelectedFile}
                className="inline-flex min-h-9 items-center justify-center rounded-full border border-[#214e34]/20 bg-white px-4 text-xs font-black text-[#214e34] transition hover:border-[#214e34]/35 hover:bg-[#eef5ec]"
              >
                Quitar foto
              </button>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="imageUrl"
            className="block text-sm font-bold text-[#1f3429]"
          >
            {urlLabel}
          </label>
          <input
            id="imageUrl"
            name="imageUrl"
            type="url"
            value={imageUrlValue}
            onChange={(event) => setImageUrlValue(event.target.value)}
            placeholder="https://..."
            className="mt-2 w-full rounded-lg border border-[#cddcc9] bg-white px-4 py-3 text-base text-[#1e261f] outline-none transition focus:border-[#2f7c5b] focus:ring-2 focus:ring-[#2f7c5b]/20"
          />
          {urlHelpText && (
            <p className="mt-2 text-xs font-semibold leading-5 text-[#6a7a70]">
              {urlHelpText}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
