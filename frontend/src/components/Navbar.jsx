import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  decodeAccessToken,
  getAccessToken,
  removeAccessToken,
} from "../helper/Token";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = decodeAccessToken();
  const [profile, setProfile] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const isActive = (path) =>
    location.pathname === path
      ? "bg-foreground text-background"
      : "hover:bg-muted";

  const initials = () => {
    const name =
      profile?.fullname?.firstname || profile?.fullname?.lastname || "U";
    return name.charAt(0).toUpperCase();
  };

  const avatarSeed = profile?._id || user?._id || "guest";
  const avatarUrl = `https://api.dicebear.com/8.x/thumbs/svg?seed=${encodeURIComponent(
    avatarSeed
  )}`;

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setProfile(null);
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await axios.get(
          "http://localhost:8080/api/v1/users/profile",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setProfile(res.data.userProfile);
      } catch (e) {
        console.error("Failed to load navbar profile", e);
        setProfile(null);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    const token = getAccessToken();

    try {
      if (token) {
        await axios.get("http://localhost:8080/api/v1/users/logout", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        });
      }
    } catch (e) {
      console.error("Logout failed", e);
    } finally {
      removeAccessToken();
      setLoggingOut(false);
      navigate("/login");
    }
  };

  return (
    <nav className="w-full border-b border-border/60 bg-background/80 px-8 py-4 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center">
        <Link to="/" className="text-2xl font-semibold tracking-tight">
          Ride-X
        </Link>

        <div className="ml-10 hidden items-center space-x-3 text-sm text-muted-foreground md:flex">
          <Link
            to="/dashboard"
            className={`${isActive(
              "/dashboard"
            )} rounded-full px-4 py-2 transition`}
          >
            Dashboard
          </Link>
          <Link
            to="/book-ride"
            className={`${isActive(
              "/book-ride"
            )} rounded-full px-4 py-2 transition`}
          >
            Book Ride
          </Link>
          <Link
            to="/ride-history"
            className={`${isActive(
              "/ride-history"
            )} rounded-full px-4 py-2 transition`}
          >
            Ride History
          </Link>
        </div>

        <div className="ml-auto flex items-center space-x-3 text-sm">
          <Link
            to="/profile"
            className="flex items-center gap-2 rounded-full px-3 py-1 hover:bg-muted transition"
          >
            <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-bold">
              <img
                src={avatarUrl}
                alt="Profile avatar"
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
              <span className="absolute text-xs">{initials()}</span>
            </div>
            <span className="text-sm font-medium">
              {profile?.fullname?.firstname || "Profile"}
            </span>
          </Link>

          {profile && (
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-full border border-border/60 px-4 py-2 text-xs font-medium hover:bg-muted transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;