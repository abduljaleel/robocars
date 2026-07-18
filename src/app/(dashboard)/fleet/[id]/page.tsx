"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getStatusBadgeVariant,
  getSeverityBadgeVariant,
  formatDate,
  type Vehicle,
  type VehicleStatus,
  type Mission,
  type BehaviorEvent,
} from "@/lib/data/fleet";
import { Button } from "@/components/ui/button";
import {
  getVehicle,
  listMissionsForVehicle,
  listEventsForVehicle,
  listInterventionsForVehicle,
  updateVehicleStatus,
  updateIntervention,
  deriveTelemetry,
  type InterventionItem,
} from "@/lib/data/api";

export default function VehicleDetailPage() {
  const params = useParams();
  const vehicleId = params.id as string;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [events, setEvents] = useState<BehaviorEvent[]>([]);
  const [interventions, setInterventions] = useState<InterventionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const v = await getVehicle(vehicleId);
        setVehicle(v);
        if (v) {
          const [m, e, i] = await Promise.all([
            listMissionsForVehicle(vehicleId),
            listEventsForVehicle(vehicleId),
            listInterventionsForVehicle(vehicleId),
          ]);
          setMissions(m);
          setEvents(e);
          setInterventions(i);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load vehicle");
      } finally {
        setLoading(false);
      }
    })();
  }, [vehicleId]);

  async function handleResolve(interventionId: string) {
    setResolvingId(interventionId);
    setError(null);
    try {
      const updated = await updateIntervention(interventionId, {
        outcome: "resumed",
      });
      setInterventions((prev) =>
        prev.map((i) => (i.id === interventionId ? updated : i))
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to resolve intervention"
      );
    } finally {
      setResolvingId(null);
    }
  }

  async function handleStatusChange(status: VehicleStatus) {
    if (!vehicle || status === vehicle.status) return;
    const previous = vehicle;
    setSavingStatus(true);
    setVehicle({ ...vehicle, status });
    try {
      await updateVehicleStatus(vehicle.id, status);
    } catch (err) {
      setVehicle(previous);
      setError(
        err instanceof Error ? err.message : "Failed to update vehicle status"
      );
    } finally {
      setSavingStatus(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Vehicle Not Found</h1>
        <p className="text-muted-foreground">
          No vehicle with ID &quot;{vehicleId}&quot; exists.
        </p>
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  const telemetry = deriveTelemetry(vehicle);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{vehicle.name}</h1>
          <p className="text-muted-foreground">{vehicle.location}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant={getStatusBadgeVariant(vehicle.status)}
            className="capitalize text-sm px-3 py-1"
          >
            {vehicle.status}
          </Badge>
          <Select
            value={vehicle.status}
            onValueChange={(v) => handleStatusChange((v ?? "idle") as VehicleStatus)}
            disabled={savingStatus}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Set status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="idle">Idle</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {/* Overview cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Type</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold capitalize">{vehicle.type}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Autonomy Level</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{vehicle.autonomyLevel}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Battery</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{vehicle.batteryPct}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Fleet Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{vehicle.fleetScore}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="status">
        <TabsList>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="missions">Missions ({missions.length})</TabsTrigger>
          <TabsTrigger value="interventions">
            Interventions ({interventions.length})
          </TabsTrigger>
          <TabsTrigger value="events">Behavior Events ({events.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Telemetry</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Speed</p>
                  <p className="text-xl font-bold">{telemetry.speed} km/h</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Heading</p>
                  <p className="text-xl font-bold">{telemetry.heading}&deg;</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CPU Load</p>
                  <p className="text-xl font-bold">{telemetry.cpuLoad}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sensor Status</p>
                  <Badge
                    variant={
                      telemetry.sensorStatus === "nominal"
                        ? "default"
                        : telemetry.sensorStatus === "degraded"
                        ? "outline"
                        : "destructive"
                    }
                    className="capitalize"
                  >
                    {telemetry.sensorStatus}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Battery</p>
                  <p className="text-xl font-bold">{telemetry.batteryPct}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Ping</p>
                  <p className="text-sm font-medium">{formatDate(telemetry.lastPing)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="missions" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Route</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead className="text-right">Interventions</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {missions.map((mission) => (
                    <TableRow key={mission.id}>
                      <TableCell className="font-medium">
                        {mission.routeName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize text-xs">
                          {mission.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(mission.startedAt)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {mission.interventions}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {mission.score || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {missions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No missions recorded
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interventions" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Resolved</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {interventions.map((intervention) => {
                    const isPending =
                      !intervention.resolvedAt &&
                      (intervention.outcome ?? "pending") === "pending";
                    return (
                      <TableRow key={intervention.id}>
                        <TableCell className="font-medium capitalize">
                          {intervention.type.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm">
                          {intervention.reason}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(intervention.startedAt)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {intervention.resolvedAt
                            ? formatDate(intervention.resolvedAt)
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize text-xs">
                            {(intervention.outcome ?? "pending").replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {isPending ? (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={resolvingId === intervention.id}
                              onClick={() => handleResolve(intervention.id)}
                            >
                              {resolvingId === intervention.id
                                ? "Resolving…"
                                : "Resolve"}
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {interventions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No interventions recorded
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium capitalize">
                        {event.type.replace("_", " ")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getSeverityBadgeVariant(event.severity)}
                          className="capitalize text-xs"
                        >
                          {event.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm">
                        {event.description}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {event.location}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(event.timestamp)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {events.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No behavior events recorded
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
