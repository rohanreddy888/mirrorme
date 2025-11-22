import { Router, type Request, type Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { withX402, type X402Config } from "agents/x402";
import { z } from "zod";
import { facilitator } from "@coinbase/x402";


// X402 configuration for payment-enabled tools
const FACILITATOR_URL = process.env.FACILITATOR_URL || "https://x402.org/facilitator";

const X402_CONFIG: X402Config = {
  network: "base-sepolia",
  recipient:
    (process.env.PAYEE_ADDRESS as `0x${string}`) || "0x958543756A4c7AC6fB361f0efBfeCD98E4D297Db" as `0x${string}`,
  facilitator: facilitator// Payment facilitator URL - can be overridden via FACILITATOR_URL env var
};

// Create MCP server with x402 payment support
// Note: In Express, we can reuse the server instance across requests
const baseServer = new McpServer({ name: "PayMCP", version: "1.0.0" });
const server = withX402(baseServer, X402_CONFIG);


console.log("FACILITATOR_URL", facilitator);


server.paidTool(
  "book_meeting",
  "Book a meeting with me",
  0.01, // USD
  {
    date: z.string().describe("Meeting date in YYYY-MM-DD format"),
    time: z.string().describe("Meeting time in HH:MM format (24-hour)"),
    duration: z.number().min(15).max(120).default(30).describe("Meeting duration in minutes"),
    attendeeName: z.string().describe("Name of the attendee"),
    attendeeEmail: z.string().email().describe("Email address of the attendee"),
    topic: z.string().optional().describe("Meeting topic or agenda")
  },
  {},
  async ({ date, time, duration, attendeeName, attendeeEmail, topic }) => {
    try {
      // Placeholder booking implementation
      const bookingId = `MEET-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      const meetingDateTime = new Date(`${date}T${time}`);
      
      const result = {
        success: true,
        bookingId,
        meeting: {
          date,
          time,
          duration,
          attendeeName,
          attendeeEmail,
          topic: topic || "General discussion",
          status: "confirmed",
          meetingDateTime: meetingDateTime.toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        message: `Meeting booked successfully! Confirmation ID: ${bookingId}`
      };
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: "Failed to book meeting",
            message: error instanceof Error ? error.message : "Unknown error"
          }, null, 2)
        }]
      };
    }
  }
);


const router: Router = Router();

// HTTP endpoint for MCP
router.post("/", async (req: Request, res: Response) => {
  // Create a new transport for each request to prevent request ID collisions
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true
  });

  res.on("close", () => {
    transport.close();
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

// Health check endpoint for MCP
router.get("/health", (_req: Request, res: Response) => {
  res.json({ 
    status: "ok", 
    service: "pay-mcp-server",
    network: X402_CONFIG.network,
    recipient: X402_CONFIG.recipient,
    facilitator: X402_CONFIG.facilitator.url
  });
});

export default router;

