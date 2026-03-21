// FPL War Room — TypeScript Types

export interface Player {
  id: number;
  name: string;
  team: string;
  position: "GKP" | "DEF" | "MID" | "FWD";
  price: number;
  totalPoints: number;
  gameweekPoints: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  minutes: number;
  form: string;
  selectedBy: string;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  isBenched?: boolean;
  news?: string;
  chanceOfPlaying?: number;
  expectedGoals: number;
  expectedAssists: number;
  expectedGoalInvolvements: number;
  ictIndex: string;
  bonusPoints: number;
}

export interface Fixture {
  id: number;
  gameweek: number;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  kickoff: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  started: boolean;
  finished: boolean;
}

export interface TeamFixtures {
  team: string;
  shortName: string;
  fixtures: Fixture[];
}

export interface GameweekStatus {
  current: number;
  deadlineTime: string;
  isActive: boolean;
  averageScore: number;
  highestScore: number;
  chipPlays: { chip: string; count: number }[];
}

export interface ManagerInfo {
  name: string;
  teamName: string;
  overallRank: number;
  overallPoints: number;
  gameweekRank: number;
  gameweekPoints: number;
  bank: number;
  freeTransfers: number;
  wildcardAvailable: boolean;
  benchBoostAvailable: boolean;
  tripleCaptainAvailable: boolean;
  freeHitAvailable: boolean;
}

export interface TransferTarget {
  playerIn: Player;
  playerOut: Player;
  netCost: number;
  pointsGain: number;
}

export interface LeagueStanding {
  rank: number;
  managerName: string;
  teamName: string;
  gameweekPoints: number;
  totalPoints: number;
}

export interface Referee {
  id: number;
  name: string;
  matchesOfficiated: number;
  yellowCards: number;
  redCards: number;
  penalties: number;
  penaltiesNotGiven: number;
  yellowsPerGame: number;
  pensPerGame: number;
  totalFouls: number;
  foulsPerGame: number;
  nextMatch?: { homeTeam: string; awayTeam: string; gameweek: number };
  recentMatches: RefereeMatch[];
  cardStyle: "strict" | "lenient" | "average";
}

export interface RefereeMatch {
  homeTeam: string;
  awayTeam: string;
  gameweek: number;
  yellows: number;
  reds: number;
  penalties: number;
  fouls: number;
}

export type TabId = "squad" | "transfers" | "fixtures" | "league" | "analytics" | "refs";
