import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import DashboardLayout from "../components/DashboardLayout";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { getAccessToken } from "../helper/Token";
import { apiUrl } from "../lib/apiUrl";

const getMonthKey = (date) => `${date.getFullYear()}-${date.getMonth()}`;

const formatDelta = (current, previous) => {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous <= 0) {
    return "--";
  }
  const change = ((current - previous) / previous) * 100;
  const sign = change > 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}%`;
};

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function DashboardPage() {
  const [rides, setRides] = useState([]);
  const [latestRide, setLatestRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fareEstimate, setFareEstimate] = useState(null);
  const [fareLoading, setFareLoading] = useState(false);
  const [pickupCoords, setPickupCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const destinationMarkerRef = useRef(null);
  const routeRef = useRef(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    const fetchData = async () => {
      setLoading(true);
      try {
        const results = await Promise.allSettled([
          axios.get(apiUrl("/api/v1/rides/user-rides"), { headers }),
          axios.get(apiUrl("/api/v1/rides/latest"), { headers }),
        ]);

        const ridesResult = results[0];
        const latestResult = results[1];

        if (ridesResult.status === "fulfilled") {
          setRides(
            Array.isArray(ridesResult.value.data?.rides)
              ? ridesResult.value.data.rides
              : []
          );
        } else {
          console.error("Failed to load rides", ridesResult.reason);
          setRides([]);
        }

        if (latestResult.status === "fulfilled") {
          setLatestRide(latestResult.value.data?.ride || null);
        } else {
          setLatestRide(null);
        }
      } catch (error) {
        console.error("Failed to load dashboard data", error);
        setRides([]);
        setLatestRide(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const map = L.map(mapRef.current).setView([28.6139, 77.209], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);
    mapInstanceRef.current = map;
    return () => map.remove();
  }, []);

  useEffect(() => {
    if (!latestRide?.pickup || !latestRide?.destination) {
      setPickupCoords(null);
      setDestinationCoords(null);
      return;
    }

    const fetchCoordinates = async () => {
      try {
        const [pickupRes, destinationRes] = await Promise.all([
          axios.get(apiUrl("/api/v1/maps/get-coordinates"), {
            params: { address: latestRide.pickup },
          }),
          axios.get(apiUrl("/api/v1/maps/get-coordinates"), {
            params: { address: latestRide.destination },
          }),
        ]);
        setPickupCoords(pickupRes.data?.data || null);
        setDestinationCoords(destinationRes.data?.data || null);
      } catch (error) {
        console.error("Failed to load map coordinates", error);
        setPickupCoords(null);
        setDestinationCoords(null);
      }
    };

    fetchCoordinates();
  }, [latestRide]);

  useEffect(() => {
    if (!mapInstanceRef.current || !pickupCoords || !destinationCoords) return;
    const map = mapInstanceRef.current;

    if (pickupMarkerRef.current) map.removeLayer(pickupMarkerRef.current);
    if (destinationMarkerRef.current) map.removeLayer(destinationMarkerRef.current);
    if (routeRef.current) map.removeLayer(routeRef.current);

    pickupMarkerRef.current = L.marker([
      pickupCoords.lat,
      pickupCoords.lng,
    ]).addTo(map);

    destinationMarkerRef.current = L.marker([
      destinationCoords.lat,
      destinationCoords.lng,
    ]).addTo(map);

    routeRef.current = L.polyline(
      [
        [pickupCoords.lat, pickupCoords.lng],
        [destinationCoords.lat, destinationCoords.lng],
      ],
      { color: "black", weight: 4 }
    ).addTo(map);

    map.fitBounds(routeRef.current.getBounds(), { padding: [40, 40] });
  }, [pickupCoords, destinationCoords]);

  useEffect(() => {
    if (!latestRide?.pickup || !latestRide?.destination || !latestRide?.vehicleType) {
      setFareEstimate(null);
      return;
    }

    const fetchFare = async () => {
      setFareLoading(true);
      try {
        const res = await axios.get(
          apiUrl("/api/v1/rides/get-fare"),
          {
            params: {
              pickup: latestRide.pickup,
              destination: latestRide.destination,
              vehicleType: latestRide.vehicleType,
            },
          }
        );
        setFareEstimate(res.data?.fareData || null);
      } catch (error) {
        console.error("Failed to load fare estimate", error);
        setFareEstimate(null);
      } finally {
        setFareLoading(false);
      }
    };

    fetchFare();
  }, [latestRide]);

  const stats = useMemo(() => {
    const now = new Date();
    const currentKey = getMonthKey(now);
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousKey = getMonthKey(previousMonth);

    let currentCount = 0;
    let previousCount = 0;
    let currentSpend = 0;
    let previousSpend = 0;

    rides.forEach((ride) => {
      if (!ride?.createdAt) return;
      const rideDate = new Date(ride.createdAt);
      const rideKey = getMonthKey(rideDate);
      const fare = Number(ride.fare) || 0;
      if (rideKey === currentKey) {
        currentCount += 1;
        currentSpend += fare;
      } else if (rideKey === previousKey) {
        previousCount += 1;
        previousSpend += fare;
      }
    });

    return {
      currentCount,
      previousCount,
      currentSpend,
      previousSpend,
    };
  }, [rides]);

  const statCards = [
    {
      label: "Rides this month",
      value: loading ? "--" : `${stats.currentCount}`,
      delta: loading ? "--" : formatDelta(stats.currentCount, stats.previousCount),
    },
    {
      label: "Total spend",
      value: loading ? "--" : `₹${stats.currentSpend.toFixed(2)}`,
      delta: loading ? "--" : formatDelta(stats.currentSpend, stats.previousSpend),
    },
    { label: "Avg. pickup", value: "4.2 min", delta: "-0.6" },
    { label: "Ride score", value: "4.9", delta: "+0.1" },
  ];

  const latestStatus = latestRide?.status || "pending";
  const statusLabel = latestRide
    ? latestStatus.charAt(0).toUpperCase() + latestStatus.slice(1)
    : "No active ride";

  return (
    <DashboardLayout
      title="Welcome back"
      description="Plan, book, and monitor every ride in one premium console."
    >
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-12">
          <div className="grid gap-8 sm:grid-cols-2">
            {statCards.map((card) => (
              <motion.div
                key={card.label}
                whileHover={{ y: -4, scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="bg-card/70 backdrop-blur">
                  <CardHeader>
                    <CardDescription>{card.label}</CardDescription>
                    <CardTitle className="text-2xl">{card.value}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="outline">{card.delta}</Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="bg-card/70 backdrop-blur">
              <CardHeader>
                <CardTitle>Live ride status</CardTitle>
                <CardDescription>
                  {latestRide
                    ? "Tracking your most recent ride."
                    : "No recent rides yet."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="text-lg font-semibold">{statusLabel}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Route</p>
                    <p className="text-sm font-semibold">
                      {latestRide
                        ? `${latestRide.pickup} -> ${latestRide.destination}`
                        : "Add a ride to see updates"}
                    </p>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-foreground"
                      style={{ width: latestRide ? "70%" : "30%" }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/70 backdrop-blur">
              <CardHeader>
                <CardTitle>Fare estimation</CardTitle>
                <CardDescription>
                  {latestRide
                    ? "Based on your latest ride request."
                    : "Create a ride to see estimates."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Typical fare</p>
                    {fareLoading ? (
                      <div className="mt-2">
                        <Skeleton className="h-7 w-24" />
                      </div>
                    ) : (
                      <p className="text-2xl font-semibold">
                        {fareEstimate?.fare
                          ? `₹${Number(fareEstimate.fare).toFixed(2)}`
                          : "--"}
                      </p>
                    )}
                  </div>
                  <Badge variant="success">Best window</Badge>
                </div>
                <div className="mt-4 grid gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>AI optimization</span>
                    <span>Optimized by 12% (₹38 saved)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Traffic impact</span>
                    <span>Low</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Surge risk</span>
                    <span>Minimal</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="bg-card/70 backdrop-blur">
            <CardHeader>
              <CardTitle>Map preview</CardTitle>
              <CardDescription>Live zone coverage preview.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative h-[320px] overflow-hidden rounded-[var(--radius)] border border-border/60 bg-muted">
                <div ref={mapRef} className="h-full w-full" />
                {!latestRide && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <p className="text-lg font-semibold">Set a ride to preview</p>
                    <p className="text-sm text-muted-foreground">
                      We will render pickup and drop-off markers here.
                    </p>
                  </div>
                )}
                {latestRide && !pickupCoords && !destinationCoords && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Skeleton className="h-6 w-32" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/70 backdrop-blur">
            <CardHeader>
              <CardTitle>Service highlights</CardTitle>
              <CardDescription>Personalized to your recent rides.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-foreground">AI route stacking</p>
                  <p>Reduce pickup times by grouping nearby riders.</p>
                </div>
                <Badge variant="outline">New</Badge>
              </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-foreground">Priority support</p>
                  <p>Get instant help from our premium concierge team.</p>
                </div>
                <Badge variant="outline">Pro</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
