import e from 'express';
import asyncHandler from 'express-async-handler';
import { HttpStatusCode } from '../../../constants/http-status.constant';
import { UseCases } from '../../../domain/use-cases/use-case.interface';
import { handleNumberOrArrayRequest, handleOrderByRequest } from '../../../helpers/common.helper';
import {
  CheckValidPermissionSchema,
  CreatePermissionDto,
  CreatePermissionSchema,
  FindAllPermissionDto,
  FindAllPermissionSchema,
  FindByIdPermissionDto,
  FindByIdPermissionSchema,
  UpdatePermissionDto,
  UpdatePermissionSchema,
} from '../../../validations/permission-validation';

export default class PermissionController {
  constructor(private useCases: UseCases) {}

  findAll = asyncHandler(async (req: e.Request, res: e.Response) => {
    const request = req.route.methods.get ? req.query : req.body;

    const params: FindAllPermissionDto = {
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
    };

    /** Request Validation **/
    FindAllPermissionSchema.parse(params);

    const result = await this.useCases.permissionUseCase.findAllPermission.execute(params);

    res.send(result);
  });

  findOne = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params = { id: Number(req.params.id), with: req.query.with };
    const result = await this.handleFindOne(params as FindByIdPermissionDto);
    res.send(result);
  });

  private async handleFindOne(params: FindByIdPermissionDto) {
    /** Request Validation **/
    FindByIdPermissionSchema.parse(params);

    return await this.useCases.permissionUseCase.findByIdPermission.execute(params);
  }

  create = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params: CreatePermissionDto = { name: req.body.name };
    /** Request Validation **/
    CreatePermissionSchema.parse(params);

    // Save to database
    const data = await this.useCases.permissionUseCase.createPermission.execute(params);

    res.status(HttpStatusCode.CREATED).send({ message: 'Success.', data });
  });

  update = asyncHandler(async (req: e.Request, res: e.Response) => {
    const id = Number(req.params.id);
    await this.handleFindOne({ id });

    const params: UpdatePermissionDto = { id, name: req.body.name };

    /** Request Validation **/
    UpdatePermissionSchema.parse(params);

    // Update to database
    const data = await this.useCases.permissionUseCase.updatePermission.execute(params);

    res.send({ message: 'Success.', data });
  });

  destroy = asyncHandler(async (req: e.Request, res: e.Response) => {
    const id = Number(req.params.id);
    /** Request Validation **/
    FindByIdPermissionSchema.parse({ id });

    await this.useCases.permissionUseCase.deletePermission.execute({ id } as FindByIdPermissionDto);

    res.send({ message: 'Success.' });
  });

  checkValidPermission = asyncHandler(async (req: e.Request, res: e.Response) => {
    const payload = { userId: Number(req.body.userId), permissions: req.body.permissions };

    /** Request Validation **/
    CheckValidPermissionSchema.parse(payload);

    res.send({
      isValid: await this.useCases.permissionUseCase.checkValidPermission.execute(payload),
    });
  });
}
