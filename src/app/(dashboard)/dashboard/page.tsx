"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  getStatusBadgeVariant,
  type Vehicle,
  type Mission,
} from "@/lib/data/fleet";
import {
  getCurrentUser,
  listVehicles,
  listMissions,
  listInterventions,
  seedDemoData,
  type InterventionItem,
} from "@/lib/data/api";

export default function DashboardPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [interventions, setInterventions] = useState<InterventionItem[]>([]);
  const [userLabel, setUserLabel] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [v, m, i, user] = await Promise.all([
        listVehicles(),
        listMissions(),
        listInterventions(200),
        getCurrentUser(),
      ]);
      setVehicles(v);
      setMissions(m);
      setInterventions(i);
      setUserLabel(user.fullName || user.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load fleet data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSeed() {
    setSeeding(true);
    setError(null);
    try {
      await seedDemoData();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load demo data");
    } finally {
      setSeeding(false);
    }
  }

  const activeVehicles = vehicles.filter((v) => v.status === "active");
  const runningMissions = missions.filter((m) => m.status === "in_progress");
  const dayAgo = Date.now() - 24 * 3600 * 1000;
  const interventionsToday = interventions.filter(
    (i) => new Date(i.startedAt).getTime() >= dayAgo
  ).length;
  const fleetScore =
    vehicles.length > 0
      ? Math.round(
          vehicles.reduce((sum, v) => sum + v.fleetScore, 0) / vehicles.length
        )
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Fleet overview &mdash; {userLabel}
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center gap-4 text-center">
            <div>
              <p className="font-semibold">No vehicles in your fleet yet</p>
              <p className="text-sm text-muted-foreground">
                Load demo data to explore the dashboard with a sample fleet,
                routes, missions, and behavior events.
              </p>
            </div>
            <Button onClick={handleSeed} disabled={seeding}>
              {seeding ? "Loading demo data…" : "Load demo data"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Active Vehicles"
              value={String(activeVehicles.length)}
              description={`of ${vehicles.length} total in fleet`}
            />
            <MetricCard
              title="Running Missions"
              value={String(runningMissions.length)}
              description="Currently in progress"
            />
            <MetricCard
              title="Interventions Today"
              value={String(interventionsToday)}
              description="Operator interventions in last 24h"
            />
            <MetricCard
              title="Fleet Score"
              value={String(fleetScore)}
              description="Average across all vehicles"
            />
          </div>

          {/* Vehicle status grid */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Vehicle Status</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {vehicles.map((vehicle) => (
                <Link key={vehicle.id} href={`/fleet/${vehicle.id}`}>
                  <Card className="hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {vehicle.name}
                      </CardTitle>
                      <Badge variant={getStatusBadgeVariant(vehicle.status)} className="text-xs capitalize">
                        {vehicle.status}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Type</p>
                          <p className="font-medium capitalize">{vehicle.type}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Level</p>
                          <p className="font-medium">{vehicle.autonomyLevel}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Battery</p>
                          <p className="font-medium">{vehicle.batteryPct}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Score</p>
                          <p className="font-medium">{vehicle.fleetScore}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
