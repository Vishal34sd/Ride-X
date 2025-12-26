import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function CommonLogin() {
  const navigate = useNavigate();

  const [role, setRole] = useState("user"); // default
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Handle email / password input
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle login submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    // Determine API endpoint based on selected role
    const endpoint =
      role === "user"
        ? "http://localhost:8080/api/v1/users/login"
        : "http://localhost:8080/api/v1/captains/login";

    try {
      const res = await axios.post(endpoint, formData);

      setSuccessMsg("Login successful!");

      // store token
      if (res.data?.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", role);
      }

      // Redirect to different dashboards
      if (role === "user") {
        navigate("/homepage-user");
      } else {
        navigate("/homepage-captain");
      }

      // Reset form
      setFormData({
        email: "",
        password: ""
      });

    } catch (error) {
      console.log(error);
      setErrorMsg(
        error?.response?.data?.message || "Invalid email or password!"
      );
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* NAVBAR */}
      <nav className="w-full bg-black text-white px-10 py-4 flex items-center h-20">
        <div className="text-2xl font-bold tracking-tight">Ride-X</div>
      </nav>

      {/* LOGIN FORM */}
      <div className="max-w-md mx-auto mt-14 px-6">
        <form
          onSubmit={handleSubmit}
          className="border border-gray-300 rounded-xl p-6 shadow-sm"
        >
          <h2 className="text-3xl font-semibold mb-2">Login</h2>
          <p className="text-gray-600 mb-8">Select role and continue</p>

          {/* ROLE SELECTOR */}
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border border-gray-300 px-4 py-3 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="user">Login as User</option>
            <option value="captain">Login as Captain</option>
          </select>

          {/* EMAIL INPUT */}
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            className="w-full border border-gray-300 px-4 py-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-black"
            required
          />

          {/* PASSWORD INPUT */}
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            className="w-full border border-gray-300 px-4 py-3 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-black"
            required
          />

          {/* ERROR MESSAGE */}
          {errorMsg && <p className="text-red-600 mb-3 text-sm">{errorMsg}</p>}

          {/* SUCCESS MESSAGE */}
          {successMsg && <p className="text-green-600 mb-3 text-sm">{successMsg}</p>}

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg text-lg font-medium hover:bg-gray-900 transition"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
