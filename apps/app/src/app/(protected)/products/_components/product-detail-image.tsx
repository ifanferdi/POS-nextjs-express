'use client';

import { refreshProductImageUrlAction } from '@/features/products/action';
import { useFreshImageUrl } from '@/hooks/use-fresh-image-url';
import { ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface ProductDetailImageProps {
  productId: number;
  imagePath: string | null;
  imageUrl: string | null;
  name: string;
}

export function ProductDetailImage({
  productId,
  imagePath,
  imageUrl,
  name,
}: ProductDetailImageProps) {
  const { src, isManaged, hasError, onError } = useFreshImageUrl(
    imageUrl,
    imagePath,
    'products/',
    () => refreshProductImageUrlAction(productId),
  );

  if (!src || hasError) return <ImageIcon className="size-8 text-muted-foreground" />;

  return (
    <Image
      src={src}
      alt={name}
      className="size-full object-cover"
      width={200}
      height={200}
      loading="eager"
      unoptimized={isManaged}
      onError={onError}
    />
  );
}
