const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const FIRST_NAMES = [
  "Amit", "Priya", "Rajesh", "Sneha", "Vikram", "Ananya", "Rahul", "Deepika", "Arjun", "Pooja",
  "Rohit", "Neha", "Sanjay", "Kavita", "Anil", "Ritu", "Suresh", "Sunita", "Mahesh", "Jyoti",
  "Ramesh", "Swati", "Gaurav", "Aarti", "Vivek", "Kiran", "Sandeep", "Nisha", "Harish", "Divya",
  "Manoj", "Megha", "Sunil", "Rupa", "Ajay", "Tanvi", "Vijay", "Shilpa", "Vinod", "Shreya",
  "Dev", "Preeti", "Abhishek", "Pallavi", "Akash", "Ridhima", "Kunal", "Ishita", "Varun", "Shalini"
];

const LAST_NAMES = [
  "Kumar", "Sharma", "Singh", "Patel", "Reddy", "Verma", "Gupta", "Nair", "Rao", "Mehta",
  "Joshi", "Das", "Sen", "Bose", "Chatterjee", "Roy", "Mishra", "Pandey", "Iyer", "Kapoor",
  "Shah", "Bhat", "Kulkarni", "Deshmukh", "Patil", "Sawant", "Gokhale", "Hegde", "Menon", "Pillai"
];

const CITIES = [
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Pune", "Jaipur", "Ahmedabad", "Kolkata", "Surat"
];

const PRODUCTS = {
  tops: [
    { name: "Floral Midi Dress", price: 3499 },
    { name: "Linen Blazer", price: 4999 },
    { name: "Cotton Tee", price: 899 },
    { name: "Oversized Denim Shirt", price: 2199 },
    { name: "Silk Kurta", price: 3999 },
    { name: "Denim Jacket", price: 4299 },
    { name: "Crop Tee", price: 799 },
    { name: "Chiffon Blouse", price: 1799 }
  ],
  bottoms: [
    { name: "Palazzo Pants", price: 1499 },
    { name: "High-Waist Jeans", price: 2799 },
    { name: "Linen Trousers", price: 2499 },
    { name: "Pleated Midi Skirt", price: 1999 },
    { name: "Cargo Joggers", price: 2299 },
    { name: "Cotton Chinos", price: 1899 }
  ],
  accessories: [
    { name: "Gold Plated Hoops", price: 1199 },
    { name: "Leather Belt", price: 999 },
    { name: "Canvas Tote Bag", price: 1299 },
    { name: "Cat-eye Sunglasses", price: 1499 },
    { name: "Silver Anklet", price: 899 },
    { name: "Silk Scarf", price: 1599 }
  ],
  footwear: [
    { name: "Classic White Sneakers", price: 3999 },
    { name: "Strap Flat Sandals", price: 1699 },
    { name: "Leather Loafers", price: 4500 },
    { name: "Suede Ankle Boots", price: 5499 },
    { name: "Velvet Mules", price: 2999 }
  ]
};

