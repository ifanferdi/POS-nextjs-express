import DashboardController from '@/adapters/http/controller/dashboard-controller';
import express from 'express';

export default function DashboardRoutes(controller: DashboardController) {
  const router = express.Router();

  router
    .get('/', controller.summary)
    .get('/orders-trend', controller.ordersTrend)
    .get('/orders-by-status', controller.ordersByStatus)
    .get('/payments', controller.payments)
    .get('/top-products', controller.topProducts)
    .get('/orders/export', controller.ordersExport);

  return router;
}
