<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=200&section=header&text=XenoFlow&fontSize=80&fontColor=fff&animation=twinkling" width="100%" />

  <h3>AI-Native Mini CRM for D2C Brands</h3>

  <p align="center">
    <a href="https://xeno-crm-web-khaki.vercel.app">
      <img src="https://img.shields.io/badge/🚀%20Live%20Demo-https%3A%2F%2Fxeno--crm--web--khaki.vercel.app-8a2be2?style=for-the-badge" alt="Live Demo">
    </a>
    <a href="https://xeno-channel-service-jpnb.onrender.com">
      <img src="https://img.shields.io/badge/📡%20Channel%20Service-https%3A%2F%2Fxeno--channel--service--jpnb.onrender.com-00a8a8?style=for-the-badge" alt="Channel Service">
    </a>
    <a href="https://github.com/Brijeshv3001/XENO-Mini-CRM">
      <img src="https://img.shields.io/badge/💻%20GitHub%20Repo-Dark-181717?style=for-the-badge&logo=github" alt="GitHub Repo">
    </a>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
    <img src="https://img.shields.io/badge/Next.js%2014-000000?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js">
    <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL">
    <img src="https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white" alt="Express.js">
    <img src="https://img.shields.io/badge/Claude%20AI-D97706?style=flat-square&logo=anthropic&logoColor=white" alt="Claude AI">
    <img src="https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel">
  </p>
</div>

> Most CRMs make the marketer do all the thinking. XenoFlow makes AI the co-pilot.

---

## ✨ Table of Contents

