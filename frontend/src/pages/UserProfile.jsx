import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { getAccessToken } from "../helper/Token";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../lib/apiUrl";

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(apiUrl("/api/v1/users/profile"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(res.data.userProfile);
      } catch (err) {
        console.error("Failed to load profile", err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const getAvatarUrl = () => {
    if (!user) return "https://api.dicebear.com/8.x/thumbs/svg?seed=guest";
    const nameSeed =
      (user.fullname?.firstname || "User") +
      " " +
      (user.fullname?.lastname || "");
    return `https://api.dicebear.com/8.x/thumbs/svg?seed=${encodeURIComponent(
      nameSeed.trim() || user.email || user._id
    )}`;
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background flex justify-center px-4 py-10">
        <div className="w-full max-w-2xl rounded-[var(--radius)] border border-border/60 bg-card/70 p-8 shadow-lg backdrop-blur">
          {loading ? (
            <p className="text-center text-muted-foreground">Loading profile...</p>
          ) : error ? (
            <p className="text-center text-destructive">{error}</p>
          ) : !user ? (
            <p className="text-center text-muted-foreground">No user data found.</p>
          ) : (
            <>
              <div className="flex items-center gap-6 mb-8">
                <img
                  src={getAvatarUrl()}
                  alt="User avatar"
                  className="w-20 h-20 rounded-full border border-border/60 bg-muted object-cover"
                />
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {user.fullname?.firstname} {user.fullname?.lastname}
                  </h1>
                  <p className="text-muted-foreground text-sm">Ride-X rider account</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border border-border/60 rounded-[var(--radius)] p-4 flex justify-between items-center">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground tracking-wide">
                      Email
                    </p>
                    <p className="text-foreground font-medium">{user.email}</p>
                  </div>
                </div>

                <div className="border border-border/60 rounded-[var(--radius)] p-4 flex justify-between items-center">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground tracking-wide">
                      User ID
                    </p>
                    <p className="text-foreground font-mono text-sm truncate max-w-xs">
                      {user._id}
                    </p>
                  </div>
                </div>

                <div className="border border-border/60 rounded-[var(--radius)] p-4">
                  <p className="text-xs uppercase text-muted-foreground tracking-wide mb-1">
                    Account created
                  </p>
                  <p className="text-foreground text-sm">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleString()
                      : "Not available"}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
