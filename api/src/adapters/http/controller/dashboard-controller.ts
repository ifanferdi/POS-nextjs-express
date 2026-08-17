import e from 'express';
import asyncHandler from 'express-async-handler';
import BaseController from '@/adapters/http/controller/_base-controller';

export default class DashboardController extends BaseController {
  index = asyncHandler(async (_req: e.Request, res: e.Response) => {
    const dashboard = await this.useCases.commonUseCase.posDashboard.execute();

    res.json(dashboard);
  });
}
