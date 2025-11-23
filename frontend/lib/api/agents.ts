const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export interface CreateAgentRequest {
  name: string;
  description: string;
  image: string;
}

export interface CreateAgentResult {
  agentId: string;
  name: string;
  description: string;
  image: string;
}

export interface CreateAgentResponse {
  result: CreateAgentResult;
  message: string;
}

export interface Agent {
  chainId?: number;
  agentId?: string;
  name?: string;
  image?: string;
  description?: string;
  owners?: string[];
  operators?: string[];
  mcp?: boolean;
  a2a?: boolean;
  supportedTrusts?: unknown[];
  a2aSkills?: unknown[];
  mcpTools?: unknown[];
  mcpPrompts?: unknown[];
  mcpResources?: unknown[];
  active?: boolean;
  x402support?: boolean;
  extras?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ListAgentsResponse {
  result: Agent[];
}

export interface GetWalletResponse {
  id: string;
  address: string;
}

export interface ApiError {
  error: string;
}

/**
 * Create a new agent
 */
export async function createAgent(
  data: CreateAgentRequest
): Promise<CreateAgentResponse> {
  const response = await fetch(`${BACKEND_URL}/api/agents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: `HTTP error! status: ${response.status}`,
    }));
    throw new Error(error.error || `Failed to create agent: ${response.statusText}`);
  }

  return response.json();
}

/**
 * List all agents
 */
export async function listAgents(): Promise<ListAgentsResponse> {
  const response = await fetch(`${BACKEND_URL}/api/agents`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: `HTTP error! status: ${response.status}`,
    }));
    throw new Error(error.error || `Failed to list agents: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get wallet address for an agent by ID
 */
export async function getAgentWallet(id: string): Promise<GetWalletResponse> {
  if (!id) {
    throw new Error("Agent ID is required");
  }

  const response = await fetch(`${BACKEND_URL}/api/agents/${encodeURIComponent(id)}/wallet`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: `HTTP error! status: ${response.status}`,
    }));
    throw new Error(error.error || `Failed to get wallet address: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Client class for agents API
 */
export class AgentsApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || BACKEND_URL;
  }

  /**
   * Create a new agent
   */
  async create(data: CreateAgentRequest): Promise<CreateAgentResponse> {
    return createAgent(data);
  }

  /**
   * List all agents
   */
  async list(): Promise<ListAgentsResponse> {
    return listAgents();
  }

  /**
   * Get wallet address for an agent by ID
   */
  async getWallet(id: string): Promise<GetWalletResponse> {
    return getAgentWallet(id);
  }
}

/**
 * Default client instance
 */
export const agentsApi = new AgentsApiClient();

