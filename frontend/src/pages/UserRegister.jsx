import React from "react";

export default function UserRegister() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* NAVBAR */}
      <nav className="w-full bg-black text-white px-6 py-4 flex items-center">
        <div className="text-2xl font-bold tracking-tight">Uber</div>
      </nav>

      {/* FORM CONTAINER */}
      <div className="max-w-md mx-auto mt-14 px-6">
        <div className="border border-gray-300 rounded-xl p-6 shadow-sm">

          <h2 className="text-3xl font-semibold mb-2">Create your account</h2>
          <p className="text-gray-600 mb-8">Sign up to get started</p>

          {/* FULL NAME */}
          <input
            type="text"
            placeholder="Full Name"
            className="w-full border border-gray-300 px-4 py-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-black"
          />

          {/* EMAIL */}
          <input
            type="email"
            placeholder="Email"
            className="w-full border border-gray-300 px-4 py-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-black"
          />

          {/* PASSWORD */}
          <input
            type="password"
            placeholder="Password"
            className="w-full border border-gray-300 px-4 py-3 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-black"
          />

          {/* SIGN UP BUTTON */}
          <button
            className="w-full bg-black text-white py-3 rounded-lg text-lg font-medium hover:bg-gray-900 transition"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}
