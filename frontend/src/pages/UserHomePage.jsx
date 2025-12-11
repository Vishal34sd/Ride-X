import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function UserHome() {
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [fare, setFare] = useState(null);
  const [selectedRide, setSelectedRide] = useState("");
  const [riderType, setRiderType] = useState("me"); // NEW

  // 👉 INITIALIZE MAP
  useEffect(() => {
    const map = L.map("map").setView([28.6139, 77.2090], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    return () => map.remove();
  }, []);

  const handleGetFare = () => {
    if (pickup && destination) {
      setFare({
        bike: 40,
        auto: 60,
        car: 120,
      });
    }
  };

  const handleBookRide = () => {
    if (!selectedRide) {
      alert("Please select a ride type!");
      return;
    }

    alert(
      `Ride booked for ${
        riderType === "me" ? "YOU" : "SOMEONE ELSE"
      } — ${selectedRide.toUpperCase()}`
    );
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen flex bg-white">

        {/* LEFT FORM BOX */}
        <div className="w-1/2 p-10">
          <div className="border border-gray-300 rounded-xl p-8 shadow-sm">

            <h2 className="text-3xl font-bold mb-2">Book your ride</h2>
            <p className="text-gray-600 mb-6">Enter your trip details</p>

            {/* PICKUP */}
            <input
              type="text"
              placeholder="Pickup location"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              className="w-full border border-gray-300 px-4 py-3 rounded-lg mb-4 focus:ring-2 focus:ring-black"
            />

            {/* DESTINATION */}
            <input
              type="text"
              placeholder="Destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full border border-gray-300 px-4 py-3 rounded-lg mb-4 focus:ring-2 focus:ring-black"
            />

            {/* WHO IS RIDING — SIMPLE BUTTONS */}
            <h3 className="text-xl font-semibold mb-3">Select the rider</h3>

            <div className="flex gap-3 mb-6">
              {/* FOR ME */}
              <button
                onClick={() => setRiderType("me")}
                className={`px-4 py-2 rounded-lg border text-sm font-medium w-1/2 transition
                  ${
                    riderType === "me"
                      ? "bg-black text-white border-black"
                      : "bg-white text-black border-gray-300"
                  }`}
              >
                For Me
              </button>

              {/* SOMEONE ELSE */}
              <button
                onClick={() => setRiderType("someone")}
                className={`px-4 py-2 rounded-lg border text-sm font-medium w-1/2 transition
                  ${
                    riderType === "someone"
                      ? "bg-black text-white border-black"
                      : "bg-white text-black border-gray-300"
                  }`}
              >
                Someone Else
              </button>
            </div>

            {/* GET FARE BUTTON */}
            <button
              onClick={handleGetFare}
              className="w-full bg-black text-white py-3 rounded-lg text-lg font-medium hover:bg-gray-900 transition mb-6"
            >
              Get Fare
            </button>

            {/* RIDE OPTIONS */}
            {fare && (
              <div className="space-y-4 mb-6">
                <h3 className="text-xl font-semibold mb-4">Select your ride</h3>

                {/* BIKE */}
                <div
                  onClick={() => setSelectedRide("bike")}
                  className={`p-4 border rounded-lg cursor-pointer flex justify-between transition
                    ${
                      selectedRide === "bike"
                        ? "bg-black text-white"
                        : "bg-white"
                    }`}
                >
                  <span>Bike</span>
                  <span>₹{fare.bike}</span>
                </div>

                {/* AUTO */}
                <div
                  onClick={() => setSelectedRide("auto")}
                  className={`p-4 border rounded-lg cursor-pointer flex justify-between transition
                    ${
                      selectedRide === "auto"
                        ? "bg-black text-white"
                        : "bg-white"
                    }`}
                >
                  <span>Auto</span>
                  <span>₹{fare.auto}</span>
                </div>

                {/* CAR */}
                <div
                  onClick={() => setSelectedRide("car")}
                  className={`p-4 border rounded-lg cursor-pointer flex justify-between transition
                    ${
                      selectedRide === "car"
                        ? "bg-black text-white"
                        : "bg-white"
                    }`}
                >
                  <span>Car</span>
                  <span>₹{fare.car}</span>
                </div>
              </div>
            )}

            {/* BOOK BUTTON */}
            {fare && (
              <button
                onClick={handleBookRide}
                className="w-full bg-black text-white py-3 rounded-lg text-lg font-medium hover:bg-gray-900 transition"
              >
                Book Ride
              </button>
            )}
          </div>
        </div>

        {/* MAP AREA */}
        <div className="w-1/2 bg-gray-200 m-5 h-[605px] rounded-xl overflow-hidden">
          <div id="map" className="w-full h-full"></div>
        </div>
      </div>
    </>
  );
}
