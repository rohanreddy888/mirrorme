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

export default router;

