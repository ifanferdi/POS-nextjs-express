import { UserRelation } from '@/domain/entities/enums/user.enum';
import { IProduct, ProductCategories } from '@/domain/entities/models/product';
import { PartialRoleHasPermission } from '@/domain/entities/models/role';
import { IUserProfile, UserRelationData } from '@/domain/entities/models/user';
import S3StorageRepository from '@/repositories/filesystem/s3-storage-repository';
import { FindAllUserDto, FindByIdUserDto } from '@/validations/user-validation';
import { isLink } from './common.helper';

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

export async function handleProfileImageUrl(
  storageRepository: S3StorageRepository,
  user: Partial<IUserProfile>,
) {
  if (user.profile?.imagePath)
    user.profile.imageUrl = await storageRepository?.getUrl(user.profile?.imagePath);
}
