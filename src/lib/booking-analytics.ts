// Booking analytics engine — processes CSV match data

import type {
  MatchData,
  RefereeStats,
  TeamDiscipline,
  BookingAnalytics,
  PlayerStats,
} from "./football-types";

export function analyzeBookings(
  matches: MatchData[],
  playerStats: PlayerStats[] = []
): BookingAnalytics {
  const finished = matches.filter((m) => m.isFinished);
  if (finished.length === 0) {
    return emptyAnalytics();
  }

  const totalYellows = finished.reduce((s, m) => s + m.homeYellows + m.awayYellows, 0);
  const totalReds = finished.reduce((s, m) => s + m.homeReds + m.awayReds, 0);
  const totalCards = totalYellows + totalReds;
  const totalFouls = finished.reduce((s, m) => s + m.homeFouls + m.awayFouls, 0);

  return {
    totalMatchesAnalyzed: finished.length,
    totalYellowCards: totalYellows,
    totalRedCards: totalReds,
    totalCards,
    averageCardsPerMatch: round(totalCards / finished.length),
    averageFoulsPerMatch: round(totalFouls / finished.length),
    averageFoulsPerCard: totalCards > 0 ? round(totalFouls / totalCards) : 0,
    refereeStats: buildRefereeStats(finished),
    teamDiscipline: buildTeamDiscipline(finished),
    playerStats: playerStats.sort((a, b) => b.totalCards - a.totalCards),
    cardsByMatchResult: buildCardsByResult(finished),
    cardDistribution: buildCardDistribution(finished),
    homeVsAway: {
      homeYellows: finished.reduce((s, m) => s + m.homeYellows, 0),
      awayYellows: finished.reduce((s, m) => s + m.awayYellows, 0),
      homeReds: finished.reduce((s, m) => s + m.homeReds, 0),
      awayReds: finished.reduce((s, m) => s + m.awayReds, 0),
    },
    highCardMatches: [...finished]
      .sort((a, b) => b.totalCards - a.totalCards)
      .slice(0, 10),
    monthlyTrends: buildMonthlyTrends(finished),
  };
}

function buildRefereeStats(matches: MatchData[]): RefereeStats[] {
  const refMap = new Map<
    string,
    {
      matchCount: number;
      yellows: number;
      reds: number;
      fouls: number;
      homeYellows: number;
      awayYellows: number;
      recentCards: number[];
      leagues: Set<string>;
    }
  >();

  for (const m of matches) {
    const ref = m.referee;
    if (!ref || ref === "Unknown") continue;

    const existing = refMap.get(ref) || {
      matchCount: 0,
      yellows: 0,
      reds: 0,
      fouls: 0,
      homeYellows: 0,
      awayYellows: 0,
      recentCards: [],
      leagues: new Set<string>(),
    };

    existing.matchCount++;
    existing.yellows += m.homeYellows + m.awayYellows;
    existing.reds += m.homeReds + m.awayReds;
    existing.fouls += m.homeFouls + m.awayFouls;
    existing.homeYellows += m.homeYellows;
    existing.awayYellows += m.awayYellows;
    existing.recentCards.push(m.totalCards);
    existing.leagues.add(m.leagueCode);

    refMap.set(ref, existing);
  }

  return Array.from(refMap.entries())
    .map(([name, data]) => {
      const totalCards = data.yellows + data.reds;
      const cardsPerMatch = round(totalCards / data.matchCount);
      const foulsPerMatch = round(data.fouls / data.matchCount);
      const totalHomeYellows = data.homeYellows;
      const totalAwayYellows = data.awayYellows;
      const totalYellowCards = data.yellows;

      let strictnessRating: RefereeStats["strictnessRating"];
      if (cardsPerMatch < 3) strictnessRating = "Lenient";
      else if (cardsPerMatch < 4.5) strictnessRating = "Moderate";
      else if (cardsPerMatch < 6) strictnessRating = "Strict";
      else strictnessRating = "Very Strict";

      return {
        name,
        matchesOfficiated: data.matchCount,
        totalYellows: data.yellows,
        totalReds: data.reds,
        totalCards,
        cardsPerMatch,
        foulsPerMatch,
        homeYellowRate: totalYellowCards > 0
          ? round(totalHomeYellows / totalYellowCards)
          : 0.5,
        awayYellowRate: totalYellowCards > 0
          ? round(totalAwayYellows / totalYellowCards)
          : 0.5,
        strictnessRating,
        recentForm: data.recentCards.slice(-10),
        leagues: Array.from(data.leagues),
      };
    })
    .sort((a, b) => b.cardsPerMatch - a.cardsPerMatch);
}

