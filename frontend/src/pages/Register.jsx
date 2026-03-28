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
        <div className="relative hidden items-center justify-center overflow-hidden bg-secondary lg:flex">
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <div className="absolute -left-12 bottom-12 h-72 w-72 rounded-full bg-muted/70 blur-3xl" />
            <div className="absolute right-8 top-10 h-56 w-56 rounded-full bg-accent/70 blur-3xl" />
          </motion.div>
          <div className="relative z-10 max-w-md space-y-4 p-10">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Ride-X Onboarding
            </p>
            <h1 className="text-3xl font-semibold">
              Choose your Ride-X experience.
            </h1>
            <p className="text-sm text-muted-foreground">
              Premium ride booking for riders and captains built to move faster.
            </p>
          </div>
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
