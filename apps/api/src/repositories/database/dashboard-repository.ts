import {
  DashboardExportRow,
  DashboardPaymentPoint,
  DashboardStatusPoint,
  DashboardTopProduct,
  DashboardTrendPoint,
} from '@/domain/entities/types/dashboard.types';
import { Prisma } from '@/infrastructure/database/prisma/generated/client';
import DatabaseBaseRepository from '@/repositories/database/_database-base-repository';

export interface DashboardDateRange {
  from: string;
  to: string;
  tz: string;
}

interface SummaryRow {
  totalOrders: number;
  revenueOrders: number;
  totalRevenue: bigint;
  totalOrdersPrev: number;
  totalRevenuePrev: bigint;
}

interface TrendRow {
  bucket: string;
  orders: number;
  revenue: bigint;
}

interface StatusRow {
  status: string;
  count: number;
}

interface PaymentRow {
  method: string;
  status: string;
  count: number;
  amount: bigint;
}

interface TopProductRow {
  productId: number | null;
  name: string | null;
  quantity: number;
  revenue: bigint;
}

export default class DashboardRepository extends DatabaseBaseRepository {
  async summary(range: DashboardDateRange & { prevFrom: string; prevTo: string }) {
    const { from, to, tz, prevFrom, prevTo } = range;

    const [row] = await this.prisma.$queryRaw<SummaryRow[]>(Prisma.sql`
      SELECT
        count(*) FILTER (WHERE ${this.dateFilter({ from, to, tz })})::int AS "totalOrders",
        count(*) FILTER (WHERE o.status IN ('paid', 'completed')
          AND ${this.dateFilter({ from, to, tz })})::int AS "revenueOrders",
        COALESCE(sum(o.total) FILTER (WHERE o.status IN ('paid', 'completed')
          AND ${this.dateFilter({ from, to, tz })}), 0)::bigint AS "totalRevenue",
        count(*) FILTER (WHERE ${this.dateFilter({ from: prevFrom, to: prevTo, tz })})::int AS "totalOrdersPrev",
        COALESCE(sum(o.total) FILTER (WHERE o.status IN ('paid', 'completed')
          AND ${this.dateFilter({ from: prevFrom, to: prevTo, tz })}), 0)::bigint AS "totalRevenuePrev"
      FROM orders o
    `);

    const [{ count: totalProducts }] = await this.prisma.$queryRaw<{ count: number }[]>(
      Prisma.sql`SELECT count(*)::int AS count FROM products WHERE "isActive" = true`,
    );

    return { ...row, totalProducts };
  }

  async ordersTrend(range: DashboardDateRange & { granularity: 'day' | 'week' | 'month' }) {
    const { from, to, tz, granularity } = range;

    const rows = await this.prisma.$queryRaw<TrendRow[]>(Prisma.sql`
      SELECT
        date_trunc(${granularity}, o."createdAt" AT TIME ZONE ${tz})::date::text AS bucket,
        count(*)::int AS orders,
        COALESCE(sum(o.total) FILTER (WHERE o.status IN ('paid', 'completed')), 0)::bigint AS revenue
      FROM orders o
      WHERE ${this.dateFilter({ from, to, tz })}
      GROUP BY bucket
      ORDER BY bucket ASC
    `);

    return rows.map((row) => ({
      ...row,
      revenue: Number(row.revenue),
    })) satisfies DashboardTrendPoint[];
  }

  async ordersByStatus(range: DashboardDateRange) {
    const { from, to, tz } = range;

    const rows = await this.prisma.$queryRaw<StatusRow[]>(Prisma.sql`
      SELECT o.status::text AS status, count(*)::int AS count
      FROM orders o
      WHERE ${this.dateFilter({ from, to, tz })}
      GROUP BY o.status
      ORDER BY count DESC
    `);

    return rows satisfies DashboardStatusPoint[];
  }

  async paymentsBreakdown(range: DashboardDateRange) {
    const { from, to, tz } = range;

    const rows = await this.prisma.$queryRaw<PaymentRow[]>(Prisma.sql`
      SELECT
        p.method AS method,
        p.status::text AS status,
        count(*)::int AS count,
        COALESCE(sum(p.amount), 0)::bigint AS amount
      FROM payments p
      JOIN orders o ON o.id = p."orderId"
      WHERE ${this.dateFilter({ from, to, tz })}
      GROUP BY p.method, p.status
      ORDER BY p.method ASC, p.status ASC
    `);

    return rows.map((row) => ({
      ...row,
      amount: Number(row.amount),
    })) satisfies DashboardPaymentPoint[];
  }

  async topProducts(range: DashboardDateRange & { limit: number }) {
    const { from, to, tz, limit } = range;

    const rows = await this.prisma.$queryRaw<TopProductRow[]>(Prisma.sql`
      SELECT
        p.id AS "productId",
        p.name AS name,
        COALESCE(sum(oi.quantity), 0)::int AS quantity,
        COALESCE(sum(oi."totalPrice"), 0)::bigint AS revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi."orderId"
      LEFT JOIN products p ON p.id = oi."productId"
      WHERE o.status IN ('paid', 'completed') AND ${this.dateFilter({ from, to, tz })}
      GROUP BY p.id, p.name
      ORDER BY quantity DESC, revenue DESC
      LIMIT ${limit}
    `);

    return rows.map((row) => ({
      ...row,
      revenue: Number(row.revenue),
    })) satisfies DashboardTopProduct[];
  }

  async ordersForExport(range: DashboardDateRange) {
    const { from, to, tz } = range;

    return this.prisma.$queryRaw<DashboardExportRow[]>(Prisma.sql`
      SELECT
        o."orderNumber" AS "orderNumber",
        to_char(o."createdAt" AT TIME ZONE ${tz}, 'YYYY-MM-DD"T"HH24:MI:SS') AS "createdAt",
        o.status::text AS status,
        o.subtotal::int AS subtotal,
        o.tax::int AS tax,
        o.discount::int AS discount,
        o.total::int AS total,
        COALESCE(p.method, '') AS method,
        COALESCE(p.status::text, '') AS "paymentStatus",
        count(oi.id)::int AS "itemCount"
      FROM orders o
      LEFT JOIN payments p ON p."orderId" = o.id
      LEFT JOIN order_items oi ON oi."orderId" = o.id
      WHERE ${this.dateFilter({ from, to, tz })}
      GROUP BY o.id, p.id
      ORDER BY o."createdAt" ASC
    `);
  }

  // Filter tanggal dalam timezone lokal: "2026-10-26" Jakarta == rentang UTC yang benar
  // tanpa perlu konversi offset di JS. Semua nilai di-bind parameter; alias tabel
  // tidak boleh di-interpolasi (Prisma menjadikannya bind parameter → $1."createdAt" error).
  private dateFilter({ from, to, tz }: DashboardDateRange) {
    return Prisma.sql`(o."createdAt" AT TIME ZONE ${tz})::date BETWEEN ${from}::date AND ${to}::date`;
  }
}
