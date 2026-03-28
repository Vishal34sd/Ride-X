import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { getAccessToken, removeAccessToken } from "../helper/Token";
import { apiUrl } from "../lib/apiUrl";

const navItems = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Book Ride", path: "/book-ride" },
  { label: "Ride History", path: "/ride-history" },
  { label: "Payments", path: "/payments" },
  { label: "Settings", path: "/settings" },
];

const placeholderPaths = new Set(["/payments", "/settings"]);

export default function DashboardLayout({ children, title, description }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const stored = window.localStorage.getItem("ride-x-theme");
    const nextIsLight = stored ? stored === "light" : false;
    setIsDark(!nextIsLight);
    root.classList.toggle("light", nextIsLight);
  }, []);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setUserProfile(null);
      setUserLoading(false);
      return;
    }

    const fetchProfile = async () => {
      setUserLoading(true);
      try {
        const res = await axios.get(apiUrl("/api/v1/users/profile"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUserProfile(res.data?.userProfile || null);
      } catch (error) {
        console.error("Failed to load dashboard profile", error);
        setUserProfile(null);
      } finally {
        setUserLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("light", !next);
      window.localStorage.setItem("ride-x-theme", next ? "dark" : "light");
      return next;
    });
  };

  const handleLogout = async () => {
    const token = getAccessToken();
    if (!token || logoutLoading) return;

    setLogoutLoading(true);
    try {
      await axios.get(apiUrl("/api/v1/users/logout"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      removeAccessToken();
      setUserProfile(null);
      setUserLoading(false);
      setLogoutLoading(false);
      navigate("/login");
    }
  };

  const activeLabel = useMemo(() => {
    const match = navItems.find((item) => item.path === location.pathname);
    return match?.label || "Dashboard";
  }, [location.pathname]);

  const profileName = userProfile
    ? `${userProfile.fullname?.firstname || ""} ${
        userProfile.fullname?.lastname || ""
      }`.trim()
    : "Guest";
  const firstName = userProfile?.fullname?.firstname || "";
  const profileLabel = userProfile ? "Premium Rider" : "Sign in";
  const initials = profileName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "RX";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative flex">
        <motion.aside
          animate={{ width: collapsed ? 86 : 260 }}
          className={cn(
            "sticky top-0 hidden h-screen shrink-0 border-r border-border/60 bg-sidebar/80 p-4 backdrop-blur-xl md:flex",
            collapsed ? "items-center" : "items-stretch"
          )}
        >
          <div className="flex h-full w-full flex-col">
            <div
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius)] border border-border/60 bg-card/70 p-3",
                collapsed ? "justify-center" : "justify-between"
              )}
            >
              <div className={cn("flex items-center gap-3", collapsed && "hidden")}>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background text-sm font-semibold">
                  RX
                </div>
                <div>
                  <p className="text-sm font-semibold">Ride-X</p>
                  <p className="text-xs text-muted-foreground">Premium Console</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed((prev) => !prev)}
                className="h-9 w-9"
                aria-label="Toggle sidebar"
              >
                <span className="text-lg">{collapsed ? ">" : "<"}</span>
              </Button>
            </div>

            <div className={cn("mt-6 flex flex-col gap-2", collapsed && "items-center")}
            >
              {navItems.map((item) => {
                if (item.label === "Settings") {
                  return (
                    <div key={item.path} className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => setShowSettings((prev) => !prev)}
                        className={cn(
                          "flex items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm font-medium transition",
                          "text-sidebar-foreground hover:bg-sidebar-accent/80",
                          collapsed && "h-10 w-10 justify-center px-0"
                        )}
                      >
                        <span className="h-2.5 w-2.5 rounded-full bg-current" />
                        <span className={cn("truncate", collapsed && "hidden")}>
                          Settings
                        </span>
                        {!collapsed && (
                          <span className="ml-auto text-xs text-muted-foreground">
                            {showSettings ? "Hide" : "Open"}
                          </span>
                        )}
                      </button>
                      {showSettings && !collapsed && (
                        <div className="flex flex-col gap-2 pl-8">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={toggleTheme}
                          >
                            Switch to {isDark ? "Light" : "Dark"} Mode
                          </Button>
                          {userProfile && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={handleLogout}
                              disabled={logoutLoading}
                            >
                              {logoutLoading ? "Logging out..." : "Logout"}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }

                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={placeholderPaths.has(item.path) ? "/dashboard" : item.path}
                    className={cn(
                      "flex items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm font-medium transition",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/80",
                      collapsed && "h-10 w-10 justify-center px-0"
                    )}
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-current" />
                    <span className={cn("truncate", collapsed && "hidden")}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-auto space-y-3">
              {!collapsed && (
                <div className="rounded-[var(--radius)] border border-border/60 bg-card/70 p-4 text-xs text-muted-foreground">
                  <p className="text-sm font-semibold text-foreground">Pro Tip</p>
                  <p className="mt-2">
                    Use smart fare alerts to lock in the lowest rates.
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 px-6 py-4 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {activeLabel}
                </p>
                <h1 className="text-2xl font-semibold">
                  {activeLabel === "Dashboard" && firstName
                    ? `Welcome back ${firstName}`
                    : (title || "Ride-X Console")}
                </h1>
                {description && (
                  <p className="text-sm text-muted-foreground">{description}</p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" aria-label="Notifications">
                  <span className="text-lg">*</span>
                </Button>
                <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-3 py-2">
                  <span className="h-8 w-8 rounded-full bg-foreground text-background text-xs font-semibold flex items-center justify-center">
                    {userLoading ? "--" : initials}
                  </span>
                  <div className="text-xs">
                    <p className="font-semibold">
                      {userLoading ? "Loading..." : profileName}
                    </p>
                    <p className="text-muted-foreground">{profileLabel}</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <AnimatePresence mode="wait">
            <motion.main
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex-1 px-6 py-8"
            >
              {children}
            </motion.main>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
