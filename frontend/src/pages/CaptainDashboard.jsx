import React, { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import io from "socket.io-client";
import { decodeAccessToken } from "../helper/Token";

export default function CaptainDashboard() {
  const [ride, setRide] = useState(null);
  const socketRef = useRef(null);

  const captain = decodeAccessToken();
  const captainId = captain?._id;

  useEffect(() => {
    if (!captainId) return;

    socketRef.current = io("http://localhost:8080", {
       withCredentials: false,
    });

    socketRef.current.emit("join", {
      userId: captainId,
      userType: "captain",
    });

    socketRef.current.on("ride-confirmed", (rideData) => {
      console.log("🚨 New Ride Request:", rideData);
      setRide(rideData);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [captainId]);

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        {!ride ? (
          <div className="bg-white p-6 rounded shadow">
            Waiting for ride requests...
          </div>
        ) : (
          <div className="bg-white p-6 rounded shadow w-[400px]">
            <h2 className="text-xl font-bold mb-3">New Ride Request</h2>
            <p><b>Pickup:</b> {ride.pickup}</p>
            <p><b>Destination:</b> {ride.destination}</p>
            <p><b>Vehicle:</b> {ride.vehicleType}</p>
          </div>
        )}
      </div>
    </>
  );
}