function buildTeamDiscipline(matches: MatchData[]): TeamDiscipline[] {
  const teamMap = new Map<
    string,
    {
      leagueCode: string;
      homeMatches: number;
      awayMatches: number;
      homeYellows: number;
      awayYellows: number;
      homeReds: number;
      awayReds: number;
      homeFouls: number;
      awayFouls: number;
    }
  >();

  for (const m of matches) {
    // Home team
    const home = teamMap.get(m.homeTeam) || {
      leagueCode: m.leagueCode,
      homeMatches: 0, awayMatches: 0,
      homeYellows: 0, awayYellows: 0,
      homeReds: 0, awayReds: 0,
      homeFouls: 0, awayFouls: 0,
    };
    home.homeMatches++;
    home.homeYellows += m.homeYellows;
    home.homeReds += m.homeReds;
    home.homeFouls += m.homeFouls;
    teamMap.set(m.homeTeam, home);

    // Away team
    const away = teamMap.get(m.awayTeam) || {
      leagueCode: m.leagueCode,
      homeMatches: 0, awayMatches: 0,
      homeYellows: 0, awayYellows: 0,
      homeReds: 0, awayReds: 0,
      homeFouls: 0, awayFouls: 0,
    };
    away.awayMatches++;
    away.awayYellows += m.awayYellows;
    away.awayReds += m.awayReds;
    away.awayFouls += m.awayFouls;
    teamMap.set(m.awayTeam, away);
  }

  return Array.from(teamMap.entries())
    .map(([team, data]) => {
      const matchesPlayed = data.homeMatches + data.awayMatches;
      const totalYellows = data.homeYellows + data.awayYellows;
      const totalReds = data.homeReds + data.awayReds;
      const totalCards = totalYellows + totalReds;
      const totalFouls = data.homeFouls + data.awayFouls;
      const homeCards = data.homeYellows + data.homeReds;
      const awayCards = data.awayYellows + data.awayReds;

      return {
        team,
        leagueCode: data.leagueCode,
        matchesPlayed,
        totalYellows,
        totalReds,
        totalCards,
        cardsPerMatch: matchesPlayed > 0 ? round(totalCards / matchesPlayed) : 0,
        foulsPerMatch: matchesPlayed > 0 ? round(totalFouls / matchesPlayed) : 0,
        foulsPerCard: totalCards > 0 ? round(totalFouls / totalCards) : 0,
        homeCards,
        awayCards,
        homeCardRate: data.homeMatches > 0 ? round(homeCards / data.homeMatches) : 0,
        awayCardRate: data.awayMatches > 0 ? round(awayCards / data.awayMatches) : 0,
      };
    })
    .sort((a, b) => b.cardsPerMatch - a.cardsPerMatch);
}

function buildCardsByResult(matches: MatchData[]) {
  const result = { homeWin: 0, draw: 0, awayWin: 0 };
  const counts = { homeWin: 0, draw: 0, awayWin: 0 };

  for (const m of matches) {
    if (m.ftResult === "H") {
      result.homeWin += m.totalCards;
      counts.homeWin++;
    } else if (m.ftResult === "A") {
      result.awayWin += m.totalCards;
      counts.awayWin++;
    } else {
      result.draw += m.totalCards;
      counts.draw++;
    }
  }

  return {
    homeWin: counts.homeWin > 0 ? round(result.homeWin / counts.homeWin) : 0,
    draw: counts.draw > 0 ? round(result.draw / counts.draw) : 0,
    awayWin: counts.awayWin > 0 ? round(result.awayWin / counts.awayWin) : 0,
  };
}

