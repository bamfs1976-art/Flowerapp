// Confirmed referee assignments for upcoming fixtures
// Sourced from premierleague.com official match officials announcements

export interface RefereeAssignment {
  homeTeam: string;
  awayTeam: string;
  referee: string;
  date: string; // ISO format YYYY-MM-DD
  matchweek?: number;
  league?: string;
}

// In-memory store for referee assignments
let assignmentsCache: RefereeAssignment[] = [
  // ── Premier League Matchweek 31 (2025-26) ──
  // Source: premierleague.com/en/news/4610866
  {
    homeTeam: "Bournemouth",
    awayTeam: "Man United",
    referee: "S Attwell",
    date: "2026-03-20",
    matchweek: 31,
    league: "Premier League",
  },
  {
    homeTeam: "Brighton",
    awayTeam: "Liverpool",
    referee: "D England",
    date: "2026-03-21",
    matchweek: 31,
    league: "Premier League",
  },
  {
    homeTeam: "Everton",
    awayTeam: "Chelsea",
    referee: "S Barrott",
    date: "2026-03-21",
    matchweek: 31,
    league: "Premier League",
  },
  {
    homeTeam: "Fulham",
    awayTeam: "Burnley",
    referee: "C Kavanagh",
    date: "2026-03-21",
    matchweek: 31,
    league: "Premier League",
  },
  {
    homeTeam: "Leeds",
    awayTeam: "Brentford",
    referee: "J Gillett",
    date: "2026-03-21",
    matchweek: 31,
    league: "Premier League",
  },
  {
    homeTeam: "Aston Villa",
    awayTeam: "West Ham",
    referee: "A Taylor",
    date: "2026-03-21",
    matchweek: 31,
    league: "Premier League",
  },
  {
    homeTeam: "Newcastle",
    awayTeam: "Sunderland",
    referee: "P Tierney",
    date: "2026-03-22",
    matchweek: 31,
    league: "Premier League",
  },
  {
    homeTeam: "Tottenham",
    awayTeam: "Nott'm Forest",
    referee: "M Oliver",
    date: "2026-03-22",
    matchweek: 31,
    league: "Premier League",
  },
];

export function getRefereeAssignments(): RefereeAssignment[] {
  return assignmentsCache;
}

export function setRefereeAssignments(assignments: RefereeAssignment[]): void {
  assignmentsCache = assignments;
}

export function addRefereeAssignments(assignments: RefereeAssignment[]): void {
  assignmentsCache = [...assignmentsCache, ...assignments];
}

// Normalize team name for fuzzy matching between data sources
function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/\bfc\b/g, "")
    .replace(/\bafc\b/g, "")
    .replace(/\bcf\b/g, "")
    .replace(/\bsc\b/g, "")
    .replace(/\bac\b/g, "")
    .replace(/\bas\b/g, "")
    .replace(/\bssc\b/g, "")
    .replace(/\bud\b/g, "")
    .replace(/\bunited\b/g, "utd")
    .replace(/\bcity\b/g, "")
    .replace(/\btown\b/g, "")
    .replace(/\bwanderers\b/g, "")
    .replace(/\balbion\b/g, "")
    .replace(/\bhotspur\b/g, "")
    .replace(/\band\b/g, "")
    .replace(/\bhove\b/g, "")
    .replace(/\b& \b/g, "")
    .replace(/\bham\b/g, "ham")
    .replace(/\bnottingham\b/g, "nott'm")
    .replace(/\bnott'm\b/g, "nott'm")
    .replace(/\s+/g, " ")
    .trim();
}

function teamsFuzzyMatch(a: string, b: string): boolean {
  if (a === b) return true;
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return true;
  if (na.length >= 3 && nb.length >= 3) {
    if (na.includes(nb) || nb.includes(na)) return true;
  }
  return false;
}

// Find the confirmed referee for a fixture
export function findRefereeForFixture(
  homeTeam: string,
  awayTeam: string
): RefereeAssignment | null {
  return (
    assignmentsCache.find(
      (a) =>
        teamsFuzzyMatch(a.homeTeam, homeTeam) &&
        teamsFuzzyMatch(a.awayTeam, awayTeam)
    ) ?? null
  );
}
