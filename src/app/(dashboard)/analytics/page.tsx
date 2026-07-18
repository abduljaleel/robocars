"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getStatusBadgeVariant,
  type Vehicle,
  type Mission,
  type BehaviorEvent,
} from "@/lib/data/fleet";
import {
  listVehicles,
  listMissions,
  listBehaviorEvents,
} from "@/lib/data/api";

export default function AnalyticsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [behaviorEvents, setBehaviorEvents] = useState<BehaviorEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [v, m, e] = await Promise.all([
          listVehicles(),
          listMissions(),
          listBehaviorEvents(200),
        ]);
        setVehicles(v);
        setMissions(m);
        setBehaviorEvents(e);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load analytics"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Share of a vehicle's missions that required at least one intervention.
  // A true percentage (0–100), derived from a single source (the mission's
  // interventions_count), so it can never exceed 100%.
  const vehicleInterventionRates = vehicles.map((v) => {
    const vehicleMissions = missions.filter((m) => m.vehicleId === v.id);
    const missionsWithIntervention = vehicleMissions.filter(
      (m) => m.interventions > 0
    ).length;
    const rate =
      vehicleMissions.length > 0
        ? Math.round((missionsWithIntervention / vehicleMissions.length) * 100)
        : 0;
    return { ...v, interventionRate: rate, missionCount: vehicleMissions.length };
  });

  const maxRate = Math.max(
    ...vehicleInterventionRates.map((v) => v.interventionRate),
    1
  );

  // Performance distribution
  const completedMissions = missions.filter((m) => m.status === "completed");
  const scoreRanges = [
    { label: "90-100", count: completedMissions.filter((m) => m.score >= 90).length },
    { label: "80-89", count: completedMissions.filter((m) => m.score >= 80 && m.score < 90).length },
    { label: "70-79", count: completedMissions.filter((m) => m.score >= 70 && m.score < 80).length },
    { label: "<70", count: completedMissions.filter((m) => m.score < 70).length },
  ];
  const maxScoreCount = Math.max(...scoreRanges.map((s) => s.count), 1);

  // Severity breakdown
  const severityCounts = {
    info: behaviorEvents.filter((e) => e.severity === "info").length,
    warning: behaviorEvents.filter((e) => e.severity === "warning").length,
    critical: behaviorEvents.filter((e) => e.severity === "critical").length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Fleet performance insights and behavioral analysis
          </p>
        </div>
        <Skeleton className="h-64 w-full" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Fleet performance insights and behavioral analysis
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {!error && vehicles.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No fleet data yet. Load demo data from the dashboard to see
            analytics.
          </CardContent>
        </Card>
      )}

      {vehicles.length > 0 && (
        <>
          {/* Intervention Rate Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Intervention Rate by Vehicle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {vehicleInterventionRates.map((v) => (
                  <div key={v.id} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-40 truncate">
                      {v.name}
                    </span>
                    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          v.interventionRate > 50
                            ? "bg-red-500"
                            : v.interventionRate > 25
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{
                          width: `${(v.interventionRate / maxRate) * 100}%`,
                          minWidth: v.interventionRate > 0 ? "8px" : "0",
                        }}
                      />
                    </div>
                    <span className="text-sm font-mono w-12 text-right">
                      {v.interventionRate}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Performance Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Mission Score Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-4 h-48">
                  {scoreRanges.map((range) => (
                    <div
                      key={range.label}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <span className="text-xs font-medium">{range.count}</span>
                      <div
                        className="w-full bg-primary rounded-t"
                        style={{
                          height: `${(range.count / maxScoreCount) * 100}%`,
                          minHeight: range.count > 0 ? "4px" : "0",
                        }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {range.label}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Event Severity Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Behavior Events by Severity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <SeverityRow
                    label="Info"
                    count={severityCounts.info}
                    total={behaviorEvents.length}
                    color="bg-blue-500"
                  />
                  <SeverityRow
                    label="Warning"
                    count={severityCounts.warning}
                    total={behaviorEvents.length}
                    color="bg-amber-500"
                  />
                  <SeverityRow
                    label="Critical"
                    count={severityCounts.critical}
                    total={behaviorEvents.length}
                    color="bg-red-500"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vehicle Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {vehicleInterventionRates
                  .sort((a, b) => b.fleetScore - a.fleetScore)
                  .map((v, i) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono text-muted-foreground w-6">
                          #{i + 1}
                        </span>
                        <div>
                          <p className="font-medium text-sm">{v.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {v.type} &middot; {v.autonomyLevel}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-right">
                          <p className="text-muted-foreground text-xs">Score</p>
                          <p className="font-bold">{v.fleetScore}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground text-xs">Missions</p>
                          <p className="font-mono">{v.missionCount}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground text-xs">Int. Rate</p>
                          <p className="font-mono">{v.interventionRate}%</p>
                        </div>
                        <Badge
                          variant={getStatusBadgeVariant(v.status)}
                          className="capitalize text-xs"
                        >
                          {v.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function SeverityRow({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {count} ({pct}%)
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%`, minWidth: count > 0 ? "4px" : "0" }}
        />
      </div>
    </div>
  );
}
