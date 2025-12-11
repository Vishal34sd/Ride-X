import React, { useState } from "react";
import axios from "axios";

export default function CaptainRegister() {
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    color: "",
    plate: "",
    capacity: "",
    vehicleType: "",
  });

  // Update form values
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Submit Logic
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("http://localhost:3000/api/captains/register", formData);
      
      console.log("Captain registered:", response.data);
      alert("Captain account created successfully!");
    } catch (error) {
      console.error("Error registering captain:", error);
      alert("Something went wrong. Try again!");
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* NAVBAR */}
      <nav className="w-full bg-black text-white px-6 py-4 flex items-center">
        <div className="text-2xl font-bold tracking-tight">Uber</div>
      </nav>

      {/* FORM BOX */}
      <div className="max-w-md mx-auto mt-14 px-6">
        <form
          onSubmit={handleSubmit}
          className="border border-gray-300 rounded-xl p-6 shadow-sm"
        >
          <h2 className="text-3xl font-semibold mb-2">Captain Sign Up</h2>
          <p className="text-gray-600 mb-8">Register to drive with Uber</p>

          {/* FIRST NAME */}
          <input
            type="text"
            name="firstname"
            placeholder="First Name"
            value={formData.firstname}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 focus:ring-2 focus:ring-black"
            required
          />

          {/* LAST NAME */}
          <input
            type="text"
            name="lastname"
            placeholder="Last Name"
            value={formData.lastname}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 focus:ring-2 focus:ring-black"
            required
          />

          {/* EMAIL */}
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 focus:ring-2 focus:ring-black"
            required
          />

          {/* PASSWORD */}
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-6 focus:ring-2 focus:ring-black"
            required
          />

          <h3 className="text-lg font-semibold mb-3">Vehicle Details</h3>

          {/* VEHICLE COLOR */}
          <input
            type="text"
            name="color"
            placeholder="Vehicle Color"
            value={formData.color}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 focus:ring-2 focus:ring-black"
            required
          />

          {/* PLATE NUMBER */}
          <input
            type="text"
            name="plate"
            placeholder="License Plate Number"
            value={formData.plate}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 focus:ring-2 focus:ring-black"
            required
          />

          {/* CAPACITY */}
          <input
            type="number"
            name="capacity"
            placeholder="Seating Capacity"
            value={formData.capacity}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 focus:ring-2 focus:ring-black"
            required
          />

          {/* VEHICLE TYPE */}
          <select
            name="vehicleType"
            value={formData.vehicleType}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-6 focus:ring-2 focus:ring-black"
            required
          >
            <option value="">Select Vehicle Type</option>
            <option value="car">Car</option>
            <option value="auto">Auto</option>
            <option value="bike">Bike</option>
          </select>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            className="w-full bg-black text-white py-3 rounded-lg text-lg font-medium hover:bg-gray-900 transition"
          >
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
}
