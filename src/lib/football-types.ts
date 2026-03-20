// Football Data API v4 Types

export interface Competition {
  id: number;
  name: string;
  code: string;
  type: string;
  emblem: string;
  area: Area;
  currentSeason: Season;
}

export interface Area {
  id: number;
  name: string;
  code: string;
  flag: string | null;
}

export interface Season {
  id: number;
  startDate: string;
  endDate: string;
  currentMatchday: number;
  winner: Team | null;
}

export interface Team {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

export interface Match {
  id: number;
  competition: Competition;
  season: Season;
  utcDate: string;
  status: MatchStatus;
  matchday: number;
  stage: string;
  homeTeam: Team;
  awayTeam: Team;
  score: Score;
  referees: Referee[];
  bookings?: Booking[];
  goals?: Goal[];
}

export type MatchStatus =
  | "SCHEDULED"
  | "TIMED"
  | "IN_PLAY"
  | "PAUSED"
  | "FINISHED"
  | "POSTPONED"
  | "SUSPENDED"
  | "CANCELLED";

export interface Score {
  winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
  duration: string;
  fullTime: { home: number | null; away: number | null };
  halfTime: { home: number | null; away: number | null };
}

export interface Referee {
  id: number;
  name: string;
  type: string;
  nationality: string;
}

export interface Booking {
  minute: number;
  team: { id: number; name: string };
  player: { id: number; name: string };
  card: "YELLOW_CARD" | "YELLOW_RED" | "RED_CARD";
}

export interface Goal {
  minute: number;
  injuryTime: number | null;
  type: string;
  team: { id: number; name: string };
  scorer: { id: number; name: string };
  assist: { id: number; name: string } | null;
}

export interface Standing {
  stage: string;
  type: string;
  table: StandingEntry[];
}

export interface StandingEntry {
  position: number;
  team: Team;
  playedGames: number;
  form: string | null;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

// Analytics types

export interface PlayerBookingProfile {
  playerId: number;
  playerName: string;
  teamId: number;
  teamName: string;
  totalYellows: number;
  totalReds: number;
  totalCards: number;
  matchesWithCards: number;
  averageMinute: number;
  cardMinutes: number[];
  bookingRate: number; // cards per appearance (estimated)
}

export interface RefereeProfile {
  refereeId: number;
  refereeName: string;
  nationality: string;
  matchesOfficiated: number;
  totalYellows: number;
  totalReds: number;
  cardsPerMatch: number;
  strictnessRating: "Lenient" | "Moderate" | "Strict" | "Very Strict";
}

export interface TeamDiscipline {
  teamId: number;
  teamName: string;
  teamCrest: string;
  totalYellows: number;
  totalReds: number;
  totalCards: number;
  matchesPlayed: number;
  cardsPerMatch: number;
  mostBookedPlayers: PlayerBookingProfile[];
}

export interface BookingAnalytics {
  playerProfiles: PlayerBookingProfile[];
  refereeProfiles: RefereeProfile[];
  teamDiscipline: TeamDiscipline[];
  totalMatchesAnalyzed: number;
  totalBookings: number;
  averageBookingsPerMatch: number;
  bookingsByHalf: { firstHalf: number; secondHalf: number };
  bookingsByMinuteRange: { range: string; count: number }[];
}

// Free tier competition codes
export const FREE_COMPETITIONS = [
  { code: "PL", name: "Premier League", country: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { code: "BL1", name: "Bundesliga", country: "Germany", flag: "🇩🇪" },
  { code: "SA", name: "Serie A", country: "Italy", flag: "🇮🇹" },
  { code: "PD", name: "La Liga", country: "Spain", flag: "🇪🇸" },
  { code: "FL1", name: "Ligue 1", country: "France", flag: "🇫🇷" },
  { code: "DED", name: "Eredivisie", country: "Netherlands", flag: "🇳🇱" },
  { code: "PPL", name: "Primeira Liga", country: "Portugal", flag: "🇵🇹" },
  { code: "ELC", name: "Championship", country: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { code: "CL", name: "Champions League", country: "Europe", flag: "🇪🇺" },
] as const;

export type CompetitionCode = (typeof FREE_COMPETITIONS)[number]["code"];
