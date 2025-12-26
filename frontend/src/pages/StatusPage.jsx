import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { getAccessToken } from "../helper/Token";

export default function StatusPage() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserRides = async () => {
      setLoading(true);
      setError("");

      const token = getAccessToken();
      if (!token) {
        setError("Please log in to view your ride status.");
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(
          "http://localhost:8080/api/v1/rides/user-rides",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setRides(res.data.rides || []);
      } catch (err) {
        console.error("Failed to load ride status", err);

        if (err.response) {
          if (err.response.status === 401) {
            setError("Please log in again to view your rides.");
          } else if (err.response.status === 404) {
            setError("API route not found. Restart backend or check URL.");
          } else {
            setError("Server error while loading ride status.");
          }
        } else {
          setError("Network error while loading ride status.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserRides();
  }, []);

  const statusLabel = (status) => {
    if (!status) return "Unknown";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const statusClasses = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-50 text-yellow-800 border border-yellow-200";
      case "confirmed":
      case "accepted":
        return "bg-green-50 text-green-800 border border-green-200";
      case "ongoing":
        return "bg-blue-50 text-blue-800 border border-blue-200";
      case "completed":
        return "bg-gray-50 text-gray-800 border border-gray-200";
      case "cancelled":
        return "bg-red-50 text-red-800 border border-red-200";
      default:
        return "bg-gray-50 text-gray-800 border border-gray-200";
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="w-full max-w-2xl bg-gray-50 border border-gray-200 rounded-2xl shadow-sm p-8">
          <h1 className="text-2xl font-bold mb-4 text-center">Your Rides</h1>

          {loading && (
            <p className="text-gray-500 text-sm text-center">Loading...</p>
          )}

          {!loading && error && (
            <p className="text-red-600 text-sm text-center mb-4">{error}</p>
          )}

          {!loading && !error && rides.length === 0 && (
            <p className="text-gray-500 text-sm text-center">No rides found.</p>
          )}

          {!loading && !error && rides.length > 0 && (
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2">
              {rides.map((ride) => (
                <div
                  key={ride._id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex justify-between items-start gap-4"
                >
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>
                      <span className="font-semibold">Pickup:</span> {ride.pickup}
                    </p>
                    <p>
                      <span className="font-semibold">Destination:</span> {ride.destination}
                    </p>
                    <p>
                      <span className="font-semibold">Vehicle:</span>{" "}
                      {ride.vehicleType?.charAt(0).toUpperCase() +
                        ride.vehicleType?.slice(1)}
                    </p>
                    {ride.fare && (
                      <p>
                        <span className="font-semibold">Fare:</span> ₹{ride.fare}
                      </p>
                    )}
                    {ride.createdAt && (
                      <p className="text-xs text-gray-500">
                        {new Date(ride.createdAt).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div
                    className={`rounded-full px-4 py-1 text-xs font-semibold whitespace-nowrap ${statusClasses(
                      ride.status
                    )}`}
                  >
                    {statusLabel(ride.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
