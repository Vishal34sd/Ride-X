import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const LandingPage = () => {
  const navigate = useNavigate();

  // INPUT STATES
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");

  // ONLY NAMES IN STATES
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState([]);

  // Debounce timers
  const pickupTimer = useRef(null);
  const dropoffTimer = useRef(null);

  // API CALL (correct format)
  const fetchSuggestions = async (query) => {
    try {
      const res = await axios.get(
        "http://localhost:8080/api/v1/maps/get-suggestions",
        {
          params: { input: query },
        }
      );

      // Backend returns: { data: [ ... ] }
      return res.data.data || [];
    } catch (err) {
      console.log("Suggestion API Error:", err);
      return [];
    }
  };

  // PICKUP HANDLER
  const handlePickupChange = (e) => {
    const value = e.target.value;
    setPickup(value);

    clearTimeout(pickupTimer.current);

    pickupTimer.current = setTimeout(async () => {
      if (value.length >= 3) {
        const results = await fetchSuggestions(value);

        // extract names
        const names = results.map((item) => item.name);

        setPickupSuggestions(names);
      } else {
        setPickupSuggestions([]);
      }
    }, 400);
  };

  // DROPOFF HANDLER
  const handleDropoffChange = (e) => {
    const value = e.target.value;
    setDropoff(value);

    clearTimeout(dropoffTimer.current);

    dropoffTimer.current = setTimeout(async () => {
      if (value.length >= 3) {
        const results = await fetchSuggestions(value);

        const names = results.map((item) => item.name);

        setDropoffSuggestions(names);
      } else {
        setDropoffSuggestions([]);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* NAVBAR */}
      <nav className="w-full flex justify-between items-center px-8 py-4 border-b bg-black">
        <div className="text-3xl font-bold text-white">Ride-X</div>

        <div className="hidden md:flex space-x-5 text-white mr-96">
          <a href="#" className="hover:bg-gray-700 rounded-full px-5 py-2">Ride</a>
          <a href="#" className="hover:bg-gray-700 rounded-full px-5 py-2">Drive</a>
          <a href="#" className="hover:bg-gray-700 rounded-full px-5 py-2">Business</a>
          <a href="#" className="hover:bg-gray-700 rounded-full px-5 py-2">About</a>
        </div>

        <div className="flex space-x-2 text-white">
          <button className="hover:bg-gray-700 rounded-full px-5 py-2">Help</button>
          <Link to ="/login"><button className="hover:bg-gray-700 rounded-full px-5 py-2">Log in</button></Link>
          <Link to="/register">
            <button className="bg-white text-black px-5 py-2 rounded-full">Sign up</button>
          </Link>
        </div>
      </nav>

      {/* MAIN SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 px-10 py-16">

        {/* LEFT SIDE */}
        <div>
          <h1 className="text-[44px] font-bold leading-tight">
            Request a ride for now or later
          </h1>

          {/* PICKUP INPUT */}
          <div className="relative mt-4">
            <input
              value={pickup}
              onChange={handlePickupChange}
              placeholder="Pickup location"
              className="w-full border border-gray-300 rounded-lg p-3 bg-gray-100"
            />

            {pickupSuggestions.length > 0 && (
              <div className="absolute bg-white w-full border rounded-lg shadow-md mt-1 z-50">
                {pickupSuggestions.map((name, i) => (
                  <div
                    key={i}
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

          {/* DROPOFF INPUT */}
          <div className="relative mt-4">
            <input
              value={dropoff}
              onChange={handleDropoffChange}
              placeholder="Dropoff location"
              className="w-full border border-gray-300 rounded-lg p-3 bg-gray-100"
            />

            {dropoffSuggestions.length > 0 && (
              <div className="absolute bg-white w-full border rounded-lg shadow-md mt-1 z-50">
                {dropoffSuggestions.map((name, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setDropoff(name);
                      setDropoffSuggestions([]);
                    }}
                    className="p-2 hover:bg-gray-200 cursor-pointer"
                  >
                    {name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* BUTTON */}
          <button
            className="mt-6 bg-black text-white px-6 py-3 rounded-lg"
            onClick={() => navigate("/register")}
          >
            See prices
          </button>
        </div>

        {/* RIGHT IMAGE */}
        <div className="flex justify-center">
          <img
            src="/trip1.png"
            className="rounded-xl w-full max-w-md shadow-md"
            alt="Trip"
          />
        </div>

      </div>
    </div>
  );
};

export default LandingPage;
