import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { saveAccessToken } from "../helper/Token.js";
import { Button } from "../components/ui/button";
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
        "http://localhost:8080/api/v1/users/register",
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
        <div className="relative hidden items-center justify-center overflow-hidden bg-secondary lg:flex">
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <div className="absolute -left-12 top-10 h-72 w-72 rounded-full bg-muted/70 blur-3xl" />
            <div className="absolute bottom-8 right-6 h-64 w-64 rounded-full bg-accent/70 blur-3xl" />
          </motion.div>
          <div className="relative z-10 max-w-md space-y-4 p-10">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Rider Profile
            </p>
            <h1 className="text-3xl font-semibold">Create your Ride-X rider hub.</h1>
            <p className="text-sm text-muted-foreground">
              Save favorites, unlock smart fare alerts, and book rides instantly.
            </p>
          </div>
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
