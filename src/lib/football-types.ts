// CSV data types for football-data.co.uk and related sources

// ── League definitions ──

export const CSV_LEAGUES = [
  { code: "E0", name: "Premier League", country: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { code: "D1", name: "Bundesliga", country: "Germany", flag: "🇩🇪" },
  { code: "I1", name: "Serie A", country: "Italy", flag: "🇮🇹" },
  { code: "SP1", name: "La Liga", country: "Spain", flag: "🇪🇸" },
  { code: "F1", name: "Ligue 1", country: "France", flag: "🇫🇷" },
  { code: "N1", name: "Eredivisie", country: "Netherlands", flag: "🇳🇱" },
  { code: "P1", name: "Primeira Liga", country: "Portugal", flag: "🇵🇹" },
  { code: "E1", name: "Championship", country: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
] as const;

export type LeagueCode = (typeof CSV_LEAGUES)[number]["code"];

// ── Raw CSV match row (from football-data.co.uk) ──

export interface CsvMatchRow {
  Div: string;       // League code (E0, SP1, etc.)
  Date: string;      // dd/mm/yy
  Time: string;      // HH:MM
  HomeTeam: string;
  AwayTeam: string;
  FTHG: number;      // Full Time Home Goals
  FTAG: number;      // Full Time Away Goals
  FTR: string;       // Full Time Result (H/D/A)
  HTHG: number;      // Half Time Home Goals
  HTAG: number;      // Half Time Away Goals
  HTR: string;       // Half Time Result
  Referee: string;
  HS: number;        // Home Shots
  AS: number;        // Away Shots
  HST: number;       // Home Shots on Target
  AST: number;       // Away Shots on Target
  HF: number;        // Home Fouls
  AF: number;        // Away Fouls
  HC: number;        // Home Corners
  AC: number;        // Away Corners
  HY: number;        // Home Yellow Cards
  AY: number;        // Away Yellow Cards
  HR: number;        // Home Red Cards
  AR: number;        // Away Red Cards
}

// ── Processed match (normalized from CSV) ──

export interface MatchData {
  id: string;
  league: string;
  leagueCode: string;
  date: string;        // ISO date
  time: string;
  homeTeam: string;
  awayTeam: string;
  ftHomeGoals: number;
  ftAwayGoals: number;
  ftResult: "H" | "D" | "A";
  htHomeGoals: number;
  htAwayGoals: number;
  htResult: string;
  referee: string;
  homeShots: number;
  awayShots: number;
  homeShotsOnTarget: number;
  awayShotsOnTarget: number;
  homeFouls: number;
  awayFouls: number;
  homeCorners: number;
  awayCorners: number;
  homeYellows: number;
  awayYellows: number;
  homeReds: number;
  awayReds: number;
  totalCards: number;
  isFinished: boolean;
}

// ── Player stats (from Kaggle / FBref CSV) ──

export interface PlayerStats {
  player: string;
  nation: string;
  position: string;
  squad: string;
  competition: string;
  age: number;
  matchesPlayed: number;
  starts: number;
  minutes: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  totalCards: number;
  cardsPerMatch: number;
  cardsPerNinety: number;
  minutesPerCard: number;
}

// ── Standings (computed from match results) ──

export interface ComputedStanding {
  position: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string[];    // Last 5 results: W/D/L
  homeRecord: { w: number; d: number; l: number };
  awayRecord: { w: number; d: number; l: number };
  totalYellows: number;
  totalReds: number;
  cardsPerMatch: number;
}

// ── Referee analytics ──

export interface RefereeStats {
  name: string;
  matchesOfficiated: number;
  totalYellows: number;
  totalReds: number;
  totalCards: number;
  cardsPerMatch: number;
  foulsPerMatch: number;
  homeYellowRate: number;
  awayYellowRate: number;
  strictnessRating: "Lenient" | "Moderate" | "Strict" | "Very Strict";
  recentForm: number[]; // cards in last N matches
  leagues: string[];
}

// ── Team discipline ──

export interface TeamDiscipline {
  team: string;
  leagueCode: string;
  matchesPlayed: number;
  totalYellows: number;
  totalReds: number;
  totalCards: number;
  cardsPerMatch: number;
  foulsPerMatch: number;
  foulsPerCard: number;       // How many fouls before a card
  homeCards: number;
  awayCards: number;
  homeCardRate: number;
  awayCardRate: number;
}

// ── Booking analytics aggregate ──

export interface BookingAnalytics {
  totalMatchesAnalyzed: number;
  totalYellowCards: number;
  totalRedCards: number;
  totalCards: number;
  averageCardsPerMatch: number;
  averageFoulsPerMatch: number;
  averageFoulsPerCard: number;
  refereeStats: RefereeStats[];
  teamDiscipline: TeamDiscipline[];
  playerStats: PlayerStats[];
  cardsByMatchResult: { homeWin: number; draw: number; awayWin: number };
  cardDistribution: { range: string; yellows: number; total: number }[];
  homeVsAway: {
    homeYellows: number;
    awayYellows: number;
    homeReds: number;
    awayReds: number;
  };
  highCardMatches: MatchData[];   // Top 10 matches by cards
  monthlyTrends: { month: string; avgCards: number; matches: number }[];
}

// ── Fixture (upcoming match from fixtures.csv) ──

export interface FixtureData {
  id: string;
  league: string;
  leagueCode: string;
  date: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
}

// ── Match booking prediction ──

export interface MatchPrediction {
  fixture: FixtureData;
  expectedCards: number;
  cardRange: { low: number; high: number };
  riskRating: "Low" | "Medium" | "High" | "Very High";
  confidence: "Low" | "Medium" | "High";
  factors: PredictionFactor[];
  headToHead: HeadToHeadRecord | null;
  playerRisks: PlayerBookingRisk[];
}

export interface PredictionFactor {
  label: string;
  impact: "increases" | "decreases" | "neutral";
  value: string;
}

export interface HeadToHeadRecord {
  matches: number;
  avgCards: number;
  avgHomeFouls: number;
  avgAwayFouls: number;
  highestCards: number;
}

export interface PlayerBookingRisk {
  player: string;
  squad: string;
  position: string;
  riskLevel: "Low" | "Medium" | "High" | "Very High";
  riskScore: number;            // 0-100
  cardsPerMatch: number;
  cardsPerNinety: number;
  totalCards: number;
  matchesPlayed: number;
  reasons: string[];
}
