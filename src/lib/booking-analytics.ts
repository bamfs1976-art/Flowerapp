// Booking analytics engine - processes match data to extract booking insights

import type {
  Match,
  Booking,
  Referee,
  PlayerBookingProfile,
  RefereeProfile,
  TeamDiscipline,
  BookingAnalytics,
} from "./football-types";

export function analyzeBookings(matches: Match[]): BookingAnalytics {
  const finishedMatches = matches.filter(
    (m) => m.status === "FINISHED" && m.bookings && m.bookings.length > 0
  );

  const allBookings = finishedMatches.flatMap((m) => m.bookings ?? []);

  const playerProfiles = buildPlayerProfiles(finishedMatches);
  const refereeProfiles = buildRefereeProfiles(finishedMatches);
  const teamDiscipline = buildTeamDiscipline(finishedMatches, playerProfiles);

  const firstHalf = allBookings.filter((b) => b.minute <= 45).length;
  const secondHalf = allBookings.filter((b) => b.minute > 45).length;

  const minuteRanges = [
    { range: "1-15", count: 0 },
    { range: "16-30", count: 0 },
    { range: "31-45", count: 0 },
    { range: "46-60", count: 0 },
    { range: "61-75", count: 0 },
    { range: "76-90+", count: 0 },
  ];

  for (const b of allBookings) {
    if (b.minute <= 15) minuteRanges[0].count++;
    else if (b.minute <= 30) minuteRanges[1].count++;
    else if (b.minute <= 45) minuteRanges[2].count++;
    else if (b.minute <= 60) minuteRanges[3].count++;
    else if (b.minute <= 75) minuteRanges[4].count++;
    else minuteRanges[5].count++;
  }

  return {
    playerProfiles: playerProfiles.sort((a, b) => b.totalCards - a.totalCards),
    refereeProfiles: refereeProfiles.sort((a, b) => b.cardsPerMatch - a.cardsPerMatch),
    teamDiscipline: teamDiscipline.sort((a, b) => b.cardsPerMatch - a.cardsPerMatch),
    totalMatchesAnalyzed: finishedMatches.length,
    totalBookings: allBookings.length,
    averageBookingsPerMatch:
      finishedMatches.length > 0
        ? Math.round((allBookings.length / finishedMatches.length) * 100) / 100
        : 0,
    bookingsByHalf: { firstHalf, secondHalf },
    bookingsByMinuteRange: minuteRanges,
  };
}

function buildPlayerProfiles(matches: Match[]): PlayerBookingProfile[] {
  const playerMap = new Map<
    number,
    {
      name: string;
      teamId: number;
      teamName: string;
      yellows: number;
      reds: number;
      minutes: number[];
      matchIds: Set<number>;
    }
  >();

  for (const match of matches) {
    for (const booking of match.bookings ?? []) {
      const existing = playerMap.get(booking.player.id);
      if (existing) {
        if (booking.card === "YELLOW_CARD") existing.yellows++;
        else existing.reds++;
        existing.minutes.push(booking.minute);
        existing.matchIds.add(match.id);
      } else {
        playerMap.set(booking.player.id, {
          name: booking.player.name,
          teamId: booking.team.id,
          teamName: booking.team.name,
          yellows: booking.card === "YELLOW_CARD" ? 1 : 0,
          reds: booking.card !== "YELLOW_CARD" ? 1 : 0,
          minutes: [booking.minute],
          matchIds: new Set([match.id]),
        });
      }
    }
  }

  return Array.from(playerMap.entries()).map(([playerId, data]) => ({
    playerId,
    playerName: data.name,
    teamId: data.teamId,
    teamName: data.teamName,
    totalYellows: data.yellows,
    totalReds: data.reds,
    totalCards: data.yellows + data.reds,
    matchesWithCards: data.matchIds.size,
    averageMinute:
      data.minutes.length > 0
        ? Math.round(data.minutes.reduce((a, b) => a + b, 0) / data.minutes.length)
        : 0,
    cardMinutes: data.minutes.sort((a, b) => a - b),
    bookingRate:
      data.matchIds.size > 0
        ? Math.round(((data.yellows + data.reds) / data.matchIds.size) * 100) / 100
        : 0,
  }));
}

