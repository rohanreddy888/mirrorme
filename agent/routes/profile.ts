import { Router, type Request, type Response } from "express";
import { supabase } from "../lib/supabase.js";
import { z } from "zod";

const router: Router = Router();

// Schema for profile creation/update
const profileSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  x_username: z.string().optional(),
  agent_id: z.string().nullable().optional(),
  user_id: z.string().describe("User identifier (CDP user ID or X username)"),
});

// GET /api/profile/:userId - Get profile by user ID
router.get("/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        return res.status(404).json({ error: "Profile not found" });
      }
      if (error.code === "PGRST002") {
        console.error("Supabase connection error:", error);
        return res.status(503).json({ 
          error: "Database connection failed", 
          message: "Could not connect to Supabase. Please check your SUPABASE_URL and ensure your project is active.",
          hint: "Verify your Supabase URL format: https://[project-ref].supabase.co"
        });
      }
      console.error("Error fetching profile:", error);
      return res.status(500).json({ error: "Failed to fetch profile", details: error.message, code: error.code });
    }

    res.json({ profile: data });
  } catch (error) {
    console.error("Error in GET profile route:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/profile - Create or update profile
router.post("/", async (req: Request, res: Response) => {
  try {
    const validationResult = profileSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid request data",
        details: validationResult.error.errors,
      });
    }

    const { user_id, name, description, x_username, agent_id } = validationResult.data;

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user_id)
      .single();

    if (existingProfile) {
      // Update existing profile
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (x_username !== undefined) updateData.x_username = x_username;
      if (agent_id !== undefined) updateData.agent_id = agent_id;

      const { data, error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", user_id)
        .select()
        .single();

      if (error) {
        console.error("Error updating profile:", error);
        return res.status(500).json({ error: "Failed to update profile", details: error.message });
      }

      return res.json({ profile: data, message: "Profile updated successfully" });
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from("profiles")
        .insert({
          user_id,
          name: name || null,
          description: description || null,
          x_username: x_username || null,
          agent_id: agent_id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating profile:", error);
        return res.status(500).json({ error: "Failed to create profile", details: error.message });
      }

      return res.status(201).json({ profile: data, message: "Profile created successfully" });
    }
  } catch (error) {
    console.error("Error in POST profile route:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/profile/:userId - Update profile (partial update)
router.put("/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { name, description, x_username, agent_id } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (x_username !== undefined) updateData.x_username = x_username;
    if (agent_id !== undefined) updateData.agent_id = agent_id;

    const { data, error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Profile not found" });
      }
      console.error("Error updating profile:", error);
      return res.status(500).json({ error: "Failed to update profile", details: error.message });
    }

    res.json({ profile: data, message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error in PUT profile route:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/profile/:userId/agent - Update agent_id (for mirror option)
router.patch("/:userId/agent", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { agent_id } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!agent_id) {
      return res.status(400).json({ error: "Agent ID is required" });
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({
        agent_id,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Profile not found" });
      }
      console.error("Error updating agent_id:", error);
      return res.status(500).json({ error: "Failed to update agent_id", details: error.message });
    }

    res.json({ profile: data, message: "Agent ID updated successfully" });
  } catch (error) {
    console.error("Error in PATCH agent route:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/profile/:userId - Delete profile
router.delete("/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting profile:", error);
      return res.status(500).json({ error: "Failed to delete profile", details: error.message });
    }

    res.json({ message: "Profile deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE profile route:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

