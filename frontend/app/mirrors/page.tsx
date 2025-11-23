"use client";

import { Agent, agentsApi } from "@/lib/api";
import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  XCircle,
  CreditCard,
  Loader2,
  Bot,
  Filter,
  ChevronDown,
} from "lucide-react";
import { getChainById } from "@/lib/chains";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Component to handle agent image with fallback
function AgentImage({ image, name }: { image?: string; name?: string }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const isValidImage =
    image && typeof image === "string" && image.startsWith("http");

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

type ActiveFilter = "all" | "active" | "inactive";
type ChainFilter = "all" | "polygon" | "base";

export default function MirrorsPage() {
  const [mirrors, setMirrors] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [chainFilter, setChainFilter] = useState<ChainFilter>("all");

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

  // Filter mirrors based on active status and chain
  const filteredMirrors = useMemo(() => {
    return mirrors.filter((mirror) => {
      // Filter by active status
      if (activeFilter !== "all") {
        const isActive = mirror.active === true;
        if (activeFilter === "active" && !isActive) return false;
        if (activeFilter === "inactive" && isActive) return false;
      }

      // Filter by chain
      if (chainFilter !== "all") {
        const polygonChainId = 80002; // Polygon Amoy
        const baseChainId = 84532; // Base Sepolia
        
        if (chainFilter === "polygon" && mirror.chainId !== polygonChainId) {
          return false;
        }
        if (chainFilter === "base" && mirror.chainId !== baseChainId) {
          return false;
        }
      }

      return true;
    });
  }, [mirrors, activeFilter, chainFilter]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
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
    <div className="flex flex-col justify-start items-start w-full max-w-7xl gap-6 mx-auto h-full md:px-12 min-h-screen">
      <div className="flex flex-col gap-2 w-full">
        <h1 className="text-4xl md:text-5xl font-bold">Explore Mirrors</h1>
        <p className="text-white text-base md:text-lg">
          Discover AI agents powered by X402 micropayments
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 w-full">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-white/70" />
          <span className="text-sm font-medium text-white/70">Filters:</span>
        </div>
        
        {/* Active Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="text-xs flex items-center gap-2"
            >
              Status: {activeFilter === "all" ? "All" : activeFilter === "active" ? "Active" : "Inactive"}
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuRadioGroup
              value={activeFilter}
              onValueChange={(value) => setActiveFilter(value as ActiveFilter)}
            >
              <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="active">Active</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="inactive">Inactive</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Chain Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="text-xs flex items-center gap-2"
            >
              Chain: {chainFilter === "all" ? "All" : chainFilter === "polygon" ? "Polygon" : "Base"}
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuRadioGroup
              value={chainFilter}
              onValueChange={(value) => setChainFilter(value as ChainFilter)}
            >
              <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="polygon" className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/chains/polygon.png"
                  alt="Polygon"
                  width={16}
                  height={16}
                  className="rounded-full"
                />
                Polygon
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="base" className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/chains/base.png"
                  alt="Base"
                  width={16}
                  height={16}
                  className="rounded-full"
                />
                Base
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {filteredMirrors.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 bg-white/50 rounded-2xl border border-border p-12 w-full h-full">
          <p className="text-muted text-lg">No mirrors found</p>
          <p className="text-muted/70 text-sm">
            {mirrors.length === 0
              ? "Check back later for available agents"
              : "Try adjusting your filters"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {filteredMirrors.map((mirror) => (
            <Link
              key={mirror.agentId || mirror.name}
              href={`/mirrors/${mirror.agentId}/chat`}
              className="group"
            >
              <div className="bg-white backdrop-blur-sm rounded-xl border border-border hover:border-white hover:shadow-lg transition-all duration-300 h-full flex flex-col overflow-hidden">
                {/* Image and Status Badges */}
                <div className="relative">
                  <div className="aspect-video w-full bg-primary flex items-center justify-center relative overflow-hidden">
                    <AgentImage
                      key={mirror.agentId || mirror.name}
                      image={mirror.image}
                      name={mirror.name}
                    />
                  </div>

                  {/* Status Badges */}
                  <div className="absolute top-1.5 right-1.5 flex flex-col gap-1.5">
                    {mirror.active ? (
                      <div className="bg-green-500 text-white px-1.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-0.5">
                       
                        Active
                      </div>
                    ) : (
                      <div className="bg-gray-400 text-white px-1.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-0.5">
                      
                        Inactive
                      </div>
                    )}
                    {mirror.x402support && (
                      <div className="bg-yellow-500 text-white px-1.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-0.5">
                        <CreditCard className="w-2.5 h-2.5" />
                        Paid
                      </div>
                    )}
                  </div>
                </div>

                {/* Agent Info */}
                <div className="flex-1 flex flex-col gap-2 p-4">
                  <h3 className="text-base font-bold text-background group-hover:text-primary transition-colors line-clamp-1">
                    {mirror.name || "Unnamed Agent"}
                  </h3>

                  {mirror.description && (
                    <p className="text-muted text-sm line-clamp-2 leading-snug">
                      {mirror.description}
                    </p>
                  )}

                  {mirror.chainId && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getChainById(mirror.chainId)?.icon || ""}
                      alt={getChainById(mirror.chainId)?.name || ""}
                      width={25}
                      height={25}
                      className="absolute top-2 left-2 rounded-full"
                    />
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
