import { Pool } from "pg";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost") || process.env.DATABASE_URL?.includes("127.0.0.1")
    ? false
    : { rejectUnauthorized: false }
});

interface MessageTask {
  messageId: string;
  channel: string;
  recipientId: string;
  recipient?: any;
  message: string;
  callbackUrl: string;
}

const LUME_PRODUCTS = [
  { name: "Lumé Silk Kurta", category: "tops", price: 3499 },
  { name: "Lumé Denim Trousers", category: "bottoms", price: 2499 },
  { name: "Lumé Linen Blazer", category: "tops", price: 4999 },
  { name: "Lumé Leather Crossbody Bag", category: "accessories", price: 1999 },
  { name: "Lumé Cotton Tee", category: "tops", price: 999 }
];

export function runSimulator(messages: MessageTask[]) {
  // Process each message asynchronously without blocking the request
  for (const msg of messages) {
    simulateSingleMessage(msg).catch(err => {
      console.error(`Simulator error for message ${msg.messageId}:`, err);
    });
  }
}

async function simulateSingleMessage(msg: MessageTask) {
  const externalId = `ext_${Math.random().toString(36).substr(2, 9)}`;

  // Helper function to post webhook callback
  async function postStatus(status: string, failureReason?: string) {
    const idempotencyKey = `${msg.messageId}_${status}`;
    const payload = {
      messageId: msg.messageId,
      externalId,
      status,
      timestamp: new Date().toISOString(),
      failureReason,
      idempotencyKey
    };

    try {
      const res = await fetch(msg.callbackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const text = await res.text();
        console.warn(`Webhook response warning [${status}]:`, res.status, text);
      }
    } catch (err: any) {
      console.error(`Failed to post webhook for ${msg.messageId} - ${status}:`, err.message);
    }
  }

  const isEmailOrWhatsapp = msg.channel === "email" || msg.channel === "whatsapp";

  // 1. Queue to Sent transition (5% failure rate)
  await sleep(1000 + Math.random() * 1000);
  const isSentSuccess = Math.random() > 0.05;
  if (!isSentSuccess) {
    await postStatus("failed", "Carrier rejection: invalid contact number format");
    return;
  }
  await postStatus("sent");

  // 2. Sent to Delivered transition (90% success rate)
  await sleep(1000 + Math.random() * 1000);
  const isDelivered = Math.random() > 0.1;
  if (!isDelivered) {
    await postStatus("failed", "Simulated delivery timeout");
    return;
  }
  await postStatus("delivered");

  // 3. Delivered to Opened transition (60% for email/whatsapp, 30% for sms/rcs)
  await sleep(1500 + Math.random() * 1500);
  const openRate = isEmailOrWhatsapp ? 0.6 : 0.3;
  const isOpened = Math.random() < openRate;
  if (!isOpened) return;
  await postStatus("opened");

  // 4. Opened to Clicked transition (40% for email/whatsapp, 15% for sms/rcs)
  await sleep(1500 + Math.random() * 1500);
  const clickRate = isEmailOrWhatsapp ? 0.4 : 0.15;
  const isClicked = Math.random() < clickRate;
  if (!isClicked) return;
  await postStatus("clicked");

  // 5. Simulate Shopper Purchase (Conversion attribution loop)
  await sleep(2000);
  const product = LUME_PRODUCTS[Math.floor(Math.random() * LUME_PRODUCTS.length)];
  const orderId = `ord_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      
      // Get campaign_id from messages
      const msgRes = await client.query("SELECT campaign_id FROM messages WHERE id = $1", [msg.messageId]);
      const campaignId = msgRes.rows[0]?.campaign_id || null;

      // Insert Simulated Order linked to this campaign
      await client.query(`
        INSERT INTO orders (id, customer_id, campaign_id, product_name, category, amount, order_date, status)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), 'completed')
      `, [orderId, msg.recipientId, campaignId, product.name, product.category, product.price]);

      // Update customer aggregate metrics
      await client.query(`
        UPDATE customers 
        SET total_spent = total_spent + $1, 
            order_count = order_count + 1, 
            last_order_date = NOW() 
        WHERE id = $2
      `, [product.price, msg.recipientId]);

      // If campaignId exists, also increment revenue_attributed directly on campaign
      if (campaignId) {
        await client.query(`
          UPDATE campaigns
          SET revenue_attributed = revenue_attributed + $1
          WHERE id = $2
        `, [product.price, campaignId]);
      }

      await client.query("COMMIT");
      console.log(`[Simulator] Generated purchase for customer ${msg.recipientId} of ₹${product.price} attributed to campaign ${campaignId}`);
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error("Failed to generate simulated purchase:", err.message);
  }
}
