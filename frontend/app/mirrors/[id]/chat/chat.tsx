"use client";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  SendHorizonal,
  Bot,
  Info,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Mail,
  MapPin,
  ExternalLink,
  Wrench,
  Zap,
  Settings,
  FileText,
  Search,
  Link as LinkIcon,
  Key,
  Database,
  Code,
  Image as ImageIcon,
  Video,
  Music,
  Globe,
  ShoppingCart,
  CreditCard,
} from "lucide-react";
import CopyButton from "@/app/components/CopyButton";
import { Agent, agentsApi } from "@/lib/api";
import { profileApi, type Profile } from "@/lib/api/profile";
import Image from "next/image";
import XIcon from "@/lib/icons/x-icon";
import Link from "next/link";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useCurrentUser } from "@coinbase/cdp-hooks";

interface PaymentRequired {
  network: string;
  maxAmountRequired: string;
  payTo: string;
  asset: string;
  resource: string;
  description: string;
  mimeType: string;
  maxTimeoutSeconds: number;
  extra?: Record<string, unknown>;
}

interface ToolCall {
  toolName: string;
  toolCallId: string;
  input: unknown;
  output: unknown;
  isError: boolean;
  paymentRequired?: PaymentRequired;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
}

const tags = ["Developer", "DeFi", "x402", "Lending", "Yield Farming", "Memecoins", "Ethereum", "Solidity"];

// Agent's wallet address (placeholder - agent has its own wallet)
const AGENT_WALLET_ADDRESS =
  process.env.NEXT_PUBLIC_AGENT_WALLET_ADDRESS ||
  "0x0000000000000000000000000000000000000000";
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

// Map tool names to relevant icons
function getToolIcon(toolName: string) {
  const name = toolName.toLowerCase();

  if (
    name.includes("meeting") ||
    name.includes("calendar") ||
    name.includes("book")
  ) {
    return Calendar;
  }
  if (
    name.includes("search") ||
    name.includes("find") ||
    name.includes("query")
  ) {
    return Search;
  }
  if (
    name.includes("url") ||
    name.includes("link") ||
    name.includes("shorten")
  ) {
    return LinkIcon;
  }
  if (
    name.includes("password") ||
    name.includes("generate") ||
    name.includes("key")
  ) {
    return Key;
  }
  if (
    name.includes("database") ||
    name.includes("store") ||
    name.includes("save")
  ) {
    return Database;
  }
  if (
    name.includes("code") ||
    name.includes("script") ||
    name.includes("execute")
  ) {
    return Code;
  }
  if (
    name.includes("image") ||
    name.includes("picture") ||
    name.includes("photo")
  ) {
    return ImageIcon;
  }
  if (name.includes("video") || name.includes("movie")) {
    return Video;
  }
  if (
    name.includes("music") ||
    name.includes("audio") ||
    name.includes("sound")
  ) {
    return Music;
  }
  if (
    name.includes("web") ||
    name.includes("http") ||
    name.includes("browser")
  ) {
    return Globe;
  }
  if (
    name.includes("payment") ||
    name.includes("pay") ||
    name.includes("transaction")
  ) {
    return CreditCard;
  }
  if (name.includes("shop") || name.includes("cart") || name.includes("buy")) {
    return ShoppingCart;
  }
  if (
    name.includes("file") ||
    name.includes("document") ||
    name.includes("text")
  ) {
    return FileText;
  }
  if (
    name.includes("setting") ||
    name.includes("config") ||
    name.includes("preference")
  ) {
    return Settings;
  }
  if (
    name.includes("tool") ||
    name.includes("utility") ||
    name.includes("action")
  ) {
    return Wrench;
  }

  // Default icon for unknown tools
  return Zap;
}

