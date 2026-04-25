import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";


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
            <div className="absolute -left-12 bottom-12 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
            <div className="absolute right-8 top-10 h-56 w-56 rounded-full bg-blue-500/15 blur-3xl" />
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
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/90 font-medium">
              Ride-X Onboarding
            </p>
            <h1 className="text-4xl font-bold leading-tight text-white lg:text-5xl">
              Choose your<br />Ride-X experience.
            </h1>
            <p className="max-w-sm text-sm leading-relaxed text-white/60">
              Premium ride booking for riders and captains built to move faster.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <div className="h-px w-12 bg-gradient-to-r from-emerald-400 to-transparent" />
              <span className="text-[11px] text-white/40 uppercase tracking-widest">Ride or drive</span>
              <div className="h-px w-12 bg-gradient-to-l from-emerald-400 to-transparent" />
            </div>
          </motion.div>
        </div>

        <div className="flex items-center justify-center px-6 py-12">
          <Card className="w-full max-w-md bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Create your Ride-X account</CardTitle>
              <CardDescription>Select a role to continue.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setSelected("rider")}
                  className={
                    selected === "rider"
                      ? "w-full rounded-[var(--radius)] border border-border bg-foreground px-4 py-3 text-left text-sm font-semibold text-background"
                      : "w-full rounded-[var(--radius)] border border-border/60 bg-card/70 px-4 py-3 text-left text-sm"
                  }
                >
                  Register as Rider
                </button>
                <button
                  type="button"
                  onClick={() => setSelected("captain")}
                  className={
                    selected === "captain"
                      ? "w-full rounded-[var(--radius)] border border-border bg-foreground px-4 py-3 text-left text-sm font-semibold text-background"
                      : "w-full rounded-[var(--radius)] border border-border/60 bg-card/70 px-4 py-3 text-left text-sm"
                  }
                >
                  Register as Captain
                </button>
              </div>

              <div className="text-xs text-muted-foreground">
                By continuing, you agree to the Ride-X terms and privacy policy.
              </div>

              <Button
                className="w-full"
                onClick={handleContinue}
                disabled={!selected}
              >
                Continue
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Already with Ride-X?{" "}
                <Link to="/login" className="text-foreground hover:underline">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
