import React, { useState, useRef, useEffect } from "react";
import Navbar from "../components/Navbar";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function UserHome() {
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");

  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);

  const pickupTimer = useRef(null);
  const destinationTimer = useRef(null);

  const [vehicleType, setVehicleType] = useState(""); 
  const [fare, setFare] = useState(null);

  const [riderType, setRiderType] = useState("me");

  // 📌 Auto-suggestion API
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

  // 📌 PICKUP change handler
  const handlePickupChange = (e) => {
    const value = e.target.value;
    setPickup(value);
    clearTimeout(pickupTimer.current);

    pickupTimer.current = setTimeout(async () => {
      if (value.length >= 3) {
        const results = await fetchSuggestions(value);
        setPickupSuggestions(results.map((item) => item.name));
      } else {
        setPickupSuggestions([]);
      }
    }, 400);
  };

  // 📌 DESTINATION change handler
  const handleDestinationChange = (e) => {
    const value = e.target.value;
    setDestination(value);
    clearTimeout(destinationTimer.current);

    destinationTimer.current = setTimeout(async () => {
      if (value.length >= 3) {
        const results = await fetchSuggestions(value);
        setDestinationSuggestions(results.map((item) => item.name));
      } else {
        setDestinationSuggestions([]);
      }
    }, 400);
  };

  // ⭐ Initialize map
  useEffect(() => {
    const map = L.map("map").setView([28.6139, 77.2090], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    return () => map.remove();
  }, []);

  // ⭐ Get fare from BACKEND
  const handleGetFare = async () => {
    if (!pickup || !destination || !vehicleType) {
      alert("Please enter pickup, destination and select vehicle");
      return;
    }

    try {
      const res = await axios.get(
        "http://localhost:8080/api/v1/rides/get-fare",
        {
          params: {
            pickup,
            destination,
            vehicleType, // IMPORTANT FIX
          },
        }
      );

      console.log("FARE RESPONSE:", res.data);
      setFare(res.data.fareData); // FIXED
    } catch (error) {
      console.log("Fare Error:", error);
      alert("Could not fetch fare!");
    }
  };

  // ⭐ Book ride
  const handleBookRide = () => {
    if (!fare) return alert("Please fetch fare first.");

    alert(
      `Ride booked for ${
        riderType === "me" ? "YOU" : "SOMEONE ELSE"
      } — Vehicle: ${vehicleType.toUpperCase()} — Fare: ₹${fare}`
    );
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen flex bg-white">

        {/* LEFT PANEL */}
        <div className="w-1/2 p-10">
          <div className="border border-gray-300 rounded-xl p-8 shadow-sm">

            <h2 className="text-3xl font-bold mb-2">Book your ride</h2>
            <p className="text-gray-600 mb-6">Enter your trip details</p>

            {/* PICKUP */}
            <div className="relative">
              <input
                type="text"
                placeholder="Pickup location"
                value={pickup}
                onChange={handlePickupChange}
                className="w-full border border-gray-300 px-4 py-3 rounded-lg mb-4"
              />

              {pickupSuggestions.length > 0 && (
                <div className="absolute bg-white w-full border rounded-lg shadow-md z-50">
                  {pickupSuggestions.map((name, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setPickup(name);
                        setPickupSuggestions([]);
                      }}
                      className="p-2 hover:bg-gray-200 cursor-pointer"
                    >
                      {name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* DESTINATION */}
            <div className="relative">
              <input
                type="text"
                placeholder="Destination"
                value={destination}
                onChange={handleDestinationChange}
                className="w-full border border-gray-300 px-4 py-3 rounded-lg mb-4"
              />

              {destinationSuggestions.length > 0 && (
                <div className="absolute bg-white w-full border rounded-lg shadow-md z-50">
                  {destinationSuggestions.map((name, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setDestination(name);
                        setDestinationSuggestions([]);
                      }}
                      className="p-2 hover:bg-gray-200 cursor-pointer"
                    >
                      {name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SELECT VEHICLE */}
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="w-full border border-gray-300 px-4 py-3 rounded-lg mb-4"
            >
              <option value="">Select Vehicle</option>
              <option value="bike">Bike</option>
              <option value="auto">Auto</option>
              <option value="car">Car</option>
            </select>

            {/* GET FARE */}
            <button
              onClick={handleGetFare}
              className="w-full bg-black text-white py-3 rounded-lg mb-4 text-lg font-medium"
            >
              Get Fare
            </button>

            {/* DISPLAY FARE */}
            {fare !== null && (
              <div className="text-xl font-semibold mb-6">
                Estimated Fare: <span className="text-green-600">₹{fare}</span>
              </div>
            )}

            {/* BOOK BUTTON */}
            {fare !== null && (
              <button
                onClick={handleBookRide}
                className="w-full bg-black text-white py-3 rounded-lg text-lg font-medium"
              >
                Book Ride
              </button>
            )}
          </div>
        </div>

        {/* MAP */}
        <div className="w-1/2 bg-gray-200 m-5 h-[605px] rounded-xl overflow-hidden">
          <div id="map" className="w-full h-full"></div>
        </div>

      </div>
    </>
  );
}
