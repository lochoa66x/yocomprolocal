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
      className={`relative isolate flex items-start overflow-hidden bg-[#eef5ec] p-4 ${className}`}
    >
      {validImageUrl ? (
        <>
          <div
            className="absolute inset-0 z-0 scale-125 bg-cover bg-center opacity-65 blur-2xl saturate-125"
            style={getBackgroundStyle(validImageUrl)}
          />
          <div className="absolute inset-0 z-0 bg-[linear-gradient(135deg,rgba(255,248,226,0.64),rgba(238,245,236,0.5),rgba(47,124,91,0.3))]" />
          <div className="absolute inset-2 z-0 rounded-xl bg-white/28 shadow-[inset_0_0_42px_rgba(33,78,52,0.12)] sm:inset-3" />
          <div
            className={`absolute inset-0 z-10 flex items-center justify-center ${imageClassName}`}
          >
            <img
              src={validImageUrl}
              alt={alt}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-contain object-center drop-shadow-[0_18px_28px_rgba(23,58,42,0.24)]"
            />
          </div>
        </>
      ) : (
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_32%_18%,rgba(255,255,255,0.36),transparent_28%),linear-gradient(135deg,#f6c55f_0%,#e37852_48%,#2f7c5b_100%)]" />
      )}

      <div className="absolute inset-0 z-20 bg-gradient-to-t from-[#173a2a]/12 via-transparent to-white/8" />

      {badge && (
        <span className="relative z-30 rounded-full bg-white/92 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-[#214e34] shadow-sm ring-1 ring-[#214e34]/10">
          {badge}
        </span>
      )}
    </div>
  );
}
