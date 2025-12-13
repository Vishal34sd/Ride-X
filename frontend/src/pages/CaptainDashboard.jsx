import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import io from "socket.io-client";

const socket = io("http://localhost:8080");

export default function CaptainDashboard() {
  const [rideRequests, setRideRequests] = useState([]);
  const [status, setStatus] = useState("Online – Waiting for rides");

  useEffect(() => {
    socket.emit("captain-online", {
      captainId: "CAPTAIN_123",
      vehicleType: "car",
    });

    socket.on("new-ride", (ride) => {
      setRideRequests((prev) => [ride, ...prev]);
      setStatus("New ride requests available");
    });

    return () => {
      socket.off("new-ride");
    };
  }, []);

  const acceptRide = (rideId) => {
    socket.emit("ride-accepted", {
      rideId,
      captainId: "CAPTAIN_123",
    });

    setRideRequests((prev) =>
      prev.filter((ride) => ride.rideId !== rideId)
    );
    setStatus("Ride accepted");
  };

  const rejectRide = (rideId) => {
    socket.emit("ride-rejected", {
      rideId,
      captainId: "CAPTAIN_123",
    });

    setRideRequests((prev) =>
      prev.filter((ride) => ride.rideId !== rideId)
    );
    setStatus("Ride rejected");
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 px-10 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Captain Dashboard</h2>
          <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
            {status}
          </span>
        </div>

        {/* Ride Requests */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rideRequests.length === 0 && (
            <div className="col-span-full text-center text-gray-500 mt-20">
              🚕 No ride requests yet
            </div>
          )}

          {rideRequests.map((ride) => (
            <div
              key={ride.rideId}
              className="bg-white rounded-xl shadow-md p-5 border hover:shadow-lg transition"
            >
              <h3 className="text-lg font-bold mb-2">
                Ride ID: {ride.rideId}
              </h3>

              <div className="space-y-1 text-sm">
                <p>
                  📍 <b>Pickup:</b> {ride.pickup}
                </p>
                <p>
                  🏁 <b>Destination:</b> {ride.destination}
                </p>
                <p>
                  📏 <b>Distance:</b> {ride.distanceKm} km
                </p>
                <p>
                  💰 <b>Fare:</b>{" "}
                  <span className="text-green-600 font-bold">
                    ₹{ride.fare}
                  </span>
                </p>
                <p>
                  🚘 <b>Vehicle:</b> {ride.vehicleType.toUpperCase()}
                </p>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => acceptRide(ride.rideId)}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700"
                >
                  Accept
                </button>

                <button
                  onClick={() => rejectRide(ride.rideId)}
                  className="flex-1 bg-red-500 text-white py-2 rounded-lg font-semibold hover:bg-red-600"
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
