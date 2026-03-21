// Booking analytics engine — processes CSV match data

import type {
  MatchData,
  RefereeStats,
  TeamDiscipline,
  BookingAnalytics,
  PlayerStats,
  FixtureData,
  MatchPrediction,
  PredictionFactor,
  HeadToHeadRecord,
  PlayerBookingRisk,
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

// ── Enhanced prediction engine ──

// Build head-to-head record between two teams from historical matches
function buildHeadToHead(
  homeTeam: string,
  awayTeam: string,
  matches: MatchData[]
): HeadToHeadRecord | null {
  const h2h = matches.filter(
    (m) =>
      (m.homeTeam === homeTeam && m.awayTeam === awayTeam) ||
      (m.homeTeam === awayTeam && m.awayTeam === homeTeam)
  );

  if (h2h.length === 0) return null;

  const totalCards = h2h.reduce((s, m) => s + m.totalCards, 0);
  const totalHomeFouls = h2h.reduce((s, m) => s + m.homeFouls, 0);
  const totalAwayFouls = h2h.reduce((s, m) => s + m.awayFouls, 0);
  const highestCards = Math.max(...h2h.map((m) => m.totalCards));

  return {
    matches: h2h.length,
    avgCards: round(totalCards / h2h.length),
    avgHomeFouls: round(totalHomeFouls / h2h.length),
    avgAwayFouls: round(totalAwayFouls / h2h.length),
    highestCards,
  };
}

// Compute player booking risk for a given team
function computePlayerRisks(
  teamName: string,
  opponentDiscipline: TeamDiscipline | undefined,
  players: PlayerStats[],
  leagueAvgCards: number
): PlayerBookingRisk[] {
  const teamPlayers = players.filter(
    (p) => p.squad === teamName && p.matchesPlayed >= 3
  );

  if (teamPlayers.length === 0) return [];

  return teamPlayers
    .map((p) => {
      const reasons: string[] = [];
      let riskScore = 0;

      // Factor 1: Individual card rate (0-40 points)
      if (p.cardsPerNinety >= 0.5) {
        riskScore += 40;
        reasons.push(`Very high card rate: ${p.cardsPerNinety}/90min`);
      } else if (p.cardsPerNinety >= 0.35) {
        riskScore += 30;
        reasons.push(`High card rate: ${p.cardsPerNinety}/90min`);
      } else if (p.cardsPerNinety >= 0.2) {
        riskScore += 20;
        reasons.push(`Moderate card rate: ${p.cardsPerNinety}/90min`);
      } else if (p.cardsPerNinety > 0) {
        riskScore += 10;
      }

      // Factor 2: Position risk (0-20 points) — midfielders and defenders more prone
      const pos = p.position.toUpperCase();
      if (pos.includes("MF") || pos.includes("DM") || pos.includes("CM")) {
        riskScore += 20;
        reasons.push("Midfielder — high-contact position");
      } else if (pos.includes("DF") || pos.includes("CB") || pos.includes("FB")) {
        riskScore += 15;
        reasons.push("Defender — frequent tackling");
      } else if (pos.includes("FW") || pos.includes("ST") || pos.includes("LW") || pos.includes("RW")) {
        riskScore += 8;
      }

      // Factor 3: Opponent fouling tendency (0-20 points)
      if (opponentDiscipline && opponentDiscipline.foulsPerMatch > 12) {
        riskScore += 20;
        reasons.push(
          `Opponent commits ${opponentDiscipline.foulsPerMatch} fouls/match`
        );
      } else if (opponentDiscipline && opponentDiscipline.foulsPerMatch > 10) {
        riskScore += 10;
      }

      // Factor 4: Minutes per card efficiency (0-20 points)
      if (p.minutesPerCard > 0 && p.minutesPerCard < 200) {
        riskScore += 20;
        reasons.push(`Card every ${p.minutesPerCard} minutes`);
      } else if (p.minutesPerCard > 0 && p.minutesPerCard < 400) {
        riskScore += 10;
      }

      // Cap at 100
      riskScore = Math.min(riskScore, 100);

      let riskLevel: PlayerBookingRisk["riskLevel"];
      if (riskScore >= 70) riskLevel = "Very High";
      else if (riskScore >= 50) riskLevel = "High";
      else if (riskScore >= 30) riskLevel = "Medium";
      else riskLevel = "Low";

      return {
        player: p.player,
        squad: p.squad,
        position: p.position,
        riskLevel,
        riskScore,
        cardsPerMatch: p.cardsPerMatch,
        cardsPerNinety: p.cardsPerNinety,
        totalCards: p.totalCards,
        matchesPlayed: p.matchesPlayed,
        reasons,
      };
    })
    .filter((p) => p.riskScore >= 25) // Only include meaningful risk
    .sort((a, b) => b.riskScore - a.riskScore);
}

// Generate full predictions for upcoming fixtures
export function generatePredictions(
  fixtures: FixtureData[],
  analytics: BookingAnalytics,
  allMatches: MatchData[]
): MatchPrediction[] {
  return fixtures.map((fixture) => {
    const factors: PredictionFactor[] = [];
    const weights: number[] = [];
    const values: number[] = [];
    const leagueAvg = analytics.averageCardsPerMatch || 4;
    let dataPoints = 0;

    // ── Factor 1: Home team discipline (weight: 30%) ──
    const homeData = analytics.teamDiscipline.find(
      (t) => t.team === fixture.homeTeam
    );
    if (homeData && homeData.matchesPlayed >= 3) {
      weights.push(0.3);
      values.push(homeData.homeCardRate);
      dataPoints++;

      const diff = homeData.homeCardRate - leagueAvg / 2;
      factors.push({
        label: `${fixture.homeTeam} concede ${homeData.homeCardRate} cards/home match`,
        impact: diff > 0.3 ? "increases" : diff < -0.3 ? "decreases" : "neutral",
        value: `${homeData.homeCardRate}/match`,
      });
    }

    // ── Factor 2: Away team discipline (weight: 30%) ──
    const awayData = analytics.teamDiscipline.find(
      (t) => t.team === fixture.awayTeam
    );
    if (awayData && awayData.matchesPlayed >= 3) {
      weights.push(0.3);
      values.push(awayData.awayCardRate);
      dataPoints++;

      const diff = awayData.awayCardRate - leagueAvg / 2;
      factors.push({
        label: `${fixture.awayTeam} concede ${awayData.awayCardRate} cards/away match`,
        impact: diff > 0.3 ? "increases" : diff < -0.3 ? "decreases" : "neutral",
        value: `${awayData.awayCardRate}/match`,
      });
    }

    // ── Factor 3: Head-to-head history (weight: 20%) ──
    const h2h = buildHeadToHead(fixture.homeTeam, fixture.awayTeam, allMatches);
    if (h2h && h2h.matches >= 1) {
      weights.push(0.2);
      values.push(h2h.avgCards);
      dataPoints++;

      const diff = h2h.avgCards - leagueAvg;
      factors.push({
        label: `H2H average: ${h2h.avgCards} cards across ${h2h.matches} meeting${h2h.matches > 1 ? "s" : ""}`,
        impact: diff > 0.5 ? "increases" : diff < -0.5 ? "decreases" : "neutral",
        value: `${h2h.avgCards} avg`,
      });
    }

    // ── Factor 4: Monthly trend (weight: 10%) ──
    const trends = analytics.monthlyTrends;
    if (trends.length >= 2) {
      const recentTrend = trends[trends.length - 1];
      weights.push(0.1);
      values.push(recentTrend.avgCards);

      const diff = recentTrend.avgCards - leagueAvg;
      factors.push({
        label: `Recent trend: ${recentTrend.avgCards} cards/match in ${recentTrend.month}`,
        impact: diff > 0.3 ? "increases" : diff < -0.3 ? "decreases" : "neutral",
        value: `${recentTrend.avgCards}/match`,
      });
    }

    // ── Factor 5: Team fouling patterns (weight: 10%) ──
    if (homeData && awayData) {
      const combinedFouls = homeData.foulsPerMatch + awayData.foulsPerMatch;
      const avgMatchFouls = analytics.averageFoulsPerMatch || 22;
      weights.push(0.1);
      values.push(
        combinedFouls > avgMatchFouls
          ? leagueAvg * 1.15
          : combinedFouls < avgMatchFouls * 0.85
            ? leagueAvg * 0.85
            : leagueAvg
      );

      factors.push({
        label: `Combined fouls: ${round(combinedFouls)}/match (avg ${avgMatchFouls})`,
        impact:
          combinedFouls > avgMatchFouls * 1.1
            ? "increases"
            : combinedFouls < avgMatchFouls * 0.9
              ? "decreases"
              : "neutral",
        value: `${round(combinedFouls)} fouls`,
      });
    }

    // ── Compute weighted prediction ──
    let expectedCards: number;
    if (weights.length > 0) {
      const totalWeight = weights.reduce((s, w) => s + w, 0);
      expectedCards = weights.reduce(
        (s, w, i) => s + (w / totalWeight) * values[i],
        0
      );
      // If both teams have data, sum their rates instead of averaging
      if (homeData && awayData && homeData.matchesPlayed >= 3 && awayData.matchesPlayed >= 3) {
        const directEstimate = homeData.homeCardRate + awayData.awayCardRate;
        // Blend: 60% direct sum, 40% weighted model
        expectedCards = directEstimate * 0.6 + expectedCards * 0.4;
      }
    } else {
      expectedCards = leagueAvg;
    }

    expectedCards = round(expectedCards);

    // Card range (±30%)
    const cardRange = {
      low: round(Math.max(0, expectedCards * 0.7)),
      high: round(expectedCards * 1.35),
    };

    // Risk rating
    let riskRating: MatchPrediction["riskRating"];
    if (expectedCards >= 6) riskRating = "Very High";
    else if (expectedCards >= 4.5) riskRating = "High";
    else if (expectedCards >= 3) riskRating = "Medium";
    else riskRating = "Low";

    // Confidence
    let confidence: MatchPrediction["confidence"];
    if (dataPoints >= 3) confidence = "High";
    else if (dataPoints >= 2) confidence = "Medium";
    else confidence = "Low";

    // ── Player booking risks ──
    const homePlayerRisks = computePlayerRisks(
      fixture.homeTeam,
      awayData,
      analytics.playerStats,
      leagueAvg
    );
    const awayPlayerRisks = computePlayerRisks(
      fixture.awayTeam,
      homeData,
      analytics.playerStats,
      leagueAvg
    );
    const playerRisks = [...homePlayerRisks, ...awayPlayerRisks]
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10);

    return {
      fixture,
      expectedCards,
      cardRange,
      riskRating,
      confidence,
      factors,
      headToHead: h2h,
      playerRisks,
    };
  }).sort((a, b) => b.expectedCards - a.expectedCards);
}
