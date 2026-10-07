import BaseController from '@/adapters/http/controller/_base-controller';
import { UploadSchema } from '@/validations/storage.validation';
import e from 'express';
import asyncHandler from 'express-async-handler';

export default class AppController extends BaseController {
  index = asyncHandler(async (_req: e.Request, res: e.Response) => {
    const dashboard = await this.useCases.commonUseCase.posDashboard.execute();

    res.json(dashboard);
  });

  presignUrl = asyncHandler(async (req: e.Request, res: e.Response) => {
    UploadSchema.parse(req.body);

    const presign = await this.useCases.commonUseCase.generatePresignUrl.execute(req.body);

    res.json(presign);
  });
}
