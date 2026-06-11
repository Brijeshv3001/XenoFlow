import { getDb } from "../client";
import type { Campaign, Message } from "../types";

export async function getAllCampaigns(): Promise<Campaign[]> {
  const db = getDb();
  const res = await db.query<Campaign>(
    `SELECT c.*, s.name AS segment_name
     FROM campaigns c LEFT JOIN segments s ON s.id = c.segment_id
     ORDER BY c.created_at DESC`
  );
  return res.rows;
}

export async function getCampaignById(id: string) {
  const db = getDb();
  const [camp, messages] = await Promise.all([
    db.query(
      `SELECT c.*, s.name AS segment_name
       FROM campaigns c LEFT JOIN segments s ON s.id = c.segment_id
       WHERE c.id = $1`, [id]
    ),
    db.query<Message>(
      `SELECT m.*, cu.name AS customer_name, cu.email, cu.phone
       FROM messages m JOIN customers cu ON cu.id = m.customer_id
       WHERE m.campaign_id = $1 ORDER BY m.sent_at DESC NULLS LAST, m.id DESC LIMIT 100`,
      [id]
    ),
  ]);
  return { campaign: camp.rows[0] ?? null, messages: messages.rows };
}

export async function createCampaign(data: {
  name: string;
  segment_id: string;
  channel: string;
  message_template: string;
  subject_line?: string;
}): Promise<Campaign> {
  const db = getDb();
  const id = `camp_${Math.random().toString(36).substr(2, 9)}`;
  const res = await db.query<Campaign>(`
    INSERT INTO campaigns (id, name, segment_id, channel, message_template, subject_line, status, total_recipients, sent_count, delivered_count, opened_count, clicked_count, failed_count, revenue_attributed)
    VALUES ($1, $2, $3, $4, $5, $6, 'draft', 0, 0, 0, 0, 0, 0, 0) RETURNING *
  `, [id, data.name, data.segment_id, data.channel, data.message_template, data.subject_line ?? null]);
  return res.rows[0];
}

export async function updateCampaignStats(campaignId: string) {
  const db = getDb();
  await db.query(`
    UPDATE campaigns SET
      sent_count      = (SELECT COUNT(*) FROM messages WHERE campaign_id = $1 AND status != 'queued'),
      delivered_count = (SELECT COUNT(*) FROM messages WHERE campaign_id = $1 AND status IN ('delivered','opened','clicked')),
      opened_count    = (SELECT COUNT(*) FROM messages WHERE campaign_id = $1 AND status IN ('opened','clicked')),
      clicked_count   = (SELECT COUNT(*) FROM messages WHERE campaign_id = $1 AND status = 'clicked'),
      failed_count    = (SELECT COUNT(*) FROM messages WHERE campaign_id = $1 AND status = 'failed')
    WHERE id = $1
  `, [campaignId]);
}

export async function processReceipt(data: {
  messageId: string;
  externalId?: string;
  status: "sent" | "delivered" | "opened" | "clicked" | "failed";
  timestamp: string;
  failureReason?: string;
  idempotencyKey: string;
}) {
  const db = getDb();

  // Idempotency check
  try {
    await db.query(
      "INSERT INTO receipt_idempotency (idempotency_key) VALUES ($1)",
      [data.idempotencyKey]
    );
  } catch {
    return { duplicate: true }; // already processed
  }

  const STATUS_ORDER = ["queued", "sent", "delivered", "opened", "clicked"];
  const statusField: Record<string, string> = {
    sent:      "sent_at",
    delivered: "delivered_at",
    opened:    "opened_at",
    clicked:   "clicked_at",
    failed:    "failed_at",
  };

  // Only advance status (never go backward)
  const msg = await db.query<Message>(
    "SELECT * FROM messages WHERE id = $1 OR external_id = $1", [data.messageId]
  );
  if (!msg.rows[0]) throw new Error("Message not found");

  const current = msg.rows[0];
  const currentIdx = STATUS_ORDER.indexOf(current.status);
  const newIdx = STATUS_ORDER.indexOf(data.status);

  if (data.status !== "failed" && newIdx <= currentIdx) {
    return { skipped: true }; // out of order, already at higher state
  }

  const ts = new Date(data.timestamp);
  
  // Conditionally construct query to update fields
  const fieldName = statusField[data.status];
  let updateQuery = `
    UPDATE messages SET
      status = $2,
      ${fieldName} = $3
  `;
  const params: any[] = [current.id, data.status, ts];
  let idx = 4;
  
  if (data.status === "failed") {
    updateQuery += `, failure_reason = $${idx++}`;
    params.push(data.failureReason ?? null);
  }
  
  updateQuery += `, external_id = COALESCE(external_id, $${idx++})`;
  params.push(data.externalId ?? null);
  
  updateQuery += ` WHERE id = $1`;
  
  await db.query(updateQuery, params);

  // Log campaign event
  await db.query(`
    INSERT INTO campaign_events (message_id, campaign_id, customer_id, event_type, metadata, occurred_at)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [
    current.id, 
    current.campaign_id, 
    current.customer_id, 
    data.status,
    JSON.stringify({ idempotency_key: data.idempotencyKey }), 
    ts
  ]);

  // Recompute campaign stats
  await updateCampaignStats(current.campaign_id);

  // Simulate 7-day conversion if link clicked!
  // If clicked, we have a 15% chance to attribute a new order from this customer to this campaign!
  if (data.status === "clicked" && Math.random() < 0.25) {
    const cust = await db.query("SELECT total_spent, order_count FROM customers WHERE id = $1", [current.customer_id]);
    if (cust.rows[0]) {
      const amount = Math.floor(Math.random() * 4000) + 1000; // ₹1,000 - ₹5,000
      
      // Update campaign revenue
      await db.query("UPDATE campaigns SET revenue_attributed = revenue_attributed + $1 WHERE id = $2", [amount, current.campaign_id]);
      
      // Update customer stats
      const newTotal = Number(cust.rows[0].total_spent) + amount;
      const newCount = Number(cust.rows[0].order_count) + 1;
      const newAvg = Number((newTotal / newCount).toFixed(2));
      await db.query(`
        UPDATE customers SET
          total_spent = $1,
          order_count = $2,
          avg_order_value = $3,
          last_order_date = NOW()
        WHERE id = $4
      `, [newTotal, newCount, newAvg, current.customer_id]);

      // Insert order log
      const orderId = `ord_${Math.random().toString(36).substr(2, 9)}`;
      await db.query(`
        INSERT INTO orders (id, customer_id, product_name, category, amount, quantity, order_date, status)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), 'completed')
      `, [orderId, current.customer_id, 'Attributed Promotion Buy', 'tops', amount, 1]);
    }
  }

  return { ok: true, campaignId: current.campaign_id };
}
