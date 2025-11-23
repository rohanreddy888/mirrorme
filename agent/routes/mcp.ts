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


// Get today's date for the tool description
const todayDate = new Date().toISOString().split('T')[0];

console.log("todayDate", todayDate);

server.paidTool(
  "book_meeting",
  `Book a meeting with me. IMPORTANT: You MUST use the current date (${todayDate}) or a future date. Never use dates from the past or example dates. Always check what today's date is before booking.`,
  0.01, // USD
  {
    date: z.string().describe(`Meeting date in YYYY-MM-DD format. CRITICAL: Must be today (${todayDate}) or a future date. Never use past dates or example dates like 2023-10-19 or 2024-12-25. Always use the actual current date or a future date.`),
    time: z.string().describe("Meeting time in HH:MM format (24-hour). Example: 14:30"),
    attendeeName: z.string().describe("Name of the attendee"),
    attendeeEmail: z.string().email().describe("Email address of the attendee"),
  },
  {},
  async ({ date, time, attendeeName, attendeeEmail }) => {
    try {
      const calendlyApiToken = process.env.CALENDLY_API_TOKEN;
      const calendlyEventTypeUri = process.env.CALENDLY_EVENT_TYPE_URI;

      if (!calendlyApiToken) {
        throw new Error("CALENDLY_API_TOKEN environment variable is not set");
      }

      if (!calendlyEventTypeUri) {
        throw new Error("CALENDLY_EVENT_TYPE_URI environment variable is not set");
      }

      // Validate date format and ensure it's not in the past
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD format.`);
      }

      // Combine date and time into ISO format
      const meetingDateTime = new Date(`${date}T${time}`);
      
      // Validate that the date is valid
      if (isNaN(meetingDateTime.getTime())) {
        throw new Error(`Invalid date or time: ${date} ${time}. Please provide a valid date and time.`);
      }

      // Check if the date is in the past (allowing for timezone differences)
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const meetingDate = new Date(meetingDateTime.getFullYear(), meetingDateTime.getMonth(), meetingDateTime.getDate());
      
      if (meetingDate < today) {
        const todayStr = today.toISOString().split('T')[0];
        throw new Error(`Cannot book a meeting in the past. Provided date: ${date}. Today is ${todayStr}. Please use today's date (${todayStr}) or a future date. If the user didn't specify a date, use today's date by default.`);
      }

      // Log the date being used for debugging
      console.log(`[Calendly Booking] Date received: ${date}, Time: ${time}, Parsed: ${meetingDateTime.toISOString()}`);
      
      // Calendly API expects the start time in ISO 8601 format
      const startTime = meetingDateTime.toISOString();
      


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
          attendeeName,
          attendeeEmail,
          status: calendlyEvent.status || "confirmed",
          meetingDateTime: startTime,
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

// Paid tool to tell a static joke
server.paidTool(
  "tell_joke",
  "Tell a funny joke to lighten the mood",
  0.01, // USD
  {
    category: z.string().optional().describe("Optional joke category (e.g., 'programming', 'dad', 'knock-knock', 'general')"),
  },
  {},
  async ({ category }) => {
    // Collection of static jokes
    const jokes: Record<string, string[]> = {
      programming: [
        "Why do programmers prefer dark mode? Because light attracts bugs!",
        "Why do Java developers wear glasses? Because they can't C#!",
        "A SQL query walks into a bar, walks up to two tables and asks: 'Can I join you?'",
        "Why did the programmer quit his job? He didn't get arrays!",
        "How do you comfort a JavaScript bug? You console it!",
      ],
      dad: [
        "I told my wife she was drawing her eyebrows too high. She looked surprised.",
        "Why don't scientists trust atoms? Because they make up everything!",
        "I'm reading a book about anti-gravity. It's impossible to put down!",
        "Why don't eggs tell jokes? They'd crack each other up!",
        "What do you call a fake noodle? An impasta!",
      ],
      "knock-knock": [
        "Knock knock. Who's there? Interrupting cow. Interrupting cow wh- MOO!",
        "Knock knock. Who's there? Boo. Boo who? Don't cry, it's just a joke!",
        "Knock knock. Who's there? Lettuce. Lettuce who? Lettuce in, it's cold out here!",
      ],
      general: [
        "Why don't skeletons fight each other? They don't have the guts!",
        "What do you call a bear with no teeth? A gummy bear!",
        "Why did the scarecrow win an award? He was outstanding in his field!",
        "What's the best thing about Switzerland? I don't know, but the flag is a big plus!",
        "Why don't scientists trust atoms? Because they make up everything!",
      ],
    };

    // Get all jokes if no category specified
    const allJokes = Object.values(jokes).flat();
    
    // Select a random joke based on category
    let selectedJoke: string;
    if (category && jokes[category.toLowerCase()]) {
      const categoryJokes = jokes[category.toLowerCase()];
      selectedJoke = categoryJokes[Math.floor(Math.random() * categoryJokes.length)];
    } else {
      selectedJoke = allJokes[Math.floor(Math.random() * allJokes.length)];
    }

    const result = {
      success: true,
      joke: selectedJoke,
      category: category || "random",
      timestamp: new Date().toISOString(),
      message: "Here's a joke for you! 😄"
    };

    return {
      content: [{
        type: "text",
        text: JSON.stringify(result, null, 2)
      }]
    };
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

