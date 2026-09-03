"use client";

import { useState } from "react";

type Props = {
  src: string;
  alt: string;
  className?: string;
};

/** Native lazy img — skips Next optimizer (avoids lag on missing Cloudinary assets). */
export default function DishImage({ src, alt, className }: Props) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <span className="card-img-fallback" aria-hidden />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
