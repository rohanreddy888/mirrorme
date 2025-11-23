# MirrorMe

MirrorMe converts your influence into immersive AI interactions. Anyone can engage with your AI persona and unlock premium features through x402 micropayments. A dynamic reputation score shaped by agent behavior drives discoverability and monetization via ERC-8004.

## Overview

MirrorMe empowers creators to build authentic, revenue-generating digital personas that stay connected with audiences anytime. Each agent can answer questions, chat naturally, and trigger premium actions when users ask personal, exclusive, or high-value requests.

## Architecture

### Frontend (`/frontend`)
- **Framework**: Next.js 16 with React 19
- **Styling**: Tailwind CSS
- **Key Features**:
  - Profile management with social media integration (X/Twitter)
  - Agent marketplace with filtering (status, chain)
  - Chat interface for AI agent interactions
  - CDP (Coinbase Developer Platform) integration for wallet management
  - X402 micropayment UI components

### Backend (`/agent`)
- **Framework**: Express.js with TypeScript
- **Key Services**:
  - **Agent API** (`/api/agent`): AI agent chat endpoints using Cloudflare Agents SDK
  - **Agents Registry** (`/api/agents`): Agent creation and management via Agent0 SDK (ERC-8004)
  - **Profile API** (`/api/profile`): User profile management with Supabase
  - **MCP Server** (`/mcp`): Model Context Protocol tools for agent capabilities
  - **X402 Integration**: Micropayment middleware for premium features

### Core Technologies

- **AI Agents**: Cloudflare Agents SDK for fast, serverless agent execution
- **Blockchain**: Agent0 SDK for ERC-8004 agent registry on Polygon Amoy & Base Sepolia
- **Payments**: X402 for single-click micropayments via CDP server wallets
- **Database**: Supabase for user profiles and agent metadata
- **Authentication**: Coinbase Developer Platform (CDP) for wallet and social linking

### How It Works

1. **Agent Creation**: Users connect socials (X/Twitter) and create AI personas via profile page
2. **Registration**: Agents are registered on ERC-8004 using Agent0 SDK, stored on IPFS (Pinata)
3. **Discovery**: Agents appear in marketplace with reputation scores based on behavior
4. **Interaction**: Users chat with agents; premium requests trigger X402 micropayments
5. **Reputation**: Dynamic scoring system updates based on agent responsiveness and behavior

## Project Structure

```
mirrorme/
├── frontend/          # Next.js application
│   ├── app/          # Pages and routes
│   ├── components/   # UI components
│   └── lib/          # Utilities and API clients
├── agent/            # Express backend
│   ├── routes/       # API route handlers
│   └── lib/          # Shared utilities (Supabase)
└── package.json      # Root workspace config
```

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm
- Supabase project
- CDP API keys
- Pinata JWT (for IPFS)
- X402 facilitator URL

### Environment Variables

**Frontend** (`.env.local`):
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

**Backend** (`.env`):
```
BACKEND_PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
PAYMENT_PRIVATE_KEY=your_private_key
PINATA_JWT=your_pinata_jwt
PAYEE_ADDRESS=your_wallet_address
FACILITATOR_URL=https://facilitator.x402.rs
```

### Installation

```bash
# Install dependencies
pnpm install

# Run frontend
cd frontend && pnpm dev

# Run backend
cd agent && pnpm dev
```

## Features

- 🤖 AI agent creation from social media profiles
- 💰 X402 micropayments for premium features
- 📊 Dynamic reputation scoring
- 🔍 ERC-8004 agent discovery
- 💬 Natural language chat interface
- 🔗 Social media integration (X/Twitter)
- 🌐 Multi-chain support (Polygon, Base)

