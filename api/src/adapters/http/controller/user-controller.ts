import BaseController from '@/adapters/http/controller/_base-controller';
import config from '@/config/config';
import { HttpStatusCode } from '@/constants/http-status.constant';
import { FileType } from '@/domain/entities/types/storage.types';
import {
  extractUserId,
  handleNumberOrArrayRequest,
  handleOrderByRequest,
} from '@/helpers/common.helper';
import uploadFile from '@/helpers/multer.helper';
import { BaseFindById } from '@/validations/base-validation';
import {
  ChangePasswordDto,
  ChangePasswordSchema,
  CreateUserProfileDto,
  CreateUserProfileSchema,
  FindAllUserDto,
  FindAllUserSchema,
  FindByIdUserDto,
  FindByIdUserSchema,
  ProfileImageSchema,
  UpdateUserProfileDto,
  UpdateUserProfileSchema,
} from '@/validations/user-validation';
import e from 'express';
import asyncHandler from 'express-async-handler';

export default class UserController extends BaseController {
  findAll = asyncHandler(async (req: e.Request & Record<string, any>, res: e.Response) => {
    const request = req.route.methods.get ? req.query : req.body;

    const params: FindAllUserDto = {
      page: Number(request.page) || 1,
      limit: Number(request.limit) || 10,
      orderBy: handleOrderByRequest(request),
      search: request.q as string,
      columns: request.columns,
      ids: request.ids?.map((val: string) => (val ? Number(val) : undefined)),
      username: request.username,
      roleId: handleNumberOrArrayRequest(request.roleId),
      isActive: request.isActive ? request.isActive === 'true' : undefined,
      email: request.email,
      role: request.role,
      with: request.with,
    };

    /** Request Validation **/
    FindAllUserSchema.parse(params);

    const result = await this.useCases.userUseCase.findAllUser.execute(params);

    res.send(result);
  });

  findOne = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params = { id: Number(req.params.id), with: req.query.with } as FindByIdUserDto;
    const result = await this.handleFindOne(params);
    res.send(result);
  });

  private handleFindOne(params: FindByIdUserDto) {
    /** Request Validation **/
    FindByIdUserSchema.parse(params);

    return this.useCases.userUseCase.findByIdUser.execute(params);
  }

  create = asyncHandler(async (req: e.Request, res: e.Response) => {
    const payload: CreateUserProfileDto = {
      username: req.body.username,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
      isActive: req.body.isActive,
      roleId: req.body.roleId,
    };
    if (req.body.profile)
      payload.profile = {
        fullName: req.body.profile.fullName,
        placeOfBirth: req.body.profile.placeOfBirth,
        dateOfBirth: req.body.profile.dateOfBirth,
        gender: req.body.profile.gender,
        age: req.body.profile.age,
        imagePath: req.body.profile.imagePath,
      };

    /** Request Validation **/
    CreateUserProfileSchema.parse(payload);

    // Save to database
    const user = await this.useCases.userUseCase.createUser.execute(payload);

    res.status(HttpStatusCode.CREATED).send({ message: 'Success.', user });
  });

  update = asyncHandler(async (req: e.Request & Record<string, any>, res: e.Response) => {
    const id = Number(req.params.id);
    await this.handleFindOne({ id });

    const payload: UpdateUserProfileDto = {
      id,
      username: req.body.username,
      isActive: req.body.isActive,
      roleId: req.body.roleId,
    };
    if (req.body.profile)
      payload.profile = {
        fullName: req.body.profile.fullName,
        placeOfBirth: req.body.profile.placeOfBirth,
        dateOfBirth: req.body.profile.dateOfBirth,
        gender: req.body.profile.gender,
        age: req.body.profile.age,
        imagePath: req.body.profile.imagePath,
      };

    const payloadPassword: ChangePasswordDto = {
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
      oldPassword: req.body.oldPassword,
    };

    /** Request Validation **/
    UpdateUserProfileSchema.parse(payload);
    ChangePasswordSchema.parse(payloadPassword);

    // Update to database
    const user = await this.useCases.userUseCase.updateUser.execute(payload, payloadPassword);

    res.send({ message: 'Success.', user });
  });

  destroy = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params = { id: Number(req.params.id) };
    /** Request Validation **/
    BaseFindById.parse(params);

    await this.useCases.userUseCase.deleteUser.execute(params as BaseFindById);

    res.send({ message: 'Success.' });
  });

  destroyPermanently = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params = { id: Number(req.params.id) };
    /** Request Validation **/
    BaseFindById.parse(params);

    await this.useCases.userUseCase.deleteUser.execute(params as BaseFindById, {
      isPermanently: true,
    });

    res.send({ message: 'Success.' });
  });

  restore = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params = { id: Number(req.params.id) };
    /** Request Validation **/
    BaseFindById.parse(params);

    this.useCases.userUseCase.restoreUser.execute(params as BaseFindById);

    res.send({ message: 'Success.' });
  });

  upload = uploadFile(config.storage.defaultMaxSize, [FileType.IMAGE]).single('image');

  uploadImage = asyncHandler(async (req: e.Request, res: e.Response) => {
    const image = req.file;

    ProfileImageSchema.parse({ image });

    const imagePath = await this.useCases.userUseCase?.profileImage.execute(
      image as Express.Multer.File,
    );

    res.send({ message: 'Success.', imagePath });
  });

  myAccount = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params = { id: extractUserId(req), with: req.query.with } as FindByIdUserDto;

    const result = await this.handleFindOne(params);
    res.send(result);
  });
}
