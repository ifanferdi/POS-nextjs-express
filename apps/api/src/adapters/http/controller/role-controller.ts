import { HttpStatusCode } from '@/constants/http-status.constant';
import { UseCases } from '@/domain/use-cases/use-case.interface';
import { handleNumberOrArrayRequest, handleOrderByRequest } from '@/helpers/common.helper';
import { BaseFindById } from '@/validations/base-validation';
import {
  CreateRoleSchema,
  FindAllRoleSchema,
  FindByIdRoleDto,
  FindByIdRoleSchema,
  RoleAssignPermissionSchema,
  UpdateRoleSchema,
} from '@/validations/role-validation';
import e from 'express';
import asyncHandler from 'express-async-handler';

type RequestWithUser = e.Request & { user?: { roleId?: number } };

export default class RoleController {
  constructor(private useCases: UseCases) {}

  findAll = asyncHandler(async (req: e.Request, res: e.Response) => {
    const request = req.route.methods.get ? req.query : req.body;

    const params = FindAllRoleSchema.parse({
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
    });

    const result = await this.useCases.roleUseCase.findAllRole.execute(params);

    res.send(result);
  });

  findOne = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params: FindByIdRoleDto = {
      id: Number(req.params.id),
      with: req.query.with as any,
      columns: req.query.columns as any,
    };
    const result = await this.handleFindOne(params as FindByIdRoleDto);
    res.send(result);
  });

  private async handleFindOne(params: FindByIdRoleDto) {
    /** Request Validation **/
    const parsedParams = FindByIdRoleSchema.parse(params);

    return await this.useCases.roleUseCase.findByIdRole.execute(parsedParams);
  }

  create = asyncHandler(async (req: RequestWithUser, res: e.Response) => {
    const params = CreateRoleSchema.parse({
      name: req.body.name,
      permissionIds: req.body.permissionIds,
      permissions: req.body.permissions,
      actorRoleId: Number(req.user?.roleId ?? 0),
    });

    // Save to database
    const role = await this.useCases.roleUseCase.createRole.execute(params);

    res.status(HttpStatusCode.CREATED).send({ message: 'Success.', role });
  });

  update = asyncHandler(async (req: e.Request, res: e.Response) => {
    const id = Number(req.params.id);
    await this.handleFindOne({ id });

    const params = UpdateRoleSchema.parse({
      id,
      name: req.body.name,
      permissionIds: req.body.permissionIds,
      permissions: req.body.permissions,
    });

    // Update to database
    const role = await this.useCases.roleUseCase.updateRole.execute(params);

    res.send({ message: 'Success.', role });
  });

  destroy = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params = BaseFindById.parse({ id: Number(req.params.id) });

    await this.useCases.roleUseCase.deleteRole.execute(params);

    res.send({ message: 'Success.' });
  });

  assignPermissions = asyncHandler(async (req: RequestWithUser, res: e.Response) => {
    const params = RoleAssignPermissionSchema.parse({
      roleId: req.body.roleId,
      actorRoleId: Number(req.user?.roleId ?? 0),
      permissionIds: req.body.permissionIds,
      permissions: req.body.permissions,
      addPermissions: req.body.addPermissions,
      removePermissions: req.body.removePermissions,
    });

    const role = await this.handleFindOne({ id: params.roleId });

    // assign permission to database
    const roleHasPermissions = await this.useCases.roleUseCase.roleAssignPermission.execute(params);

    res.send({ message: 'Success.', role: { ...role, roleHasPermissions } });
  });
}
