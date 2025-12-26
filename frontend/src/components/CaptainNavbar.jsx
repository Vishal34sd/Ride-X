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
      ? "bg-white text-black"
      : "hover:bg-gray-700";

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
    <nav className="w-full flex items-center px-8 py-4 border-b bg-black">
      <Link to="/" className="text-3xl font-bold tracking-tight text-white">
        Ride-X
      </Link>

      <div className="flex items-center space-x-6 text-[15px] text-white ml-10">
        <Link
          to="/homepage-captain"
          className={`${isActive(
            "/homepage-captain"
          )} rounded-full px-5 py-2 transition`}
        >
          Dashboard
        </Link>

        

        <Link
          to="/captain/rides"
          className={`${isActive(
            "/captain/rides"
          )} rounded-full px-5 py-2 transition border border-gray-700`}
        >
          All rides{typeof totalRides === "number" ? ` (${totalRides})` : ""}
        </Link>
      </div>

      <div className="flex items-center space-x-3 text-[15px] text-white ml-auto">
        {isCaptain && (
          <Link
            to="/captain/profile"
            className="flex items-center gap-2 rounded-full px-3 py-1 hover:bg-gray-700 transition"
          >
            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-black text-sm font-bold">
              <img
                src={avatarUrl}
                alt="Captain avatar"
                className="w-full h-full object-cover"
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
            className="text-sm rounded-full px-4 py-2 border border-gray-600 hover:bg-gray-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        )}
      </div>
    </nav>
  );
};

export default CaptainNavbar;
