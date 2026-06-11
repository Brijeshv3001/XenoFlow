import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { z } from "zod";
import { runSimulator } from "./simulator";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Request Body Validation Schema
const SendPayloadSchema = z.object({
  messages: z.array(
    z.object({
      messageId: z.string(),
      channel: z.string(),
      recipientId: z.string(),
      recipient: z.any().optional(),
      message: z.string(),
      callbackUrl: z.string().url()
    })
  )
});

app.post("/send", (req, res) => {
  try {
    const body = SendPayloadSchema.parse(req.body);
    
    // Trigger asynchronous campaign simulation in background
    runSimulator(body.messages);

    return res.status(202).json({
      success: true,
      message: `Accepted ${body.messages.length} messages for dispatch simulation.`
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: "Validation failed", details: err.errors });
    }
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[Channel Service] Standalone messaging gateway listening on port ${PORT}`);
});
