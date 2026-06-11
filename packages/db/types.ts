export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  total_spent: number;
  order_count: number;
  avg_order_value: number;
  last_order_date: Date | null;
  first_order_date: Date | null;
  rfm_recency: number | null;
  rfm_frequency: number | null;
  rfm_monetary: number | null;
  tags: string[];
  signup_date: Date;
};

export type Order = {
  id: string;
  customer_id: string;
  product_name: string;
  category: string;
  amount: number;
  quantity: number;
  order_date: Date;
  status: string;
};

export type Segment = {
  id: string;
  name: string;
  description: string | null;
  rules: SegmentRule[];
  computed_sql: string | null;
  customer_count: number;
  is_ai_generated: boolean;
  created_at?: Date;
};

export type SegmentRule = {
  field: string;
  op: "gt" | "gte" | "lt" | "lte" | "eq" | "neq";
  value: string | number;
};

export type Campaign = {
  id: string;
  name: string;
  segment_id: string | null;
  channel: "whatsapp" | "sms" | "email" | "rcs";
  message_template: string;
  subject_line: string | null;
  status: "draft" | "scheduled" | "running" | "completed" | "cancelled";
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  failed_count: number;
  revenue_attributed: number;
  created_at: Date;
  started_at?: Date | null;
};

export type Message = {
  id: string;
  campaign_id: string;
  customer_id: string;
  rendered_text: string;
  channel: string;
  external_id: string | null;
  status: "queued" | "sent" | "delivered" | "opened" | "clicked" | "failed";
  sent_at: Date | null;
  delivered_at: Date | null;
  opened_at: Date | null;
  clicked_at: Date | null;
  failed_at?: Date | null;
  failure_reason?: string | null;
  queued_at?: Date;
};
