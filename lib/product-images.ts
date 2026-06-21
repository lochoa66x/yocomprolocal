import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createProductSlug } from "@/lib/slugs";

export const PRODUCT_IMAGE_BUCKET = "product-images";
export const PRODUCT_IMAGE_MAX_SIZE = 5 * 1024 * 1024;

const ALLOWED_PRODUCT_IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

export type ProductImageUploadError = "image-size" | "image-type" | "image-upload";

export function getProductImageValidationError(
  file: File
): ProductImageUploadError | null {
  if (file.size > PRODUCT_IMAGE_MAX_SIZE) {
    return "image-size";
  }

  if (!ALLOWED_PRODUCT_IMAGE_TYPES.has(file.type)) {
    return "image-type";
  }

  return null;
}

function getProductImageExtension(file: File) {
  return ALLOWED_PRODUCT_IMAGE_TYPES.get(file.type) ?? "jpg";
}

export async function uploadProductImage({
  supabase,
  file,
  productTitle,
  sellerSlug,
}: {
  supabase: SupabaseClient;
  file: File;
  productTitle: string;
  sellerSlug: string;
}) {
  const validationError = getProductImageValidationError(file);

  if (validationError) {
    return {
      error: validationError,
      publicUrl: null,
    };
  }

  const productSlug = createProductSlug(productTitle);
  const extension = getProductImageExtension(file);
  const storagePath = `${sellerSlug}/${productSlug}-${randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(storagePath, file, {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error("Supabase product image upload error:", error);

    return {
      error: "image-upload" as const,
      publicUrl: null,
    };
  }

  const { data } = supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .getPublicUrl(storagePath);

  return {
    error: null,
    publicUrl: data.publicUrl,
  };
}
