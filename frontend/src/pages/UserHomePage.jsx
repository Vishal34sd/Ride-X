import React, { useState, useRef, useEffect } from "react";
import Navbar from "../components/Navbar";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { io } from "socket.io-client";
import { decodeAccessToken } from "../helper/Token";
import useBookRide from "../hooks/useBookRide";
import { API_BASE_URL, apiUrl } from "../lib/apiUrl";

const defaultMarkerIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function UserHomePage() {
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");

  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);

  const pickupTimer = useRef(null);
  const destinationTimer = useRef(null);

  const [vehicleType, setVehicleType] = useState("");
  const [fareData, setFareData] = useState(null);
  const [showFareDetails, setShowFareDetails] = useState(false);
  const [fareLoading, setFareLoading] = useState(false);

  const [pickupCoords, setPickupCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);

  const [rideNotifications, setRideNotifications] = useState([]);
  const [currentRide, setCurrentRide] = useState(null);
  const [rideStatus, setRideStatus] = useState(null); // null | "pending" | "ongoing" | "confirmed" | "declined" | "completed"
  const [captainLocation, setCaptainLocation] = useState(null);
  const [captainDistance, setCaptainDistance] = useState(null);

  const mapRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const destinationMarkerRef = useRef(null);
  const routeRef = useRef(null);

  const socketRef = useRef(null);

  const { bookRide } = useBookRide();

  const user = decodeAccessToken();
  const userId = user?._id;

  const getFormStorageKey = () =>
    userId ? `ride_form_${userId}` : "ride_form_guest";

  const pushRideNotification = (notification) => {
    setRideNotifications((prev) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const next = [{ id, createdAt: Date.now(), ...notification }, ...prev];
      return next.slice(0, 5);
    });
  };

  const fetchSuggestions = async (query) => {
    try {
      const res = await axios.get(
        apiUrl("/api/v1/maps/get-suggestions"),
        { params: { input: query } }
      );
      return res.data.data || [];
    } catch (err) {
      console.log("Suggestion API Error:", err);
      return [];
    }
  };

  const handlePickupChange = (e) => {
    const value = e.target.value;
    setPickup(value);
    setFareData(null);
    setShowFareDetails(false);

    clearTimeout(pickupTimer.current);
    pickupTimer.current = setTimeout(async () => {
      if (value.length >= 3) {
        setPickupSuggestions(await fetchSuggestions(value));
      } else setPickupSuggestions([]);
    }, 400);
  };

  const handleDestinationChange = (e) => {
    const value = e.target.value;
    setDestination(value);
    setFareData(null);
    setShowFareDetails(false);

    clearTimeout(destinationTimer.current);
    destinationTimer.current = setTimeout(async () => {
      if (value.length >= 3) {
        setDestinationSuggestions(await fetchSuggestions(value));
      } else setDestinationSuggestions([]);
    }, 400);
  };

  // Load saved form values when user opens the page
  useEffect(() => {
    if (typeof window === "undefined") return;

    const key = getFormStorageKey();
    const raw = window.localStorage.getItem(key);
    if (!raw) return;

    try {
      const saved = JSON.parse(raw);
      if (saved.pickup) setPickup(saved.pickup);
      if (saved.destination) setDestination(saved.destination);
      if (saved.vehicleType) setVehicleType(saved.vehicleType);
    } catch (e) {
      console.error("Failed to parse saved ride form", e);
    }
  }, [userId]);

  // Persist form values whenever they change
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = getFormStorageKey();
    const data = {
      pickup,
      destination,
      vehicleType,
    };
    try {
      window.localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save ride form", e);
    }
  }, [pickup, destination, vehicleType, userId]);

  useEffect(() => {
    if (!userId) return;

    const socketUrl =
      import.meta.env.VITE_SOCKET_URL || API_BASE_URL;

    socketRef.current = io(socketUrl, {
      withCredentials: false,
    });

    socketRef.current.on("connect", () => {
      console.log("✅ User socket connected:", socketRef.current.id);

      socketRef.current.emit("join", {
        userId,
        userType: "user",
      });
    });

    socketRef.current.on("ride-confirmed", (rideData) => {
      console.log("✅ Ride confirmed for user:", rideData);
      pushRideNotification({ type: "confirmed", ride: rideData });
      setCurrentRide(rideData);
      setRideStatus("ongoing");
    });

    socketRef.current.on("ride-declined", (rideData) => {
      console.log("⚠️ Ride declined for user:", rideData);
      pushRideNotification({ type: "declined", ride: rideData });
      setRideStatus("declined");
    });

    socketRef.current.on("ride-ended", (rideData) => {
      console.log("🏁 Ride completed:", rideData);
      pushRideNotification({ type: "completed", ride: rideData });
      setRideStatus("completed");
      setCaptainLocation(null);
      setCaptainDistance(null);
    });

    socketRef.current.on("no-captains-available", (data) => {
      console.log("⚠️ No captains:", data);
      pushRideNotification({ type: "no-captains", ride: null });
      setRideStatus(null);
    });

    // Live captain location — calculate distance from captain to pickup
    socketRef.current.on("captain-location-update", (data) => {
      const { captainLocation: loc } = data;
      setCaptainLocation(loc);
      if (loc && pickupCoords) {
        const toRad = (deg) => (deg * Math.PI) / 180;
        const R = 6371;
        const dLat = toRad(loc.lat - pickupCoords.lat);
        const dLng = toRad(loc.lng - pickupCoords.lng);
        const a = Math.sin(dLat/2)**2 + Math.cos(toRad(pickupCoords.lat)) * Math.cos(toRad(loc.lat)) * Math.sin(dLng/2)**2;
        const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        setCaptainDistance(Math.round(dist * 10) / 10);
      }
    });

    socketRef.current.on("disconnect", () => {
      console.log("🔌 User socket disconnected");
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [userId]);


  useEffect(() => {
    const map = L.map("map").setView([28.6139, 77.209], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    return () => map.remove();
  }, []);

  useEffect(() => {
    if (!mapRef.current || !pickupCoords || !destinationCoords) return;

    const map = mapRef.current;

    if (pickupMarkerRef.current) map.removeLayer(pickupMarkerRef.current);
    if (destinationMarkerRef.current)
      map.removeLayer(destinationMarkerRef.current);
    if (routeRef.current) map.removeLayer(routeRef.current);

    pickupMarkerRef.current = L.marker(
      [pickupCoords.lat, pickupCoords.lng],
      { icon: defaultMarkerIcon }
    ).addTo(map);

    destinationMarkerRef.current = L.marker(
      [destinationCoords.lat, destinationCoords.lng],
      { icon: defaultMarkerIcon }
    ).addTo(map);

    routeRef.current = L.polyline(
      [
        [pickupCoords.lat, pickupCoords.lng],
        [destinationCoords.lat, destinationCoords.lng],
      ],
      { color: "blue", weight: 5 }
    ).addTo(map);

    map.fitBounds(routeRef.current.getBounds(), { padding: [50, 50] });
  }, [pickupCoords, destinationCoords]);

  const handleGetFare = async () => {
    if (fareLoading) return;
    if (!pickup || !destination || !vehicleType) {
      alert("Please fill pickup, destination & vehicle");
      return;
    }

    try {
      setFareLoading(true);
      const res = await axios.get(
        apiUrl("/api/v1/rides/get-fare"),
        {
          params: { pickup, destination, vehicleType },
        }
      );
      setFareData(res.data.fareData);
      setShowFareDetails(false);
    } catch (err) {
      const status = err?.response?.status;
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        (Array.isArray(err?.response?.data?.errors)
          ? err.response.data.errors.map((e) => e.msg).join(", ")
          : null) ||
        err?.message ||
        "Unknown error";

      console.error("Get fare failed:", {
        status,
        message,
        data: err?.response?.data,
      });

      alert(`Could not fetch fare${status ? ` (HTTP ${status})` : ""}: ${message}`);
    } finally {
      setFareLoading(false);
    }
  };

  const roundMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

  const getFareBreakdown = () => {
    if (!fareData || !vehicleType) return null;

    const fallbackBaseFareMap = {
      auto: 30,
      car: 50,
      motorcycle: 20,
    };

    const fallbackPerKmRateMap = {
      auto: 10,
      car: 15,
      motorcycle: 8,
    };

    const backendBaseFare = Number(fareData.baseFare);
    const backendPerKmRate = Number(fareData.perKmRate);

    const baseFare = Number.isFinite(backendBaseFare)
      ? backendBaseFare
      : (fallbackBaseFareMap[vehicleType] ?? 0);

    const perKmRate = Number.isFinite(backendPerKmRate)
      ? backendPerKmRate
      : (fallbackPerKmRateMap[vehicleType] ?? 0);

    const distanceKm = Number(fareData.distanceKm) || 0;

    // Prefer backend-provided numbers (exact), fallback to client calculation
    const backendDistanceCharge = Number(fareData.distanceCharge);
    const distanceCharge = Number.isFinite(backendDistanceCharge)
      ? backendDistanceCharge
      : perKmRate * distanceKm;

    const computedSubtotal = roundMoney(
      (Number.isFinite(baseFare) ? baseFare : 0) + distanceCharge
    );

    const backendSubtotal = Number(fareData.subtotal);
    const subtotal = Number.isFinite(backendSubtotal)
      ? roundMoney(backendSubtotal)
      : computedSubtotal;

    const total = roundMoney(fareData.fare);
    let taxesAndFees = roundMoney(total - subtotal);
    if (Math.abs(taxesAndFees) < 0.01) taxesAndFees = 0;

    return {
      baseFare: roundMoney(baseFare),
      perKmRate: roundMoney(perKmRate),
      distanceKm: roundMoney(distanceKm),
      distanceCharge: roundMoney(distanceCharge),
      subtotal,
      taxesAndFees,
      total,
    };
  };

   const handleBookRide = async () => {
    if (!fareData) return alert("Please fetch fare first.");

    try {
      const ride = await bookRide({
        pickup,
        destination,
        vehicleType,
      });

      setCurrentRide(ride);
      setRideStatus("pending");
      pushRideNotification({ type: "requested", ride });

      const totalMinutes = Math.floor(fareData.durationSeconds / 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      alert(
        `Ride booked!
Ride ID: ${ride._id}
Vehicle: ${vehicleType.toUpperCase()}
Fare: ₹${fareData.fare}
Distance: ${fareData.distanceKm.toFixed(2)} km
Time: ${hours > 0 ? `${hours} hr ${minutes} min` : `${minutes} min`}`
      );
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex bg-white">
        <div className="w-1/2 p-10">
          <div className="border border-gray-300 rounded-xl p-8 shadow-sm">
            <h2 className="text-3xl font-bold mb-2">Book your ride</h2>

            <div className="relative">
              <input
                type="text"
                placeholder="Pickup"
                value={pickup}
                onChange={handlePickupChange}
                className="w-full border px-4 py-3 rounded-lg mb-4"
              />
              {pickupSuggestions.length > 0 && (
                <div className="absolute w-full bg-white border rounded-lg shadow-md z-50">
                  {pickupSuggestions.map((item, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setPickup(item.name);
                        setPickupCoords({ lat: item.lat, lng: item.lng });
                        setPickupSuggestions([]);
                        setFareData(null);
                      }}
                      className="p-2 cursor-pointer hover:bg-gray-200"
                    >
                      {item.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Destination"
                value={destination}
                onChange={handleDestinationChange}
                className="w-full border px-4 py-3 rounded-lg mb-4"
              />
              {destinationSuggestions.length > 0 && (
                <div className="absolute w-full bg-white border rounded-lg shadow-md z-50">
                  {destinationSuggestions.map((item, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setDestination(item.name);
                        setDestinationCoords({ lat: item.lat, lng: item.lng });
                        setDestinationSuggestions([]);
                        setFareData(null);
                      }}
                      className="p-2 cursor-pointer hover:bg-gray-200"
                    >
                      {item.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <select
              value={vehicleType}
              onChange={(e) => {
                setVehicleType(e.target.value);
                setFareData(null);
                setShowFareDetails(false);
              }}
              className="w-full border px-4 py-3 rounded-lg mb-4"
            >
              <option value="">Select Vehicle</option>
		      <option value="motorcycle">Motorcycle</option>
              <option value="auto">Auto</option>
              <option value="car">Car</option>
            </select>

            <button
              onClick={handleGetFare}
              disabled={fareLoading}
              className={`w-full bg-black text-white py-3 rounded-lg mb-4 flex items-center justify-center gap-2 ${
                fareLoading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {fareLoading && (
                <span
                  className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                  aria-hidden="true"
                />
              )}
              {fareLoading ? "Fetching fare..." : "Get Fare"}
            </button>

            {fareData && (
              <div className="text-lg font-semibold space-y-2 mb-6">
                <p>
                  🚖 <b>Fare:</b>{" "}
                  <span className="text-green-600 text-xl font-bold">
                    ₹{fareData.fare}
                  </span>
                </p>
                <p>
                  📍 <b>Distance:</b> {fareData.distanceKm.toFixed(2)} km
                </p>
                <p>
                  ⏱ <b>Time:</b>{" "}
                  {(() => {
                    const totalMinutes = Math.floor(
                      fareData.durationSeconds / 60
                    );
                    const hours = Math.floor(totalMinutes / 60);
                    const minutes = totalMinutes % 60;
                    return hours > 0
                      ? `${hours} hr ${minutes} min`
                      : `${minutes} min`;
                  })()}
                </p>

                <button
                  type="button"
                  onClick={() => setShowFareDetails((v) => !v)}
                  className="text-sm underline text-gray-700"
                >
                  {showFareDetails ? "Hide fare details" : "View fare details"}
                </button>

                {showFareDetails && (() => {
                  const breakdown = getFareBreakdown();
                  if (!breakdown) return null;

                  return (
                    <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Fare calculation</span>
                        <span className="font-semibold">₹{breakdown.total}</span>
                      </div>

                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span>Base fare</span>
                          <span>₹{breakdown.baseFare}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span>
                            Distance charge (₹{breakdown.perKmRate}/km × {breakdown.distanceKm} km)
                          </span>
                          <span>₹{breakdown.distanceCharge}</span>
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                          <span>Subtotal</span>
                          <span>₹{breakdown.subtotal}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span>Taxes & fees</span>
                          <span>₹{breakdown.taxesAndFees}</span>
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-200 pt-2 font-semibold">
                          <span>Total</span>
                          <span>₹{breakdown.total}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* ── Live Ride Status Tracker ── */}
          {rideStatus && (
            <div className="mt-4 space-y-3">
              {/* Status indicator */}
              <div className={`rounded-xl border p-4 text-sm font-medium shadow-sm ${
                rideStatus === "pending" ? "border-yellow-200/70 bg-gradient-to-br from-yellow-50 via-yellow-100 to-yellow-200 text-yellow-900" :
                rideStatus === "ongoing" || rideStatus === "confirmed" ? "border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-200 text-emerald-900" :
                rideStatus === "declined" ? "border-rose-200/70 bg-gradient-to-br from-rose-50 via-rose-100 to-rose-200 text-rose-900" :
                "border-blue-200/70 bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 text-blue-900"
              }`}>
                {rideStatus === "pending" && <p>🔍 Searching for nearby captains...</p>}
                {(rideStatus === "ongoing" || rideStatus === "confirmed") && <p>🚗 Ride accepted! Captain is on the way.</p>}
                {rideStatus === "declined" && <p>❌ Ride rejected by captain. Please try again.</p>}
                {rideStatus === "completed" && <p>🏁 Ride completed! Thank you for riding.</p>}
              </div>

              {/* Captain distance tracker */}
              {(rideStatus === "ongoing" || rideStatus === "confirmed") && captainDistance !== null && (
                <div className="rounded-xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 to-white p-4">
                  <p className="text-xs uppercase tracking-wide text-emerald-700 mb-1">Captain is approximately</p>
                  <p className="text-2xl font-bold text-emerald-900">
                    {captainDistance} km <span className="text-sm font-normal">away</span>
                  </p>
                  {captainLocation && (
                    <p className="text-xs text-emerald-600 mt-1">
                      📍 Live: {captainLocation.lat.toFixed(4)}, {captainLocation.lng.toFixed(4)}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Ride Notifications ── */}
          {rideNotifications.length > 0 && (
            <div className="mt-4 space-y-3">
              {rideNotifications.map((item) => {
                const isPositive = item.type === "confirmed" || item.type === "requested";
                const baseStyle = isPositive
                  ? "border-emerald-200/70 text-emerald-900"
                  : "border-rose-200/70 text-rose-900";
                const gradientStyle = isPositive
                  ? "bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-200"
                  : "bg-gradient-to-br from-rose-50 via-rose-100 to-rose-200";

                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-4 text-sm font-medium shadow-sm ${baseStyle} ${gradientStyle}`}
                  >
                    {item.type === "confirmed" && (
                      <p>✅ Ride confirmed. Your captain is on the way.</p>
                    )}
                    {item.type === "requested" && (
                      <p>🚕 Ride requested. Matching you with nearby captains.</p>
                    )}
                    {item.type === "declined" && (
                      <p>❌ Ride rejected by captain. Please try again.</p>
                    )}
                    {item.type === "completed" && (
                      <p>🏁 Ride completed. Thank you for riding!</p>
                    )}
                    {item.type === "no-captains" && (
                      <p>⚠️ No captains available nearby. Try again shortly.</p>
                    )}
                    {item.ride?.pickup && item.ride?.destination && (
                      <p className="mt-2 text-xs opacity-80">
                        {item.ride.pickup} → {item.ride.destination}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {fareData && (
            <button
              onClick={handleBookRide}
              className="w-1/3 ml-52 mt-12 bg-black text-white py-4 rounded-xl text-lg font-bold shadow-md hover:bg-gray-900 transition"
            >
              Book Ride
            </button>
          )}
        </div>

        <div className="w-1/2 m-5 bg-gray-200 h-[605px] rounded-xl overflow-hidden">
          <div id="map" className="w-full h-full"></div>
        </div>
      </div>
    </>
  );
}
