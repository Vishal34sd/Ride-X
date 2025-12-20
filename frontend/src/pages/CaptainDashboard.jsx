import React, { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import { io } from "socket.io-client";
import axios from "axios";
import { decodeAccessToken, getAccessToken } from "../helper/Token";

export default function CaptainDashboard() {
  const [ride, setRide] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const socketRef = useRef(null);

  const captain = decodeAccessToken();
  const captainId = captain?._id;

  useEffect(() => {
    if (!captainId) return;

    const socketUrl =
      import.meta.env.VITE_SOCKET_URL || "http://localhost:8080";

    socketRef.current = io(socketUrl, {
      withCredentials: false,
    });

    socketRef.current.on("connect", () => {
      console.log("✅ Captain socket connected:", socketRef.current.id);

      socketRef.current.emit("join", {
        userId: captainId,
        userType: "captain",
      });
    });

    socketRef.current.on("ride-confirmed", (rideData) => {
      console.log("🚨 New Ride Request:", rideData);
      setRide(rideData);
    });

    socketRef.current.on("disconnect", () => {
      console.log("🔌 Captain socket disconnected");
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [captainId]);

  const handleAcceptRide = async () => {
    if (!ride?._id) return;
    setActionLoading(true);
    try {
      const token = getAccessToken();
      await axios.post(
        "http://localhost:8080/api/v1/rides/confirm",
        { rideId: ride._id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setRide(null);
    } catch (error) {
      console.error("Accept ride failed", error);
      alert("Failed to accept ride. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineRide = async () => {
    if (!ride?._id) return;
    setActionLoading(true);
    try {
      const token = getAccessToken();
      await axios.post(
        "http://localhost:8080/api/v1/rides/decline",
        { rideId: ride._id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setRide(null);
    } catch (error) {
      console.error("Decline ride failed", error);
      alert("Failed to decline ride. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        {!ride ? (
          /* Waiting State */
          <div className="bg-white p-8 rounded-xl shadow-md text-center w-full max-w-sm">
            <div className="flex justify-center mb-3">
              <span className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></span>
            </div>

            <h2 className="text-lg font-semibold text-gray-800">
              You’re Online
            </h2>

            <p className="text-gray-500 mt-2">
              Waiting for ride requests...
            </p>
          </div>
        ) : (
          /* Ride Request Card */
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm overflow-hidden">
            {/* Header */}
            <div className="bg-black text-white p-4">
              <h2 className="text-lg font-semibold">New Ride Request</h2>
              <p className="text-sm text-gray-300">
                Respond quickly to earn more 🚗
              </p>
            </div>

            {/* Ride Details */}
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs text-gray-500">Pickup</p>
                <p className="font-medium text-gray-800">
                  {ride.pickup}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Destination</p>
                <p className="font-medium text-gray-800">
                  {ride.destination}
                </p>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Vehicle</span>
                <span className="px-3 py-1 text-sm rounded-full bg-gray-200 text-gray-800">
                  {ride.vehicleType}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 p-4 border-t">
              <button
                type="button"
                onClick={handleAcceptRide}
                disabled={actionLoading}
                className="flex-1 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {actionLoading ? "Processing..." : "Accept"}
              </button>

              <button
                type="button"
                onClick={handleDeclineRide}
                disabled={actionLoading}
                className="flex-1 py-3 rounded-xl bg-red-100 text-red-600 font-semibold hover:bg-red-200 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {actionLoading ? "Processing..." : "Decline"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
