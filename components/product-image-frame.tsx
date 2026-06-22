import type { CSSProperties } from "react";

type ProductImageFrameProps = {
  alt: string;
  badge?: string;
  className?: string;
  imageClassName?: string;
  imageUrl: string | null;
};

function getValidImageUrl(imageUrl: string | null) {
  const trimmedUrl = imageUrl?.trim();

  if (!trimmedUrl || !/^https?:\/\//.test(trimmedUrl)) {
    return null;
  }

  return trimmedUrl;
}

function getBackgroundStyle(imageUrl: string): CSSProperties {
  return {
    backgroundImage: `url(${JSON.stringify(imageUrl)})`,
  };
}

export function ProductImageFrame({
  alt,
  badge,
  className = "aspect-[4/3]",
  imageClassName = "p-5 sm:p-6",
  imageUrl,
}: ProductImageFrameProps) {
  const validImageUrl = getValidImageUrl(imageUrl);

  return (
    <div
      className={`relative isolate flex items-end overflow-hidden bg-[linear-gradient(135deg,#f6c55f_0%,#e37852_48%,#2f7c5b_100%)] p-4 ${className}`}
    >
      {validImageUrl ? (
        <>
          <div
            className="absolute inset-0 z-0 scale-110 bg-cover bg-center opacity-55 blur-2xl"
            style={getBackgroundStyle(validImageUrl)}
          />
          <div className="absolute inset-0 z-0 bg-[linear-gradient(135deg,rgba(251,251,247,0.82),rgba(238,245,236,0.48),rgba(23,58,42,0.22))]" />
          <img
            src={validImageUrl}
            alt={alt}
            loading="lazy"
            className={`absolute inset-0 z-10 h-full w-full object-contain drop-shadow-[0_18px_28px_rgba(23,58,42,0.24)] ${imageClassName}`}
          />
        </>
      ) : (
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_32%_18%,rgba(255,255,255,0.36),transparent_28%),linear-gradient(135deg,#f6c55f_0%,#e37852_48%,#2f7c5b_100%)]" />
      )}

      <div className="absolute inset-0 z-20 bg-gradient-to-t from-[#173a2a]/34 via-transparent to-transparent" />

      {badge && (
        <span className="relative z-30 rounded-full bg-white/92 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-[#214e34] shadow-sm">
          {badge}
        </span>
      )}
    </div>
  );
}
