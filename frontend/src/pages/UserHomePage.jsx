import React, { useState, useRef, useEffect } from "react";
import Navbar from "../components/Navbar";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { io } from "socket.io-client";
import { decodeAccessToken } from "../helper/Token";
import useBookRide from "../hooks/useBookRide";

export default function UserHomePage() {
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");

  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);

  const pickupTimer = useRef(null);
  const destinationTimer = useRef(null);

  const [vehicleType, setVehicleType] = useState("");
  const [fareData, setFareData] = useState(null);

  const [pickupCoords, setPickupCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);

  const [rideNotification, setRideNotification] = useState(null);

  const mapRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const destinationMarkerRef = useRef(null);
  const routeRef = useRef(null);

  const socketRef = useRef(null);

  const { bookRide } = useBookRide();

  const user = decodeAccessToken();
  const userId = user?._id;

  const fetchSuggestions = async (query) => {
    try {
      const res = await axios.get(
        "http://localhost:8080/api/v1/maps/get-suggestions",
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

    clearTimeout(destinationTimer.current);
    destinationTimer.current = setTimeout(async () => {
      if (value.length >= 3) {
        setDestinationSuggestions(await fetchSuggestions(value));
      } else setDestinationSuggestions([]);
    }, 400);
  };

  useEffect(() => {
    if (!userId) return;

    const socketUrl =
      import.meta.env.VITE_SOCKET_URL || "http://localhost:8080";

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
      setRideNotification({ type: "confirmed", ride: rideData });
    });

    socketRef.current.on("ride-declined", (rideData) => {
      console.log("⚠️ Ride declined for user:", rideData);
      setRideNotification({ type: "declined", ride: rideData });
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
    if (!rideNotification) return;

    const timer = setTimeout(() => {
      setRideNotification(null);
    }, 5000);

    return () => clearTimeout(timer);
  }, [rideNotification]);

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

    pickupMarkerRef.current = L.marker([
      pickupCoords.lat,
      pickupCoords.lng,
    ]).addTo(map);

    destinationMarkerRef.current = L.marker([
      destinationCoords.lat,
      destinationCoords.lng,
    ]).addTo(map);

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
    if (!pickup || !destination || !vehicleType) {
      alert("Please fill pickup, destination & vehicle");
      return;
    }

    try {
      const res = await axios.get(
        "http://localhost:8080/api/v1/rides/get-fare",
        {
          params: { pickup, destination, vehicleType },
        }
      );
      setFareData(res.data.fareData);
    } catch {
      alert("Could not fetch fare!");
    }
  };

   const handleBookRide = async () => {
    if (!fareData) return alert("Please fetch fare first.");

    try {
      const ride = await bookRide({
        pickup,
        destination,
        vehicleType,
      });

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
              className="w-full bg-black text-white py-3 rounded-lg mb-4"
            >
              Get Fare
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
              </div>
            )}
          </div>

          {rideNotification && (
            <div
              className={`mt-4 p-4 rounded-xl shadow-sm text-sm font-medium ${
                rideNotification.type === "confirmed"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {rideNotification.type === "confirmed" ? (
                <p>
                  ✅ Your ride has been <b>confirmed</b> by a captain.
                </p>
              ) : (
                <p>
                  ⚠️ Your ride was <b>declined</b>. Please try booking again.
                </p>
              )}
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
