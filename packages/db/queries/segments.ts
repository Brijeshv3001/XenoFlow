import { getDb } from "../client";
import type { Segment, SegmentRule } from "../types";

const FIELD_MAP: Record<string, string> = {
  total_spent:         "c.total_spent",
  order_count:         "c.order_count",
  avg_order_value:     "c.avg_order_value",
  last_order_days_ago: "EXTRACT(DAY FROM NOW() - c.last_order_date)::INTEGER",
  signup_days_ago:     "EXTRACT(DAY FROM NOW() - c.signup_date)::INTEGER",
  rfm_recency:         "c.rfm_recency",
  rfm_frequency:       "c.rfm_frequency",
  rfm_monetary:        "c.rfm_monetary",
  city:                "c.city",
};
const OP_MAP: Record<string, string> = {
  gt: ">", gte: ">=", lt: "<", lte: "<=", eq: "=", neq: "!=",
};

export function rulesToSQL(rules: SegmentRule[]): string {
  if (!rules.length) return "TRUE";
  return rules
    .map(r => {
      const col = FIELD_MAP[r.field] ?? `c.${r.field}`;
      const op  = OP_MAP[r.op] ?? "=";
      const val = typeof r.value === "string" ? `'${r.value.replace(/'/g, "''")}'` : r.value;
      return `${col} ${op} ${val}`;
    })
    .join(" AND ");
}

export async function getAllSegments(): Promise<Segment[]> {
  const db = getDb();
  const res = await db.query<Segment>(
    "SELECT * FROM segments ORDER BY customer_count DESC"
  );
  return res.rows.map((row: any) => ({
    ...row,
    rules: typeof row.rules === 'string' ? JSON.parse(row.rules) : row.rules
  }));
}

export async function previewSegment(rules: SegmentRule[]): Promise<{
  count: number;
  sample: { id: string; name: string; email: string; city: string; total_spent: number }[];
}> {
  const db = getDb();
  const where = rulesToSQL(rules);
  const [countRes, sampleRes] = await Promise.all([
    db.query(`SELECT COUNT(*) AS count FROM customers c WHERE ${where}`),
    db.query(`SELECT id, name, email, city, total_spent FROM customers c WHERE ${where} LIMIT 5`),
  ]);
  return {
    count: parseInt(countRes.rows[0].count, 10),
    sample: sampleRes.rows.map((r: any) => ({
      ...r,
      total_spent: Number(r.total_spent)
    })),
  };
}

export async function createSegment(data: {
  name: string;
  description?: string;
  rules: SegmentRule[];
  is_ai_generated?: boolean;
}): Promise<Segment> {
  const db = getDb();
  const sql = rulesToSQL(data.rules);
  const countRes = await db.query(`SELECT COUNT(*) AS count FROM customers c WHERE ${sql}`);
  const count = parseInt(countRes.rows[0].count, 10);

  const id = `seg_${Math.random().toString(36).substr(2, 9)}`;
  const res = await db.query<Segment>(`
    INSERT INTO segments (id, name, description, rules, computed_sql, customer_count, is_ai_generated)
    VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
  `, [
    id,
    data.name, 
    data.description ?? null, 
    JSON.stringify(data.rules), 
    sql, 
    count, 
    data.is_ai_generated ?? false
  ]);

  const row = res.rows[0];
  return {
    ...row,
    rules: typeof row.rules === 'string' ? JSON.parse(row.rules) : row.rules
  };
}

export async function deleteSegment(id: string): Promise<boolean> {
  const db = getDb();
  await db.query("DELETE FROM segments WHERE id = $1", [id]);
  return true;
}

export async function getSegmentCustomers(segmentId: string): Promise<any[]> {
  const db = getDb();
  const seg = await db.query<Segment>("SELECT * FROM segments WHERE id = $1", [segmentId]);
  if (!seg.rows[0]) throw new Error("Segment not found");
  const parsedRules = typeof seg.rows[0].rules === 'string' 
    ? JSON.parse(seg.rows[0].rules as any) 
    : seg.rows[0].rules;
  const where = rulesToSQL(parsedRules as SegmentRule[]);
  const res = await db.query(
    `SELECT id, name, email, phone, city, total_spent, order_count, last_order_date, tags
     FROM customers c WHERE ${where} ORDER BY total_spent DESC`
  );
  return res.rows.map((row: any) => ({
    ...row,
    total_spent: Number(row.total_spent)
  }));
}
