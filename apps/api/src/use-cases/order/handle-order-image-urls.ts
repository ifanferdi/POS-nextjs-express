import { IProduct } from '@/domain/entities/models/product';
import { IProfile, IUserProfile } from '@/domain/entities/models/user';
import { Order, OrderItem } from '@/infrastructure/database/prisma/generated/client';
import { handleProductImageUrl, handleProfileImageUrl } from '@/helpers/data-extractor';
import S3StorageRepository from '@/repositories/filesystem/s3-storage-repository';

type OrderUserWithOptionalProfile = Omit<Partial<IUserProfile>, 'profile'> & {
  profile?: IProfile | null;
};

export type OrderWithImageRelations = Order & {
  orderItems?: Array<OrderItem & { product?: IProduct | null }>;
  user?: OrderUserWithOptionalProfile | null;
  customer?: OrderUserWithOptionalProfile | null;
};

export default async function handleOrderImageUrls(
  storageRepository: S3StorageRepository,
  order: OrderWithImageRelations,
) {
  const imageUrlPromises =
    order.orderItems?.map(({ product }) =>
      product ? handleProductImageUrl(storageRepository, product) : undefined,
    ) ?? [];

  if (order.user?.profile)
    imageUrlPromises.push(handleProfileImageUrl(storageRepository, { profile: order.user.profile }));
  if (order.customer?.profile)
    imageUrlPromises.push(handleProfileImageUrl(storageRepository, { profile: order.customer.profile }));

  await Promise.all(imageUrlPromises);
}