function buildCardDistribution(matches: MatchData[]) {
  // Distribution of total cards per match
  const buckets = [
    { range: "0-1", yellows: 0, total: 0 },
    { range: "2-3", yellows: 0, total: 0 },
    { range: "4-5", yellows: 0, total: 0 },
    { range: "6-7", yellows: 0, total: 0 },
    { range: "8-9", yellows: 0, total: 0 },
    { range: "10+", yellows: 0, total: 0 },
  ];

  for (const m of matches) {
    const totalYellow = m.homeYellows + m.awayYellows;
    const total = m.totalCards;
    let idx: number;
    if (total <= 1) idx = 0;
    else if (total <= 3) idx = 1;
    else if (total <= 5) idx = 2;
    else if (total <= 7) idx = 3;
    else if (total <= 9) idx = 4;
    else idx = 5;

    buckets[idx].yellows += totalYellow;
    buckets[idx].total++;
  }

  return buckets;
}

function buildMonthlyTrends(matches: MatchData[]) {
  const monthMap = new Map<string, { totalCards: number; count: number }>();

  for (const m of matches) {
    if (!m.date) continue;
    const monthKey = m.date.substring(0, 7); // YYYY-MM
    const existing = monthMap.get(monthKey) || { totalCards: 0, count: 0 };
    existing.totalCards += m.totalCards;
    existing.count++;
    monthMap.set(monthKey, existing);
  }

  return Array.from(monthMap.entries())
    .map(([month, data]) => ({
      month,
      avgCards: round(data.totalCards / data.count),
      matches: data.count,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function emptyAnalytics(): BookingAnalytics {
  return {
    totalMatchesAnalyzed: 0,
    totalYellowCards: 0,
    totalRedCards: 0,
    totalCards: 0,
    averageCardsPerMatch: 0,
    averageFoulsPerMatch: 0,
    averageFoulsPerCard: 0,
    refereeStats: [],
    teamDiscipline: [],
    playerStats: [],
    cardsByMatchResult: { homeWin: 0, draw: 0, awayWin: 0 },
    cardDistribution: [],
    homeVsAway: { homeYellows: 0, awayYellows: 0, homeReds: 0, awayReds: 0 },
    highCardMatches: [],
    monthlyTrends: [],
  };
}

// Predict expected cards for an upcoming match
export function predictMatchCards(
  homeTeam: string,
  awayTeam: string,
  referee: string,
  analytics: BookingAnalytics
): {
  expectedCards: number;
  confidence: "Low" | "Medium" | "High";
  factors: string[];
} {
  const factors: string[] = [];
  let estimate = analytics.averageCardsPerMatch || 4;
  let dataPoints = 0;

  const homeData = analytics.teamDiscipline.find((t) => t.team === homeTeam);
  const awayData = analytics.teamDiscipline.find((t) => t.team === awayTeam);
  const refData = analytics.refereeStats.find((r) => r.name === referee);

  if (homeData && homeData.matchesPlayed >= 3) {
    const weight = homeData.homeCardRate;
    estimate = (estimate + weight) / 2;
    dataPoints++;
    if (homeData.cardsPerMatch > analytics.averageCardsPerMatch) {
      factors.push(
        `${homeTeam} average ${homeData.cardsPerMatch} cards/match (above avg)`
      );
    }
  }

  if (awayData && awayData.matchesPlayed >= 3) {
    const weight = awayData.awayCardRate;
    estimate = (estimate + weight) / 2;
    dataPoints++;
    if (awayData.cardsPerMatch > analytics.averageCardsPerMatch) {
      factors.push(
        `${awayTeam} average ${awayData.cardsPerMatch} cards/match (above avg)`
      );
    }
  }

  if (refData && refData.matchesOfficiated >= 3) {
    estimate = (estimate + refData.cardsPerMatch) / 2;
    dataPoints++;
    factors.push(
      `Referee ${refData.name} is ${refData.strictnessRating.toLowerCase()} (${refData.cardsPerMatch}/match)`
    );
  }

  return {
    expectedCards: Math.round(estimate * 10) / 10,
    confidence: dataPoints >= 3 ? "High" : dataPoints >= 2 ? "Medium" : "Low",
    factors: factors.length > 0 ? factors : ["Insufficient data for detailed prediction"],
  };
}
