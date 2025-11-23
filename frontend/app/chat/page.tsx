"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useUSDCBalance } from "@/hooks/useUSDCBalance";
import CopyButton from "../components/CopyButton";
import { Send, Calendar, CheckCircle2, XCircle, Clock, User, Mail, MapPin, ExternalLink, Wrench, Zap, Settings, FileText, Search, Link as LinkIcon, Key, Database, Code, Image as ImageIcon, Video, Music, Globe, ShoppingCart, CreditCard } from "lucide-react";
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

// Agent's wallet address (placeholder - agent has its own wallet)
const AGENT_WALLET_ADDRESS = process.env.NEXT_PUBLIC_AGENT_WALLET_ADDRESS || "0x0000000000000000000000000000000000000000";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

// Map tool names to relevant icons
function getToolIcon(toolName: string) {
  const name = toolName.toLowerCase();
  
  if (name.includes("meeting") || name.includes("calendar") || name.includes("book")) {
    return Calendar;
  }
  if (name.includes("search") || name.includes("find") || name.includes("query")) {
    return Search;
  }
  if (name.includes("url") || name.includes("link") || name.includes("shorten")) {
    return LinkIcon;
  }
  if (name.includes("password") || name.includes("generate") || name.includes("key")) {
    return Key;
  }
  if (name.includes("database") || name.includes("store") || name.includes("save")) {
    return Database;
  }
  if (name.includes("code") || name.includes("script") || name.includes("execute")) {
    return Code;
  }
  if (name.includes("image") || name.includes("picture") || name.includes("photo")) {
    return ImageIcon;
  }
  if (name.includes("video") || name.includes("movie")) {
    return Video;
  }
  if (name.includes("music") || name.includes("audio") || name.includes("sound")) {
    return Music;
  }
  if (name.includes("web") || name.includes("http") || name.includes("browser")) {
    return Globe;
  }
  if (name.includes("payment") || name.includes("pay") || name.includes("transaction")) {
    return CreditCard;
  }
  if (name.includes("shop") || name.includes("cart") || name.includes("buy")) {
    return ShoppingCart;
  }
  if (name.includes("file") || name.includes("document") || name.includes("text")) {
    return FileText;
  }
  if (name.includes("setting") || name.includes("config") || name.includes("preference")) {
    return Settings;
  }
  if (name.includes("tool") || name.includes("utility") || name.includes("action")) {
    return Wrench;
  }
  
  // Default icon for unknown tools
  return Zap;
}

