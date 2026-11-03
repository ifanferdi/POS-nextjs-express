import { UserRelation } from '@/domain/entities/enums/user.enum';
import { IProduct, ProductCategories } from '@/domain/entities/models/product';
import { PartialRoleHasPermission } from '@/domain/entities/models/role';
import { IUserProfile, UserRelationData } from '@/domain/entities/models/user';
import { ProductDiscountCycle } from '@/infrastructure/database/prisma/generated/client';
import S3StorageRepository from '@/repositories/filesystem/s3-storage-repository';
import { FindAllUserDto, FindByIdUserDto } from '@/validations/user-validation';
import { isLink } from './common.helper';
import { effectiveUnitDiscount, remainingQuota } from './discount.helper';

export function extractRelationDataUser(
  params: FindAllUserDto | FindByIdUserDto,
  user: Partial<UserRelationData>,
) {
  const _handlePermissions = (user: Partial<UserRelationData>) => {
    user.permissions = [];
    user.role?.roleHasPermissions?.map((roleHasPermission) =>
      user.permissions?.push(roleHasPermission.permission),
    );
  };
  const _handleRolePermissions = (role: PartialRoleHasPermission) => {
    role.permissions = [];
    role.roleHasPermissions?.map((roleHasPermission) =>
      role?.permissions?.push(roleHasPermission.permission),
    );

    delete role.roleHasPermissions;
  };

  if (params.with?.includes(UserRelation.PERMISSIONS) && user.role) {
    _handlePermissions(user);
    delete user.role.roleHasPermissions;
    if (
      !params.with.includes(UserRelation.ROLE) &&
      !params.with.includes(UserRelation.ROLE_PERMISSIONS)
    )
      delete user.role;
  }
  if (params.with?.includes(UserRelation.ROLE_PERMISSIONS) && user.role) {
    _handleRolePermissions(user.role as unknown as PartialRoleHasPermission);
  }
}

export function extractCategories(product: ProductCategories) {
  if (product.productHasCategories) {
    product.categories = product.productHasCategories.map((phc) => phc.category);
    delete (product as any).productHasCategories;
  }
}

export async function handleProductImageUrl(
  storageRepository: S3StorageRepository,
  product: IProduct,
) {
  if (product.imagePath)
    product.imageUrl = isLink(product.imagePath)
      ? product.imagePath
      : await storageRepository.getUrl(product.imagePath);
}

export function applyActiveDiscount(products: IProduct[], discounts: ProductDiscountCycle[]) {
  // findActive() mengurutkan startDate desc → ambil yang pertama (latest) per product.
  const discountMap = new Map<number, ProductDiscountCycle>();
  discounts.forEach((discount) => {
    if (!discountMap.has(discount.productId)) discountMap.set(discount.productId, discount);
  });

  products.forEach((product) => {
    const discount = discountMap.get(product.id);
    const remaining = discount ? remainingQuota(discount) : null;

    product.discount = discount
      ? {
          ...discount,
          remainingQuota: remaining,
          finalPrice:
            remaining !== 0
              ? product.price - effectiveUnitDiscount(discount.amount, product.price)
              : product.price,
        }
      : null;
  });
}

export async function handleProfileImageUrl(
  storageRepository: S3StorageRepository,
  user: Partial<IUserProfile>,
) {
  if (user.profile?.imagePath)
    user.profile.imageUrl = await storageRepository?.getUrl(user.profile?.imagePath);
}
