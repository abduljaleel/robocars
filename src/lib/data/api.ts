import { createClient } from "@/lib/supabase/client";
import {
  vehicles as seedVehicles,
  routes as seedRoutes,
  missions as seedMissions,
  behaviorEvents as seedEvents,
  type Vehicle,
  type VehicleType,
  type VehicleStatus,
  type AutonomyLevel,
  type Route,
  type Mission,
  type MissionStatus,
  type BehaviorEvent,
  type EventSeverity,
  type Telemetry,
} from "@/lib/data/fleet";

// ── Context ────────────────────────────────────────────────────────────────

export async function getCtx() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();
  if (!profile?.org_id) throw new Error("No organization found for user");
  return { supabase, userId: user.id, orgId: profile.org_id as string };
}

export async function getCurrentUser(): Promise<{
  email: string;
  fullName: string | null;
}> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return {
    email: user?.email ?? "",
    fullName: (user?.user_metadata?.full_name as string | undefined) ?? null,
  };
}

// ── DB row shapes ──────────────────────────────────────────────────────────

interface VehicleLocationJson {
  label?: string;
  battery_pct?: number;
  fleet_score?: number;
  total_missions?: number;
}

interface VehicleRow {
  id: string;
  org_id: string;
  name: string;
  vehicle_type: string | null;
  status: string | null;
  autonomy_level: string | null;
  current_location: VehicleLocationJson | null;
  last_seen_at: string | null;
  created_at: string;
}

interface RouteRow {
  id: string;
  org_id: string;
  name: string;
  waypoints: { label?: string }[] | null;
  distance_km: number | string | null;
  estimated_duration_min: number | null;
  route_type: string | null;
  risk_score: number | null;
  created_at: string;
}

interface MissionRow {
  id: string;
  vehicle_id: string | null;
  route_id: string | null;
  status: string | null;
  started_at: string | null;
  completed_at: string | null;
  interventions_count: number | null;
  performance_score: number | null;
  created_at: string;
  vehicles?: { name: string } | null;
  routes?: { name: string } | null;
}

interface InterventionRow {
  id: string;
  mission_id: string | null;
  vehicle_id: string | null;
  intervention_type: string | null;
  reason: string | null;
  initiated_by: string | null;
  started_at: string | null;
  resolved_at: string | null;
  outcome: string | null;
  created_at: string;
  vehicles?: { name: string } | null;
}

interface BehaviorEventRow {
  id: string;
  vehicle_id: string | null;
  mission_id: string | null;
  event_type: string | null;
  severity: string | null;
  location: { label?: string } | null;
  timestamp: string | null;
  metadata: { description?: string } | null;
  created_at: string;
  vehicles?: { name: string } | null;
}

// ── UI type for interventions (no seed equivalent) ────────────────────────

export interface InterventionItem {
  id: string;
  vehicleId: string;
  vehicleName: string;
  missionId: string | null;
  type: string;
  reason: string;
  startedAt: string;
  resolvedAt: string | null;
  outcome: string | null;
}

// ── Status mapping (DB queued/active/completed/aborted ↔ UI) ──────────────

function dbToUiMissionStatus(status: string | null): MissionStatus {
  switch (status) {
    case "active":
      return "in_progress";
    case "completed":
      return "completed";
    case "aborted":
      return "aborted";
    case "queued":
    default:
      return "scheduled";
  }
}

function uiToDbMissionStatus(status: MissionStatus): string {
  switch (status) {
    case "in_progress":
      return "active";
    case "completed":
      return "completed";
    case "aborted":
      return "aborted";
    case "scheduled":
    default:
      return "queued";
  }
}

// ── Row → UI mappers ───────────────────────────────────────────────────────

function mapVehicle(row: VehicleRow): Vehicle {
  const loc = row.current_location ?? {};
  return {
    id: row.id,
    name: row.name,
    type: (row.vehicle_type as VehicleType) ?? "shuttle",
    status: (row.status as VehicleStatus) ?? "idle",
    autonomyLevel: (row.autonomy_level as AutonomyLevel) ?? "L4",
    location: loc.label ?? "Unknown",
    batteryPct: loc.battery_pct ?? 100,
    totalMissions: loc.total_missions ?? 0,
    fleetScore: loc.fleet_score ?? 0,
    lastActive: row.last_seen_at ?? row.created_at,
  };
}