// Component to display tool output in a visualized way
function ToolOutputDisplay({ output, toolName }: { output: unknown; toolName: string }) {
  // Try to parse the output
  let parsedOutput: Record<string, unknown> | string;
  
  if (typeof output === "string") {
    try {
      parsedOutput = JSON.parse(output);
    } catch {
      // If it's not JSON, just display as string
      return (
        <div className="mt-2 p-3 bg-white/50 border border-border rounded-xl">
          <pre className="text-xs whitespace-pre-wrap text-background/80">{output}</pre>
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
    const bookingId = typeof parsedOutput.bookingId === "string" ? parsedOutput.bookingId : String(parsedOutput.bookingId || "");
    const meeting = parsedOutput.meeting as Record<string, unknown>;
    const message = typeof parsedOutput.message === "string" ? parsedOutput.message : String(parsedOutput.message || "");
    const error = parsedOutput.error;
    
    if (error || !success) {
      // Error case
      const errorMessage = typeof error === "string" ? error : typeof message === "string" ? message : "Unknown error occurred";
      return (
        <div className="mt-2 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-red-600" />
            <span className="font-semibold text-red-800 text-sm">Booking Failed</span>
          </div>
          <p className="text-red-700 text-xs mb-2">{errorMessage}</p>
          {parsedOutput.details !== undefined && parsedOutput.details !== null && (
            <details className="text-xs">
              <summary className="text-red-600 cursor-pointer">Details</summary>
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
      <div className="mt-2 p-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-green-100 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h4 className="font-semibold text-green-900 text-sm">Meeting Booked Successfully!</h4>
            <p className="text-green-700 text-xs">{typeof message === "string" ? message : String(message || "")}</p>
          </div>
        </div>

        <div className="space-y-2.5">
          {/* Meeting Details */}
          <div className="bg-white/60 rounded-lg p-3 space-y-2">
            {typeof meeting.date === "string" && typeof meeting.time === "string" && (
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

            {typeof meeting.calendlyEventUrl === "string" && meeting.calendlyEventUrl !== "N/A" && (
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
              <span className="text-xs font-mono text-green-800 font-medium">{bookingId}</span>
            </div>
          )}

          {/* Status Badge */}
          {typeof meeting.status === "string" && meeting.status && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-green-700/70">Status:</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                meeting.status === "confirmed" || meeting.status === "active"
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}>
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

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your x402 agent. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const { currentUser } = useCurrentUser();
  const [isLoading, setIsLoading] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<
    PaymentRequired[] | null
  >(null);
  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { balance: usdcBalance, isLoading: isLoadingBalance } =
    useUSDCBalance(AGENT_WALLET_ADDRESS);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
          const amountUSD = formatUnits(BigInt(paymentReq.maxAmountRequired), 6);
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
    [input, isLoading, messages, pendingPayment, pendingMessages]
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

  return (
    <main className="flex w-full max-w-6xl flex-col h-[calc(100dvh-3rem)] gap-6 bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg">
      <div className="flex items-center gap-4 w-full">
        <Image
          src="/assets/logo-dark.svg"
          alt="MirrorMe Logo"
          width={140}
          height={20}
          priority
        />
        <div className="ml-auto flex md:flex-row flex-col items-end md:items-center md:gap-4 gap-2">
          {/* USDC Balance */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-white/50">
            <span className="text-sm text-muted">USDC:</span>
            <span className="text-sm font-semibold text-background">
              {isLoadingBalance ? "..." : `$${usdcBalance}`}
            </span>
          </div>
          {/* Agent Avatar */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-white/50">
            <div className="flex flex-row items-center gap-2">
              <span className="text-sm text-muted font-medium">Agent:</span>
              <div className="flex items-center gap-1.5 text-sm text-background group">
                <span>{formatAddress(AGENT_WALLET_ADDRESS)}</span>
                <CopyButton
                  textToCopy={AGENT_WALLET_ADDRESS}
                  iconSize="w-4 h-4"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Link
        href="/"
        className="text-muted hover:text-background transition-colors"
      >
        ← Back
      </Link>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white/50 rounded-2xl border border-border min-h-[400px] max-h-[600px]">
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
                          const IconComponent = getToolIcon(toolCall.toolName);
                          return <IconComponent className="w-4 h-4 text-background/70" />;
                        })()}
                        <span className="font-medium text-background">
                          {toolCall.toolName}
                        </span>
                        {toolCall.isError && (
                          <span className="text-red-500 text-xs">(Error)</span>
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
                              <span className="text-yellow-700/70">Amount</span>
                              <span className="text-yellow-800 font-medium">
                                {formatUnits(BigInt(toolCall.paymentRequired.maxAmountRequired), 6)}{" "}
                                {String(toolCall.paymentRequired.extra?.name || "USDC")}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-yellow-700/70">Network</span>
                              <span className="text-yellow-800 font-medium">
                                {toolCall.paymentRequired.network}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-yellow-700/70">Recipient</span>
                              <span className="text-yellow-800 font-mono text-[10px]">
                                {formatAddress(toolCall.paymentRequired.payTo)}
                              </span>
                            </div>
                            {toolCall.paymentRequired.description && (
                              <div className="pt-1.5 border-t border-yellow-200/50">
                                <span className="text-yellow-700/70 block mb-0.5">Description</span>
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
                          <ToolOutputDisplay output={toolCall.output} toolName={toolCall.toolName} />
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
        <div className="p-6 border border-yellow-300 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl backdrop-blur-sm shadow-lg">
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
                      <span className="text-muted text-sm font-medium">Amount</span>
                      <span className="text-yellow-900 font-semibold">
                        {formatUnits(BigInt(req.maxAmountRequired), 6)} {String(req.extra?.name || "USDC")}
                      </span>
                    </div>
                    <div className="h-px bg-border/50" />
                    <div className="flex items-center justify-between">
                      <span className="text-muted text-sm font-medium">Network</span>
                      <span className="text-background text-sm font-medium">
                        {req.network}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted text-sm font-medium">Recipient</span>
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
                          <span className="text-muted text-sm font-medium block mb-1">Description</span>
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
      {/* Prompt Suggestions */}
      {!isLoading && !pendingPayment && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted font-medium">Sample prompts</p>
          <div className="flex flex-row max-w-full overflow-x-auto scrollbar-hide gap-2 pb-1">
            {[
              { text: "Shorten a URL", paid: true, price: "$0.02" },
              { text: "Generate a password", paid: true, price: "$0.01" },
              { text: "What tools are available?", paid: false },
              { text: "Motivate me", paid: false },
            ].map((prompt) => (
              <button
                key={prompt.text}
                onClick={() => handleSend(false, prompt.text)}
                className={`px-4 py-2 text-xs rounded-full transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  prompt.paid
                    ? "bg-yellow-50 hover:bg-yellow-100 text-background border border-yellow-200 hover:border-yellow-300"
                    : "bg-white/50 hover:bg-white/80 text-background border border-border hover:border-primary/50"
                }`}
              >
                {prompt.paid && (
                  <span className="text-yellow-600 text-[10px]">💰</span>
                )}
                <span className="font-medium">{prompt.text}</span>
                {prompt.paid && prompt.price && (
                  <span className="text-[10px] text-yellow-700/80 font-medium">
                    {prompt.price}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={onSubmit} className="flex gap-2 border border-border bg-white/80 rounded-full p-1.5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          className="flex-1 ml-4 py-3 bg-transparent text-background placeholder-muted focus:outline-none"
          disabled={isLoading || !!pendingPayment}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading || !!pendingPayment}
          className="p-3 bg-gradient text-white rounded-full font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center gap-2"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </main>
  );
}

