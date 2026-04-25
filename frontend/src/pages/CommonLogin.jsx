import React, { useState } from "react";
import axios from "axios";
import { apiUrl } from "../lib/apiUrl";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";


export default function CommonLogin() {
  const navigate = useNavigate();

  const [role, setRole] = useState("user");
  const [formData, setFormData] = useState({
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

    const endpoint = role === "user"
      ? apiUrl("/api/v1/users/login")
      : apiUrl("/api/v1/captains/login");

    try {
      const res = await axios.post(endpoint, formData);

      setSuccessMsg("Login successful!");

      if (res.data?.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", role);
      }

      if (role === "user") {
        navigate("/dashboard");
      } else {
        navigate("/homepage-captain");
      }

      setFormData({
        email: "",
        password: "",
      });
    } catch (error) {
      console.log(error);
      setErrorMsg(
        error?.response?.data?.message || "Invalid email or password!",
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
            alt="Premium ride"
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
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 pointer-events-none"
          >
            <div className="absolute -left-10 top-12 h-72 w-72 rounded-full bg-purple-500/15 blur-3xl" />
            <div className="absolute bottom-10 right-4 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />
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
            <p className="text-xs uppercase tracking-[0.3em] text-purple-300/90 font-medium">
              Ride-X Access
            </p>
            <h1 className="text-4xl font-bold leading-tight text-white lg:text-5xl">
              Your premium<br />mobility console<br />starts here.
            </h1>
            <p className="max-w-sm text-sm leading-relaxed text-white/60">
              Centralize ride scheduling, live tracking, and concierge support
              in one dashboard.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <div className="h-px w-12 bg-gradient-to-r from-purple-400 to-transparent" />
              <span className="text-[11px] text-white/40 uppercase tracking-widest">Trusted by thousands</span>
              <div className="h-px w-12 bg-gradient-to-l from-purple-400 to-transparent" />
            </div>
          </motion.div>
        </div>

        <div className="flex items-center justify-center px-6 py-12">
          <Card className="w-full max-w-md bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Sign in to Ride-X</CardTitle>
              <CardDescription>
                Choose a role and continue to your dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="h-11 w-full rounded-[var(--radius)] border border-input bg-background px-3 text-sm text-foreground"
                >
                  <option value="user">Login as Rider</option>
                  <option value="captain">Login as Captain</option>
                </select>
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
                  {loading ? "Logging in..." : "Login"}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  New to Ride-X ? Sign up now for faster, smarter ride booking.
                  <Link
                    to="/register"
                    className="block text-foreground hover:underline mt-1"
                  >
                    Create your account
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
