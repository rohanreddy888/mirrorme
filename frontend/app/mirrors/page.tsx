"use client";

import { Agent, agentsApi } from "@/lib/api";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, XCircle, CreditCard, Zap, Loader2, Bot } from "lucide-react";

// Component to handle agent image with fallback
function AgentImage({ image, name }: { image?: string; name?: string }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const isValidImage = image && typeof image === "string" && image.startsWith("http");

  if (!isValidImage || imageError) {
    return (
      <div className="flex w-full h-full items-center justify-center">
        <Bot className="w-10 h-10 text-white/80" />
      </div>
    );
  }

  return (
    <>
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Bot className="w-10 h-10 text-white/60 animate-pulse" />
        </div>
      )}
      <Image
        src={image}
        alt={name || "Agent"}
        width={200}
        height={200}
        className="w-full h-full object-cover"
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
      />
    </>
  );
}

export default function MirrorsPage() {
  const [mirrors, setMirrors] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMirrors = async () => {
      try {
        setIsLoading(true);
        const response = await agentsApi.list();
        setMirrors(response.result);
        setError(null);
      } catch (err) {
        console.error("Error fetching mirrors:", err);
        setError(err instanceof Error ? err.message : "Failed to load mirrors");
      } finally {
        setIsLoading(false);
      }
    };
    fetchMirrors();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted">Loading mirrors...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <XCircle className="w-8 h-8 text-red-500" />
        <p className="text-red-500">Error: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gradient text-white rounded-full font-medium hover:opacity-90 transition-opacity"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-7xl gap-6 mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-5xl font-bold text-background">Explore Mirrors</h1>
        <p className="text-muted text-lg">
          Discover AI agents powered by X402 micropayments
        </p>
      </div>

      {mirrors.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 bg-white/50 rounded-2xl border border-border p-12">
          <p className="text-muted text-lg">No mirrors found</p>
          <p className="text-muted/70 text-sm">Check back later for available agents</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {mirrors.map((mirror) => (
            <Link
              key={mirror.agentId || mirror.name}
              href={`/chat?agent=${encodeURIComponent(mirror.agentId || "")}`}
              className="group"
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-border p-4 hover:shadow-lg hover:border-primary/50 transition-all duration-300 h-full flex flex-col">
                {/* Image and Status Badges */}
                <div className="relative mb-3">
                  <div className="aspect-square w-full rounded-lg bg-gradient flex items-center justify-center overflow-hidden relative">
                    <AgentImage 
                      key={mirror.agentId || mirror.name} 
                      image={mirror.image} 
                      name={mirror.name} 
                    />
                  </div>
                  
                  {/* Status Badges */}
                  <div className="absolute top-1.5 right-1.5 flex flex-col gap-1.5">
                    {mirror.active ? (
                      <div className="bg-green-500 text-white px-1.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Active
                      </div>
                    ) : (
                      <div className="bg-gray-400 text-white px-1.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-0.5">
                        <XCircle className="w-2.5 h-2.5" />
                        Inactive
                      </div>
                    )}
                    {mirror.x402support && (
                      <div className="bg-yellow-500 text-white px-1.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-0.5">
                        <CreditCard className="w-2.5 h-2.5" />
                        Paid
                      </div>
                    )}
                  </div>
                </div>

                {/* Agent Info */}
                <div className="flex-1 flex flex-col gap-2">
                  <h3 className="text-sm font-bold text-background group-hover:text-primary transition-colors line-clamp-1">
                    {mirror.name || "Unnamed Agent"}
                  </h3>
                  
                  {mirror.description && (
                    <p className="text-muted text-xs line-clamp-2 leading-snug">
                      {mirror.description}
                    </p>
                  )}

                  {/* Features */}
                  <div className="flex flex-wrap gap-1.5 mt-auto pt-2 border-t border-border/50">
                    {mirror.mcp && (
                      <div className="flex items-center gap-0.5 text-[10px] text-muted bg-white/50 px-1.5 py-0.5 rounded-full">
                        <Zap className="w-2.5 h-2.5" />
                        MCP
                      </div>
                    )}
                    {mirror.a2a && (
                      <div className="flex items-center gap-0.5 text-[10px] text-muted bg-white/50 px-1.5 py-0.5 rounded-full">
                        <Zap className="w-2.5 h-2.5" />
                        A2A
                      </div>
                    )}
                    {mirror.mcpTools && Array.isArray(mirror.mcpTools) && mirror.mcpTools.length > 0 && (
                      <div className="flex items-center gap-0.5 text-[10px] text-muted bg-white/50 px-1.5 py-0.5 rounded-full">
                        {mirror.mcpTools.length} Tool{mirror.mcpTools.length !== 1 ? "s" : ""}
                      </div>
                    )}
                  </div>

                  {/* Chain ID */}
                  {mirror.chainId && (
                    <div className="text-[10px] text-muted/70 mt-1">
                      Chain: {mirror.chainId}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
