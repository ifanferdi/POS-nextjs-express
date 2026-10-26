import BaseController from '@/adapters/http/controller/_base-controller';
import { DashboardQuerySchema } from '@/validations/dashboard-validation';
import e from 'express';
import asyncHandler from 'express-async-handler';

const buildQuery = (req: e.Request) => ({
  from: req.query.from,
  to: req.query.to,
  granularity: req.query.granularity,
  tz: req.query.tz,
  limit: req.query.limit,
});

export default class DashboardController extends BaseController {
  private dashboard = this.useCases.dashboardUseCase;

  summary = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params = DashboardQuerySchema.parse(buildQuery(req));
    res.json(await this.dashboard.summary.execute(params));
  });

  ordersTrend = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params = DashboardQuerySchema.parse(buildQuery(req));
    res.json(await this.dashboard.ordersTrend.execute(params));
  });

  ordersByStatus = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params = DashboardQuerySchema.parse(buildQuery(req));
    res.json(await this.dashboard.ordersByStatus.execute(params));
  });

  payments = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params = DashboardQuerySchema.parse(buildQuery(req));
    res.json(await this.dashboard.payments.execute(params));
  });

  topProducts = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params = DashboardQuerySchema.parse(buildQuery(req));
    res.json(await this.dashboard.topProducts.execute(params));
  });

  ordersExport = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params = DashboardQuerySchema.parse(buildQuery(req));
    const { csv, filename } = await this.dashboard.ordersExport.execute(params);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  });
}
