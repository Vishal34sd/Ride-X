import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";

const featureItems = [
  {
    title: "Real-time ride tracking",
    description: "Follow every turn with dynamic live status updates.",
  },
  {
    title: "Smart fare estimation",
    description: "Predict pricing windows and lock in best fares.",
  },
  {
    title: "AI-powered suggestions",
    description: "Personalized pickup times that save minutes.",
  },
];

const testimonials = [
  {
    name: "Avery Patel",
    role: "Operations Lead",
    quote:
      "Ride-X feels like a premium control room for mobility. Our team cut booking time in half.",
  },
  {
    name: "Monica Li",
    role: "Product Designer",
    quote:
      "The UI is flawless and the ride intelligence keeps us moving fast.",
  },
  {
    name: "Jonas Wright",
    role: "Founder",
    quote:
      "We scaled our travel workflow without extra operations overhead.",
  },
];

const pricing = [
  {
    name: "Starter",
    price: "$39",
    perks: ["Smart fare alerts", "Live ride tracking", "Standard support"],
  },
  {
    name: "Premium",
    price: "$89",
    perks: ["Priority dispatch", "AI ride assistant", "Premium support"],
  },
  {
    name: "Enterprise",
    price: "Custom",
    perks: ["Fleet analytics", "Dedicated success team", "Custom SLA"],
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative overflow-hidden">
        <motion.div
          className="pointer-events-none absolute inset-0"
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute -top-32 right-[-10%] h-[420px] w-[420px] rounded-full bg-muted/60 blur-3xl" />
          <div className="absolute bottom-0 left-[-10%] h-[360px] w-[360px] rounded-full bg-accent/60 blur-3xl" />
        </motion.div>

        <nav className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <Link to="/" className="flex flex-col text-2xl font-semibold tracking-tight">
            <span>Ride-X</span>
            <span className="mt-2 h-[2px] w-12 rounded-full bg-foreground" />
          </Link>
          <div className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a
              href="#ride"
              className="transition hover:text-foreground"
            >
              Ride
            </a>
            <a
              href="#solutions"
              className="transition hover:text-foreground"
            >
              Solutions
            </a>
            <a
              href="#pricing"
              className="transition hover:text-foreground"
            >
              Pricing
            </a>
            <a
              href="#support"
              className="transition hover:text-foreground"
            >
              Support
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link to="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </nav>

        <section
          id="ride"
          className="relative z-10 mx-auto grid w-full max-w-6xl gap-10 px-6 pb-20 pt-12 lg:grid-cols-[1.1fr_0.9fr]"
        >
          <div className="space-y-6">
            <Badge variant="outline">Premium mobility SaaS</Badge>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              Book Rides Smarter with Ride-X
            </h1>
            <p className="text-lg text-muted-foreground">
              A premium command center for ride booking, tracking, and
              optimization. Built for teams that move fast.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/book-ride">
                <Button size="lg">Book Ride</Button>
              </Link>
              <Link to="/register">
                <Button size="lg" variant="outline">
                  Get Started
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>Live dispatch intelligence</span>
              <span>|</span>
              <span>Precision fare control</span>
              <span>|</span>
              <span>24/7 premium support</span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="rounded-[var(--radius)] border border-border/60 bg-card/60 p-6 shadow-lg backdrop-blur"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-muted-foreground">
                  Live map pulse
                </p>
                <p className="text-lg font-semibold">Downtown, 12 vehicles</p>
              </div>
              <Badge>Active</Badge>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { label: "North", value: "6 cars" },
                { label: "Midtown", value: "9 cars" },
                { label: "South", value: "4 cars" },
                { label: "Airport", value: "2 cars" },
                { label: "East", value: "5 cars" },
                { label: "West", value: "7 cars" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex h-16 flex-col justify-center rounded-[var(--radius)] border border-border/60 bg-muted/60 px-3"
                >
                  <p className="text-[11px] uppercase text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-[var(--radius)] border border-border/60 bg-background/70 p-4">
              <p className="text-sm font-semibold">AI trip assistant</p>
              <p className="text-xs text-muted-foreground">
                Suggesting optimal pickup spot based on traffic heatmaps.
              </p>
            </div>
          </motion.div>
        </section>
      </div>

      <section id="solutions" className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Features</p>
            <h2 className="text-3xl font-semibold">Designed for premium ride ops</h2>
          </div>
          <Button variant="outline">Explore platform</Button>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {featureItems.map((feature) => (
            <motion.div key={feature.title} whileHover={{ y: -6 }}>
              <Card className="h-full bg-card/70 backdrop-blur">
                <CardHeader>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost">Learn more</Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="support" className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <p className="text-xs uppercase text-muted-foreground">Testimonials</p>
            <h2 className="text-3xl font-semibold">Trusted by teams on the move</h2>
            <div className="grid gap-4">
              {testimonials.map((item) => (
                <Card key={item.name} className="bg-card/70 backdrop-blur">
                  <CardHeader>
                    <CardTitle>{item.name}</CardTitle>
                    <CardDescription>{item.role}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">"{item.quote}"</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <Card className="bg-card/70 backdrop-blur">
            <CardHeader>
              <CardTitle>Premium insights</CardTitle>
              <CardDescription>Dispatch intelligence, delivered.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[var(--radius)] border border-border/60 bg-muted/50 p-4">
                <p className="text-sm font-semibold">Real-time demand heatmap</p>
                <p className="text-xs text-muted-foreground">
                  Highlighted zones show 18% faster pickups.
                </p>
              </div>
              <div className="rounded-[var(--radius)] border border-border/60 bg-muted/50 p-4">
                <p className="text-sm font-semibold">Surge forecasting</p>
                <p className="text-xs text-muted-foreground">
                  Plan rides before price spikes hit.
                </p>
              </div>
              <Button className="w-full">See analytics</Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="pricing" className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Pricing</p>
            <h2 className="text-3xl font-semibold">Plans for every scale</h2>
          </div>
          <Badge variant="outline">Monthly billing</Badge>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {pricing.map((plan) => (
            <Card key={plan.name} className="bg-card/70 backdrop-blur">
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription className="text-2xl font-semibold text-foreground">
                  {plan.price}
                  <span className="text-sm text-muted-foreground"> / month</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                {plan.perks.map((perk) => (
                  <div key={perk} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-foreground" />
                    <span>{perk}</span>
                  </div>
                ))}
                <Button className="mt-3 w-full">Choose plan</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
