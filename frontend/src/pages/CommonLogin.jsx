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
        <div className="relative hidden items-center justify-center overflow-hidden bg-secondary lg:flex">
          <motion.div
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <div className="absolute -left-10 top-12 h-72 w-72 rounded-full bg-muted/70 blur-3xl" />
            <div className="absolute bottom-10 right-4 h-64 w-64 rounded-full bg-accent/70 blur-3xl" />
          </motion.div>
          <div className="relative z-10 max-w-md space-y-4 p-10">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Ride-X Access
            </p>
            <h1 className="text-3xl font-semibold">
              Your premium mobility console starts here.
            </h1>
            <p className="text-sm text-muted-foreground">
              Centralize ride scheduling, live tracking, and concierge support
              in one dashboard.
            </p>
          </div>
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
