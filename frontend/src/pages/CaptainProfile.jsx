import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import CaptainNavbar from "../components/CaptainNavbar";
import { getAccessToken } from "../helper/Token";
import { apiUrl } from "../lib/apiUrl";

export default function CaptainProfile() {
  const navigate = useNavigate();
  const [captain, setCaptain] = useState(null);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const statusCounts = useMemo(() => {
    const counts = {
      all: Array.isArray(rides) ? rides.length : 0,
      pending: 0,
      ongoing: 0,
      completed: 0,
    };

    for (const ride of rides) {
      const status = (ride?.status || "").toLowerCase();

      if (status === "ongoing") counts.ongoing += 1;
      else if (status === "completed") counts.completed += 1;
      else if (status === "pending" || status === "accepted" || status === "confirmed") {
        counts.pending += 1;
      }
    }

    return counts;
  }, [rides]);

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      navigate("/login");
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    const fetchData = async () => {
      setLoading(true);
      setErrorMsg("");
      try {
        const profileRes = await axios.get(
            apiUrl("/api/v1/captains/profile"),
          { headers }
        );
        const captainData = profileRes.data?.captain || null;
        setCaptain(captainData);

        try {
          const ridesRes = await axios.get(
              apiUrl("/api/v1/rides/captain-rides"),
            { headers }
          );
          setRides(Array.isArray(ridesRes.data?.rides) ? ridesRes.data.rides : []);
        } catch (ridesErr) {
          console.error("Failed to load captain rides", ridesErr);
          setRides([]);
        }
      } catch (e) {
        console.error("Failed to load captain profile", e);

        const status = e?.response?.status;
        if (status === 401 || status === 403) {
          navigate("/login");
          return;
        }

        setCaptain(null);
        setRides([]);
        setErrorMsg(
          e?.response?.data?.message ||
            `Profile not available${status ? ` (HTTP ${status})` : ""}`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  return (
    <>
      <CaptainNavbar />

      <div className="min-h-screen bg-background px-4 py-10">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-[var(--radius)] border border-border/60 bg-card/70 shadow-lg backdrop-blur overflow-hidden">
            <div className="border-b border-border/60 p-6">
              <h1 className="text-2xl font-semibold">Captain Profile</h1>
              <p className="text-sm text-muted-foreground">Manage your details</p>
            </div>

            <div className="p-6">
              {loading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : !captain ? (
                <div className="space-y-3">
                  <p className="text-muted-foreground">
                    {errorMsg || "Profile not available."}
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-[var(--radius)] border border-border/60">
                      <p className="text-xs text-muted-foreground">Name</p>
                      <p className="font-semibold text-foreground">
                        {captain?.fullname?.firstname} {captain?.fullname?.lastname}
                      </p>
                    </div>

                    <div className="p-4 rounded-[var(--radius)] border border-border/60">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-semibold text-foreground">{captain?.email}</p>
                    </div>

                    <div className="p-4 rounded-[var(--radius)] border border-border/60">
                      <p className="text-xs text-muted-foreground">Vehicle Type</p>
                      <p className="font-semibold text-foreground">
                        {captain?.vehicles?.vehicleType || captain?.vehicle?.vehicleType || "-"}
                      </p>
                    </div>

                    <div className="p-4 rounded-[var(--radius)] border border-border/60">
                      <p className="text-xs text-muted-foreground">Plate</p>
                      <p className="font-semibold text-foreground">
                        {captain?.vehicles?.plate || captain?.vehicle?.plate || "-"}
                      </p>
                    </div>

                    <div className="p-4 rounded-[var(--radius)] border border-border/60">
                      <p className="text-xs text-muted-foreground">Color</p>
                      <p className="font-semibold text-foreground">
                        {captain?.vehicles?.color || captain?.vehicle?.color || "-"}
                      </p>
                    </div>

                    <div className="p-4 rounded-[var(--radius)] border border-border/60">
                      <p className="text-xs text-muted-foreground">Capacity</p>
                      <p className="font-semibold text-foreground">
                        {captain?.vehicles?.capacity ?? captain?.vehicle?.capacity ?? "-"}
                      </p>
                    </div>

                    <div className="p-4 rounded-[var(--radius)] border border-border/60">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className="font-semibold text-foreground">{captain?.status || "-"}</p>
                    </div>
                  </div>


                  
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
