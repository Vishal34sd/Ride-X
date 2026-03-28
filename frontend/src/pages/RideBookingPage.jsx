import React, { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import DashboardLayout from "../components/DashboardLayout";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { useToast } from "../components/ui/toast";
import { getAccessToken } from "../helper/Token";
import { apiUrl } from "../lib/apiUrl";

const rideOptions = [
  { id: "motorcycle", label: "Bike", eta: "2 min" },
  { id: "auto", label: "Auto", eta: "4 min" },
  { id: "car", label: "Cab", eta: "6 min" },
];

export default function RideBookingPage() {
  const { toast } = useToast();
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropSuggestions, setDropSuggestions] = useState([]);
  const [vehicle, setVehicle] = useState("car");
  const [loading, setLoading] = useState(false);
  const [fareLoading, setFareLoading] = useState(false);
  const [fareData, setFareData] = useState(null);
  const pickupTimer = useRef(null);
  const dropTimer = useRef(null);

  const fetchSuggestions = async (query) => {
    try {
      const res = await axios.get(
        apiUrl("/api/v1/maps/get-suggestions"),
        { params: { input: query } }
      );
      return res.data?.data || [];
    } catch (error) {
      console.error("Suggestion API error", error);
      return [];
    }
  };

  const handlePickupChange = (event) => {
    const value = event.target.value;
    setPickup(value);
    setFareData(null);

    clearTimeout(pickupTimer.current);
    pickupTimer.current = setTimeout(async () => {
      if (value.length >= 3) {
        const results = await fetchSuggestions(value);
        setPickupSuggestions(results);
      } else {
        setPickupSuggestions([]);
      }
    }, 400);
  };

  const handleDropChange = (event) => {
    const value = event.target.value;
    setDrop(value);
    setFareData(null);

    clearTimeout(dropTimer.current);
    dropTimer.current = setTimeout(async () => {
      if (value.length >= 3) {
        const results = await fetchSuggestions(value);
        setDropSuggestions(results);
      } else {
        setDropSuggestions([]);
      }
    }, 400);
  };

  const fare = useMemo(() => {
    if (!fareData?.fare) return "--";
    return `₹${Number(fareData.fare).toFixed(2)}`;
  }, [fareData]);

  const handleGetFare = async () => {
    if (!pickup || !drop || !vehicle) {
      toast({
        title: "Missing details",
        description: "Add pickup, drop-off, and vehicle type.",
        variant: "destructive",
      });
      return;
    }

    setFareLoading(true);
    try {
      const res = await axios.get(
        apiUrl("/api/v1/rides/get-fare"),
        {
          params: {
            pickup,
            destination: drop,
            vehicleType: vehicle,
          },
        }
      );
      setFareData(res.data?.fareData || null);
    } catch (error) {
      console.error("Fare calculation failed", error);
      setFareData(null);
      toast({
        title: "Fare unavailable",
        description: "We could not calculate a fare for this route.",
        variant: "destructive",
      });
    } finally {
      setFareLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!pickup || !drop) {
      toast({
        title: "Missing details",
        description: "Add pickup and drop-off locations to continue.",
        variant: "destructive",
      });
      return;
    }

    const token = getAccessToken();
    if (!token) {
      toast({
        title: "Login required",
        description: "Please log in to book a ride.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        apiUrl("/api/v1/rides/create"),
        {
          pickup,
          destination: drop,
          vehicleType: vehicle,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast({
        title: "Ride requested",
        description: "We are matching you with the best driver nearby.",
      });
    } catch (error) {
      console.error("Ride booking failed", error);
      toast({
        title: "Booking failed",
        description:
          error?.response?.data?.message || "Unable to book this ride.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="Book a ride"
      description="Configure the ride details and confirm instantly."
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="bg-card/70 backdrop-blur">
          <CardHeader>
            <CardTitle>Ride details</CardTitle>
            <CardDescription>
              Provide pickup, destination, and your preferred ride type.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Input
                value={pickup}
                onChange={handlePickupChange}
                placeholder="Pickup location"
              />
              {pickupSuggestions.length > 0 && (
                <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-[var(--radius)] border border-border/60 bg-card shadow-lg">
                  {pickupSuggestions.map((item) => (
                    <button
                      type="button"
                      key={item.name}
                      onClick={() => {
                        setPickup(item.name);
                        setPickupSuggestions([]);
                      }}
                      className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <Input
                value={drop}
                onChange={handleDropChange}
                placeholder="Drop-off location"
              />
              {dropSuggestions.length > 0 && (
                <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-[var(--radius)] border border-border/60 bg-card shadow-lg">
                  {dropSuggestions.map((item) => (
                    <button
                      type="button"
                      key={item.name}
                      onClick={() => {
                        setDrop(item.name);
                        setDropSuggestions([]);
                      }}
                      className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {rideOptions.map((option) => (
                <motion.button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setVehicle(option.id);
                    setFareData(null);
                  }}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  className={
                    option.id === vehicle
                      ? "rounded-[var(--radius)] border border-border bg-foreground text-background p-4 text-left shadow"
                      : "rounded-[var(--radius)] border border-border/60 bg-card/60 p-4 text-left text-foreground shadow-sm"
                  }
                >
                  <p className="text-sm font-semibold">{option.label}</p>
                  <p className="text-xs text-muted-foreground">ETA {option.eta}</p>
                </motion.button>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius)] border border-border/60 bg-muted/60 p-4">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Estimated fare</p>
                <motion.p
                  key={fare}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl font-semibold"
                >
                  {fare}
                </motion.p>
              </div>
              <Badge variant="outline">AI optimized</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                variant="outline"
                onClick={handleGetFare}
                disabled={fareLoading}
              >
                {fareLoading ? "Calculating..." : "Calculate fare"}
              </Button>
              <Button className="w-full" onClick={handleConfirm} disabled={loading}>
                {loading ? "Confirming..." : "Confirm booking"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-card/70 backdrop-blur">
            <CardHeader>
              <CardTitle>Ride timeline</CardTitle>
              <CardDescription>Live updates once a driver accepts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="rounded-[var(--radius)] border border-border/60 bg-card/60 p-4">
                <p className="font-semibold text-foreground">Dispatching driver</p>
                <p>Searching the closest premium driver nearby.</p>
              </div>
              <div className="rounded-[var(--radius)] border border-border/60 bg-card/60 p-4">
                <p className="font-semibold text-foreground">Pickup window</p>
                <p>Expected arrival between 4 - 6 minutes.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/70 backdrop-blur">
            <CardHeader>
              <CardTitle>Smart suggestions</CardTitle>
              <CardDescription>AI-powered tips to save time.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Try shifting pickup by 2 minutes to reduce fare by 8%.
              </p>
              <p>
                Book with a Bike to reach the destination 3 minutes faster.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
