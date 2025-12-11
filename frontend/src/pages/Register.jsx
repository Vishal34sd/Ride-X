import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [selected, setSelected] = useState("");
  const navigate = useNavigate();

  const handleContinue = () => {
    if (selected === "rider") {
      navigate("/register-user");
    } else if (selected === "captain") {
      navigate("/register-captain");
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* NAVBAR */}
      <nav className="w-full bg-black text-white px-6 py-4 flex items-center">
        <div className="text-2xl font-bold tracking-tight">Uber</div>
      </nav>

      {/* MAIN CONTENT */}
      <div className="max-w-md mx-auto mt-14 px-6">

        {/* FORM WRAPPER WITH BORDER */}
        <div className="border border-gray-300 rounded-xl p-6 shadow-sm">

          <h2 className="text-3xl font-semibold mb-2">Get started</h2>
          <p className="text-gray-600 mb-8">Begin your journey with Uber</p>

          {/* BUTTONS */}
          <div className="space-y-4 mb-6">
            <button
              onClick={() => setSelected("rider")}
              className={`w-full py-3 rounded-lg text-lg font-medium transition 
                border 
                ${
                  selected === "rider"
                    ? "bg-black text-white border-black"
                    : "bg-white text-black border-gray-300"
                }
              `}
            >
              Register as a Rider
            </button>

            <button
              onClick={() => setSelected("captain")}
              className={`w-full py-3 rounded-lg text-lg font-medium transition 
                border
                ${
                  selected === "captain"
                    ? "bg-black text-white border-black"
                    : "bg-white text-black border-gray-300"
                }
              `}
            >
              Register as a Captain
            </button>
          </div>

          {/* TERMS LIST */}
          <div className="mb-6 text-sm text-gray-600 space-y-2">
            <p className="font-medium text-black">Before you continue:</p>

            <ul className="list-disc pl-6 space-y-1">
              <li>You agree to Uber’s Terms & Conditions</li>
              <li>You consent to receive SMS for verification</li>
              <li>You confirm you are above 18</li>
              <li>Your data will be used for account verification</li>
            </ul>
          </div>

          {/* CONTINUE BUTTON */}
          <button
            onClick={handleContinue}
            disabled={!selected}
            className={`w-full py-3 rounded-lg text-lg font-medium transition 
              ${
                selected
                  ? "bg-black text-white hover:bg-gray-900"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }
            `}
          >
            Continue
          </button>

        </div>
      </div>
    </div>
  );
}