function buildRefereeProfiles(matches: Match[]): RefereeProfile[] {
  const refMap = new Map<
    number,
    {
      name: string;
      nationality: string;
      matchCount: number;
      yellows: number;
      reds: number;
    }
  >();

  for (const match of matches) {
    const mainRef = match.referees?.find((r: Referee) => r.type === "REFEREE");
    if (!mainRef) continue;

    const existing = refMap.get(mainRef.id);
    const bookings = match.bookings ?? [];
    const yellows = bookings.filter((b: Booking) => b.card === "YELLOW_CARD").length;
    const reds = bookings.filter((b: Booking) => b.card !== "YELLOW_CARD").length;

    if (existing) {
      existing.matchCount++;
      existing.yellows += yellows;
      existing.reds += reds;
    } else {
      refMap.set(mainRef.id, {
        name: mainRef.name,
        nationality: mainRef.nationality,
        matchCount: 1,
        yellows,
        reds,
      });
    }
  }

  return Array.from(refMap.entries()).map(([refereeId, data]) => {
    const cardsPerMatch =
      data.matchCount > 0
        ? Math.round(((data.yellows + data.reds) / data.matchCount) * 100) / 100
        : 0;

    let strictnessRating: RefereeProfile["strictnessRating"];
    if (cardsPerMatch < 3) strictnessRating = "Lenient";
    else if (cardsPerMatch < 4.5) strictnessRating = "Moderate";
    else if (cardsPerMatch < 6) strictnessRating = "Strict";
    else strictnessRating = "Very Strict";

    return {
      refereeId,
      refereeName: data.name,
      nationality: data.nationality,
      matchesOfficiated: data.matchCount,
      totalYellows: data.yellows,
      totalReds: data.reds,
      cardsPerMatch,
      strictnessRating,
    };
  });
}

function buildTeamDiscipline(
  matches: Match[],
  playerProfiles: PlayerBookingProfile[]
): TeamDiscipline[] {
  const teamMap = new Map<
    number,
    {
      name: string;
      crest: string;
      yellows: number;
      reds: number;
      matchIds: Set<number>;
    }
  >();

  for (const match of matches) {
    for (const booking of match.bookings ?? []) {
      const existing = teamMap.get(booking.team.id);
      if (existing) {
        if (booking.card === "YELLOW_CARD") existing.yellows++;
        else existing.reds++;
        existing.matchIds.add(match.id);
      } else {
        const teamInfo =
          match.homeTeam.id === booking.team.id
            ? match.homeTeam
            : match.awayTeam;
        teamMap.set(booking.team.id, {
          name: booking.team.name,
          crest: teamInfo.crest || "",
          yellows: booking.card === "YELLOW_CARD" ? 1 : 0,
          reds: booking.card !== "YELLOW_CARD" ? 1 : 0,
          matchIds: new Set([match.id]),
        });
      }
    }
  }

  return Array.from(teamMap.entries()).map(([teamId, data]) => {
    const totalCards = data.yellows + data.reds;
    const matchesPlayed = data.matchIds.size;
    return {
      teamId,
      teamName: data.name,
      teamCrest: data.crest,
      totalYellows: data.yellows,
      totalReds: data.reds,
      totalCards,
      matchesPlayed,
      cardsPerMatch:
        matchesPlayed > 0
          ? Math.round((totalCards / matchesPlayed) * 100) / 100
          : 0,
      mostBookedPlayers: playerProfiles
        .filter((p) => p.teamId === teamId)
        .sort((a, b) => b.totalCards - a.totalCards)
        .slice(0, 5),
    };
  });
}

// Predict booking likelihood for an upcoming match
export function predictBookingLikelihood(
  homeTeam: TeamDiscipline | undefined,
  awayTeam: TeamDiscipline | undefined,
  referee: RefereeProfile | undefined
): {
  expectedCards: number;
  confidence: "Low" | "Medium" | "High";
  factors: string[];
} {
  const factors: string[] = [];
  let expectedCards = 4; // baseline average
  let dataPoints = 0;

  if (homeTeam) {
    expectedCards = (expectedCards + homeTeam.cardsPerMatch) / 2;
    dataPoints++;
    if (homeTeam.cardsPerMatch > 2.5) {
      factors.push(`${homeTeam.teamName} are aggressive (${homeTeam.cardsPerMatch} cards/match)`);
    }
  }

  if (awayTeam) {
    expectedCards = (expectedCards + awayTeam.cardsPerMatch) / 2;
    dataPoints++;
    if (awayTeam.cardsPerMatch > 2.5) {
      factors.push(`${awayTeam.teamName} are aggressive (${awayTeam.cardsPerMatch} cards/match)`);
    }
  }

  if (referee) {
    // Referee influence is significant
    expectedCards = (expectedCards + referee.cardsPerMatch) / 2;
    dataPoints++;
    if (referee.strictnessRating === "Strict" || referee.strictnessRating === "Very Strict") {
      factors.push(`${referee.refereeName} is ${referee.strictnessRating.toLowerCase()} (${referee.cardsPerMatch} cards/match)`);
    } else if (referee.strictnessRating === "Lenient") {
      factors.push(`${referee.refereeName} is lenient (${referee.cardsPerMatch} cards/match)`);
    }
  }

  const confidence: "Low" | "Medium" | "High" =
    dataPoints >= 3 ? "High" : dataPoints >= 2 ? "Medium" : "Low";

  return {
    expectedCards: Math.round(expectedCards * 10) / 10,
    confidence,
    factors,
  };
}
