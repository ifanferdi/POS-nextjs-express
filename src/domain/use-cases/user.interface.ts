import CreateUser from '../../use-cases/user/create-user';
import DeleteUser from '../../use-cases/user/delete-user';
import FindAllUser from '../../use-cases/user/find-all-user';
import FindByIdUser from '../../use-cases/user/find-by-id-user';
import ProfileImage from '../../use-cases/user/profile-image';
import RestoreUser from '../../use-cases/user/restore-user';
import UpdateUser from '../../use-cases/user/update-user';

export interface UserUseCase {
  findAllUser: FindAllUser;
  createUser: CreateUser;
  findByIdUser: FindByIdUser;
  updateUser: UpdateUser;
  deleteUser: DeleteUser;
  restoreUser: RestoreUser;
  profileImage: ProfileImage;
}
