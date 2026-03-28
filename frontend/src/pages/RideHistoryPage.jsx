import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import DashboardLayout from "../components/DashboardLayout";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { getAccessToken } from "../helper/Token";

const statusVariant = {
  completed: "success",
  cancelled: "destructive",
  ongoing: "warning",
};

export default function RideHistoryPage() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      setErrorMsg("Please log in to view ride history.");
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    const fetchRides = async () => {
      setLoading(true);
      setErrorMsg("");
      try {
        const res = await axios.get(
          "http://localhost:8080/api/v1/rides/user-rides",
          { headers }
        );
        setRides(Array.isArray(res.data?.rides) ? res.data.rides : []);
      } catch (error) {
        console.error("Failed to load ride history", error);
        setRides([]);
        setErrorMsg(
          error?.response?.data?.message || "Ride history not available."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRides();
  }, []);

  const filtered = useMemo(() => {
    return rides.filter((ride) => {
      const rideId = ride?._id || "";
      const pickup = ride?.pickup || "";
      const dropoff = ride?.destination || "";
      const matchesQuery =
        rideId.toLowerCase().includes(query.toLowerCase()) ||
        pickup.toLowerCase().includes(query.toLowerCase()) ||
        dropoff.toLowerCase().includes(query.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || ride.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [query, statusFilter, rides]);

  return (
    <DashboardLayout
      title="Ride history"
      description="Track every Ride-X journey with smart filters."
    >
      <Card className="bg-card/70 backdrop-blur">
        <CardHeader>
          <CardTitle>All rides</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by ID, pickup, or drop-off"
              className="md:max-w-sm"
            />
            <div className="flex flex-wrap gap-2">
              {[
                { label: "All", value: "all" },
                { label: "Completed", value: "completed" },
                { label: "Ongoing", value: "ongoing" },
                { label: "Cancelled", value: "cancelled" },
              ].map((item) => (
                <Button
                  key={item.value}
                  variant={statusFilter === item.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(item.value)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading rides...</p>
          ) : errorMsg ? (
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No rides found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ride ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Pickup</TableHead>
                  <TableHead>Drop-off</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Fare</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((ride) => (
                  <TableRow key={ride._id}>
                    <TableCell className="font-semibold">{ride._id}</TableCell>
                    <TableCell>
                      {ride.createdAt
                        ? new Date(ride.createdAt).toLocaleDateString()
                        : "--"}
                    </TableCell>
                    <TableCell>{ride.pickup || "--"}</TableCell>
                    <TableCell>{ride.destination || "--"}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[ride.status] || "outline"}>
                        {ride.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {Number.isFinite(Number(ride.fare))
                        ? `₹${Number(ride.fare).toFixed(2)}`
                        : "--"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
