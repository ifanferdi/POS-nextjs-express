import { HttpStatusCode } from '@/constants/http-status.constant';
import { UseCases } from '@/domain/use-cases/use-case.interface';
import { handleNumberOrArrayRequest, handleOrderByRequest } from '@/helpers/common.helper';
import {
  CheckValidPermissionSchema,
  CreatePermissionSchema,
  FindAllPermissionSchema,
  FindByIdPermissionDto,
  FindByIdPermissionSchema,
  UpdatePermissionSchema,
} from '@/validations/permission-validation';
import e from 'express';
import asyncHandler from 'express-async-handler';

export default class PermissionController {
  constructor(private useCases: UseCases) {}

  findAll = asyncHandler(async (req: e.Request, res: e.Response) => {
    const request = req.route.methods.get ? req.query : req.body;

    const params = FindAllPermissionSchema.parse({
      page: Number(request.page) || 1,
      limit: Number(request.limit) || 10,
      orderBy: handleOrderByRequest(request),
      search: request.q as string,
      columns: request.columns,
      ids: Array.isArray(request?.ids) ? request.ids.map((val: string) => Number(val)) : undefined,
      notId: handleNumberOrArrayRequest(request.notId),
      name: request.name,
      roleId: handleNumberOrArrayRequest(request.roleId),
      with: request.with,
    });

    const result = await this.useCases.permissionUseCase.findAllPermission.execute(params);

    res.send(result);
  });

  findOne = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params: FindByIdPermissionDto = {
      id: Number(req.params.id),
      with: req.query.with as any,
      columns: req.query.columns as any,
    };
    const result = await this.handleFindOne(params as FindByIdPermissionDto);
    res.send(result);
  });

  private async handleFindOne(params: FindByIdPermissionDto) {
    /** Request Validation **/
    const parsedParams = FindByIdPermissionSchema.parse(params);

    return await this.useCases.permissionUseCase.findByIdPermission.execute(parsedParams);
  }

  create = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params = CreatePermissionSchema.parse({ name: req.body.name });

    // Save to database
    const data = await this.useCases.permissionUseCase.createPermission.execute(params);

    res.status(HttpStatusCode.CREATED).send({ message: 'Success.', data });
  });

  update = asyncHandler(async (req: e.Request, res: e.Response) => {
    const id = Number(req.params.id);
    await this.handleFindOne({ id });

    const params = UpdatePermissionSchema.parse({ id, name: req.body.name });

    // Update to database
    const data = await this.useCases.permissionUseCase.updatePermission.execute(params);

    res.send({ message: 'Success.', data });
  });

  destroy = asyncHandler(async (req: e.Request, res: e.Response) => {
    const id = Number(req.params.id);
    /** Request Validation **/
    const params = FindByIdPermissionSchema.parse({ id });

    await this.useCases.permissionUseCase.deletePermission.execute(params);

    res.send({ message: 'Success.' });
  });

  checkValidPermission = asyncHandler(async (req: e.Request, res: e.Response) => {
    const payload = CheckValidPermissionSchema.parse({
      userId: Number(req.body.userId),
      permissions: req.body.permissions,
    });

    res.send({
      isValid: await this.useCases.permissionUseCase.checkValidPermission.execute(payload),
    });
  });
}
