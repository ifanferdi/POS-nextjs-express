'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { refreshMyProfileImageUrlAction } from '@/features/account/action';
import { useFreshImageUrl } from '@/hooks/use-fresh-image-url';
import { getInitials } from '@/lib/helper';

interface AccountProfileAvatarProps {
  imageUrl?: string | null;
  imagePath?: string | null;
  username: string;
  fullName?: string | null;
  className?: string;
  fallbackClassName?: string;
}

export function AccountProfileAvatar({
  imageUrl,
  imagePath,
  username,
  fullName,
  className,
  fallbackClassName,
}: AccountProfileAvatarProps) {
  const { src, hasError, onError } = useFreshImageUrl(
    imageUrl,
    imagePath,
    'profiles/',
    refreshMyProfileImageUrlAction,
  );

  return (
    <Avatar size="lg" className={className}>
      {src && !hasError && <AvatarImage src={src} alt={username} onError={onError} />}
      <AvatarFallback className={fallbackClassName}>
        {getInitials(fullName ?? username)}
      </AvatarFallback>
    </Avatar>
  );
}
