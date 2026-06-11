import { Pool } from "pg";
import { Database } from "sqlite3";
import * as path from "path";
import * as fs from "fs";

let pgPool: Pool;
let sqlitePoolInstance: SqlitePool;

export interface DbInterface {
  query<T = any>(sql: string, params?: any[]): Promise<{ rows: T[] }>;
  connect(): Promise<{
    query<T = any>(sql: string, params?: any[]): Promise<{ rows: T[] }>;
    release(): void;
  }>;
}

class SqlitePool implements DbInterface {
  private db: Database;

  constructor(filePath: string) {
    const absolutePath = path.isAbsolute(filePath) 
      ? filePath 
      : path.resolve(process.cwd(), filePath);
    
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    this.db = new Database(absolutePath);
    this.initSchema();
  }

  private initSchema() {
    this.db.serialize(() => {
      this.db.run(`
        CREATE TABLE IF NOT EXISTS customers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          phone TEXT NOT NULL,
          total_spent REAL NOT NULL DEFAULT 0,
          order_count INTEGER NOT NULL DEFAULT 0,
          avg_order_value REAL NOT NULL DEFAULT 0,
          last_order_date TEXT,
          first_order_date TEXT,
          signup_date TEXT DEFAULT CURRENT_TIMESTAMP,
          city TEXT NOT NULL,
          state TEXT,
          tags TEXT,
          rfm_recency INTEGER,
          rfm_frequency INTEGER,
          rfm_monetary INTEGER,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      this.db.run(`
        CREATE TABLE IF NOT EXISTS segments (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          rules TEXT NOT NULL,
          computed_sql TEXT,
          customer_count INTEGER NOT NULL DEFAULT 0,
          is_ai_generated INTEGER DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      this.db.run(`
        CREATE TABLE IF NOT EXISTS campaigns (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          segment_id TEXT,
          channel TEXT NOT NULL,
          message_template TEXT NOT NULL,
          subject_line TEXT,
          status TEXT NOT NULL DEFAULT 'draft',
          total_recipients INTEGER NOT NULL DEFAULT 0,
          sent_count INTEGER NOT NULL DEFAULT 0,
          delivered_count INTEGER NOT NULL DEFAULT 0,
          opened_count INTEGER NOT NULL DEFAULT 0,
          clicked_count INTEGER NOT NULL DEFAULT 0,
          failed_count INTEGER NOT NULL DEFAULT 0,
          revenue_attributed REAL NOT NULL DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      this.db.run(`
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          campaign_id TEXT NOT NULL,
          customer_id TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'queued',
          external_id TEXT,
          failure_reason TEXT,
          sent_at TEXT,
          delivered_at TEXT,
          opened_at TEXT,
          clicked_at TEXT,
          failed_at TEXT,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      this.db.run(`
        CREATE TABLE IF NOT EXISTS campaign_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          message_id TEXT NOT NULL,
          campaign_id TEXT NOT NULL,
          customer_id TEXT NOT NULL,
          event_type TEXT NOT NULL,
          metadata TEXT,
          occurred_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      this.db.run(`
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          customer_id TEXT NOT NULL,
          campaign_id TEXT,
          product_name TEXT NOT NULL,
          category TEXT NOT NULL,
          amount REAL NOT NULL,
          order_date TEXT DEFAULT CURRENT_TIMESTAMP,
          status TEXT NOT NULL DEFAULT 'completed'
        )
      `);

      this.db.run(`
        CREATE TABLE IF NOT EXISTS receipt_idempotency (
          idempotency_key TEXT PRIMARY KEY,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      this.db.get("SELECT COUNT(*) as count FROM customers", (err, row: any) => {
        if (!row || row.count === 0) {
          const customers = [
            ["cust_1", "Sriram Iyer", "sriram.iyer@gmail.com", "+919820012345", 12500, 5, 2500, "2026-05-10 14:00:00", "2025-10-01 10:00:00", "2025-10-01 10:00:00", "Mumbai", "Maharashtra", "vip,accessories", 4, 5, 5],
            ["cust_2", "Priya Sharma", "priya.sharma@yahoo.com", "+919811023456", 8400, 3, 2800, "2026-05-15 11:30:00", "2025-12-15 12:00:00", "2025-12-15 12:00:00", "Delhi", "Delhi", "dresses", 4, 3, 4],
            ["cust_3", "Rohan Das", "rohan.das@gmail.com", "+919845034567", 1200, 1, 1200, "2026-06-01 18:45:00", "2026-01-20 09:00:00", "2026-01-20 09:00:00", "Bangalore", "Karnataka", "basics", 5, 1, 1],
            ["cust_4", "Aisha Khan", "aisha.khan@outlook.com", "+919920045678", 18000, 6, 3000, "2026-05-20 16:15:00", "2025-08-01 14:30:00", "2025-08-01 14:30:00", "Mumbai", "Maharashtra", "vip,dresses,kurtas", 4, 5, 5],
            ["cust_5", "Vikram Patel", "vikram.patel@gmail.com", "+919724056789", 4500, 2, 2250, "2026-04-10 09:15:00", "2026-02-10 11:00:00", "2026-02-10 11:00:00", "Chennai", "Tamil Nadu", "basics", 3, 2, 3],
            ["cust_6", "Kripa Chatterjee", "kripa.c@gmail.com", "+919830067890", 300, 1, 300, "2026-01-15 15:20:00", "2025-11-01 10:30:00", "2025-11-01 10:30:00", "Kolkata", "West Bengal", "basics", 1, 1, 1],
            ["cust_7", "Sameer Deshmukh", "sameer.d@gmail.com", "+919822078901", 6700, 4, 1675, "2026-05-30 10:00:00", "2026-03-01 13:00:00", "2026-03-01 13:00:00", "Pune", "Maharashtra", "dresses", 5, 4, 4],
            ["cust_8", "Kavya Reddy", "kavya.reddy@gmail.com", "+919848089012", 15500, 7, 2214, "2026-06-05 17:30:00", "2025-06-01 12:00:00", "2025-06-01 12:00:00", "Hyderabad", "Telangana", "vip,accessories", 5, 5, 5],
            ["cust_9", "Ananya Sen", "ananya.sen@gmail.com", "+919820090123", 0, 0, 0, null, null, "2026-06-08 11:00:00", "Mumbai", "Maharashtra", null, 5, 1, 1],
            ["cust_10", "Kabir Mehta", "kabir.mehta@gmail.com", "+919810001234", 9800, 4, 2450, "2026-06-08 19:00:00", "2025-09-15 15:00:00", "2025-09-15 15:00:00", "Delhi", "Delhi", "basics,dresses", 5, 4, 4]
          ];
          const stmt = this.db.prepare(`
            INSERT INTO customers (id, name, email, phone, total_spent, order_count, avg_order_value, last_order_date, first_order_date, signup_date, city, state, tags, rfm_recency, rfm_frequency, rfm_monetary)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          for (const c of customers) {
            stmt.run(c);
          }
          stmt.finalize();

          // Seed sample orders
          const orders = [
            ["ord_1", "cust_1", null, "Lumé Silk Kurta", "tops", 3499, "2026-05-10 14:00:00", "completed"],
            ["ord_2", "cust_2", null, "Lumé Denim Trousers", "bottoms", 2499, "2026-05-15 11:30:00", "completed"],
            ["ord_3", "cust_4", null, "Lumé Linen Blazer", "tops", 4999, "2026-05-20 16:15:00", "completed"]
          ];
          const ordStmt = this.db.prepare(`
            INSERT INTO orders (id, customer_id, campaign_id, product_name, category, amount, order_date, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `);
          for (const o of orders) {
            ordStmt.run(o);
          }
          ordStmt.finalize();

          console.log("[SQLite DB] Initialized schema and pre-seeded customers & orders!");
        }
      });
    });
  }

  public async query<T = any>(sql: string, params: any[] = []): Promise<{ rows: T[] }> {
    const translatedSql = this.translate(sql);
    return new Promise((resolve, reject) => {
      this.db.all(translatedSql, params, (err, rows: any[]) => {
        if (err) {
          console.error(`[SQLite DB Error] SQL: ${translatedSql}`, err);
          return reject(err);
        }
        resolve({ rows: rows || [] });
      });
    });
  }

  public async connect(): Promise<any> {
    return {
      query: async <T = any>(sql: string, params: any[] = []): Promise<{ rows: T[] }> => {
        return this.query<T>(sql, params);
      },
      release: () => {}
    };
  }

  private translate(sql: string): string {
    let output = sql;
    
    // Translate = ANY(tags)
    output = output.replace(/\? = ANY\(tags\)/gi, "tags LIKE '%' || ? || '%'");
    output = output.replace(/\$\d+ = ANY\(tags\)/gi, "tags LIKE '%' || ? || '%'");
    
    // Replace postgres placeholders $1, $2 with ?
    output = output.replace(/\$\d+/g, "?");
    
    // Replace ILIKE with LIKE
    output = output.replace(/\bILIKE\b/gi, "LIKE");
    
    // Replace TO_CHAR(order_date, 'YYYY-MM') with strftime('%Y-%m', order_date)
    output = output.replace(/TO_CHAR\(order_date,\s*'YYYY-MM'\)/gi, "strftime('%Y-%m', order_date)");
    
    // Replace ::NUMERIC and ::INTEGER casting
    output = output.replace(/::NUMERIC/gi, "");
    output = output.replace(/::INTEGER/gi, "");
    
    // Replace NOW() - INTERVAL '30 days' with datetime('now', '-30 days')
    output = output.replace(/NOW\(\)\s*-\s*INTERVAL\s*'30 days'/gi, "datetime('now', '-30 days')");
    // Replace NOW() - INTERVAL '12 months' with datetime('now', '-12 months')
    output = output.replace(/NOW\(\)\s*-\s*INTERVAL\s*'12 months'/gi, "datetime('now', '-12 months')");
    
    // Replace NOW() with datetime('now')
    output = output.replace(/\bNOW\(\)/gi, "datetime('now')");
    
    // Replace COUNT(*) FILTER (WHERE ...) with SUM(CASE WHEN ...)
    output = output.replace(
      /COUNT\(\*\)\s+FILTER\s*\(WHERE\s+order_count\s*>\s*1\)/gi,
      "SUM(CASE WHEN order_count > 1 THEN 1 ELSE 0 END)"
    );
    output = output.replace(
      /COUNT\(\*\)\s+FILTER\s*\(WHERE\s+'vip'\s+=\s+ANY\(tags\)\)/gi,
      "SUM(CASE WHEN tags LIKE '%vip%' THEN 1 ELSE 0 END)"
    );
    output = output.replace(
      /COUNT\(\*\)\s+FILTER\s*\(WHERE\s+'at_risk'\s+=\s+ANY\(tags\)\)/gi,
      "SUM(CASE WHEN tags LIKE '%at_risk%' THEN 1 ELSE 0 END)"
    );
    output = output.replace(
      /COUNT\(\*\)\s+FILTER\s*\(WHERE\s+signup_date\s*>\s*datetime\('now',\s*'-30 days'\)\)/gi,
      "SUM(CASE WHEN signup_date > datetime('now', '-30 days') THEN 1 ELSE 0 END)"
    );
    output = output.replace(
      /COUNT\(\*\)\s+FILTER\s*\(WHERE\s+signup_date\s*>\s*NOW\(\)\s*-\s*INTERVAL\s*'30 days'\)/gi,
      "SUM(CASE WHEN signup_date > datetime('now', '-30 days') THEN 1 ELSE 0 END)"
    );
    
    // Replace RANDOM()
    output = output.replace(/\bRANDOM\(\)/gi, "RANDOM()");
    
    // Translate segment extract syntax
    output = output.replace(
      /EXTRACT\(DAY FROM datetime\('now'\) - c\.last_order_date\)/gi,
      "CAST(julianday('now') - julianday(c.last_order_date) AS INTEGER)"
    );
    output = output.replace(
      /EXTRACT\(DAY FROM datetime\('now'\) - c\.signup_date\)/gi,
      "CAST(julianday('now') - julianday(c.signup_date) AS INTEGER)"
    );
    output = output.replace(
      /EXTRACT\(DAY FROM NOW\(\) - c\.last_order_date\)/gi,
      "CAST(julianday('now') - julianday(c.last_order_date) AS INTEGER)"
    );
    output = output.replace(
      /EXTRACT\(DAY FROM NOW\(\) - c\.signup_date\)/gi,
      "CAST(julianday('now') - julianday(c.signup_date) AS INTEGER)"
    );
    
    return output;
  }
}

export function getDb(): DbInterface {
  const connectionString = process.env.DATABASE_URL || "file:./dev.db";

  if (connectionString.startsWith("file:") || connectionString.includes(".db") || connectionString.includes("sqlite")) {
    if (!sqlitePoolInstance) {
      const dbPath = connectionString.replace("file:", "");
      console.log(`[Database Client] Initializing SQLite Pool connection pointing to: ${dbPath}`);
      sqlitePoolInstance = new SqlitePool(dbPath);
    }
    return sqlitePoolInstance;
  }

  if (!pgPool) {
    console.log(`[Database Client] Initializing PostgreSQL PG Pool connection...`);
    pgPool = new Pool({
      connectionString,
      ssl: connectionString.includes("localhost") || connectionString.includes("127.0.0.1") 
        ? false 
        : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    pgPool.on("error", (err) => console.error("Unexpected PostgreSQL DB error", err));
  }
  
  return {
    query: async <T = any>(sql: string, params: any[] = []): Promise<{ rows: T[] }> => {
      const res = await pgPool.query(sql, params);
      return { rows: res.rows };
    },
    connect: async () => {
      const client = await pgPool.connect();
      return {
        query: async <T = any>(sql: string, params: any[] = []): Promise<{ rows: T[] }> => {
          const res = await client.query(sql, params);
          return { rows: res.rows };
        },
        release: () => client.release()
      };
    }
  };
}