function mapRoute(row: RouteRow): Route {
  const waypoints = Array.isArray(row.waypoints) ? row.waypoints : [];
  return {
    id: row.id,
    name: row.name,
    origin: waypoints[0]?.label ?? "—",
    destination: waypoints[waypoints.length - 1]?.label ?? "—",
    distanceKm: Number(row.distance_km ?? 0),
    estimatedMinutes: row.estimated_duration_min ?? 0,
  };
}

function mapMission(row: MissionRow): Mission {
  return {
    id: row.id,
    vehicleId: row.vehicle_id ?? "",
    vehicleName: row.vehicles?.name ?? "Unknown vehicle",
    routeId: row.route_id ?? "",
    routeName: row.routes?.name ?? "Unknown route",
    status: dbToUiMissionStatus(row.status),
    startedAt: row.started_at ?? row.created_at,
    completedAt: row.completed_at,
    interventions: row.interventions_count ?? 0,
    score: row.performance_score ?? 0,
  };
}

function mapIntervention(row: InterventionRow): InterventionItem {
  return {
    id: row.id,
    vehicleId: row.vehicle_id ?? "",
    vehicleName: row.vehicles?.name ?? "Unknown vehicle",
    missionId: row.mission_id,
    type: row.intervention_type ?? "manual",
    reason: row.reason ?? "",
    startedAt: row.started_at ?? row.created_at,
    resolvedAt: row.resolved_at,
    outcome: row.outcome,
  };
}

function mapEvent(row: BehaviorEventRow): BehaviorEvent {
  return {
    id: row.id,
    vehicleId: row.vehicle_id ?? "",
    vehicleName: row.vehicles?.name ?? "Unknown vehicle",
    type: row.event_type ?? "unknown",
    severity: (row.severity as EventSeverity) ?? "info",
    timestamp: row.timestamp ?? row.created_at,
    description: row.metadata?.description ?? "",
    location: row.location?.label ?? "—",
  };
}

// ── Vehicles ───────────────────────────────────────────────────────────────

export async function listVehicles(): Promise<Vehicle[]> {
  const { supabase, orgId } = await getCtx();
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as VehicleRow[]).map(mapVehicle);
}

export async function getVehicle(id: string): Promise<Vehicle | null> {
  const { supabase } = await getCtx();
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapVehicle(data as VehicleRow) : null;
}

