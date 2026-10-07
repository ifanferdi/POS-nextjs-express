import BaseController from '@/adapters/http/controller/_base-controller';
import { HttpStatusCode } from '@/constants/http-status.constant';
import { handleNumberOrArrayRequest, handleOrderByRequest } from '@/helpers/common.helper';
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
    const params: FindByIdUserDto = {
      id: Number(req.params.id),
      with: req.query.with as any,
      columns: req.query.columns as any,
    };
    const result = await this.handleFindOne(params);
    res.send(result);
  });

  private handleFindOne(params: FindByIdUserDto) {
    /** Request Validation **/
    FindByIdUserSchema.parse(params);

    return this.useCases.userUseCase.findByIdUser.execute(params);
  }

  create = asyncHandler(async (req: e.Request, res: e.Response) => {
    let payload: CreateUserProfileDto = {
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
    payload = CreateUserProfileSchema.parse(payload);

    // Save to database
    const user = await this.useCases.userUseCase.createUser.execute(payload);

    res.status(HttpStatusCode.CREATED).send({ message: 'Success.', user });
  });

  update = asyncHandler(async (req: e.Request & Record<string, any>, res: e.Response) => {
    const id = Number(req.params.id);
    await this.handleFindOne({ id });

    await this.handleUpdate(req.body, id, { isActive: req.body.isActive, roleId: req.body.roleId }, res);
  });

  updateMyAccount = asyncHandler(async (req: e.Request & Record<string, any>, res: e.Response) => {
    const id = req.user.id;
    const current = await this.handleFindOne({ id });

    // ponytail: role & active status locked to current values so self-update can't escalate
    await this.handleUpdate(
      req.body,
      id,
      { isActive: current.isActive, roleId: current.roleId! },
      res,
    );
  });

  private async handleUpdate(
    body: Record<string, any>,
    id: number,
    access: { isActive: boolean; roleId: number },
    res: e.Response,
  ) {
    let payload: UpdateUserProfileDto = {
      id,
      username: body.username,
      isActive: access.isActive,
      roleId: access.roleId,
    };
    if (body.profile)
      payload.profile = {
        fullName: body.profile.fullName,
        placeOfBirth: body.profile.placeOfBirth,
        dateOfBirth: body.profile.dateOfBirth,
        gender: body.profile.gender,
        age: body.profile.age,
        imagePath: body.profile.imagePath,
      };

    const payloadPassword: ChangePasswordDto = {
      password: body.password,
      confirmPassword: body.confirmPassword,
      oldPassword: body.oldPassword,
    };

    /** Request Validation **/
    payload = UpdateUserProfileSchema.parse(payload);
    ChangePasswordSchema.parse(payloadPassword);

    // Update to database
    const user = await this.useCases.userUseCase.updateUser.execute(payload, payloadPassword);

    res.send({ message: 'Success.', user });
  }

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

  myAccount = asyncHandler(async (req: e.Request & Record<string, any>, res) => {
    const result = await this.useCases.userUseCase.myAccount.execute({
      id: req.user.id,
    });

    res.send(result);
  });
}