// Component to display tool output in a visualized way
function ToolOutputDisplay({
  output,
  toolName,
}: {
  output: unknown;
  toolName: string;
}) {
  // Try to parse the output
  let parsedOutput: Record<string, unknown> | string;

  if (typeof output === "string") {
    try {
      parsedOutput = JSON.parse(output);
    } catch {
      // If it's not JSON, just display as string
      return (
        <div className="mt-2 p-3 bg-white/50 border border-border rounded-xl">
          <pre className="text-xs whitespace-pre-wrap text-background/80">
            {output}
          </pre>
        </div>
      );
    }
  } else {
    parsedOutput = output as Record<string, unknown>;
  }

  // Check if it's a Calendly booking response
  if (
    typeof parsedOutput === "object" &&
    parsedOutput !== null &&
    "success" in parsedOutput &&
    "meeting" in parsedOutput &&
    toolName === "book_meeting"
  ) {
    const success = parsedOutput.success;
    const bookingId =
      typeof parsedOutput.bookingId === "string"
        ? parsedOutput.bookingId
        : String(parsedOutput.bookingId || "");
    const meeting = parsedOutput.meeting as Record<string, unknown>;
    const message =
      typeof parsedOutput.message === "string"
        ? parsedOutput.message
        : String(parsedOutput.message || "");
    const error = parsedOutput.error;

    if (error || !success) {
      // Error case
      const errorMessage =
        typeof error === "string"
          ? error
          : typeof message === "string"
          ? message
          : "Unknown error occurred";
      return (
        <div className="mt-2 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-red-600" />
            <span className="font-semibold text-red-800 text-sm">
              Booking Failed
            </span>
          </div>
          <p className="text-red-700 text-xs mb-2">{errorMessage}</p>
          {parsedOutput.details !== undefined &&
            parsedOutput.details !== null && (
              <details className="text-xs">
                <summary className="text-red-600 cursor-pointer">
                  Details
                </summary>
                <pre className="mt-2 text-red-600/80 whitespace-pre-wrap">
                  {JSON.stringify(parsedOutput.details, null, 2)}
                </pre>
              </details>
            )}
        </div>
      );
    }

    // Success case - Calendly booking
    const formatDateTime = (dateStr: string, timeStr: string) => {
      try {
        const date = new Date(`${dateStr}T${timeStr}`);
        return date.toLocaleString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch {
        return `${dateStr} at ${timeStr}`;
      }
    };

    return (
      <div className="mt-2 p-4 from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-green-100 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h4 className="font-semibold text-green-900 text-sm">
              Meeting Booked Successfully!
            </h4>
            <p className="text-green-700 text-xs">
              {typeof message === "string" ? message : String(message || "")}
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {/* Meeting Details */}
          <div className="bg-white/60 rounded-lg p-3 space-y-2">
            {typeof meeting.date === "string" &&
              typeof meeting.time === "string" && (
                <div className="flex items-center gap-2 text-xs">
                  <Calendar className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-green-800 font-medium">
                    {formatDateTime(meeting.date, meeting.time)}
                  </span>
                </div>
              )}

            {typeof meeting.timezone === "string" && meeting.timezone && (
              <div className="flex items-center gap-2 text-xs text-green-700/80">
                <Clock className="w-3.5 h-3.5" />
                <span>{meeting.timezone}</span>
              </div>
            )}

            {typeof meeting.attendeeName === "string" && (
              <div className="flex items-center gap-2 text-xs">
                <User className="w-3.5 h-3.5 text-green-600" />
                <span className="text-green-800">{meeting.attendeeName}</span>
              </div>
            )}

            {typeof meeting.attendeeEmail === "string" && (
              <div className="flex items-center gap-2 text-xs">
                <Mail className="w-3.5 h-3.5 text-green-600" />
                <span className="text-green-800">{meeting.attendeeEmail}</span>
              </div>
            )}

            {typeof meeting.calendlyEventUrl === "string" &&
              meeting.calendlyEventUrl !== "N/A" && (
                <div className="flex items-center gap-2 text-xs pt-1 border-t border-green-200/50">
                  <MapPin className="w-3.5 h-3.5 text-green-600" />
                  <a
                    href={meeting.calendlyEventUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-700 hover:text-green-900 underline flex items-center gap-1"
                  >
                    View Meeting Details
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
          </div>

          {/* Booking ID */}
          {bookingId && (
            <div className="flex items-center justify-between bg-white/40 rounded-lg px-3 py-2">
              <span className="text-xs text-green-700/70">Booking ID:</span>
              <span className="text-xs font-mono text-green-800 font-medium">
                {bookingId}
              </span>
            </div>
          )}

          {/* Status Badge */}
          {typeof meeting.status === "string" && meeting.status && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-green-700/70">Status:</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  meeting.status === "confirmed" || meeting.status === "active"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {meeting.status}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Generic JSON output for other tools
  return (
    <div className="mt-2 p-3 bg-white/50 border border-border rounded-xl">
      <span className="text-muted/70 text-xs mb-1 block">Output:</span>
      <pre className="text-xs whitespace-pre-wrap text-background/80">
        {JSON.stringify(parsedOutput, null, 2)}
      </pre>
    </div>
  );
}

// Mock agent data
const MOCK_AGENT_DATA: Agent = {
  name: "MirrorMe AI Assistant",
  image: "https://api.dicebear.com/7.x/bottts/svg?seed=mirrorbot",
  description:
    "Your personal AI agent powered by X402 micropayments. I can help you with various tasks including URL shortening, password generation, and more using secure micropayment infrastructure.",
  extras: {
    tags: [
      "Developer",
      "DeFi",
      "x402",
      "Lending",
      "Yield Farming",
      "Memecoins",
      "Ethereum",
      "Solidity",
    ],
    faqs: [
      {
        question: "Tell me about yourself",
      },
      {
        question: "Book a meeting for tomorrow 10 am",
        paid: true,
      },
      {
        question: "Is my data secure?",
      },
    ],
  },
};

// Simple formatUnits function (replaces viem's formatUnits)
function formatUnits(value: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals);
  const quotient = value / divisor;
  const remainder = value % divisor;

  if (remainder === BigInt(0)) {
    return quotient.toString();
  }

  const remainderStr = remainder.toString().padStart(decimals, "0");
  const trimmed = remainderStr.replace(/0+$/, "");
  return `${quotient}.${trimmed}`;
}

export default function Chat() {
  const params = useParams();
  const mirrorID = params?.id as string;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your x402 agent. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<
    PaymentRequired[] | null
  >(null);
  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [agentData, setAgentData] = useState<Agent | null>(null);
  const [profileData, setProfileData] = useState<Profile | null>(null);
  const [imageError, setImageError] = useState(false);
  const { currentUser } = useCurrentUser();

  // Select 3-4 random tags
  const randomTags = useMemo(() => {
    const shuffled = [...tags].sort(() => Math.random() - 0.5);
    const count = Math.floor(Math.random() * 2) + 3; // Random 3 or 4
    return shuffled.slice(0, Math.min(count, tags.length));
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch agent data
  useEffect(() => {
    const fetchAgentData = async () => {
      try {
        const response = await agentsApi.list();
        const agent = response.result.find((a) => a.agentId === mirrorID);
        if (agent) {
          setAgentData(agent);
        }
      } catch (error) {
        console.error("Error fetching agent data:", error);
      }
    };
    fetchAgentData();
  }, [mirrorID]);

  // Fetch profile data by agent ID
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!mirrorID) return;

      try {
        const profile = await profileApi.getProfileByAgentId(mirrorID);
        if (profile) {
          setProfileData(profile);
        }
      } catch (error) {
        // Profile might not exist for this agent, which is fine
        if (error instanceof Error && error.message !== "Profile not found") {
          console.error("Error fetching profile data:", error);
        }
      }
    };
    fetchProfileData();
  }, [mirrorID]);

  const handleSend = useCallback(
    async (confirmPayment = false, promptText?: string) => {
      const messageText = promptText || input;
      // Allow proceeding if confirming payment, otherwise require input
      if ((!confirmPayment && !messageText.trim()) || isLoading) return;

      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: confirmPayment ? "Payment confirmed" : messageText,
      };

      const currentMessages = confirmPayment ? pendingMessages : messages;
      if (!confirmPayment) {
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
      }
      if (confirmPayment) {
        setPendingMessages([]);
        setPendingPayment(null);
      }
      setIsLoading(true);

      try {
        // Call server-side API route
        // Agent has its own wallet, so we use the agent's address
        const response = await fetch(`${BACKEND_URL}/api/agent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: confirmPayment
              ? currentMessages.map((msg) => ({
                  role: msg.role,
                  content: msg.content,
                }))
              : [...currentMessages, userMessage].map((msg) => ({
                  role: msg.role,
                  content: msg.content,
                })),
            accountAddress: AGENT_WALLET_ADDRESS,
            accountId: currentUser?.authenticationMethods.x?.username || "",
            network: "base-sepolia",
            confirmPayment,
            paymentRequirements: confirmPayment ? pendingPayment : undefined,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to get response from server");
        }

        // Parse JSON response
        const data = await response.json();

        // If payment is required, store it and show confirmation
        if (
          data.paymentRequired &&
          data.paymentRequired.length > 0 &&
          !confirmPayment
        ) {
          setPendingPayment(data.paymentRequired);
          setPendingMessages([...currentMessages, userMessage]);
          const paymentReq = data.paymentRequired[0];
          const amountUSD = formatUnits(
            BigInt(paymentReq.maxAmountRequired),
            6
          );
          const assistantMessage: Message = {
            id: Date.now().toString(),
            role: "assistant",
            content: `Payment required: ${amountUSD} ${
              paymentReq.extra?.name || "tokens"
            }\n\n${
              paymentReq.description || "Please confirm payment to proceed."
            }`,
            toolCalls: data.toolCalls,
          };
          setMessages((prev) => [...prev, assistantMessage]);
        } else {
          const assistantMessage: Message = {
            id: Date.now().toString(),
            role: "assistant",
            content: data.text || "No response generated",
            toolCalls: data.toolCalls,
          };
          setMessages((prev) => [...prev, assistantMessage]);
          if (!confirmPayment) {
            setInput("");
          }
        }
      } catch (error) {
        console.error("Error sending message:", error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "Sorry, there was an error processing your message. Please try again.",
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [
      input,
      isLoading,
      messages,
      pendingPayment,
      pendingMessages,
      currentUser?.authenticationMethods.x?.username,
    ]
  );

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSend();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  // Function to render text with clickable URLs
  const renderTextWithLinks = (text: string): React.ReactNode[] => {
    // First, handle markdown-style links [text](url)
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = markdownLinkRegex.exec(text)) !== null) {
      // Add text before the link
      if (match.index > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index);
        parts.push(...renderPlainUrls(beforeText));
      }
      // Add the link
      parts.push(
        <a
          key={match.index}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-secondary hover:text-secondary underline break-all"
        >
          {match[1]}
        </a>
      );
      lastIndex = markdownLinkRegex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      parts.push(...renderPlainUrls(remainingText));
    }

    // If no markdown links were found, just render plain URLs
    if (parts.length === 0) {
      return renderPlainUrls(text);
    }

    return parts;
  };

  // Function to render plain URLs in text
  const renderPlainUrls = (text: string): React.ReactNode[] => {
    // URL regex pattern
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = urlRegex.exec(text)) !== null) {
      // Add text before the URL
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      // Add the URL as a link
      parts.push(
        <a
          key={key++}
          href={match[1]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-secondary hover:text-secondary underline break-all"
        >
          {match[1]}
        </a>
      );
      lastIndex = urlRegex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    // If no URLs found, return the text as-is
    if (parts.length === 0) {
      return [text];
    }

    return parts;
  };

  // Extract agent data with proper type guards, use mock data as fallback
  // Prefer profile data over agent data for name, description, and image
  const displayAgent = agentData || MOCK_AGENT_DATA;
  const agentName =
    profileData?.name ||
    (typeof displayAgent?.name === "string"
      ? displayAgent.name
      : MOCK_AGENT_DATA.name);
  const agentImage =
    profileData?.image ||
    (typeof displayAgent?.image === "string"
      ? displayAgent.image
      : MOCK_AGENT_DATA.image);
  const agentDescription =
    profileData?.description ||
    (typeof displayAgent?.description === "string"
      ? displayAgent.description
      : MOCK_AGENT_DATA.description);
  const xUsername = profileData?.x_username;

  // Reset image error when image changes
  useEffect(() => {
    setImageError(false);
  }, [agentImage]);
  const agentTags =
    displayAgent?.extras?.tags && Array.isArray(displayAgent.extras.tags)
      ? (displayAgent.extras.tags as string[])
      : (MOCK_AGENT_DATA.extras?.tags as string[]) || [];
  const agentFaqs =
    displayAgent?.extras?.faqs && Array.isArray(displayAgent.extras.faqs)
      ? (displayAgent.extras.faqs as Array<{
          question: string;
          answer?: string;
          paid?: boolean;
        }>)
      : (MOCK_AGENT_DATA.extras?.faqs as Array<{
          question: string;
          answer?: string;
          paid?: boolean;
        }>) || [];

  return (
    <div className="h-full w-full md:grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto md:px-6">
      <main className="flex w-full max-w-6xl flex-col gap-4 bg-white/80 backdrop-blur-sm rounded-3xl p-4 md:p-6 shadow-lg h-full md:col-span-2">
        {/* Mobile Agent Info Button */}
        <div className="flex md:hidden justify-end">
          <Drawer direction="right">
            <DrawerTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2 bg-gradient text-white rounded-full text-sm font-medium shadow-lg">
                <Info className="w-4 h-4" />
                Agent Info
              </button>
            </DrawerTrigger>
            <DrawerContent className="h-full">
              <DrawerHeader className="border-b border-border">
                <DrawerTitle className="text-lg font-bold text-background">
                  Agent Information
                </DrawerTitle>
              </DrawerHeader>

              {/* Content */}
              <div className="p-6 flex flex-col gap-6 overflow-y-auto">
                {/* Profile Image */}
                <div className="flex flex-col items-center gap-4">
                  <div className="w-24 h-24 rounded-full bg-gradient flex items-center justify-center overflow-hidden p-1">
                    {agentImage && !imageError ? (
                      <Image
                        src={agentImage}
                        alt={agentName || "Agent"}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                        unoptimized={
                          agentImage.startsWith("data:") ||
                          agentImage.includes("pbs.twimg.com")
                        }
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <Bot className="w-12 h-12 text-white" />
                    )}
                  </div>

                  {/* Name */}
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-background">
                      {agentName}
                    </h2>
                    {/* X/Twitter Username */}
                    {xUsername && (
                      <Link
                        target="_blank"
                        href={`https://x.com/${xUsername}`}
                        className="inline-flex items-center gap-1.5 mt-2 text-xs text-muted hover:text-secondary transition-colors"
                      >
                        <XIcon className="w-3.5 h-3.5" />
                        <span>@{xUsername}</span>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Description */}
                {agentDescription && (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-center text-background leading-relaxed line-clamp-5">
                      {agentDescription}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {agentTags.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <h3 className="text-sm font-semibold text-muted uppercase tracking-wide">
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {agentTags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* FAQs */}
                {agentFaqs.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <h3 className="text-sm font-semibold text-muted uppercase tracking-wide">
                      Frequently Answered Questions
                    </h3>
                    <div className="flex flex-col gap-2">
                      {agentFaqs.map((faq, index) => (
                        <button
                          key={index}
                          onClick={() => handleSend(false, faq.question)}
                          disabled={isLoading || !!pendingPayment}
                          className="border border-border rounded-xl p-3 text-left bg-white hover:bg-gray-50 hover:border-secondary/30 hover:shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-sm font-medium text-background group-hover:text-secondary transition-colors flex-1">
                              {faq.question}
                            </p>
                            {faq.paid && (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                                <CreditCard className="w-3 h-3" />
                                Paid
                              </span>
                            )}
                          </div>
                          {faq.answer && (
                            <p className="text-sm text-muted leading-relaxed">
                              {faq.answer}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DrawerContent>
          </Drawer>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-white rounded-2xl min-h-0">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 ${
                  message.role === "user"
                    ? "bg-gradient text-white"
                    : "bg-white text-background border border-border"
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">
                  {renderTextWithLinks(message.content)}
                </div>
                {message.toolCalls && message.toolCalls.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                    {message.toolCalls.map((toolCall, idx) => (
                      <div
                        key={toolCall.toolCallId || idx}
                        className="bg-white/50 border border-border rounded-xl p-3 text-xs"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {(() => {
                            const IconComponent = getToolIcon(
                              toolCall.toolName
                            );
                            return (
                              <IconComponent className="w-4 h-4 text-background/70" />
                            );
                          })()}
                          <span className="font-medium text-background">
                            {toolCall.toolName}
                          </span>
                          {toolCall.isError && (
                            <span className="text-red-500 text-xs">
                              (Error)
                            </span>
                          )}
                          {toolCall.paymentRequired && (
                            <span className="text-yellow-600 text-xs">
                              (Payment Required)
                            </span>
                          )}
                        </div>

                        {toolCall.paymentRequired && (
                          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm">💰</span>
                              <p className="text-yellow-800 font-semibold text-xs">
                                Payment Required
                              </p>
                            </div>
                            <div className="space-y-1.5 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-yellow-700/70">
                                  Amount
                                </span>
                                <span className="text-yellow-800 font-medium">
                                  {formatUnits(
                                    BigInt(
                                      toolCall.paymentRequired.maxAmountRequired
                                    ),
                                    6
                                  )}{" "}
                                  {String(
                                    toolCall.paymentRequired.extra?.name ||
                                      "USDC"
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-yellow-700/70">
                                  Network
                                </span>
                                <span className="text-yellow-800 font-medium">
                                  {toolCall.paymentRequired.network}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-yellow-700/70">
                                  Recipient
                                </span>
                                <span className="text-yellow-800 font-mono text-[10px]">
                                  {formatAddress(
                                    toolCall.paymentRequired.payTo
                                  )}
                                </span>
                              </div>
                              {toolCall.paymentRequired.description && (
                                <div className="pt-1.5 border-t border-yellow-200/50">
                                  <span className="text-yellow-700/70 block mb-0.5">
                                    Description
                                  </span>
                                  <p className="text-yellow-800 text-[11px]">
                                    {toolCall.paymentRequired.description}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {toolCall.output !== null &&
                          toolCall.output !== undefined &&
                          !toolCall.paymentRequired && (
                            <ToolOutputDisplay
                              output={toolCall.output}
                              toolName={toolCall.toolName}
                            />
                          )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start items-center">
              <div className="bg-white text-background border border-border rounded-2xl p-4">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-secondary rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 bg-secondary rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 bg-secondary rounded-full animate-bounce" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Payment Confirmation Modal */}
        {pendingPayment && pendingPayment.length > 0 && (
          <div className="p-4 md:p-6 border border-yellow-300 from-yellow-50 to-yellow-100 rounded-2xl backdrop-blur-sm shadow-lg shrink-0">
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-yellow-200 flex items-center justify-center">
                  <span className="text-xl">💰</span>
                </div>
                <div>
                  <h3 className="text-yellow-900 font-semibold text-lg">
                    Payment Required
                  </h3>
                  <p className="text-yellow-700/70 text-sm">
                    Confirm payment to proceed with the request
                  </p>
                </div>
              </div>
              {pendingPayment[0] &&
                (() => {
                  const req = pendingPayment[0];
                  return (
                    <div className="bg-white/80 border border-yellow-200 rounded-xl p-4 space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-muted text-sm font-medium">
                          Amount
                        </span>
                        <span className="text-yellow-900 font-semibold">
                          {formatUnits(BigInt(req.maxAmountRequired), 6)}{" "}
                          {String(req.extra?.name || "USDC")}
                        </span>
                      </div>
                      <div className="h-px bg-border/50" />
                      <div className="flex items-center justify-between">
                        <span className="text-muted text-sm font-medium">
                          Network
                        </span>
                        <span className="text-background text-sm font-medium">
                          {req.network}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted text-sm font-medium">
                          Recipient
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-background text-sm font-mono">
                            {formatAddress(req.payTo)}
                          </span>
                          <CopyButton
                            textToCopy={req.payTo}
                            iconSize="w-3.5 h-3.5"
                          />
                        </div>
                      </div>
                      {req.description && (
                        <>
                          <div className="h-px bg-border/50" />
                          <div>
                            <span className="text-muted text-sm font-medium block mb-1">
                              Description
                            </span>
                            <p className="text-background text-sm">
                              {req.description}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })()}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setPendingPayment(null);
                  setPendingMessages([]);
                }}
                className="flex-1 px-4 py-2.5 bg-white/80 hover:bg-white text-background rounded-full font-medium transition-colors border border-border"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSend(true)}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-gradient text-white rounded-full font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  "Confirm & Pay"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={onSubmit}
          className="flex gap-2 border border-border bg-white/80 rounded-full p-1.5 shrink-0"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 ml-3 md:ml-4 py-2 md:py-3 bg-transparent text-background placeholder-muted focus:outline-none text-sm md:text-base"
            disabled={isLoading || !!pendingPayment}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading || !!pendingPayment}
            className="p-2 md:p-3 w-10 h-10 md:w-12 md:h-12 bg-gradient text-white rounded-full font-medium hover:opacity-90 transition-opacity disabled:opacity-90 disabled:cursor-not-allowed group flex items-center justify-center gap-2"
          >
            <SendHorizonal className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </form>
      </main>
      <aside className="hidden md:grid md:col-span-1 md:grid-rows-7 gap-4 overflow-y-auto">
        <div className="bg-white backdrop-blur-sm rounded-3xl p-6 shadow-lg flex flex-col gap-1 md:row-span-3">
          {/* Profile Image */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-gradient flex items-center justify-center overflow-hidden p-1">
              {agentImage && !imageError ? (
                <Image
                  src={agentImage}
                  alt={agentName || "Agent"}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover rounded-full"
                  unoptimized={
                    agentImage.startsWith("data:") ||
                    agentImage.includes("pbs.twimg.com")
                  }
                  onError={() => setImageError(true)}
                />
              ) : (
                <Bot className="w-12 h-12 text-white" />
              )}
            </div>

            {/* Name */}
            <div className="text-center">
              <h2 className="text-xl font-bold text-background">{agentName}</h2>
              {/* X/Twitter Username */}
              {xUsername && (
                <Link
                  target="_blank"
                  href={`https://x.com/${xUsername}`}
                  className="inline-flex items-center gap-1.5 mt-2 text-xs text-muted hover:text-secondary transition-colors"
                >
                  <XIcon className="w-3.5 h-3.5" />
                  <span>@{xUsername}</span>
                </Link>
              )}
            </div>
          </div>

          {/* Description */}
          {agentDescription && (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-center text-background leading-relaxed line-clamp-5">
                {agentDescription}
              </p>
            </div>
          )}
        </div>
        {/* Tags */}
        {randomTags.length > 0 && (
          <div className="flex flex-col gap-2 bg-white backdrop-blur-sm rounded-3xl p-6 shadow-lg md:row-span-1">
            <div className="flex flex-wrap gap-2">
              {randomTags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* FAQs */}
        {agentFaqs.length > 0 && (
          <div className="flex flex-col gap-3 bg-white backdrop-blur-sm rounded-3xl p-6 shadow-lg md:row-span-3">
            <h3 className="text-sm font-semibold text-muted uppercase tracking-wide">
              Frequently Answered Questions
            </h3>
            <div className="flex flex-col gap-2">
              {agentFaqs.map((faq, index) => (
                <button
                  key={index}
                  onClick={() => handleSend(false, faq.question)}
                  disabled={isLoading || !!pendingPayment}
                  className="border border-border rounded-xl p-3 bg-white hover:bg-gray-50 hover:border-secondary/30 hover:shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-left group"
                >
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-background group-hover:text-secondary transition-colors flex-1">
                      {faq.question}
                    </p>
                    {faq.paid && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium shrink-0">
                        <CreditCard className="w-3 h-3" />
                        Paid
                      </span>
                    )}
                  </div>
                  {faq.answer && (
                    <p className="text-xs text-muted leading-relaxed line-clamp-2">
                      {faq.answer}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