// Seed random dates
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log("Cleaning database...");
  await prisma.campaignEvent.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.campaign.deleteMany({});
  await prisma.segment.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.customer.deleteMany({});

  console.log("Seeding customers and orders...");
  
  const customersToCreate = [];
  const ordersToCreate = [];
  const now = new Date("2026-06-09T22:50:43+05:30");
  const year2024 = new Date("2024-01-01T00:00:00Z");
  const mid2026 = new Date("2026-05-01T00:00:00Z");

  const emailsUsed = new Set();

  for (let i = 0; i < 500; i++) {
    // Generate unique customer info
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const name = `${firstName} ${lastName}`;
    
    let email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@lumedemo.com`;
    let attempts = 0;
    while (emailsUsed.has(email) && attempts < 10) {
      email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}${Math.floor(Math.random() * 100)}@lumedemo.com`;
      attempts++;
    }
    emailsUsed.add(email);

    const phone = `+91${Math.floor(6000000000 + Math.random() * 3999999999)}`;
    const city = CITIES[Math.floor(Math.random() * CITIES.length)];
    const signup_date = randomDate(year2024, mid2026);
    
    // Customer ID
    const customerId = `cust_${i + 1}`;
    
    // Determine order counts (1 to 15, weighted towards 1-4)
    let orderCount = 1;
    const roll = Math.random();
    if (roll > 0.85) {
      orderCount = Math.floor(5 + Math.random() * 10); // 5 to 14
    } else if (roll > 0.4) {
      orderCount = Math.floor(2 + Math.random() * 3); // 2 to 4
    }
    
    let totalSpent = 0;
    let lastOrderDate = null;
    
    // Generate customer orders
    for (let j = 0; j < orderCount; j++) {
      const orderDate = randomDate(signup_date, now);
      if (!lastOrderDate || orderDate > lastOrderDate) {
        lastOrderDate = orderDate;
      }
      
      // Select category and product
      const categories = Object.keys(PRODUCTS);
      const category = categories[Math.floor(Math.random() * categories.length)];
      const productList = PRODUCTS[category];
      const product = productList[Math.floor(Math.random() * productList.length)];
      const amount = product.price;
      totalSpent += amount;
      
      ordersToCreate.push({
        id: `ord_${i + 1}_${j + 1}`,
        customer_id: customerId,
        product_name: product.name,
        category: category,
        amount: amount,
        order_date: orderDate,
        status: "completed"
      });
    }

    // RFM Score Calculation
    // R: 3 if bought in last 60 days, 2 if in 180 days, 1 otherwise
    const daysSinceLastOrder = Math.floor((now - lastOrderDate) / (1000 * 60 * 60 * 24));
    const r = daysSinceLastOrder <= 60 ? "3" : daysSinceLastOrder <= 180 ? "2" : "1";
    // F: 3 if orders >= 5, 2 if orders >= 2, 1 if 1
    const f = orderCount >= 5 ? "3" : orderCount >= 2 ? "2" : "1";
    // M: 3 if spent > 15000, 2 if spent > 4000, 1 otherwise
    const m = totalSpent > 15000 ? "3" : totalSpent > 4000 ? "2" : "1";
    const rfm_score = `${r}${f}${m}`;

    // Tags
    const tags = [];
    if (totalSpent > 15000) tags.push("VIP");
    if (orderCount >= 4) tags.push("loyal");
    if (daysSinceLastOrder > 90) tags.push("at-risk");
    const daysSinceSignup = Math.floor((now - signup_date) / (1000 * 60 * 60 * 24));
    if (daysSinceSignup <= 45) tags.push("new");
    if (orderCount === 1 && !tags.includes("new") && !tags.includes("at-risk")) tags.push("one-time");
    if (tags.length === 0) tags.push("regular");

    customersToCreate.push({
      id: customerId,
      name: name,
      email: email,
      phone: phone,
      city: city,
      signup_date: signup_date,
      total_spent: totalSpent,
      order_count: orderCount,
      last_order_date: lastOrderDate,
      tags: JSON.stringify(tags),
      rfm_score: rfm_score,
      created_at: signup_date
    });
  }

  // Create in batches
  console.log(`Creating ${customersToCreate.length} customers...`);
  await prisma.customer.createMany({ data: customersToCreate });

  console.log(`Creating ${ordersToCreate.length} orders...`);
  // Batch orders to prevent SQLite variable limits
  const batchSize = 500;
  for (let i = 0; i < ordersToCreate.length; i += batchSize) {
    const batch = ordersToCreate.slice(i, i + batchSize);
    await prisma.order.createMany({ data: batch });
  }

  console.log("Seeding pre-built segments...");
  const segments = [
    {
      id: "seg_vip",
      name: "VIP Buyers (spent > ₹15k)",
      description: "High-value shoppers who have spent a lifetime total of more than ₹15,000",
      rules_json: JSON.stringify([
        { field: "total_spent", operator: "gt", value: 15000 }
      ]),
      customer_count: customersToCreate.filter(c => c.total_spent > 15000).length
    },
    {
      id: "seg_at_risk",
      name: "At-Risk (no purchase 60+ days)",
      description: "Customers whose last purchase was more than 60 days ago",
      rules_json: JSON.stringify([
        { field: "last_purchase_days", operator: "gt", value: 60 }
      ]),
      customer_count: customersToCreate.filter(c => {
        const days = Math.floor((now - c.last_order_date) / (1000 * 60 * 60 * 24));
        return days > 60;
      }).length
    },
    {
      id: "seg_new_joiners",
      name: "New Joiners (last 30 days)",
      description: "Shoppers who signed up in the last 30 days",
      rules_json: JSON.stringify([
        { field: "signup_days", operator: "lte", value: 30 }
      ]),
      customer_count: customersToCreate.filter(c => {
        const days = Math.floor((now - c.signup_date) / (1000 * 60 * 60 * 24));
        return days <= 30;
      }).length
    }
  ];

  for (const seg of segments) {
    await prisma.segment.create({ data: seg });
  }

  console.log("Seeding past campaigns and messages...");
  // Seeding campaign 1
  const campaign1Id = "camp_past_1";
  const campaign1 = await prisma.campaign.create({
    data: {
      id: campaign1Id,
      name: "Summer Collection Launch",
      segment_id: "seg_new_joiners",
      channel: "Email",
      message_template: "Hey {{first_name}}, check out our summer linen shirts starting at ₹1200! Code: SUMMER10",
      status: "completed",
      scheduled_at: new Date("2026-05-15T10:00:00Z"),
      sent_count: 120,
      delivered_count: 114,
      opened_count: 91,
      clicked_count: 28,
      failed_count: 6,
      revenue_attributed: 18900.0,
      created_at: new Date("2026-05-14T09:00:00Z")
    }
  });

  // Seeding campaign 2
  const campaign2Id = "camp_past_2";
  const campaign2 = await prisma.campaign.create({
    data: {
      id: campaign2Id,
      name: "VIP Early Access",
      segment_id: "seg_vip",
      channel: "WhatsApp",
      message_template: "Hello {{first_name}}! Since you are a Lumé VIP, here is an exclusive 25% off our new Silk Kurta collection. Link: lume.in/vip25",
      status: "completed",
      scheduled_at: new Date("2026-06-01T11:00:00Z"),
      sent_count: 85,
      delivered_count: 83,
      opened_count: 79,
      clicked_count: 42,
      failed_count: 2,
      revenue_attributed: 62499.0,
      created_at: new Date("2026-05-30T14:00:00Z")
    }
  });

  // Seed some message logs for past campaigns
  // We will select a few sample customers to create message logs for
  const vipCustomers = customersToCreate.filter(c => c.total_spent > 15000).slice(0, 85);
  const newCustomers = customersToCreate.filter(c => {
    const days = Math.floor((now - c.signup_date) / (1000 * 60 * 60 * 24));
    return days <= 30;
  }).slice(0, 120);

  console.log("Seeding detailed message logs...");
  const messagesToCreate = [];
  const eventsToCreate = [];

  // Seed for VIP campaign
  let msgIdx = 1;
  vipCustomers.forEach((cust, idx) => {
    const msgId = `msg_vip_${idx + 1}`;
    let status = "failed";
    if (idx < 2) status = "failed";
    else if (idx < 42) status = "clicked";
    else if (idx < 79) status = "opened";
    else if (idx < 83) status = "delivered";
    else status = "sent";

    const baseTime = new Date("2026-06-01T11:00:00Z");

    messagesToCreate.push({
      id: msgId,
      campaign_id: campaign2Id,
      customer_id: cust.id,
      status: status,
      sent_at: baseTime,
      delivered_at: status !== "failed" && status !== "sent" ? new Date(baseTime.getTime() + 4000) : null,
      opened_at: ["opened", "clicked"].includes(status) ? new Date(baseTime.getTime() + 15000) : null,
      clicked_at: status === "clicked" ? new Date(baseTime.getTime() + 30000) : null
    });

    eventsToCreate.push({
      id: `evt_${msgIdx++}`,
      message_id: msgId,
      event_type: "sent",
      timestamp: baseTime
    });

    if (status !== "failed" && status !== "sent") {
      eventsToCreate.push({
        id: `evt_${msgIdx++}`,
        message_id: msgId,
        event_type: "delivered",
        timestamp: new Date(baseTime.getTime() + 4000)
      });
    } else if (status === "failed") {
      eventsToCreate.push({
        id: `evt_${msgIdx++}`,
        message_id: msgId,
        event_type: "failed",
        timestamp: new Date(baseTime.getTime() + 1000)
      });
    }

    if (["opened", "clicked"].includes(status)) {
      eventsToCreate.push({
        id: `evt_${msgIdx++}`,
        message_id: msgId,
        event_type: "opened",
        timestamp: new Date(baseTime.getTime() + 15000)
      });
    }

    if (status === "clicked") {
      eventsToCreate.push({
        id: `evt_${msgIdx++}`,
        message_id: msgId,
        event_type: "clicked",
        timestamp: new Date(baseTime.getTime() + 30000)
      });
    }
  });

  // Seed for New Joiners campaign
  newCustomers.forEach((cust, idx) => {
    const msgId = `msg_new_${idx + 1}`;
    let status = "failed";
    if (idx < 6) status = "failed";
    else if (idx < 34) status = "clicked";
    else if (idx < 91) status = "opened";
    else if (idx < 114) status = "delivered";
    else status = "sent";

    const baseTime = new Date("2026-05-15T10:00:00Z");

    messagesToCreate.push({
      id: msgId,
      campaign_id: campaign1Id,
      customer_id: cust.id,
      status: status,
      sent_at: baseTime,
      delivered_at: status !== "failed" && status !== "sent" ? new Date(baseTime.getTime() + 6000) : null,
      opened_at: ["opened", "clicked"].includes(status) ? new Date(baseTime.getTime() + 25000) : null,
      clicked_at: status === "clicked" ? new Date(baseTime.getTime() + 45000) : null
    });

    eventsToCreate.push({
      id: `evt_${msgIdx++}`,
      message_id: msgId,
      event_type: "sent",
      timestamp: baseTime
    });

    if (status !== "failed" && status !== "sent") {
      eventsToCreate.push({
        id: `evt_${msgIdx++}`,
        message_id: msgId,
        event_type: "delivered",
        timestamp: new Date(baseTime.getTime() + 6000)
      });
    } else if (status === "failed") {
      eventsToCreate.push({
        id: `evt_${msgIdx++}`,
        message_id: msgId,
        event_type: "failed",
        timestamp: new Date(baseTime.getTime() + 1500)
      });
    }

    if (["opened", "clicked"].includes(status)) {
      eventsToCreate.push({
        id: `evt_${msgIdx++}`,
        message_id: msgId,
        event_type: "opened",
        timestamp: new Date(baseTime.getTime() + 25000)
      });
    }

    if (status === "clicked") {
      eventsToCreate.push({
        id: `evt_${msgIdx++}`,
        message_id: msgId,
        event_type: "clicked",
        timestamp: new Date(baseTime.getTime() + 45000)
      });
    }
  });

  // Batch insert messages & events
  console.log(`Inserting ${messagesToCreate.length} message records...`);
  await prisma.message.createMany({ data: messagesToCreate });

  console.log(`Inserting ${eventsToCreate.length} audit event records...`);
  for (let i = 0; i < eventsToCreate.length; i += batchSize) {
    const batch = eventsToCreate.slice(i, i + batchSize);
    await prisma.campaignEvent.createMany({ data: batch });
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
