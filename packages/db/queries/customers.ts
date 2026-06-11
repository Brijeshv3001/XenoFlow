import { getDb } from "../client";
import type { Customer } from "../types";

export async function getCustomers(opts: {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  tag?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}): Promise<{ customers: Customer[]; total: number }> {
  const db = getDb();
  const { page = 1, limit = 50, search, city, tag, sortBy = "total_spent", sortDir = "desc" } = opts;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: any[] = [];
  let i = 1;

  if (search) {
    conditions.push(`(name ILIKE $${i} OR email ILIKE $${i})`);
    params.push(`%${search}%`);
    i++;
  }
  if (city) { 
    conditions.push(`city = $${i}`); 
    params.push(city);
    i++;
  }
  if (tag) { 
    conditions.push(`$${i} = ANY(tags)`); 
    params.push(tag);
    i++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const allowedSort = ["total_spent", "order_count", "last_order_date", "signup_date", "name"];
  const sort = allowedSort.includes(sortBy) ? sortBy : "total_spent";

  const customersQuery = `SELECT * FROM customers ${where} ORDER BY ${sort} ${sortDir} LIMIT $${i} OFFSET $${i+1}`;
  const countQuery = `SELECT COUNT(*) AS count FROM customers ${where}`;

  const [rows, countRow] = await Promise.all([
    db.query<Customer>(customersQuery, [...params, limit, offset]),
    db.query<{ count: string }>(countQuery, params),
  ]);

  return { customers: rows.rows, total: parseInt(countRow.rows[0].count, 10) };
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const db = getDb();
  const res = await db.query<Customer>("SELECT * FROM customers WHERE id = $1", [id]);
  return res.rows[0] ?? null;
}

export async function getCustomerOrders(customerId: string) {
  const db = getDb();
  const res = await db.query(
    "SELECT * FROM orders WHERE customer_id = $1 ORDER BY order_date DESC",
    [customerId]
  );
  return res.rows;
}

export async function getDashboardStats() {
  const db = getDb();
  const [stats, topCities, recentOrders, revenueByMonth] = await Promise.all([
    db.query(`
      SELECT
        COUNT(*)                                        AS total_customers,
        COALESCE(SUM(total_spent), 0)                   AS total_revenue,
        COALESCE(ROUND(AVG(avg_order_value)::NUMERIC, 2), 0) AS avg_order_value,
        COUNT(*) FILTER (WHERE order_count > 1)         AS repeat_buyers,
        COUNT(*) FILTER (WHERE 'vip' = ANY(tags))       AS vip_count,
        COUNT(*) FILTER (WHERE 'at_risk' = ANY(tags))   AS at_risk_count,
        COUNT(*) FILTER (WHERE signup_date > NOW() - INTERVAL '30 days') AS new_this_month
      FROM customers
    `),
    db.query(`
      SELECT city, COUNT(*) AS count, SUM(total_spent) AS revenue
      FROM customers WHERE city IS NOT NULL
      GROUP BY city ORDER BY count DESC LIMIT 5
    `),
    db.query(`
      SELECT o.*, c.name AS customer_name
      FROM orders o JOIN customers c ON c.id = o.customer_id
      ORDER BY o.order_date DESC LIMIT 10
    `),
    db.query(`
      SELECT
        TO_CHAR(order_date, 'YYYY-MM') AS month,
        SUM(amount) AS revenue,
        COUNT(*) AS orders
      FROM orders
      WHERE order_date > NOW() - INTERVAL '12 months'
      GROUP BY month ORDER BY month
    `),
  ]);

  return {
    stats: stats.rows[0],
    topCities: topCities.rows,
    recentOrders: recentOrders.rows,
    revenueByMonth: revenueByMonth.rows,
  };
}

export async function bulkInsertCustomers(customers: Omit<Customer, 'id' | 'avg_order_value' | 'rfm_recency' | 'rfm_frequency' | 'rfm_monetary'>[]) {
  const db = getDb();
  const results = [];
  for (const c of customers) {
    const id = `cust_${Math.random().toString(36).substr(2, 9)}`;
    const avgVal = c.order_count > 0 ? Number((c.total_spent / c.order_count).toFixed(2)) : 0;
    const res = await db.query(`
      INSERT INTO customers (id, name, email, phone, city, state, total_spent, order_count, avg_order_value, last_order_date, first_order_date, tags, signup_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [id, c.name, c.email, c.phone, c.city, c.state, c.total_spent, c.order_count, avgVal, c.last_order_date, c.first_order_date || new Date(), c.tags, c.signup_date]);
    results.push(res.rows[0]);
  }
  return results;
}
