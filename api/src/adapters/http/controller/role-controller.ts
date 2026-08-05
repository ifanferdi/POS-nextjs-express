import e from 'express';
import asyncHandler from 'express-async-handler';
import { HttpStatusCode } from '../../../constants/http-status.constant';
import { UseCases } from '../../../domain/use-cases/use-case.interface';
import { handleNumberOrArrayRequest, handleOrderByRequest } from '../../../helpers/common.helper';
import { BaseFindById } from '../../../validations/base-validation';
import {
  CreateRoleDto,
  CreateRoleSchema,
  FindAllRoleDto,
  FindAllRoleSchema,
  FindByIdRoleDto,
  FindByIdRoleSchema,
  RoleAssignPermissionDto,
  RoleAssignPermissionSchema,
  UpdateRoleDto,
  UpdateRoleSchema,
} from '../../../validations/role-validation';

export default class RoleController {
  constructor(private useCases: UseCases) {}

  findAll = asyncHandler(async (req: e.Request, res: e.Response) => {
    const request = req.route.methods.get ? req.query : req.body;

    const params: FindAllRoleDto = {
      page: Number(request.page) || 1,
      limit: Number(request.limit) || 10,
      orderBy: handleOrderByRequest(request),
      search: request.q as string,
      columns: request.columns,
      ids: Array.isArray(request?.ids) ? request.ids.map((val: string) => Number(val)) : undefined,
      notId: handleNumberOrArrayRequest(request.notId),
      name: request.name,
      userId: handleNumberOrArrayRequest(request.userId),
      permissionId: handleNumberOrArrayRequest(request.permissionId),
      with: request.with,
    };

    /** Request Validation **/
    FindAllRoleSchema.parse(params);

    const result = await this.useCases.roleUseCase.findAllRole.execute(params);

    res.send(result);
  });

  findOne = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params = { id: Number(req.params.id), with: req.query.with };
    const result = await this.handleFindOne(params as FindByIdRoleDto);
    res.send(result);
  });

  private async handleFindOne(params: FindByIdRoleDto) {
    /** Request Validation **/
    FindByIdRoleSchema.parse(params);

    return await this.useCases.roleUseCase.findByIdRole.execute(params);
  }

  create = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params: CreateRoleDto = {
      name: req.body.name,
      permissionIds: req.body.permissionIds,
      permissions: req.body.permissions,
    };

    /** Request Validation **/
    CreateRoleSchema.parse(params);

    // Save to database
    const role = await this.useCases.roleUseCase.createRole.execute(params);

    res.status(HttpStatusCode.CREATED).send({ message: 'Success.', role });
  });

  update = asyncHandler(async (req: e.Request, res: e.Response) => {
    const id = Number(req.params.id);
    await this.handleFindOne({ id });

    const params: UpdateRoleDto = {
      id,
      name: req.body.name,
      permissionIds: req.body.permissionIds,
      permissions: req.body.permissions,
    };

    /** Request Validation **/
    UpdateRoleSchema.parse(params);

    // Update to database
    const role = await this.useCases.roleUseCase.updateRole.execute(params);

    res.send({ message: 'Success.', role });
  });

  destroy = asyncHandler(async (req: e.Request, res: e.Response) => {
    const id = Number(req.params.id);
    /** Request Validation **/
    BaseFindById.parse({ id });

    await this.useCases.roleUseCase.deleteRole.execute({ id });

    res.send({ message: 'Success.' });
  });

  assignPermissions = asyncHandler(async (req: e.Request, res: e.Response) => {
    const roleId = req.body.roleId;
    const params: RoleAssignPermissionDto = {
      roleId: req.body.roleId,
      permissionIds: req.body.permissionIds,
      permissions: req.body.permissions,
      addPermissions: req.body.addPermissions,
      removePermissions: req.body.removePermissions,
    };

    RoleAssignPermissionSchema.parse(params);

    const role = await this.handleFindOne({ id: roleId });

    // assign permission to database
    const roleHasPermissions = await this.useCases.roleUseCase.roleAssignPermission.execute(params);

    res.send({ message: 'Success.', role: { ...role, roleHasPermissions } });
  });
}
