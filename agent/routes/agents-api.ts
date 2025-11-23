import { Router, type Request, type Response } from "express";
import { supabase } from "../lib/supabase.js";
import { z } from "zod";

const router: Router = Router();

// Schema for agent creation/update
const agentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  trust_score: z.number().min(0).max(100).optional(),
});

// GET /api/agents-api - Get all agents
router.get("/", async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .order("trust_score", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === "PGRST002") {
        console.error("Supabase connection error:", error);
        return res.status(503).json({ 
          error: "Database connection failed", 
          message: "Could not connect to Supabase. Please check your SUPABASE_URL and ensure your project is active.",
          hint: "Verify your Supabase URL format: https://[project-ref].supabase.co"
        });
      }
      console.error("Error fetching agents:", error);
      return res.status(500).json({ error: "Failed to fetch agents", details: error.message, code: error.code });
    }

    res.json({ agents: data || [] });
  } catch (error) {
    console.error("Error in GET agents route:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/agents-api/:id - Get agent by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Agent ID is required" });
    }

    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Agent not found" });
      }
      console.error("Error fetching agent:", error);
      return res.status(500).json({ error: "Failed to fetch agent", details: error.message });
    }

    res.json({ agent: data });
  } catch (error) {
    console.error("Error in GET agent route:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/agents-api - Create a new agent
router.post("/", async (req: Request, res: Response) => {
  try {
    const validationResult = agentSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid request data",
        details: validationResult.error.errors,
      });
    }

    const { name, description, trust_score } = validationResult.data;

    const { data, error } = await supabase
      .from("agents")
      .insert({
        name,
        description: description || null,
        trust_score: trust_score || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating agent:", error);
      return res.status(500).json({ error: "Failed to create agent", details: error.message });
    }

    res.status(201).json({ agent: data, message: "Agent created successfully" });
  } catch (error) {
    console.error("Error in POST agents route:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/agents-api/:id - Update agent
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validationResult = agentSchema.partial().safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid request data",
        details: validationResult.error.errors,
      });
    }

    const { name, description, trust_score } = validationResult.data;

    if (!id) {
      return res.status(400).json({ error: "Agent ID is required" });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (trust_score !== undefined) updateData.trust_score = trust_score;

    const { data, error } = await supabase
      .from("agents")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Agent not found" });
      }
      console.error("Error updating agent:", error);
      return res.status(500).json({ error: "Failed to update agent", details: error.message });
    }

    res.json({ agent: data, message: "Agent updated successfully" });
  } catch (error) {
    console.error("Error in PUT agents route:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/agents-api/:id/trust-score - Update trust score
router.patch("/:id/trust-score", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { trust_score } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Agent ID is required" });
    }

    if (trust_score === undefined || trust_score === null) {
      return res.status(400).json({ error: "Trust score is required" });
    }

    if (typeof trust_score !== "number" || trust_score < 0 || trust_score > 100) {
      return res.status(400).json({ error: "Trust score must be a number between 0 and 100" });
    }

    const { data, error } = await supabase
      .from("agents")
      .update({
        trust_score,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Agent not found" });
      }
      console.error("Error updating trust score:", error);
      return res.status(500).json({ error: "Failed to update trust score", details: error.message });
    }

    res.json({ agent: data, message: "Trust score updated successfully" });
  } catch (error) {
    console.error("Error in PATCH trust-score route:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/agents-api/:id - Delete agent
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Agent ID is required" });
    }

    const { error } = await supabase
      .from("agents")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting agent:", error);
      return res.status(500).json({ error: "Failed to delete agent", details: error.message });
    }

    res.json({ message: "Agent deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE agents route:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

