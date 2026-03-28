import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-[var(--radius)] border border-border/60 bg-card/80 p-8 text-center shadow-lg backdrop-blur">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Ride-X
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The route you requested does not exist. Check the URL or go back.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link to="/">
            <Button className="w-full">Back to home</Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="outline" className="w-full">
              Go to dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
