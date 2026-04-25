import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CaptainNavbar from "../components/CaptainNavbar";
import { io } from "socket.io-client";
import axios from "axios";
import { decodeAccessToken, getAccessToken } from "../helper/Token";
import { API_BASE_URL, apiUrl } from "../lib/apiUrl";

export default function CaptainDashboard() {
  const [ride, setRide] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rides, setRides] = useState([]);
  const [ridesLoading, setRidesLoading] = useState(true);
  const [ridesError, setRidesError] = useState("");
  const [completingRideId, setCompletingRideId] = useState(null);
  const socketRef = useRef(null);

  const captain = decodeAccessToken();
  const captainId = captain?._id;

  useEffect(() => {
    if (!captainId) return;

    const socketUrl =
      import.meta.env.VITE_SOCKET_URL || API_BASE_URL;

    socketRef.current = io(socketUrl, {
      withCredentials: false,
    });

    let locationInterval = null;

    socketRef.current.on("connect", () => {
      console.log("✅ Captain socket connected:", socketRef.current.id);

      // Register this captain's socket on the backend
      socketRef.current.emit("join", {
        userId: captainId,
        userType: "captain",
      });

      // ── Start sending live GPS location every 4 seconds ──
      // The backend stores this in MongoDB (GeoJSON format) so that
      // when a rider requests a ride, the $near geospatial query can
      // find this captain if they're within 10 km of the pickup.
      locationInterval = setInterval(() => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              socketRef.current.emit("update-location", {
                captainId,
                location: {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                },
              });
            },
            (err) => {
              console.warn("📍 Geolocation error:", err.message);
            },
            { enableHighAccuracy: true, timeout: 5000 }
          );
        }
      }, 4000);
    });

    // ── Listen for new ride requests broadcast by the backend ──
    // This fires when a rider creates a ride and this captain is
    // within 10 km, has matching vehicleType, and is available.
    socketRef.current.on("new-ride-request", (rideData) => {
      console.log("🚨 New Ride Request:", rideData);
      setRide(rideData);
    });

    socketRef.current.on("disconnect", () => {
      console.log("🔌 Captain socket disconnected");
    });

    return () => {
      if (locationInterval) {
        clearInterval(locationInterval);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [captainId]);

  const fetchCaptainRides = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setRides([]);
      setRidesLoading(false);
      setRidesError("Please log in to view ride history.");
      return;
    }

    setRidesLoading(true);
    setRidesError("");
    try {
      const res = await axios.get(
        apiUrl("/api/v1/rides/captain-rides"),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setRides(Array.isArray(res.data?.rides) ? res.data.rides : []);
    } catch (error) {
      console.error("Failed to load captain rides", error);
      const status = error?.response?.status;
      setRides([]);
      setRidesError(
        error?.response?.data?.message ||
          `Rides not available${status ? ` (HTTP ${status})` : ""}`
      );
    } finally {
      setRidesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!captainId) return;
    fetchCaptainRides();
  }, [captainId, fetchCaptainRides]);

  const handleAcceptRide = async () => {
    if (!ride?._id) return;
    setActionLoading(true);
    try {
      const token = getAccessToken();
      await axios.post(
        apiUrl("/api/v1/rides/confirm"),
        { rideId: ride._id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setRide(null);
      await fetchCaptainRides();
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
        apiUrl("/api/v1/rides/decline"),
        { rideId: ride._id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setRide(null);
      await fetchCaptainRides();
    } catch (error) {
      console.error("Decline ride failed", error);
      alert("Failed to decline ride. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteRide = async (rideId) => {
    if (!rideId || completingRideId) return;
    const token = getAccessToken();
    if (!token) {
      alert("Please log in again to complete rides.");
      return;
    }

    setCompletingRideId(rideId);
    try {
      await axios.post(
        apiUrl("/api/v1/rides/end-ride"),
        { rideId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      await fetchCaptainRides();
    } catch (error) {
      console.error("Complete ride failed", error);
      const msg =
        error?.response?.data?.message ||
        "Failed to complete ride. Please try again.";
      alert(msg);
    } finally {
      setCompletingRideId(null);
    }
  };

  const acceptedRides = useMemo(() => {
    return rides.filter((r) =>
      ["confirmed", "ongoing", "completed"].includes(r?.status)
    );
  }, [rides]);

  const stats = useMemo(() => {
    const completedRides = rides.filter((r) => r?.status === "completed");
    const totalCompleted = completedRides.length;
    const totalEarnings = completedRides.reduce((sum, r) => {
      const fare = Number(r?.fare);
      return Number.isFinite(fare) ? sum + fare : sum;
    }, 0);

    return {
      totalAccepted: acceptedRides.length,
      totalCompleted,
      totalEarnings,
    };
  }, [acceptedRides, rides]);

  const statusLabel = (status) => {
    if (!status) return "UNKNOWN";
    if (status === "confirmed") return "ACCEPTED";
    return status.toUpperCase();
  };

  return (
    <>
      <CaptainNavbar />

      <div className="min-h-screen bg-background px-4 py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
            <div className="flex items-start justify-center">
              {!ride ? (
                /* Waiting State */
                <div className="bg-card/70 p-8 rounded-[var(--radius)] border border-border/60 shadow-lg backdrop-blur text-center w-full max-w-sm">
                  <div className="flex justify-center mb-3">
                    <span className="h-3 w-3 bg-foreground rounded-full animate-pulse"></span>
                  </div>

                  <h2 className="text-lg font-semibold text-foreground">
                    You’re Online
                  </h2>

                  <p className="text-muted-foreground mt-2">
                    Waiting for ride requests...
                  </p>
                </div>
              ) : (
                /* Ride Request Card */
                <div className="bg-card/70 rounded-[var(--radius)] border border-border/60 shadow-lg w-full max-w-sm overflow-hidden backdrop-blur">
                  {/* Header */}
                  <div className="border-b border-border/60 p-4">
                    <h2 className="text-lg font-semibold">New Ride Request</h2>
                    <p className="text-sm text-muted-foreground">
                      Respond quickly to earn more 🚗
                    </p>
                  </div>

                  {/* Ride Details */}
                  <div className="p-5 space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Pickup</p>
                      <p className="font-medium text-foreground">
                        {ride.pickup}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">Destination</p>
                      <p className="font-medium text-foreground">
                        {ride.destination}
                      </p>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Vehicle</span>
                      <span className="px-3 py-1 text-sm rounded-full bg-muted text-foreground">
                        {ride.vehicleType}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 p-4 border-t border-border/60">
                    <button
                      type="button"
                      onClick={handleAcceptRide}
                      disabled={actionLoading}
                      className="flex-1 py-3 rounded-[var(--radius)] bg-foreground text-background font-semibold hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {actionLoading ? "Processing..." : "Accept"}
                    </button>

                    <button
                      type="button"
                      onClick={handleDeclineRide}
                      disabled={actionLoading}
                      className="flex-1 py-3 rounded-[var(--radius)] bg-destructive/20 text-destructive font-semibold hover:bg-destructive/30 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {actionLoading ? "Processing..." : "Decline"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-[var(--radius)] border border-border/60 bg-card/70 p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Accepted rides
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {stats.totalAccepted}
                </p>
              </div>
              <div className="rounded-[var(--radius)] border border-border/60 bg-card/70 p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Completed rides
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {stats.totalCompleted}
                </p>
              </div>
              <div className="rounded-[var(--radius)] border border-border/60 bg-card/70 p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Amount earned
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  ₹{stats.totalEarnings.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[var(--radius)] border border-border/60 bg-card/70 shadow-lg">
            <div className="border-b border-border/60 p-6">
              <h2 className="text-xl font-semibold text-foreground">
                Accepted rides history
              </h2>
              <p className="text-sm text-muted-foreground">
                Track accepted, ongoing, and completed rides.
              </p>
            </div>

            <div className="p-6">
              {ridesLoading ? (
                <p className="text-muted-foreground">Loading rides...</p>
              ) : ridesError ? (
                <p className="text-muted-foreground">{ridesError}</p>
              ) : acceptedRides.length === 0 ? (
                <p className="text-muted-foreground">
                  No accepted rides yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {acceptedRides.map((rideItem) => (
                    <div
                      key={rideItem?._id}
                      className="rounded-[var(--radius)] border border-border/60 bg-background/60 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">
                          {statusLabel(rideItem?.status)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {rideItem?.createdAt
                            ? new Date(rideItem.createdAt).toLocaleString()
                            : "-"}
                        </span>
                      </div>

                      <div className="mt-3 space-y-2 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Pickup</p>
                          <p className="font-medium text-foreground">
                            {rideItem?.pickup || "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Destination</p>
                          <p className="font-medium text-foreground">
                            {rideItem?.destination || "-"}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Fare</span>
                          <span className="font-semibold text-foreground">
                            {typeof rideItem?.fare === "number"
                              ? `₹${rideItem.fare}`
                              : "-"}
                          </span>
                        </div>
                      </div>

                      {(rideItem?.status === "ongoing" ||
                        rideItem?.status === "confirmed") && (
                        <button
                          type="button"
                          onClick={() => handleCompleteRide(rideItem._id)}
                          disabled={completingRideId === rideItem._id}
                          className="mt-4 w-full rounded-[var(--radius)] border border-foreground/20 bg-foreground text-background py-2 text-sm font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {completingRideId === rideItem._id
                            ? "Completing..."
                            : "Mark as Completed"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
