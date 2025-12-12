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
  const [fareData, setFareData] = useState(null);

  const [pickupCoords, setPickupCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);

  // 🔍 Suggestion API
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

  // 📌 Pickup input handler
  const handlePickupChange = (e) => {
    const value = e.target.value;
    setPickup(value);
    setFareData(null);

    clearTimeout(pickupTimer.current);
    pickupTimer.current = setTimeout(async () => {
      if (value.length >= 3) {
        const results = await fetchSuggestions(value);
        setPickupSuggestions(results);
      } else setPickupSuggestions([]);
    }, 400);
  };

  // 📌 Destination input handler
  const handleDestinationChange = (e) => {
    const value = e.target.value;
    setDestination(value);
    setFareData(null);

    clearTimeout(destinationTimer.current);
    destinationTimer.current = setTimeout(async () => {
      if (value.length >= 3) {
        const results = await fetchSuggestions(value);
        setDestinationSuggestions(results);
      } else setDestinationSuggestions([]);
    }, 400);
  };

  // 🗺 Initialize Map
  useEffect(() => {
    const map = L.map("map").setView([28.6139, 77.209], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    return () => map.remove();
  }, []);

  // 💰 Get Fare
  const handleGetFare = async () => {
    if (!pickup || !destination || !vehicleType) {
      alert("Please fill pickup, destination & vehicle");
      return;
    }

    try {
      const res = await axios.get(
        "http://localhost:8080/api/v1/rides/get-fare",
        {
          params: {
            pickup,
            destination,
            vehicleType,
          },
        }
      );

      console.log("FARE RESPONSE:", res.data);
      setFareData(res.data.fareData);
    } catch (error) {
      console.log("Fare Error:", error);
      alert("Could not fetch fare!");
    }
  };

  // 🚗 Book Ride
  const handleBookRide = () => {
    if (!fareData) return alert("Please fetch fare first.");

    alert(
      `Ride booked!\nVehicle: ${vehicleType.toUpperCase()}\nFare: ₹${fareData.fare}\nDistance: ${fareData.distanceKm.toFixed(
        2
      )} km\nTime: ${(fareData.durationSeconds / 60).toFixed(2)} minutes`
    );
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen flex bg-white">
        {/* LEFT SIDE */}
        <div className="w-1/2 p-10">
          <div className="border border-gray-300 rounded-xl p-8 shadow-sm">
            <h2 className="text-3xl font-bold mb-2">Book your ride</h2>

            {/* PICKUP */}
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

            {/* DESTINATION */}
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

            {/* VEHICLE SELECT */}
            <select
              value={vehicleType}
              onChange={(e) => {
                setVehicleType(e.target.value);
                setFareData(null);
              }}
              className="w-full border px-4 py-3 rounded-lg mb-4"
            >
              <option value="">Select Vehicle</option>
              <option value="bike">Bike</option>
              <option value="auto">Auto</option>
              <option value="car">Car</option>
            </select>

            {/* GET FARE BUTTON */}
            <button
              onClick={handleGetFare}
              className="w-full bg-black text-white py-3 rounded-lg mb-4"
            >
              Get Fare
            </button>

            {/* SHOW FARE */}
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
                  {(fareData.durationSeconds / 60).toFixed(2)} minutes
                </p>
              </div>
            )}
          </div>

          {/* ⭐ BOOK BUTTON OUTSIDE THE FORM ⭐ */}
          {fareData && (
            <button
              onClick={handleBookRide}
              className="w-1/3 ml-52 mt-12 bg-black text-white py-4 rounded-xl text-lg font-bold shadow-md hover:bg-gray-900 transition mt-4"
            >
              Book Ride
            </button>
          )}
        </div>

        {/* MAP */}
        <div className="w-1/2 m-5 bg-gray-200 h-[605px] rounded-xl overflow-hidden">
          <div id="map" className="w-full h-full"></div>
        </div>
      </div>
    </>
  );
}