export async function createVehicle(input: {
  name: string;
  type: VehicleType;
  autonomyLevel: AutonomyLevel;
  location: string;
}): Promise<Vehicle> {
  const { supabase, orgId } = await getCtx();
  const { data, error } = await supabase
    .from("vehicles")
    .insert({
      org_id: orgId,
      name: input.name,
      vehicle_type: input.type,
      status: "idle",
      autonomy_level: input.autonomyLevel,
      current_location: {
        label: input.location,
        battery_pct: 100,
        fleet_score: 0,
        total_missions: 0,
      },
      last_seen_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapVehicle(data as VehicleRow);
}

export async function updateVehicleStatus(
  id: string,
  status: VehicleStatus
): Promise<void> {
  const { supabase } = await getCtx();
  const { error } = await supabase
    .from("vehicles")
    .update({ status, last_seen_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// ── Routes ─────────────────────────────────────────────────────────────────

export async function listRoutes(): Promise<Route[]> {
  const { supabase, orgId } = await getCtx();
  const { data, error } = await supabase
    .from("routes")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as RouteRow[]).map(mapRoute);
}

// ── Missions ───────────────────────────────────────────────────────────────

const MISSION_SELECT = "*, vehicles(name), routes(name)";

export async function listMissions(): Promise<Mission[]> {
  const { supabase } = await getCtx();
  const { data, error } = await supabase
    .from("missions")
    .select(MISSION_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as MissionRow[]).map(mapMission);
}

export async function listMissionsForVehicle(
  vehicleId: string
): Promise<Mission[]> {
  const { supabase } = await getCtx();
  const { data, error } = await supabase
    .from("missions")
    .select(MISSION_SELECT)
    .eq("vehicle_id", vehicleId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as MissionRow[]).map(mapMission);
}

export async function createMission(input: {
  vehicleId: string;
  routeId: string;
}): Promise<Mission> {
  const { supabase } = await getCtx();
  const { data, error } = await supabase
    .from("missions")
    .insert({
      vehicle_id: input.vehicleId,
      route_id: input.routeId,
      status: "queued",
      // started_at stays null until the mission actually transitions to
      // in_progress; mapMission falls back to created_at for display.
      interventions_count: 0,
    })
    .select(MISSION_SELECT)
    .single();
  if (error) throw new Error(error.message);
  return mapMission(data as MissionRow);
}

export async function updateMissionStatus(
  id: string,
  status: MissionStatus
): Promise<Mission> {
  const { supabase } = await getCtx();
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    status: uiToDbMissionStatus(status),
  };
  if (status === "in_progress") {
    patch.started_at = now;
    patch.completed_at = null;
  }
  if (status === "completed") {
    patch.completed_at = now;
    // Deterministic score derived from mission data: start at 100 and dock 15
    // points per operator intervention, floored at 40. Re-completing a mission
    // yields the same score rather than random noise.
    const { data: current } = await supabase
      .from("missions")
      .select("interventions_count")
      .eq("id", id)
      .maybeSingle();
    const interventionCount =
      (current as { interventions_count: number | null } | null)
        ?.interventions_count ?? 0;
    patch.performance_score = Math.max(40, 100 - 15 * interventionCount);
  }
  if (status === "aborted") {
    patch.completed_at = now;
  }
  const { data, error } = await supabase
    .from("missions")
    .update(patch)
    .eq("id", id)
    .select(MISSION_SELECT)
    .single();
  if (error) throw new Error(error.message);
  return mapMission(data as MissionRow);
}

// ── Interventions ──────────────────────────────────────────────────────────

const INTERVENTION_SELECT = "*, vehicles(name)";

export async function listInterventions(
  limit = 20
): Promise<InterventionItem[]> {
  const { supabase } = await getCtx();
  const { data, error } = await supabase
    .from("interventions")
    .select(INTERVENTION_SELECT)
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return ((data ?? []) as InterventionRow[]).map(mapIntervention);
}

export async function listInterventionsForVehicle(
  vehicleId: string
): Promise<InterventionItem[]> {
  const { supabase } = await getCtx();
  const { data, error } = await supabase
    .from("interventions")
    .select(INTERVENTION_SELECT)
    .eq("vehicle_id", vehicleId)
    .order("started_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as InterventionRow[]).map(mapIntervention);
}

export async function createIntervention(input: {
  vehicleId: string;
  missionId?: string | null;
  type: string;
  reason: string;
}): Promise<InterventionItem> {
  const { supabase, userId } = await getCtx();
  let missionId = input.missionId ?? null;
  if (!missionId) {
    // Attach to the vehicle's currently active mission, if any
    const { data: active } = await supabase
      .from("missions")
      .select("id")
      .eq("vehicle_id", input.vehicleId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    missionId = (active as { id: string } | null)?.id ?? null;
  }
  const { data, error } = await supabase
    .from("interventions")
    .insert({
      vehicle_id: input.vehicleId,
      mission_id: missionId,
      intervention_type: input.type,
      reason: input.reason,
      initiated_by: userId,
      started_at: new Date().toISOString(),
      outcome: "pending",
    })
    .select(INTERVENTION_SELECT)
    .single();
  if (error) throw new Error(error.message);
  return mapIntervention(data as InterventionRow);
}

export async function updateIntervention(
  id: string,
  input: { outcome: string; resolvedAt?: string | null }
): Promise<InterventionItem> {
  const { supabase } = await getCtx();
  const { data, error } = await supabase
    .from("interventions")
    .update({
      outcome: input.outcome,
      resolved_at: input.resolvedAt ?? new Date().toISOString(),
    })
    .eq("id", id)
    .select(INTERVENTION_SELECT)
    .single();
  if (error) throw new Error(error.message);
  return mapIntervention(data as InterventionRow);
}

// ── Behavior events ────────────────────────────────────────────────────────

const EVENT_SELECT = "*, vehicles(name)";

export async function listBehaviorEvents(
  limit = 50
): Promise<BehaviorEvent[]> {
  const { supabase } = await getCtx();
  const { data, error } = await supabase
    .from("behavior_events")
    .select(EVENT_SELECT)
    .order("timestamp", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return ((data ?? []) as BehaviorEventRow[]).map(mapEvent);
}

export async function listEventsForVehicle(
  vehicleId: string
): Promise<BehaviorEvent[]> {
  const { supabase } = await getCtx();
  const { data, error } = await supabase
    .from("behavior_events")
    .select(EVENT_SELECT)
    .eq("vehicle_id", vehicleId)
    .order("timestamp", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as BehaviorEventRow[]).map(mapEvent);
}

// ── Telemetry (derived deterministically from live vehicle state) ─────────

export function deriveTelemetry(vehicle: Vehicle): Telemetry {
  let hash = 0;
  for (const c of vehicle.id) hash = (hash * 31 + c.charCodeAt(0)) % 100000;
  const moving = vehicle.status === "active";
  return {
    speed: moving ? 20 + (hash % 46) : 0,
    heading: moving ? hash % 360 : 0,
    batteryPct: vehicle.batteryPct,
    cpuLoad:
      vehicle.status === "offline"
        ? 0
        : moving
        ? 30 + (hash % 40)
        : 5 + (hash % 10),
    sensorStatus:
      vehicle.status === "offline"
        ? "fault"
        : vehicle.status === "maintenance"
        ? "degraded"
        : "nominal",
    lastPing: vehicle.lastActive,
  };
}

// ── Demo data seeding ──────────────────────────────────────────────────────

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600 * 1000).toISOString();
}

function hoursFromNow(h: number): string {
  return new Date(Date.now() + h * 3600 * 1000).toISOString();
}

const ROUTE_TYPES: Record<string, string> = {
  "r-001": "urban",
  "r-002": "highway",
  "r-003": "industrial",
  "r-004": "campus",
  "r-005": "highway",
};

const ROUTE_RISK: Record<string, number> = {
  "r-001": 35,
  "r-002": 48,
  "r-003": 22,
  "r-004": 15,
  "r-005": 62,
};

// hours-ago offsets keyed by seed ids, so demo data always looks recent
const VEHICLE_SEEN_OFFSET: Record<string, number> = {
  "v-001": 0.05,
  "v-002": 0.12,
  "v-003": 0.0,
  "v-004": 0.08,
  "v-005": 0.17,
  "v-006": 1.5,
  "v-007": 16,
  "v-008": 43,
};

const MISSION_TIME_OFFSET: Record<string, { start: number; end: number | null }> = {
  "m-001": { start: 1.25, end: null },
  "m-002": { start: 0.75, end: null },
  "m-003": { start: 2.5, end: null },
  "m-004": { start: 3.0, end: 2.4 },
  "m-005": { start: 1.75, end: 1.5 },
  "m-006": { start: 3.75, end: 3.35 },
  "m-007": { start: -1.25, end: null }, // scheduled in the future
  "m-008": { start: 11.75, end: 11.45 },
};

const EVENT_TIME_OFFSET: Record<string, number> = {
  "be-001": 0.55,
  "be-002": 2.7,
  "be-003": 43,
  "be-004": 3.5,
  "be-005": 16,
  "be-006": 1.6,
  "be-007": 2.25,
  "be-008": 0.33,
};

// seed event id → seed mission id (for FK linkage)
const EVENT_MISSION: Record<string, string | null> = {
  "be-001": "m-002",
  "be-002": "m-004",
  "be-003": null,
  "be-004": "m-006",
  "be-005": null,
  "be-006": "m-005",
  "be-007": "m-003",
  "be-008": "m-002",
};

export async function seedDemoData(): Promise<void> {
  const { supabase, orgId, userId } = await getCtx();

  // 1) Routes
  const { data: routeRows, error: routeErr } = await supabase
    .from("routes")
    .insert(
      seedRoutes.map((r) => ({
        org_id: orgId,
        name: r.name,
        waypoints: [{ label: r.origin }, { label: r.destination }],
        distance_km: r.distanceKm,
        estimated_duration_min: r.estimatedMinutes,
        route_type: ROUTE_TYPES[r.id] ?? "standard",
        risk_score: ROUTE_RISK[r.id] ?? 30,
      }))
    )
    .select("id");
  if (routeErr) throw new Error(routeErr.message);
  const routeIdMap = new Map<string, string>();
  seedRoutes.forEach((r, i) => {
    routeIdMap.set(r.id, (routeRows as { id: string }[])[i].id);
  });

  // 2) Vehicles
  const { data: vehicleRows, error: vehicleErr } = await supabase
    .from("vehicles")
    .insert(
      seedVehicles.map((v) => ({
        org_id: orgId,
        name: v.name,
        vehicle_type: v.type,
        status: v.status,
        autonomy_level: v.autonomyLevel,
        current_location: {
          label: v.location,
          battery_pct: v.batteryPct,
          fleet_score: v.fleetScore,
          total_missions: v.totalMissions,
        },
        last_seen_at: hoursAgo(VEHICLE_SEEN_OFFSET[v.id] ?? 1),
      }))
    )
    .select("id");
  if (vehicleErr) throw new Error(vehicleErr.message);
  const vehicleIdMap = new Map<string, string>();
  seedVehicles.forEach((v, i) => {
    vehicleIdMap.set(v.id, (vehicleRows as { id: string }[])[i].id);
  });

  // 3) Missions (FK on vehicles + routes)
  const { data: missionRows, error: missionErr } = await supabase
    .from("missions")
    .insert(
      seedMissions.map((m) => {
        const offset = MISSION_TIME_OFFSET[m.id] ?? { start: 1, end: null };
        return {
          vehicle_id: vehicleIdMap.get(m.vehicleId),
          route_id: routeIdMap.get(m.routeId),
          status: uiToDbMissionStatus(m.status),
          started_at:
            offset.start < 0
              ? hoursFromNow(-offset.start)
              : hoursAgo(offset.start),
          completed_at: offset.end !== null ? hoursAgo(offset.end) : null,
          interventions_count: m.interventions,
          performance_score: m.score > 0 ? m.score : null,
        };
      })
    )
    .select("id");
  if (missionErr) throw new Error(missionErr.message);
  const missionIdMap = new Map<string, string>();
  seedMissions.forEach((m, i) => {
    missionIdMap.set(m.id, (missionRows as { id: string }[])[i].id);
  });

  // 4) Interventions (FK on missions + vehicles)
  const demoInterventions = [
    {
      mission: "m-002",
      vehicle: "v-002",
      type: "remote_pause",
      reason:
        "Operator paused vehicle after hard-brake event near crosswalk to verify pedestrian clearance.",
      start: 0.65,
      end: 0.6,
      outcome: "resumed",
    },
    {
      mission: "m-006",
      vehicle: "v-001",
      type: "teleop_takeover",
      reason:
        "Manual guidance through 5th Ave detour after route deviation around road closure.",
      start: 3.6,
      end: 3.45,
      outcome: "resumed",
    },
    {
      mission: "m-008",
      vehicle: "v-004",
      type: "reroute",
      reason:
        "Attempted remote reroute around stalled traffic; alternate path rejected by planner.",
      start: 11.7,
      end: 11.6,
      outcome: "failed",
    },
    {
      mission: "m-008",
      vehicle: "v-004",
      type: "return_to_base",
      reason:
        "Mission aborted by operator after failed reroute; vehicle recalled to depot.",
      start: 11.55,
      end: 11.45,
      outcome: "mission_aborted",
    },
  ];
  const { error: interventionErr } = await supabase.from("interventions").insert(
    demoInterventions.map((i) => ({
      mission_id: missionIdMap.get(i.mission),
      vehicle_id: vehicleIdMap.get(i.vehicle),
      intervention_type: i.type,
      reason: i.reason,
      initiated_by: userId,
      started_at: hoursAgo(i.start),
      resolved_at: hoursAgo(i.end),
      outcome: i.outcome,
    }))
  );
  if (interventionErr) throw new Error(interventionErr.message);

  // 5) Behavior events (FK on vehicles + missions)
  const { error: eventErr } = await supabase.from("behavior_events").insert(
    seedEvents.map((e) => {
      const seedMissionId = EVENT_MISSION[e.id];
      return {
        vehicle_id: vehicleIdMap.get(e.vehicleId),
        mission_id: seedMissionId ? missionIdMap.get(seedMissionId) ?? null : null,
        event_type: e.type,
        severity: e.severity,
        location: { label: e.location },
        timestamp: hoursAgo(EVENT_TIME_OFFSET[e.id] ?? 1),
        metadata: { description: e.description },
      };
    })
  );
  if (eventErr) throw new Error(eventErr.message);
}
