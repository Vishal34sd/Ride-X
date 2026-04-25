import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { io } from "socket.io-client";
import DashboardLayout from "../components/DashboardLayout";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { useToast } from "../components/ui/toast";
import { getAccessToken, decodeAccessToken } from "../helper/Token";
import { API_BASE_URL, apiUrl } from "../lib/apiUrl";

const rideOptions = [
  { id: "motorcycle", label: "Bike", eta: "2 min" },
  { id: "auto", label: "Auto", eta: "4 min" },
  { id: "car", label: "Cab", eta: "6 min" },
];

/**
 * Haversine formula — calculate distance between two lat/lng points in km.
 */
const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function RideBookingPage() {
  const { toast } = useToast();
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropSuggestions, setDropSuggestions] = useState([]);
  const [vehicle, setVehicle] = useState("car");
  const [loading, setLoading] = useState(false);
  const [fareLoading, setFareLoading] = useState(false);
  const [fareData, setFareData] = useState(null);
  const pickupTimer = useRef(null);
  const dropTimer = useRef(null);

  // ── Ride tracking state ──
  const [rideStatus, setRideStatus] = useState(null); // null | "pending" | "confirmed" | "ongoing" | "declined" | "completed"
  const [rideData, setRideData] = useState(null);
  const [captainLocation, setCaptainLocation] = useState(null);
  const [captainDistance, setCaptainDistance] = useState(null);
  const [pickupCoords, setPickupCoords] = useState(null);

  const socketRef = useRef(null);
  const user = decodeAccessToken();
  const userId = user?._id;

  // ── Socket.IO connection for real-time ride updates ──
  useEffect(() => {
    if (!userId) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || API_BASE_URL;
    socketRef.current = io(socketUrl, { withCredentials: false });

    socketRef.current.on("connect", () => {
      console.log("✅ Rider socket connected:", socketRef.current.id);
      socketRef.current.emit("join", { userId, userType: "user" });
    });

    // Captain accepted → ride is now ONGOING
    socketRef.current.on("ride-confirmed", (data) => {
      console.log("✅ Ride confirmed:", data);
      setRideStatus("ongoing");
      setRideData(data);
      toast({
        title: "Ride accepted!",
        description: `Captain ${data.captain?.fullname?.firstname || ""} is on the way.`,
      });
    });

    // Captain declined → ride is REJECTED
    socketRef.current.on("ride-declined", (data) => {
      console.log("❌ Ride declined:", data);
      setRideStatus("declined");
      setRideData(data);
      toast({
        title: "Ride declined",
        description: "The captain declined your ride. Please try again.",
        variant: "destructive",
      });
    });

    // Ride completed
    socketRef.current.on("ride-ended", (data) => {
      console.log("🏁 Ride ended:", data);
      setRideStatus("completed");
      setRideData(data);
      setCaptainLocation(null);
      setCaptainDistance(null);
      toast({ title: "Ride completed!", description: "Thanks for riding with Ride-X." });
    });

    // No captains found nearby
    socketRef.current.on("no-captains-available", (data) => {
      console.log("⚠️ No captains:", data);
      setRideStatus(null);
      toast({
        title: "No drivers nearby",
        description: data.message || "Please try again shortly.",
        variant: "destructive",
      });
    });

    // Live captain location updates (forwarded from backend every 4s)
    // Only update location and distance — do NOT override rideStatus here,
    // because that causes the entire status panel to re-animate every 4 seconds.
    socketRef.current.on("captain-location-update", (data) => {
      const { captainLocation: loc } = data;
      setCaptainLocation(loc);

      // Calculate distance if we have pickup coordinates
      if (loc && pickupCoords) {
        const dist = haversineDistance(
          loc.lat, loc.lng,
          pickupCoords.lat, pickupCoords.lng
        );
        setCaptainDistance(Math.round(dist * 10) / 10); // round to 1 decimal
      }
    });

    socketRef.current.on("disconnect", () => {
      console.log("🔌 Rider socket disconnected");
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [userId]);

  // Re-calculate distance when pickupCoords change
  useEffect(() => {
    if (captainLocation && pickupCoords) {
      const dist = haversineDistance(
        captainLocation.lat, captainLocation.lng,
        pickupCoords.lat, pickupCoords.lng
      );
      setCaptainDistance(Math.round(dist * 10) / 10);
    }
  }, [pickupCoords, captainLocation]);

  const fetchSuggestions = async (query) => {
    try {
      const res = await axios.get(apiUrl("/api/v1/maps/get-suggestions"), {
        params: { input: query },
      });
      return res.data?.data || [];
    } catch (error) {
      console.error("Suggestion API error", error);
      return [];
    }
  };

  const handlePickupChange = (event) => {
    const value = event.target.value;
    setPickup(value);
    setFareData(null);
    clearTimeout(pickupTimer.current);
    pickupTimer.current = setTimeout(async () => {
      if (value.length >= 3) setPickupSuggestions(await fetchSuggestions(value));
      else setPickupSuggestions([]);
    }, 400);
  };

  const handleDropChange = (event) => {
    const value = event.target.value;
    setDrop(value);
    setFareData(null);
    clearTimeout(dropTimer.current);
    dropTimer.current = setTimeout(async () => {
      if (value.length >= 3) setDropSuggestions(await fetchSuggestions(value));
      else setDropSuggestions([]);
    }, 400);
  };

  const fare = useMemo(() => {
    if (!fareData?.fare) return "--";
    return `₹${Number(fareData.fare).toFixed(2)}`;
  }, [fareData]);

  const handleGetFare = async () => {
    if (!pickup || !drop || !vehicle) {
      toast({ title: "Missing details", description: "Add pickup, drop-off, and vehicle type.", variant: "destructive" });
      return;
    }
    setFareLoading(true);
    try {
      const res = await axios.get(apiUrl("/api/v1/rides/get-fare"), {
        params: { pickup, destination: drop, vehicleType: vehicle },
      });
      setFareData(res.data?.fareData || null);
    } catch (error) {
      console.error("Fare calculation failed", error);
      setFareData(null);
      toast({ title: "Fare unavailable", description: "We could not calculate a fare for this route.", variant: "destructive" });
    } finally {
      setFareLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!pickup || !drop) {
      toast({ title: "Missing details", description: "Add pickup and drop-off locations to continue.", variant: "destructive" });
      return;
    }
    const token = getAccessToken();
    if (!token) {
      toast({ title: "Login required", description: "Please log in to book a ride.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        apiUrl("/api/v1/rides/create"),
        { pickup, destination: drop, vehicleType: vehicle },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRideStatus("pending");
      setRideData(res.data?.ride || null);

      // Geocode pickup to get coordinates for distance calculations
      try {
        const geoRes = await axios.get(apiUrl("/api/v1/maps/get-coordinates"), {
          params: { address: pickup },
        });
        if (geoRes.data?.lat && geoRes.data?.lng) {
          setPickupCoords({ lat: geoRes.data.lat, lng: geoRes.data.lng });
        }
      } catch {
        // If geocode fails, try to parse from suggestions or skip
      }

      toast({ title: "Ride requested", description: "Matching you with the best driver nearby." });
    } catch (error) {
      console.error("Ride booking failed", error);
      toast({
        title: "Booking failed",
        description: error?.response?.data?.message || "Unable to book this ride.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetRide = () => {
    setRideStatus(null);
    setRideData(null);
    setCaptainLocation(null);
    setCaptainDistance(null);
    setPickupCoords(null);
  };

  // ── Status display helpers ──
  const statusConfig = {
    pending: { label: "Searching for drivers...", color: "text-yellow-400", icon: "🔍", pulse: true },
    ongoing: { label: "Captain is on the way", color: "text-emerald-400", icon: "🚗", pulse: true },
    confirmed: { label: "Ride confirmed", color: "text-emerald-400", icon: "✅", pulse: false },
    declined: { label: "Ride rejected", color: "text-red-400", icon: "❌", pulse: false },
    completed: { label: "Ride completed", color: "text-blue-400", icon: "🏁", pulse: false },
  };

  const currentStatus = statusConfig[rideStatus] || null;

  return (
    <DashboardLayout title="Book a ride" description="Configure the ride details and confirm instantly.">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="bg-card/70 backdrop-blur">
          <CardHeader>
            <CardTitle>Ride details</CardTitle>
            <CardDescription>Provide pickup, destination, and your preferred ride type.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Input value={pickup} onChange={handlePickupChange} placeholder="Pickup location" className="pr-10" />
              {pickup ? (
                <button
                  type="button"
                  aria-label="Clear pickup location"
                  onClick={() => { setPickup(""); setPickupSuggestions([]); setFareData(null); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition hover:text-foreground"
                >X</button>
              ) : null}
              {pickupSuggestions.length > 0 && (
                <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-[var(--radius)] border border-border/60 bg-card shadow-lg">
                  {pickupSuggestions.map((item) => (
                    <button
                      type="button"
                      key={item.name}
                      onClick={() => {
                        setPickup(item.name);
                        setPickupCoords({ lat: item.lat, lng: item.lng });
                        setPickupSuggestions([]);
                      }}
                      className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-muted"
                    >{item.name}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <Input value={drop} onChange={handleDropChange} placeholder="Drop-off location" className="pr-10" />
              {drop ? (
                <button
                  type="button"
                  aria-label="Clear drop-off location"
                  onClick={() => { setDrop(""); setDropSuggestions([]); setFareData(null); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition hover:text-foreground"
                >X</button>
              ) : null}
              {dropSuggestions.length > 0 && (
                <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-[var(--radius)] border border-border/60 bg-card shadow-lg">
                  {dropSuggestions.map((item) => (
                    <button
                      type="button"
                      key={item.name}
                      onClick={() => { setDrop(item.name); setDropSuggestions([]); }}
                      className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-muted"
                    >{item.name}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {rideOptions.map((option) => (
                <motion.button
                  key={option.id}
                  type="button"
                  onClick={() => { setVehicle(option.id); setFareData(null); }}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  className={
                    option.id === vehicle
                      ? "rounded-[var(--radius)] border border-border bg-foreground text-background p-4 text-left shadow"
                      : "rounded-[var(--radius)] border border-border/60 bg-card/60 p-4 text-left text-foreground shadow-sm"
                  }
                >
                  <p className="text-sm font-semibold">{option.label}</p>
                  <p className="text-xs text-muted-foreground">ETA {option.eta}</p>
                </motion.button>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius)] border border-border/60 bg-muted/60 p-4">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Estimated fare</p>
                <motion.p key={fare} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-semibold">
                  {fare}
                </motion.p>
              </div>
              <Badge variant="outline">AI optimized</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="outline" onClick={handleGetFare} disabled={fareLoading}>
                {fareLoading ? "Calculating..." : "Calculate fare"}
              </Button>
              <Button className="w-full" onClick={handleConfirm} disabled={loading || rideStatus === "pending" || rideStatus === "ongoing"}>
                {loading ? "Confirming..." : rideStatus === "pending" ? "Searching..." : "Confirm booking"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── RIGHT PANEL — Live Ride Tracking ── */}
        <div className="space-y-6">
          <Card className="bg-card/70 backdrop-blur">
            <CardHeader>
              <CardTitle>Ride status</CardTitle>
              <CardDescription>Live updates on your current ride.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <AnimatePresence mode="wait">
                {!rideStatus ? (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded-[var(--radius)] border border-border/60 bg-card/60 p-6 text-center"
                  >
                    <p className="text-3xl mb-2">🚕</p>
                    <p className="text-sm text-muted-foreground">
                      Book a ride to see live tracking here.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="active"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {/* Status Badge */}
                    <div className={`rounded-[var(--radius)] border p-4 ${
                      rideStatus === "declined" ? "border-red-500/40 bg-red-500/10" :
                      rideStatus === "completed" ? "border-blue-500/40 bg-blue-500/10" :
                      "border-emerald-500/40 bg-emerald-500/10"
                    }`}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{currentStatus?.icon}</span>
                        <div>
                          <p className={`font-semibold ${currentStatus?.color}`}>
                            {currentStatus?.label}
                          </p>
                          {currentStatus?.pulse && (
                            <span className="inline-block mt-1 h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Captain Distance Tracker — shows when ride is confirmed/ongoing */}
                    {(rideStatus === "ongoing" || rideStatus === "confirmed") && captainDistance !== null && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-[var(--radius)] border border-border/60 bg-gradient-to-br from-card/80 to-muted/40 p-5"
                      >
                        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                          Captain is approximately
                        </p>
                        <motion.p
                          key={captainDistance}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-3xl font-bold text-foreground"
                        >
                          {captainDistance} km <span className="text-base font-normal text-muted-foreground">away</span>
                        </motion.p>
                        {captainLocation && (
                          <p className="text-xs text-muted-foreground mt-2">
                            📍 Live: {captainLocation.lat.toFixed(4)}, {captainLocation.lng.toFixed(4)}
                          </p>
                        )}
                      </motion.div>
                    )}

                    {/* Captain Info — shows after acceptance */}
                    {rideData?.captain && (rideStatus === "ongoing" || rideStatus === "confirmed") && (
                      <div className="rounded-[var(--radius)] border border-border/60 bg-card/60 p-4">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Your captain</p>
                        <p className="font-semibold text-foreground">
                          {rideData.captain.fullname?.firstname} {rideData.captain.fullname?.lastname}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {rideData.captain.vehicles?.vehicleType?.toUpperCase()} • {rideData.captain.vehicles?.plate}
                        </p>
                      </div>
                    )}

                    {/* Ride Rejected — show retry button */}
                    {rideStatus === "declined" && (
                      <div className="space-y-3">
                        <div className="rounded-[var(--radius)] border border-red-500/30 bg-red-500/5 p-4">
                          <p className="text-sm text-red-400">
                            The captain declined your ride request. This can happen when captains are busy.
                          </p>
                        </div>
                        <Button variant="outline" className="w-full" onClick={handleResetRide}>
                          Try booking again
                        </Button>
                      </div>
                    )}

                    {/* Ride Completed */}
                    {rideStatus === "completed" && (
                      <div className="space-y-3">
                        <div className="rounded-[var(--radius)] border border-blue-500/30 bg-blue-500/5 p-4">
                          <p className="text-sm text-blue-400">
                            Your ride has been completed. Thank you for choosing Ride-X! 🎉
                          </p>
                        </div>
                        <Button variant="outline" className="w-full" onClick={handleResetRide}>
                          Book another ride
                        </Button>
                      </div>
                    )}

                    {/* Ride details */}
                    {rideData && (
                      <div className="rounded-[var(--radius)] border border-border/60 bg-card/60 p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Pickup</span>
                          <span className="text-foreground font-medium text-right max-w-[60%] truncate">
                            {rideData.pickup}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Destination</span>
                          <span className="text-foreground font-medium text-right max-w-[60%] truncate">
                            {rideData.destination}
                          </span>
                        </div>
                        {rideData.fare && (
                          <div className="flex justify-between text-sm border-t border-border/40 pt-2 mt-2">
                            <span className="text-muted-foreground">Fare</span>
                            <span className="text-foreground font-semibold">₹{rideData.fare}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          <Card className="bg-card/70 backdrop-blur">
            <CardHeader>
              <CardTitle>Smart suggestions</CardTitle>
              <CardDescription>AI-powered tips to save time.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Try shifting pickup by 2 minutes to reduce fare by 8%.</p>
              <p>Book with a Bike to reach the destination 3 minutes faster.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
