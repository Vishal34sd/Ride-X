import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { decodeAccessToken, getAccessToken, removeAccessToken } from "../helper/Token";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = decodeAccessToken();
  const [profile, setProfile] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const isActive = (path) =>
    location.pathname === path
      ? "bg-white text-black"
      : "hover:bg-gray-700";

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
    <nav className="w-full flex items-center px-8 py-4 border-b bg-black">
      <Link to="/" className="text-3xl font-bold tracking-tight text-white">
        Ride-X
      </Link>

      <div className="flex items-center space-x-6 text-[15px] text-white ml-10">
        <Link
          to="/homepage-user"
          className={`${isActive(
            "/homepage-user"
          )} rounded-full px-5 py-2 transition`}
        >
          Ride
        </Link>
        <Link
          to="/status"
          className={`${isActive(
            "/status"
          )} rounded-full px-5 py-2 transition`}
        >
          Status
        </Link>
        <button className="rounded-full px-5 py-2 hover:bg-gray-700 transition">
          Business
        </button>
        <button className="rounded-full px-5 py-2 hover:bg-gray-700 transition">
          Help
        </button>
      </div>

      <div className="flex items-center space-x-3 text-[15px] text-white ml-auto">
        <Link
          to="/profile"
          className="flex items-center gap-2 rounded-full px-3 py-1 hover:bg-gray-700 transition"
        >
          <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-black text-sm font-bold">
            <img
              src={avatarUrl}
              alt="Profile avatar"
              className="w-full h-full object-cover"
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
            className="text-sm rounded-full px-4 py-2 border border-gray-600 hover:bg-gray-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;