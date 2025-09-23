// hooks/useProfile.ts
import { useEffect, useState } from "react";
import privateApi from "@/api";

interface Profile {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
}

export function useAuth() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await privateApi.get("/api/auth/profile/");
        const userData = response.data;

        const userProfile: Profile = {
          id: userData.id,
          name:
            userData.full_name ||
            userData.username ||
            userData.email ||
            "User",
          username: userData.username || "",
          profile_image_url: userData.profile_image_url,
        };

        setProfile(userProfile);
      } catch (error) {
        console.error("Profile fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return { profile, loading };
}
