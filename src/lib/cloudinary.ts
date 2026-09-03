/**
 * Cloudinary delivery for menu photos.
 * Store either a full https URL or a public_id like `dineflow/menu/burger`.
 */
export function getCloudinaryCloudName() {
  return (
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim() ||
    process.env.CLOUDINARY_CLOUD_NAME?.trim() ||
    ""
  );
}

export function isCloudinaryConfigured() {
  return getCloudinaryCloudName().length > 0;
}

/** Build an optimized Cloudinary URL from a public_id. */
export function cloudinaryUrl(
  publicId: string,
  opts: { width?: number; height?: number } = {},
) {
  const cloud = getCloudinaryCloudName();
  if (!cloud || !publicId) return "";
  const id = publicId.replace(/^\/+/, "").replace(/\.(jpg|jpeg|png|webp)$/i, "");
  const width = opts.width ?? 480;
  const height = opts.height;
  const crop = height
    ? `c_fill,g_auto,w_${width},h_${height}`
    : `c_fill,g_auto,w_${width}`;
  return `https://res.cloudinary.com/${cloud}/image/upload/${crop},f_auto,q_auto/${id}`;
}

/**
 * Resolve DB `image_url` which may be a public_id or a full Cloudinary URL.
 */
export function resolveMenuImage(
  imageUrlOrPublicId: string | null | undefined,
  opts: { width?: number; height?: number } = {},
) {
  const value = (imageUrlOrPublicId || "").trim();
  if (!value) return "";
  // Local public assets or absolute URLs — use as-is
  if (value.startsWith("/") || /^https?:\/\//i.test(value)) {
    return value;
  }
  return cloudinaryUrl(value, opts);
}
