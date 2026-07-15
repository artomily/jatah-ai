import { mulberry32 } from "@/lib/billing";
import { round4, startOfToday } from "@/lib/format";
import { getAgentsByCreator } from "@/lib/data/agents";

const DAY = 24 * 60 * 60 * 1000;

export const CREATOR_PERSONA_ID = "nova-works";

export interface EarningsPoint {
  day: number;
  usage: number;
  passes: number;
}

export interface AgentEarnings {
  agentId: string;
  usage: number;
  passes: number;
  runs30d: number;
  activePassHolders: number;
}

export interface CreatorStats {
  series90d: EarningsPoint[];
  lifetime: number;
  thisMonth: number;
  last30d: number;
  runsServed: number;
  activePassHolders: number;
  perAgent: AgentEarnings[];
}

/**
 * Static demo stats for the Nova Works persona. Deterministic per `now`
 * (call from mounted client components only).
 */
export function getCreatorStats(now: number): CreatorStats {
  const rng = mulberry32(0x9047a);
  const today = startOfToday(now);
  const series90d: EarningsPoint[] = [];

  for (let i = 89; i >= 0; i--) {
    const day = today - i * DAY;
    const growth = 1 + (89 - i) / 140; // slow ramp over the quarter
    const weekday = new Date(day).getDay();
    const seasonality = weekday === 0 || weekday === 6 ? 0.55 : 1;
    const usage = round4((14 + rng() * 10) * growth * seasonality);
    const passes = round4(rng() < 0.5 ? (4 + rng() * 22) * growth * seasonality : 0);
    series90d.push({ day, usage, passes });
  }

  const monthStart = new Date(now);
  monthStart.setHours(0, 0, 0, 0);
  monthStart.setDate(1);
  const thisMonth = round4(
    series90d
      .filter((p) => p.day >= monthStart.getTime())
      .reduce((s, p) => s + p.usage + p.passes, 0),
  );
  const last30d = round4(
    series90d.slice(-30).reduce((s, p) => s + p.usage + p.passes, 0),
  );
  const quarter = round4(series90d.reduce((s, p) => s + p.usage + p.passes, 0));

  const agents = getAgentsByCreator(CREATOR_PERSONA_ID);
  const shares = [0.58, 0.27, 0.15]; // Scout, Draftsman, Meeting Distiller
  const quarterUsage = series90d.reduce((s, p) => s + p.usage, 0);
  const quarterPasses = series90d.reduce((s, p) => s + p.passes, 0);
  const perAgent: AgentEarnings[] = agents.map((agent, i) => ({
    agentId: agent.id,
    usage: round4(quarterUsage * (shares[i] ?? 0.1)),
    passes: round4(quarterPasses * (shares[i] ?? 0.1)),
    runs30d: Math.round((agent.runsCount / 340) * (0.8 + rng() * 0.4)),
    activePassHolders: [312, 141, 87][i] ?? 40,
  }));

  return {
    series90d,
    lifetime: round4(quarter * 3.6), // platform launched well before this quarter
    thisMonth,
    last30d,
    runsServed: perAgent.reduce((s, a) => s + a.runs30d, 0),
    activePassHolders: perAgent.reduce((s, a) => s + a.activePassHolders, 0),
    perAgent,
  };
}
