import { Prisma } from '@prisma/client';

export interface SegmentRule {
  field: 'total_spent' | 'order_count' | 'city' | 'tags' | 'last_purchase_days' | 'signup_days';
  operator: 'gt' | 'lt' | 'eq' | 'neq' | 'contains' | 'lte';
  value: string | number;
}

export function buildPrismaWhereClause(rules: SegmentRule[]): Prisma.CustomerWhereInput {
  const andClauses: Prisma.CustomerWhereInput[] = [];

  const now = new Date("2026-06-09T22:50:43+05:30"); // Align with pre-seeded time

  for (const rule of rules) {
    const val = rule.value;

    switch (rule.field) {
      case 'total_spent':
        const numSpent = parseFloat(val as string);
        if (rule.operator === 'gt') andClauses.push({ total_spent: { gt: numSpent } });
        else if (rule.operator === 'lt') andClauses.push({ total_spent: { lt: numSpent } });
        else andClauses.push({ total_spent: numSpent });
        break;

      case 'order_count':
        const numOrders = parseInt(val as string, 10);
        if (rule.operator === 'gt') andClauses.push({ order_count: { gt: numOrders } });
        else if (rule.operator === 'lt') andClauses.push({ order_count: { lt: numOrders } });
        else andClauses.push({ order_count: numOrders });
        break;

      case 'city':
        const cityStr = String(val);
        if (rule.operator === 'eq') {
          andClauses.push({ city: { equals: cityStr } });
        } else {
          andClauses.push({ city: { not: { equals: cityStr } } });
        }
        break;

      case 'tags':
        const tagStr = String(val);
        // SQLite contains query works on JSON string representation
        andClauses.push({ tags: { contains: tagStr } });
        break;

      case 'last_purchase_days':
        const purchaseDays = parseInt(val as string, 10);
        const purchaseRefDate = new Date(now.getTime() - purchaseDays * 24 * 60 * 60 * 1000);
        
        if (rule.operator === 'gt') {
          // No purchase in last X days means last_order_date is older than ref date or null
          andClauses.push({
            OR: [
              { last_order_date: { lt: purchaseRefDate } },
              { last_order_date: null }
            ]
          });
        } else {
          // Purchased within last X days means last_order_date is newer than ref date
          andClauses.push({ last_order_date: { gte: purchaseRefDate } });
        }
        break;

      case 'signup_days':
        const signupDays = parseInt(val as string, 10);
        const signupRefDate = new Date(now.getTime() - signupDays * 24 * 60 * 60 * 1000);

        if (rule.operator === 'lte') {
          // Signed up in the last X days means signup_date is newer than ref date
          andClauses.push({ signup_date: { gte: signupRefDate } });
        } else {
          // Signed up more than X days ago means signup_date is older than ref date
          andClauses.push({ signup_date: { lt: signupRefDate } });
        }
        break;
    }
  }

  return andClauses.length > 0 ? { AND: andClauses } : {};
}
