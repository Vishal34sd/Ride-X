import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  decodeAccessToken,
  getAccessToken,
  removeAccessToken,
} from "../helper/Token";

const CaptainNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const captainToken = getAccessToken();
  const decoded = decodeAccessToken();

  const [captainProfile, setCaptainProfile] = useState(null);
  const [totalRides, setTotalRides] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const storedRole = localStorage.getItem("role");
  const isCaptain = storedRole === "captain" || Boolean(captainProfile);

  const isActive = (path) =>
    location.pathname === path
      ? "bg-foreground text-background"
      : "hover:bg-muted";

  const initials = () => {
    const name =
      captainProfile?.fullname?.firstname ||
      captainProfile?.fullname?.lastname ||
      "C";
    return name.charAt(0).toUpperCase();
  };

  const avatarSeed = captainProfile?._id || decoded?._id || "captain";
  const avatarUrl = `https://api.dicebear.com/8.x/thumbs/svg?seed=${encodeURIComponent(
    avatarSeed
  )}`;

  useEffect(() => {
    if (!captainToken) {
      setCaptainProfile(null);
      setTotalRides(null);
      return;
    }

    const headers = {
      Authorization: `Bearer ${captainToken}`,
    };

    const fetchCaptain = async () => {
      try {
        const [profileRes, statsRes] = await Promise.all([
          axios.get("http://localhost:8080/api/v1/captains/profile", {
            headers,
          }),
          axios.get("http://localhost:8080/api/v1/rides/captain-stats", {
            headers,
          }),
        ]);

        setCaptainProfile(profileRes.data?.captain || null);
        setTotalRides(
          typeof statsRes.data?.totalRides === "number"
            ? statsRes.data.totalRides
            : null
        );
      } catch (e) {
        console.error("Failed to load captain navbar data", e);

        const status = e?.response?.status;
        if (status === 401 || status === 403) {
          removeAccessToken();
          localStorage.removeItem("role");
          navigate("/login");
          return;
        }

        setCaptainProfile(null);
        setTotalRides(null);
      }
    };

    fetchCaptain();
  }, [captainToken, navigate]);

  const handleCaptainLogout = async () => {
    if (!captainToken) return;

    setLoggingOut(true);
    try {
      if (captainToken) {
        await axios.get("http://localhost:8080/api/v1/captains/logout", {
          headers: {
            Authorization: `Bearer ${captainToken}`,
          },
          withCredentials: true,
        });
      }
    } catch (e) {
      console.error("Captain logout failed", e);
    } finally {
      removeAccessToken();
      localStorage.removeItem("role");
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
            to="/homepage-captain"
            className={`${isActive(
              "/homepage-captain"
            )} rounded-full px-4 py-2 transition`}
          >
            Dashboard
          </Link>

          <Link
            to="/captain/rides"
            className={`${isActive(
              "/captain/rides"
            )} rounded-full border border-border/60 px-4 py-2 transition`}
          >
            All rides{typeof totalRides === "number" ? ` (${totalRides})` : ""}
          </Link>
        </div>

        <div className="ml-auto flex items-center space-x-3 text-sm">
          {isCaptain && (
            <Link
              to="/captain/profile"
              className="flex items-center gap-2 rounded-full px-3 py-1 hover:bg-muted transition"
            >
              <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-bold">
                <img
                  src={avatarUrl}
                  alt="Captain avatar"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
                <span className="absolute text-xs">{initials()}</span>
              </div>
              <span className="text-sm font-medium">
                {captainProfile?.fullname?.firstname || "Captain"}
              </span>
            </Link>
          )}

          {isCaptain && (
            <button
              type="button"
              onClick={handleCaptainLogout}
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

export default CaptainNavbar;
