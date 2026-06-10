const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const CRM_RECEIPT_URL = process.env.CRM_RECEIPT_URL || 'http://localhost:3000/api/receipts';

// In-memory store for message states
const messagesDb = new Map();

// Helper for structured logging
function log(msg, level = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${msg}`);
}

// POST webhook callback with retry logic
async function sendCallback(payload, attempt = 1) {
  try {
    log(`Sending callback to CRM: ${payload.messageId} -> status: ${payload.status} (Attempt ${attempt})`);
    
    const response = await fetch(CRM_RECEIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`CRM returned HTTP ${response.status}`);
    }
    
    log(`Callback success: ${payload.messageId} -> status: ${payload.status}`);
  } catch (error) {
    log(`Callback failed: ${payload.messageId} -> status: ${payload.status}. Error: ${error.message}`, 'WARNING');
    if (attempt < 3) {
      const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
      log(`Retrying callback in ${delay}ms...`);
      setTimeout(() => sendCallback(payload, attempt + 1), delay);
    } else {
      log(`Max retries reached. Callback permanently failed for ${payload.messageId}`, 'ERROR');
    }
  }
}

// Staggered simulation logic
function simulateMessageLifecycle(msg) {
  const { id: messageId, campaignId, customerId, channel, recipientPhone, recipientEmail } = msg;
  const recipient = channel === 'Email' ? recipientEmail : recipientPhone;

  // Initialize in store
  messagesDb.set(messageId, {
    messageId,
    campaignId,
    customerId,
    channel,
    recipient,
    status: 'queued',
    timestamp: new Date().toISOString()
  });

  // Step 1: Queued immediately
  sendCallback({ messageId, campaignId, customerId, status: 'queued', timestamp: new Date().toISOString() });

  // Step 2: Sent stage (staggered delay 500ms - 2000ms)
  const sentDelay = 500 + Math.random() * 1500;
  setTimeout(() => {
    // 5% fail immediately at Sent stage
    const isSentFailure = Math.random() < 0.05;
    if (isSentFailure) {
      messagesDb.set(messageId, { ...messagesDb.get(messageId), status: 'failed', reason: 'Sent failure' });
      sendCallback({ messageId, campaignId, customerId, status: 'failed', timestamp: new Date().toISOString() });
      return;
    }

    messagesDb.set(messageId, { ...messagesDb.get(messageId), status: 'sent' });
    sendCallback({ messageId, campaignId, customerId, status: 'sent', timestamp: new Date().toISOString() });

    // Step 3: Delivered stage (staggered delay 2s - 5s after sent)
    const deliveredDelay = 2000 + Math.random() * 3000;
    setTimeout(() => {
      // 3% fail at Delivered stage
      const isDeliveredFailure = Math.random() < 0.03;
      if (isDeliveredFailure) {
        messagesDb.set(messageId, { ...messagesDb.get(messageId), status: 'failed', reason: 'Delivery failed' });
        sendCallback({ messageId, campaignId, customerId, status: 'failed', timestamp: new Date().toISOString() });
        return;
      }

      messagesDb.set(messageId, { ...messagesDb.get(messageId), status: 'delivered' });
      sendCallback({ messageId, campaignId, customerId, status: 'delivered', timestamp: new Date().toISOString() });

      // Step 4: Opened stage (80% chance, delay 3s - 8s after delivery)
      const isOpened = Math.random() < 0.80;
      if (!isOpened) return;

      const openedDelay = 3000 + Math.random() * 5000;
      setTimeout(() => {
        messagesDb.set(messageId, { ...messagesDb.get(messageId), status: 'opened' });
        sendCallback({ messageId, campaignId, customerId, status: 'opened', timestamp: new Date().toISOString() });

        // Step 5: Clicked stage (30% chance of opened, delay 4s - 10s after open)
        const isClicked = Math.random() < 0.30;
        if (!isClicked) return;

        const clickedDelay = 4000 + Math.random() * 6000;
        setTimeout(() => {
          messagesDb.set(messageId, { ...messagesDb.get(messageId), status: 'clicked' });
          sendCallback({ messageId, campaignId, customerId, status: 'clicked', timestamp: new Date().toISOString() });
        }, clickedDelay);

      }, openedDelay);

    }, deliveredDelay);

  }, sentDelay);
}

// POST /send - Queue messages for simulation
app.post('/send', (req, res) => {
  const body = req.body;
  
  let messages = [];
  if (Array.isArray(body)) {
    messages = body;
  } else if (body.messages && Array.isArray(body.messages)) {
    messages = body.messages;
  } else if (body.id || body.messageId) {
    messages = [body];
  } else {
    return res.status(400).json({ error: 'Invalid payload format. Expected single message or array.' });
  }

  if (messages.length === 0) {
    return res.status(400).json({ error: 'No messages to send.' });
  }

  log(`Received ${messages.length} messages to dispatch.`);

  // Process and throttle: process max 50 messages/second
  // We stagger the dispatch by scheduling them with slight delays
  messages.forEach((msg, idx) => {
    // Stagger starts in blocks of 50 per second
    const batchOffset = Math.floor(idx / 50) * 1000;
    const itemOffset = (idx % 50) * 20; // 20ms apart
    const totalOffset = batchOffset + itemOffset;

    setTimeout(() => {
      // Normalize object shape
      const normalizedMsg = {
        id: msg.id || msg.messageId,
        campaignId: msg.campaignId,
        customerId: msg.customerId,
        channel: msg.channel,
        recipientPhone: msg.recipientPhone || msg.phone,
        recipientEmail: msg.recipientEmail || msg.email,
        content: msg.message || msg.content
      };
      
      simulateMessageLifecycle(normalizedMsg);
    }, totalOffset);
  });

  return res.status(200).json({
    status: 'success',
    message: `Enqueued ${messages.length} messages for dispatch simulation.`,
    count: messages.length
  });
});

// GET /status/:messageId - Retrieve status of a message
app.get('/status/:messageId', (req, res) => {
  const { messageId } = req.params;
  const msg = messagesDb.get(messageId);
  if (!msg) {
    return res.status(404).json({ error: 'Message not found' });
  }
  return res.status(200).json(msg);
});

// GET /health - Diagnostics
app.get('/health', (req, res) => {
  return res.status(200).json({
    status: 'healthy',
    messagesStored: messagesDb.size,
    crmReceiptUrl: CRM_RECEIPT_URL
  });
});

app.listen(PORT, () => {
  log(`Xeno Channel Service running on port ${PORT}`);
  log(`Callback configured to send receipts to: ${CRM_RECEIPT_URL}`);
});
