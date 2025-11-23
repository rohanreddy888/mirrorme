const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export interface Profile {
  id: string;
  user_id: string;
  name: string | null;
  description: string | null;
  x_username: string | null;
  agent_id: string | null;
  image: string | null;
  created_at: string;
  updated_at: string;
}

export interface TwitterProfileData {
  name: string | null;
  description: string | null;
  image: string | null;
  username: string;
}

export interface CreateProfileRequest {
  user_id: string;
  name?: string;
  description?: string;
  x_username?: string;
  agent_id?: string | null;
  image?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  description?: string;
  x_username?: string;
  agent_id?: string | null;
}

export interface ProfileResponse {
  profile: Profile;
  message?: string;
}

class ProfileApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${BACKEND_URL}/api/profile`;
  }

  /**
   * Get profile by user ID
   */
  async getProfile(userId: string): Promise<Profile> {
    const response = await fetch(`${this.baseUrl}/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Profile not found");
      }
      const error = await response.json().catch(() => ({ error: "Failed to fetch profile" }));
      throw new Error(error.message || error.error || "Failed to fetch profile");
    }

    const data: ProfileResponse = await response.json();
    return data.profile;
  }

  /**
   * Create or update profile (upsert)
   */
  async createOrUpdateProfile(request: CreateProfileRequest): Promise<Profile> {
    const response = await fetch(`${this.baseUrl}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Failed to save profile" }));
      throw new Error(error.message || error.error || "Failed to save profile");
    }

    const data: ProfileResponse = await response.json();
    return data.profile;
  }

  /**
   * Update profile by user ID
   */
  async updateProfile(userId: string, request: UpdateProfileRequest): Promise<Profile> {
    const response = await fetch(`${this.baseUrl}/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Profile not found");
      }
      const error = await response.json().catch(() => ({ error: "Failed to update profile" }));
      throw new Error(error.message || error.error || "Failed to update profile");
    }

    const data: ProfileResponse = await response.json();
    return data.profile;
  }

  /**
   * Update agent ID for a profile
   */
  async updateAgentId(userId: string, agentId: string | null): Promise<Profile> {
    const response = await fetch(`${this.baseUrl}/${userId}/agent`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ agent_id: agentId }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Profile not found");
      }
      const error = await response.json().catch(() => ({ error: "Failed to update agent ID" }));
      throw new Error(error.message || error.error || "Failed to update agent ID");
    }

    const data: ProfileResponse = await response.json();
    return data.profile;
  }

  /**
   * Delete profile by user ID
   */
  async deleteProfile(userId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${userId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Failed to delete profile" }));
      throw new Error(error.message || error.error || "Failed to delete profile");
    }
  }

  /**
   * Get profile by agent ID
   */
  async getProfileByAgentId(agentId: string): Promise<Profile> {
    const response = await fetch(`${this.baseUrl}/agent/${agentId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Profile not found");
      }
      const error = await response.json().catch(() => ({ error: "Failed to fetch profile" }));
      throw new Error(error.message || error.error || "Failed to fetch profile");
    }

    const data: ProfileResponse = await response.json();
    return data.profile;
  }

  /**
   * Fetch Twitter profile data by username
   */
  async getTwitterProfile(username: string): Promise<TwitterProfileData> {
    const response = await fetch(`${this.baseUrl}/twitter/${username}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Failed to fetch Twitter profile" }));
      throw new Error(error.message || error.error || "Failed to fetch Twitter profile");
    }

    return await response.json();
  }
}

export const profileApi = new ProfileApiClient();

