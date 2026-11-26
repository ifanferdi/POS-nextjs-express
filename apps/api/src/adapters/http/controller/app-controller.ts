import BaseController from '@/adapters/http/controller/_base-controller';
import { UploadSchema } from '@/validations/storage.validation';
import e from 'express';
import asyncHandler from 'express-async-handler';

export default class AppController extends BaseController {
  presignUrl = asyncHandler(async (req: e.Request, res: e.Response) => {
    const payload = UploadSchema.parse(req.body);

    const presign = await this.useCases.commonUseCase.generatePresignUrl.execute(payload);

    res.json(presign);
  });
}
