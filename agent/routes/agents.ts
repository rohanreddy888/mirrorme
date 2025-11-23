import { Router, type Request, type Response } from "express";
import { SDK } from 'agent0-sdk';
import { CdpClient } from "@coinbase/cdp-sdk";


const router: Router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
        // TODO: Implement agent registration logic
        // Initialize SDK with IPFS and subgraph
        const name = req.body.name;
        const description = req.body.description;
        const image = req.body.image;
        const sdk = new SDK({
        chainId: 80002, // Base sepolia testnet
        signer: process.env.PAYMENT_PRIVATE_KEY,
        rpcUrl: "https://polygon-amoy.g.alchemy.com/v2/demo",
        ipfs: 'pinata',
        pinataJwt: process.env.PINATA_JWT,
        // Subgraph URL auto-defaults from DEFAULT_SUBGRAPH_URLS
        });
        
        const agent = sdk.createAgent(
          name,
          description,
          image,
        );
        agent.setActive(true);
        await agent.registerIPFS();
        

        res.json({result: { agentId: agent.agentId, name: name, description: description, image: image}, message: "Agent created successfully" });
  } catch (error) {
    console.error("Error in registration route:", error);
    res.status(500).json({ error: "Failed to process registration" });
  }
});


router.get("/", async (req: Request, res: Response) => {
  try {
    const sdk = new SDK({
        chainId: 80002, // Base sepolia testnet
        rpcUrl: "https://polygon-amoy.g.alchemy.com/v2/demo",
        // Subgraph URL auto-defaults from DEFAULT_SUBGRAPH_URLS
        });
        const result = await sdk.searchAgents({
          // active: true,
          owners: [process.env.OWNER_ADDRESS as `0x${string}`],
          chains: [80002, 84532]  // ETH Sepolia and Base Sepolia
        });
    res.json({ result: result.items });
  } catch (error) {
    console.error("Error in registration route:", error);
    res.status(500).json({ error: "Failed to process registration" });
  }
});

router.get("/:id/wallet", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: "ID is required" });
    }

    const cdp = new CdpClient();
    const accountCdp = await cdp.evm.getOrCreateAccount({
      name: id
    });

    res.json({ 
      id,
      address: accountCdp.address 
    });
  } catch (error) {
    console.error("Error getting CDP wallet address:", error);
    res.status(500).json({ error: "Failed to get wallet address" });
  }
});

router.patch("/:agentId/inactive", async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    
    if (!agentId) {
      return res.status(400).json({ error: "Agent ID is required" });
    }

    // Parse agentId format: "chainId:agentNumber"
    const [chainIdStr] = agentId.split(":");
    const chainId = parseInt(chainIdStr, 10);
    
    if (isNaN(chainId)) {
      return res.status(400).json({ error: "Invalid agent ID format. Expected format: chainId:agentNumber" });
    }

    const sdk = new SDK({
      chainId: chainId,
      signer: process.env.PAYMENT_PRIVATE_KEY,
      rpcUrl: "https://polygon-amoy.g.alchemy.com/v2/demo",
      ipfs: 'pinata',
      pinataJwt: process.env.PINATA_JWT,
      // Subgraph URL auto-defaults from DEFAULT_SUBGRAPH_URLS
    });


    // Try to get the agent and set it inactive
    // Note: getAgent may return AgentSummary (read-only) or Agent (mutable)
    // We'll try to call setActive if available
    try {
      const agent = await sdk.loadAgent(agentId);

      agent.setActive(false);
      await agent.registerIPFS();
      res.json({ message: "Agent set to inactive successfully" });
    } catch (error) {
      console.error("Error setting agent inactive:", error);
      res.status(500).json({ error: "Failed to set agent inactive" });
    }
  } catch (error) {
    console.error("Error setting agent inactive:", error);
    res.status(500).json({ error: "Failed to set agent inactive" });
  }
});

export default router;

