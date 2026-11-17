import { IProduct } from '@/domain/entities/models/product';
import { IProfile, IUserProfile } from '@/domain/entities/models/user';
import { Order, OrderItem } from '@/infrastructure/database/prisma/generated/client';
import { handleProductImageUrl, handleProfileImageUrl } from '@/helpers/data-extractor';
import S3StorageRepository from '@/repositories/filesystem/s3-storage-repository';

type OrderUserWithOptionalProfile = Omit<Partial<IUserProfile>, 'profile'> & {
  profile?: IProfile | null;
};

type OrderImageMetadata = {
  products?: IProduct[];
  user?: OrderUserWithOptionalProfile | null;
  customer?: OrderUserWithOptionalProfile | null;
};

type OrderItemWithImageRelations = Omit<OrderItem, 'meta'> & {
  product?: IProduct | null;
  meta?: { product?: IProduct | null } | null;
};

export type OrderWithImageRelations = Omit<Order, 'meta'> & {
  meta?: OrderImageMetadata | null;
  orderItems?: OrderItemWithImageRelations[];
  user?: OrderUserWithOptionalProfile | null;
  customer?: OrderUserWithOptionalProfile | null;
};

export default async function handleOrderImageUrls(
  storageRepository: S3StorageRepository,
  order: OrderWithImageRelations,
) {
  const imageUrlPromises: Promise<void>[] = [];

  for (const item of order.orderItems ?? []) {
    if (item.product)
      imageUrlPromises.push(handleProductImageUrl(storageRepository, item.product));
    if (item.meta?.product)
      imageUrlPromises.push(handleProductImageUrl(storageRepository, item.meta.product));
  }

  for (const product of order.meta?.products ?? [])
    imageUrlPromises.push(handleProductImageUrl(storageRepository, product));

  for (const user of [order.user, order.customer, order.meta?.user, order.meta?.customer])
    if (user?.profile)
      imageUrlPromises.push(
        handleProfileImageUrl(storageRepository, { profile: user.profile }),
      );

  await Promise.all(imageUrlPromises);
}
