import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import CaptainNavbar from "../components/CaptainNavbar";
import { getAccessToken } from "../helper/Token";

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "ongoing", label: "Ongoing" },
  { key: "completed", label: "Completed" },
];

function normalizeTab(status) {
  const s = (status || "").toLowerCase();
  if (s === "ongoing") return "ongoing";
  if (s === "completed") return "completed";
  return "pending";
}

function statusLabelForRide(ride) {
  const status = (ride?.status || "-").toUpperCase();
  if (ride?.status === "confirmed") return "ACCEPTED";
  if (ride?.status === "cancelled") return "DECLINED";
  return status;
}

export default function CaptainRides() {
  const navigate = useNavigate();
  const [rides, setRides] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const tabCounts = useMemo(() => {
    const counts = { pending: 0, ongoing: 0, completed: 0 };

    for (const ride of rides) {
      const tab = normalizeTab(ride?.status);
      counts[tab] += 1;
    }

    return counts;
  }, [rides]);

  const filteredRides = useMemo(() => {
    return rides.filter((ride) => normalizeTab(ride?.status) === activeTab);
  }, [rides, activeTab]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      navigate("/login");
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    const fetchRides = async () => {
      setLoading(true);
      setErrorMsg("");
      try {
        const ridesRes = await axios.get(
          "http://localhost:8080/api/v1/rides/captain-rides",
          { headers }
        );
        setRides(Array.isArray(ridesRes.data?.rides) ? ridesRes.data.rides : []);
      } catch (e) {
        console.error("Failed to load captain rides", e);

        const status = e?.response?.status;
        if (status === 401 || status === 403) {
          navigate("/login");
          return;
        }

        setRides([]);
        setErrorMsg(
          e?.response?.data?.message ||
            `Rides not available${status ? ` (HTTP ${status})` : ""}`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRides();
  }, [navigate]);

  const tabClass = (tabKey) =>
    tabKey === activeTab
      ? "bg-black text-white"
      : "bg-white text-gray-800 hover:bg-gray-100";

  return (
    <>
      <CaptainNavbar />

      <div className="min-h-screen bg-gray-100 px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="bg-black text-white p-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold">All Rides</h1>
                <p className="text-sm text-gray-300">
                  View rides by status
                </p>
              </div>

              
            </div>

            <div className="p-6">
              <div className="flex flex-wrap gap-2">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setActiveTab(t.key)}
                    className={`rounded-full px-5 py-2 border transition ${tabClass(
                      t.key
                    )}`}
                  >
                    {t.label} ({tabCounts[t.key] || 0})
                  </button>
                ))}
              </div>

              <div className="mt-6">
                {loading ? (
                  <p className="text-gray-600">Loading rides...</p>
                ) : errorMsg ? (
                  <p className="text-gray-600">{errorMsg}</p>
                ) : filteredRides.length === 0 ? (
                  <p className="text-gray-600">No rides found.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredRides.map((ride) => (
                      <div
                        key={ride?._id}
                        className="rounded-2xl border bg-white overflow-hidden"
                      >
                        <div className="p-4 border-b flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-900">
                            {statusLabelForRide(ride)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {ride?.createdAt
                              ? new Date(ride.createdAt).toLocaleString()
                              : "-"}
                          </span>
                        </div>

                        <div className="p-4 space-y-3">
                          <div>
                            <p className="text-xs text-gray-500">Pickup</p>
                            <p className="font-medium text-gray-900">
                              {ride?.pickup || "-"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">Destination</p>
                            <p className="font-medium text-gray-900">
                              {ride?.destination || "-"}
                            </p>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Vehicle</span>
                            <span className="px-3 py-1 text-sm rounded-full bg-gray-200 text-gray-800">
                              {ride?.vehicleType || "-"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Fare</span>
                            <span className="font-semibold text-gray-900">
                              {typeof ride?.fare === "number" ? `₹${ride.fare}` : "-"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