- [🎬 Introduction](#-introduction)
- [🌐 Live System URLs & Demo Flow](#-live-system-urls--demo-flow)
- [🏗 Architecture Diagram](#-architecture-diagram)
- [⚡ Feature Breakdown](#-feature-breakdown)
- [🤖 AI-Native Design & Agentic Tool-Use](#-ai-native-design--agentic-tool-use)
- [🔄 The Webhook Callback Loop](#-the-webhook-callback-loop)
- [🗂 Project Structure](#-project-structure)
- [🧠 Key Design Decisions](#-key-design-decisions)
- [🚀 Running Locally](#-running-locally)
- [📊 Deployment Details](#-deployment-details)
- [📹 Walkthrough Video](#-walkthrough-video)

---

## 🎬 Introduction

Imagine you are **Lumé**, a fast-growing D2C fashion label preparing for a major festive season promotion. Traditionally, executing an audience outreach campaign requires writing complex SQL segment queries, copying data into spreadsheets, writing manual communication copies, uploading lists to SMS/WhatsApp gateways, and waiting hours or days to match CSV receipts back to sales dashboards. 

**XenoFlow** eliminates this operational friction. By combining a modern web dashboard with an event-driven background messaging microservice and an embedded LLM copilot, marketers can transition from insight to automated messaging campaigns in seconds.

```
+───────────────────────────────────────────────────────────────────+
│                       THE MARKETER'S DILEMMA                      │
│                                                                   │
│  1. Who to talk to?  ──> Natural Language Segmentation Engine     │
│  2. What to say?     ──> Claude-Drafted Hyper-Personalized Copy   │
│  3. Did it convert?  ──> Real-Time Webhook Callback Analytics     │
+───────────────────────────────────────────────────────────────────+
```

---

## 🌐 Live System URLs & Demo Flow

| Service | Public URL | Hosting Platform | Deployment Status |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | [xeno-crm-web-khaki.vercel.app](https://xeno-crm-web-khaki.vercel.app) | Vercel Serverless | Active (CI/CD from `main`) |
| **Channel Microservice** | [xeno-channel-service-jpnb.onrender.com](https://xeno-channel-service-jpnb.onrender.com) | Render Web Service | Active |
| **PostgreSQL Database** | Render Managed Instance (Oregon US) | Render PostgreSQL | Active (Managed Pool) |

### Try This End-to-End Flow:
1. Open [xeno-crm-web-khaki.vercel.app](https://xeno-crm-web-khaki.vercel.app).
2. Go to **Segments** -> Select **AI Segment Builder** -> Ask for: *"Customers from Delhi who have placed more than 3 orders"*.
3. Verify the generated SQL rules instantly previewing matches. Name and save your segment.
4. Go to **Campaigns** -> Create new campaign -> Choose your new segment and select **WhatsApp**.
5. Use **AI Variations** to let Claude draft localized copies (e.g. Tone: *VIP*, Goal: *Festive Discount*). Save your draft.
6. Click **Send Campaign** to initiate the dispatch loop.
7. Return to the **Dashboard** and watch the **Live Campaign Feed** as delivery receipts (`SENT` -> `DELIVERED` -> `CLICKED`) stream in.

---

## 🏗 Architecture Diagram

The system consists of two primary services decoupled through an asynchronous REST webhook integration:

```
                  +───────────────────────────────────────+
                  │           Browser Dashboard           │
                  +───────────────────┬───────────────────+
                                      │
                   HTTPS API requests │ (SSE/SWR Polling)
                                      ▼
                  +───────────────────────────────────────+
                  │        Next.js Web Server (Vercel)    │
                  +───┬───────────────────────────────┬───+
                      │                               │
       Database query │                               │ Generate variations
                      ▼                               ▼
+───────────────────────────+               +───────────────────+
│   PostgreSQL DB (Render)  │               │   Anthropic API   │
+───────────────────────────+               +───────────────────+
                      ▲
      Webhook receipt │
      status callback │ (HTTP POST /api/receipts)
                      │
   +──────────────────┴───────────────────────────────────────+
   │             Express.js Channel Service (Render)          │
   +──────────────────────────────────────────────────────────+
   │  - Simulates carrier handoff (WhatsApp/SMS/Email/RCS)   │
   │  - Async state machine transitions (0.5s - 5s offsets)   │
   │  - Dispatches mock webhooks to CRM callback interface    │
   +──────────────────────────────────────────────────────────+
```

---

## ⚡ Feature Breakdown

<details>
<summary>📥 Data Ingestion Engine</summary>

### Customer & Order Ingestion
- **Bulk CSV Parser**: Upload thousands of historical user and order records in seconds.
- **Auto Schema Normalization**: Automatically converts variable fields (phone validation, country codes, regional names) into unified DB types.
- **Ingestion Metrics**:
  - Max batch ingestion size: `10,000` rows per API post.
  - Runtime validation: Zod schema-enforced validation layers block corrupted entries.
</details>

<details>
<summary>🎯 Smart Segmentation Engine</summary>

### Dual-Core Audience Builder
- **Visual Segment Builder**: Assemble complex query filters (e.g., `total_spent > 10000 AND city = 'Mumbai'`) without code.
- **Natural Language compiler**: Compile plain English directives into query conditions automatically using our Claude agent:
  ```sql
  -- Input: "Loyal customers in Maharashtra who haven't ordered recently"
  SELECT * FROM customers 
  WHERE state = 'Maharashtra' 
    AND order_count > 3 
    AND last_order_date < NOW() - INTERVAL '30 days'
  ```
- **Rules Caching**: Saved segments cache their target SQL and execute previews inside a sandboxed PostgreSQL execution environment.
</details>

<details>
<summary>📣 Campaign Builder & Orchestrator</summary>

### Message Composer
- **Personalized Template Binding**: Dynamic tag expansion maps database columns directly to message strings at dispatch time (e.g. `{{first_name}}`, `{{city}}`, `{{total_spent}}`).
- **Claude Message Variations**: Instantly generate three copy variations (VIP, Friendly, Urgent) using the embedded assistant.
- **State Machine Integration**: Generates individual records in the `messages` table for every target recipient in a `QUEUED` state, tracking status changes.
</details>

<details>
<summary>📊 Live Performance Analytics</summary>

### Real-Time Analytics Dashboard
- **Key Metrics**: Dynamic display of Total Customers, Cumulative Revenue (Sales), Average Order Value, and Repeat Customer Rates.
- **Live Feed Feed**: A reactive webhook logger updating instantly upon delivery callback execution.
- **Aggregated Visualizations**: Recharts-based Monthly Revenue Performance graphs and top geographical demographic indicators.
</details>

---

## 🤖 AI-Native Design & Agentic Tool-Use

Rather than a simple wrapper, the embedded AI Assistant functions as an autonomous agent. The helper is bound to the CRM database schema via structured tools:

```typescript
export const AI_TOOLS = [
  {
    name: "query_customers",
    description: "Queries the customer database using specific filter conditions.",
    input_schema: {
      type: "object",
      properties: {
        min_spent: { type: "number" },
        city: { type: "string" },
        tag: { type: "string" },
        limit: { type: "number" }
      }
    }
  },
  {
    name: "create_segment",
    description: "Creates and saves a static segment based on rules.",
    input_schema: {
      type: "object",
      required: ["name", "rules"],
      properties: {
        name: { type: "string" },
        rules: { type: "array" }
      }
    }
  }
];
```

### Typical Conversation Sequence:
```
User:  "How many VIP customers do we have in Bangalore? Group them and save them as a new segment."

Agent: [Invokes: query_customers({ tag: 'vip', city: 'Bangalore' })]
       ↳ Returns: { count: 87, sample: [...] }

Agent: [Invokes: create_segment({ name: 'Bangalore VIPs', rules: [...] })]
       ↳ Returns: { id: 'seg_xyz987', customer_count: 87 }

Agent: "I found 87 VIP customers in Bangalore. I've created a new audience segment called 'Bangalore VIPs' for your next campaign."
```

---

## 🔄 The Webhook Callback Loop

```
+─────────────+               +─────────────────+               +───────────────+
│  XenoFlow   │               │ Channel Service │               │ CRM Webhook   │
│  (Vercel)   │               │    (Render)     │               │  (/api/rcpt)  │
+──────┬──────+               +────────┬────────+               +───────┬───────+
       │                               │                                │
       │ POST /send (messages payload) │                                │
       ├──────────────────────────────>│                                │
       │                               │                                │
       │ 202 Accepted                  │                                │
       |<──────────────────────────────┤                                │
       │                               │                                │
       │                               │ Asynchronous simulations       │
       │                               ├──────────────────────────┐     │
       │                               │                          │     │
       │                               │ 1. Queued -> Sent (0.5s) │     │
       │                               │ 2. Sent -> Deliv (1.5s)  │     │
       │                               │ 3. Deliv -> Click (3.0s) │     │
       │                               │                          │     │
       │                               │◄─────────────────────────┘     │
       │                               │                                │
       │                               │ POST /receipt (status update)  │
       │                               ├───────────────────────────────>│
       │                               │                                │
       │                               │                   200 OK       │
       │                               │<───────────────────────────────┤
```

### Simulated Delivery Funnel Statistics:
To mirror real-world carrier latency and drop-offs, the Express service applies randomized outcomes to campaign dispatches:

| Transition Status | Delay Offset | Probability Rate | Simulation Event |
| :--- | :--- | :--- | :--- |
| `QUEUED` -> `SENT` | 500ms | 100% | Handed off to carrier gateway |
| `SENT` -> `DELIVERED` | 1,500ms | 95% | Carrier tower delivers to handset |
| `SENT` -> `FAILED` | 1,500ms | 5% | Number unreachable / carrier reject |
| `DELIVERED` -> `OPENED` | 3,000ms | 60% | Recipient unlocks phone and views copy |
| `OPENED` -> `CLICKED` | 4,500ms | 30% | Recipient clicks embedded promotional URL |

---

## 🗂 Project Structure

```
.
├── apps
│   ├── channel-service                 # Express.js Gateway microservice
│   │   ├── index.ts                    # Entry point & API endpoints
│   │   ├── simulator.ts                # Asynchronous queue simulation logic
│   │   └── package.json
│   │
│   └── web                             # Next.js 14 Frontend Web Application
│       ├── app
│       │   ├── api                     # Next.js API Routes (Campaigns, Segments, Webhooks)
│       │   │   └── campaigns
│       │   │       └── [id]/send       # 🔑 Orchestration endpoint: calls gateway
│       │   └── page.tsx                # Dashboard layout
│       └── next.config.ts
│
└── packages
    └── db                              # Shared database connector package
        ├── client.ts                   # 🔑 Dynamic client (SQLite dev / Postgres prod)
        ├── types.ts                    # Global TS definitions
        └── queries                     # Segment, Order, and Customer SQL builders
```

---

## 🧠 Key Design Decisions

### 1. Denormalized Customer Statistics
I chose to store rolling aggregate stats directly inside the `customers` database table (`total_spent`, `order_count`, `avg_order_value`, `last_order_date`). While normalization is a standard relational practice, running ad-hoc SQL aggregation (`SUM`, `COUNT`, `AVG`) across millions of raw purchase logs during live audience segmentation introduces critical database bottlenecks. This trade-off saves performance at query time, though it requires transactional updates in our order placement handler. **At scale**, these updates would be driven asynchronously by listening to order-created events on a message bus like Kafka or RabbitMQ.

### 2. Compiled SQL Rules Caching on Segments
I chose to pre-compile and save the raw segment rules SQL directly inside the `segments` table database record upon creation. Compiling segment parameters on every retrieval wastes CPU cycles and adds query latency. Storing compiled fragments allows fast execution during campaign dispatch. **At scale**, compiling user input directly could introduce SQL injection vulnerabilities; I secured this by strictly mapping field keys and operators against an immutable mapping dictionary (`FIELD_MAP` and `OP_MAP`) before compilation.

### 3. Idempotent Webhook Callback Processing
I chose to enforce strict API idempotency checks on the CRM receipt route using a dedicated lookup table (`receipt_idempotency`). In carrier networks, network retries often lead to duplicate webhooks. To handle duplicate receipts without corrupting campaign aggregates, I executed a fast write constraint:
```sql
INSERT INTO receipt_idempotency (idempotency_key) VALUES ($1) ON CONFLICT DO NOTHING;
```
If the insert fails to modify rows, the webhook handler instantly halts, ensuring that message metrics (delivered, clicked) are never counted twice. **At scale**, this deduplication would be offloaded to a distributed cache like Redis with an expiration window of 24-48 hours.

### 4. Forward-Only Message State Machine
I chose to model message status tracking using a strict forward-only state machine pattern. A message's lifecycle can only progress sequentially:
`QUEUED` ──> `SENT` ──> `DELIVERED` ──> `OPENED` ──> `CLICKED`
Or transition to `FAILED` from any point. Webhook receipts arriving out of chronological order (e.g. `DELIVERED` arriving before `SENT` due to network routing delays) are automatically handled by ensuring updates only write to database rows where the current state is lower in the hierarchy. **At scale**, out-of-order event streaming would be handled via message timestamps and event time windowing in an analytics tool like Apache Flink.

### 5. SWR Polling vs WebSockets for Live Feeds
I chose to use client-side polling with Next.js hooks (`SWR` / `react-query`) with a 3,000ms interval for updates, instead of establishing persistent WebSocket connections. This dramatically simplified the server infrastructure and avoided the complexity of connection state management. **At scale**, when handling thousands of concurrent users, SWR polling would overload database read-replicas, and we would migrate to server-sent events (SSE) or WebSockets managed by a decoupled pub/sub layer like Redis or AWS API Gateway.

---

## 🚀 Running Locally

### Prerequisites
- Node.js (v18.x or later)
- NPM (v10.x or later)
- PostgreSQL local instance (optional, defaults to local SQLite database out-of-the-box)

### Step 1: Environment Configuration
Create a `.env` file in the root workspace directory:
```env
# Database Connection
# Keep blank to automatically provision and use local SQLite (dev.db)
DATABASE_URL=

# AI Credentials
ANTHROPIC_API_KEY=your-anthropic-key-here

# Communication Gateways
CHANNEL_SERVICE_URL=http://localhost:3001
CRM_RECEIPT_URL=http://localhost:3000/api/receipts
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Run the Channel Simulator (Terminal 1)
```bash
# Builds and starts the Express gateway simulator
npm run dev --workspace=apps/channel-service
```

### Step 4: Run the Next.js CRM Application (Terminal 2)
```bash
# Starts the CRM frontend + API routes
npm run dev --workspace=apps/web
```
Open [http://localhost:3000](http://localhost:3000) to access XenoFlow.

---

## 📊 Deployment Details

| Layer | Hosting Provider | Deployment Notes |
| :--- | :--- | :--- |
| **Next.js Web Frontend** | Vercel Serverless | Runs SSR and API Route Handlers on edge functions. |
| **Express Gateway** | Render Web Services | Standard long-running Node process to handle asynchronous queuing. |
| **PostgreSQL Database** | Render DB | Dedicated PostgreSQL instance with managed connection strings. |

---

## 📹 Walkthrough Video

> [!TIP]
> A comprehensive system walk-through detailing product features, engineering architecture, code structure, and agentic workflows can be viewed below:

### [Play Demo Walkthrough Video](https://github.com/Brijeshv3001/XENO-Mini-CRM)

*Timeline Breakdown:*
- `0:00 - 0:30`: Product Introduction & Goals
- `0:30 - 2:00`: End-to-End Campaign Orchestration Demo
- `2:00 - 3:00`: System Architecture & Webhook Walkthrough
- `3:00 - 4:00`: Code Walkthrough & PostgreSQL Client Adapter
- `4:00 - 5:00`: Claude AI Assistant Integration & Tool Call Logs

---

<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=100&section=footer" width="100%" />
</div>
