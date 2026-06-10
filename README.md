# XenoCRM: AI-Native D2C Marketing CRM

XenoCRM is a production-quality, AI-native Mini CRM designed for D2C fashion and retail brands (showcasing the mock label **"Lumé"**). It features dynamic visual query segmentation, natural language segment extraction, AI-driven campaign copywriting, a separate dispatch simulation service, and live-updating revenue attribution metrics.

---

## Technical Architecture

```
                      +-------------------+
                      |   Next.js CRM     |
                      |   (Port 3000)     |
                      +---------+---------+
                                |
                   (HTTP POST)  |  (HTTP POST Webhook)
                   /send        |  /api/receipts
                                v
                      +-------------------+
                      |  Channel Service  |
                      |   (Port 3001)     |
                      +-------------------+
```

1. **CRM Frontend & DB (Next.js 14 + SQLite + Prisma):** Holds shopper lists, orders, templates, and logs. It translates visual segment rules or natural language queries into Prisma conditions.
2. **Channel Microservice (Express Server):** Receives campaign dispatches, throttles message processing (max 50 msg/s), runs staggered event timeouts (`sent` -> `delivered` -> `opened` -> `clicked`), and makes webhook calls to the CRM's `/api/receipts` endpoint.
3. **Attribution Model:** Automatically links sales orders to active campaigns if the customer clicked a campaign link within 7 days of checkout, updating the Campaign ROI statistics in real-time.

---

## Quick Start Guide

### 1. Install Dependencies
Install all package dependencies in the workspace root:
```bash
npm install
```

Install dependencies inside the Channel Service:
```bash
cd channel-service
npm install
cd ..
```

### 2. Configure Environment variables
Create a `.env` file in the root directory (or copy from `.env.example`):
```bash
# Database Configuration
DATABASE_URL="file:./dev.db"

# Claude AI API Keys (Optional - Fallback Mock is enabled automatically if blank)
ANTHROPIC_API_KEY="your-anthropic-key-here"

# Webhook Endpoints
CHANNEL_SERVICE_URL="http://localhost:3001/send"
CRM_RECEIPT_URL="http://localhost:3000/api/receipts"
PORT=3000
```

### 3. Initialize Database and Seed Data
Sync the database schemas and run the seeder script (populates 500 customers, 1,494 orders, pre-built segments, and past campaigns):
```bash
npx prisma db push
node prisma/seed.js
```

### 4. Run Locally
Start the separate Channel Service (Port 3001) and Next.js CRM Dev Server (Port 3000) concurrently:
```bash
# Start Channel Service (Tab 1)
cd channel-service
node server.js

# Start Next.js CRM (Tab 2)
npm run dev
```

Visit the dashboard at `http://localhost:3000`!

---

## Running Integration Tests

To run the end-to-end integration test (tests stats check, segment builder creation, campaign creation, dispatch, and callback updates):
```bash
node "C:\Users\sriram\.gemini\antigravity\brain\efed0a67-990e-46d3-9373-f44682ed8115\scratch\test-flow.js"
```

---

## Production Scaling Tradeoffs

When migrating XenoCRM to a real D2C environment with millions of customers, we would upgrade:
1. **Message Queue:** Replace the in-memory Express timeouts with an industrial queue broker (AWS SQS, RabbitMQ, or Apache Kafka) to manage staggered dispatches at scale.
2. **Idempotency Keys:** Enforce idempotency on CRM receipt callbacks to ensure network retries do not count clicks or revenue twice.
3. **Database Indexing:** Index `Customer(city, tags, total_spent)`, `Order(customer_id, order_date)`, and `Message(campaign_id, status)` for sub-second visual segment evaluations.
4. **Workspace Multi-Tenancy:** Secure Next.js routes using JWT tokens and structure database schemas to support multiple brand accounts.
