import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-[var(--radius)] border border-border/60 bg-card/80 p-8 text-center shadow-lg backdrop-blur">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Ride-X Access
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Not authorized</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have access to this page with your current account.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link to="/login">
            <Button className="w-full">Sign in</Button>
          </Link>
          <Link to="/">
            <Button variant="outline" className="w-full">
              Back to home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
