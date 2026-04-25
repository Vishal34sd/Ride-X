import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { saveAccessToken } from "../helper/Token.js";
import { Button } from "../components/ui/button";
import { apiUrl } from "../lib/apiUrl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";


export default function CaptainRegister() {
  const navigate = useNavigate();
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      fullname: {
        firstname: formData.firstname,
        lastname: formData.lastname,
      },
      email: formData.email,
      password: formData.password,
      vehicle: {
        color: formData.color,
        plate: formData.plate,
        capacity: Number(formData.capacity),
        vehicleType: formData.vehicleType,
      },
    };

    try {
      const response = await axios.post(
        apiUrl("/api/v1/captains/register"),
        payload
      );

      console.log("Captain registered:", response.data);
      saveAccessToken(response.data.token);
      localStorage.setItem("role", "captain");
      alert("Captain account created successfully!");
      navigate("/login");

      setFormData({
        firstname: "",
        lastname: "",
        email: "",
        password: "",
        color: "",
        plate: "",
        capacity: "",
        vehicleType: "",
      });
    } catch (error) {
      console.error("Error registering captain:", error);

      if (error.response?.data?.errors) {
        alert(error.response.data.errors[0].msg);
      } else {
        alert("Something went wrong. Try again!");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        {/* Left panel — full-bleed image with overlaid text */}
        <div className="relative hidden overflow-hidden lg:flex">
          {/* Full-cover background image */}
          <motion.img
            src="/car3.jpg"
            alt="Captain with premium vehicle"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Dark gradient overlays for depth & readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
          {/* Animated accent glow */}
          <motion.div
            animate={{ opacity: [0.25, 0.5, 0.25] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 pointer-events-none"
          >
            <div className="absolute -left-10 bottom-12 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl" />
            <div className="absolute right-6 top-12 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl" />
          </motion.div>
          {/* Brand badge — top left */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="absolute left-8 top-8 z-20 flex items-center gap-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm border border-white/10">
              <span className="text-sm font-bold text-white">RX</span>
            </div>
            <span className="text-sm font-semibold tracking-wide text-white/90">Ride-X</span>
          </motion.div>
          {/* Overlaid text — bottom left */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.4 }}
            className="absolute bottom-0 left-0 z-20 w-full space-y-4 p-10 lg:p-12"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-violet-300/90 font-medium">
              Captain Onboarding
            </p>
            <h1 className="text-4xl font-bold leading-tight text-white lg:text-5xl">
              Deliver premium<br />rides with Ride-X.
            </h1>
            <p className="max-w-sm text-sm leading-relaxed text-white/60">
              Access real-time demand forecasts and priority ride matching.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <div className="h-px w-12 bg-gradient-to-r from-violet-400 to-transparent" />
              <span className="text-[11px] text-white/40 uppercase tracking-widest">Drive with purpose</span>
              <div className="h-px w-12 bg-gradient-to-l from-violet-400 to-transparent" />
            </div>
          </motion.div>
        </div>

        <div className="flex items-center justify-center px-6 py-12">
          <Card className="w-full max-w-md bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Captain sign up</CardTitle>
              <CardDescription>Register your profile and vehicle details.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="text"
                  name="firstname"
                  placeholder="First name"
                  value={formData.firstname}
                  onChange={handleChange}
                  required
                />
                <Input
                  type="text"
                  name="lastname"
                  placeholder="Last name"
                  value={formData.lastname}
                  onChange={handleChange}
                  required
                />
                <Input
                  type="email"
                  name="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <Input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />

                <div className="pt-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Vehicle details
                  </p>
                </div>

                <Input
                  type="text"
                  name="color"
                  placeholder="Vehicle color"
                  value={formData.color}
                  onChange={handleChange}
                  required
                />
                <Input
                  type="text"
                  name="plate"
                  placeholder="License plate"
                  value={formData.plate}
                  onChange={handleChange}
                  required
                />
                <Input
                  type="number"
                  name="capacity"
                  placeholder="Seating capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  required
                />
                <select
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                  className="h-11 w-full rounded-[var(--radius)] border border-input bg-background px-3 text-sm text-foreground"
                  required
                >
                  <option value="">Select vehicle type</option>
                  <option value="car">Car</option>
                  <option value="auto">Auto</option>
                  <option value="bike">Bike</option>
                </select>

                <Button type="submit" className="w-full">
                  Sign Up
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Already with Ride-X?{" "}
                  <Link to="/login" className="text-foreground hover:underline">
                    Sign in
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
