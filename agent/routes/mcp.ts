import { Router, type Request, type Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { withX402, type X402Config } from "agents/x402";
import { z } from "zod";
import { facilitator } from "@coinbase/x402";
import axios from "axios";


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
      const calendlyApiToken = process.env.CALENDLY_API_TOKEN;
      const calendlyEventTypeUri = process.env.CALENDLY_EVENT_TYPE_URI;

      if (!calendlyApiToken) {
        throw new Error("CALENDLY_API_TOKEN environment variable is not set");
      }

      if (!calendlyEventTypeUri) {
        throw new Error("CALENDLY_EVENT_TYPE_URI environment variable is not set");
      }

      // Combine date and time into ISO format
      const meetingDateTime = new Date(`${date}T${time}`);
      
      // Calendly API expects the start time in ISO 8601 format
      const startTime = meetingDateTime.toISOString();
      
      // Calculate end time based on duration
      const endTime = new Date(meetingDateTime.getTime() + duration * 60 * 1000).toISOString();

      // First, fetch the event type to get question structure if we need to include questions_and_answers
      let questionsAndAnswers: any[] = [];
      if (topic) {
        try {
          const eventTypeResponse = await axios.get(
            calendlyEventTypeUri,
            {
              headers: {
                "Authorization": `Bearer ${calendlyApiToken}`,
                "Content-Type": "application/json"
              }
            }
          );

          const eventType = eventTypeResponse.data?.resource;
          // Find the first question field that accepts text input
          // Calendly questions have a 'position' field (0-indexed)
          if (eventType?.questions) {
            // Find a text question to use for the topic
            const textQuestion = eventType.questions.find((q: any) => 
              q.type === "text" || q.type === "textarea" || !q.type
            );
            if (textQuestion) {
              questionsAndAnswers = [{
                position: textQuestion.position ?? 0,
                answer: topic
              }];
            } else {
              // Fallback: use position 0 if no questions found
              questionsAndAnswers = [{
                position: 0,
                answer: topic
              }];
            }
          } else {
            // If no questions structure, use position 0 as default
            questionsAndAnswers = [{
              position: 0,
              answer: topic
            }];
          }
        } catch (error) {
          // If we can't fetch event type, use position 0 as fallback
          questionsAndAnswers = [{
            position: 0,
            answer: topic
          }];
        }
      }

      // Create scheduled event invitation via Calendly API
      const calendlyResponse = await axios.post(
        "https://api.calendly.com/invitees",
        {
          event_type: calendlyEventTypeUri,
          invitee: {
            email: attendeeEmail,
            name: attendeeName,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          location: {
            kind: "google_conference"
          },
          start_time: startTime,
          questions_and_answers: questionsAndAnswers
        },
        {
          headers: {
            "Authorization": `Bearer ${calendlyApiToken}`,
            "Content-Type": "application/json"
          }
        }
      );

      const calendlyEvent = calendlyResponse.data.resource;
      
      const result = {
        success: true,
        bookingId: calendlyEvent.uri.split("/").pop() || `MEET-${Date.now()}`,
        calendlyUri: calendlyEvent.uri,
        meeting: {
          date,
          time,
          duration,
          attendeeName,
          attendeeEmail,
          topic: topic || "General discussion",
          status: calendlyEvent.status || "confirmed",
          meetingDateTime: startTime,
          endTime: endTime,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          calendlyEventUrl: calendlyEvent.event_guests?.[0]?.event_guest_url || calendlyEvent.location?.location || "N/A"
        },
        message: `Meeting booked successfully via Calendly! Confirmation ID: ${calendlyEvent.uri.split("/").pop()}`
      };
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      // Handle Calendly API errors
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message;
        const errorDetails = error.response?.data;
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              error: "Failed to book meeting via Calendly",
              message: errorMessage,
              details: errorDetails,
              statusCode: error.response?.status
            }, null, 2)
          }]
        };
      }
      
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

