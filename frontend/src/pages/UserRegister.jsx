import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { saveAccessToken } from "../helper/Token.js";
import { Button } from "../components/ui/button";
import { apiUrl } from "../lib/apiUrl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";


export default function UserRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const payload = {
      fullname: {
        firstname: formData.firstName,
        lastname: formData.lastName,
      },
      email: formData.email,
      password: formData.password,
    };

    try {
      const res = await axios.post(
        apiUrl("/api/v1/users/register"),
        payload
      );

      setSuccessMsg("Account created successfully!");
      saveAccessToken(res.data.token);
      navigate("/login");

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
      });
    } catch (error) {
      console.log(error);
      setErrorMsg(
        error?.response?.data?.message || "Something went wrong. Try again!"
      );
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        {/* Left panel — full-bleed image with overlaid text */}
        <div className="relative hidden overflow-hidden lg:flex">
          {/* Full-cover background image */}
          <motion.img
            src="/car3.jpg"
            alt="Premium ride experience"
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
            <div className="absolute -left-12 top-10 h-72 w-72 rounded-full bg-orange-500/15 blur-3xl" />
            <div className="absolute bottom-8 right-6 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />
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
            <p className="text-xs uppercase tracking-[0.3em] text-orange-300/90 font-medium">
              Rider Profile
            </p>
            <h1 className="text-4xl font-bold leading-tight text-white lg:text-5xl">
              Create your<br />Ride-X rider hub.
            </h1>
            <p className="max-w-sm text-sm leading-relaxed text-white/60">
              Save favorites, unlock smart fare alerts, and book rides instantly.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <div className="h-px w-12 bg-gradient-to-r from-orange-400 to-transparent" />
              <span className="text-[11px] text-white/40 uppercase tracking-widest">Your journey begins</span>
              <div className="h-px w-12 bg-gradient-to-l from-orange-400 to-transparent" />
            </div>
          </motion.div>
        </div>

        <div className="flex items-center justify-center px-6 py-12">
          <Card className="w-full max-w-md bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Create rider account</CardTitle>
              <CardDescription>Join Ride-X in under a minute.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First name"
                  required
                />
                <Input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last name"
                  required
                />
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  required
                />
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  required
                />

                {errorMsg && (
                  <p className="text-xs text-destructive">{errorMsg}</p>
                )}
                {successMsg && (
                  <p className="text-xs text-foreground">{successMsg}</p>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Sign Up"}
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
