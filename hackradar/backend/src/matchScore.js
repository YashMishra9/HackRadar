const { splitCsv } = require("./utils");

// Weights sum to 100. Deliberately simple + explainable per the spec:
// "Don't make the algorithm unnecessarily complicated initially."
const WEIGHTS = {
  interestMatch: 30,
  skillMatch: 25,
  modeMatch: 15,
  locationMatch: 10,
  teamSizeMatch: 10,
  quality: 10,
};

function overlapRatio(a, b) {
  if (!a.length || !b.length) return 0;
  const setB = new Set(b.map((s) => s.toLowerCase()));
  const hits = a.filter((s) => setB.has(s.toLowerCase()));
  return hits.length / a.length;
}

function scoreEvent(event, profile) {
  const eventTags = splitCsv(event.tags);
  const eventSkills = splitCsv(event.skills);
  const profileInterests = splitCsv(profile.interests);
  const profileSkills = splitCsv(profile.skills);

  const reasons = [];
  let score = 0;

  // Interest match
  const interestOverlap = overlapRatio(eventTags, profileInterests);
  const interestPts = Math.round(interestOverlap * WEIGHTS.interestMatch);
  score += interestPts;
  const matchedInterests = eventTags.filter((t) =>
    profileInterests.map((i) => i.toLowerCase()).includes(t.toLowerCase())
  );
  if (matchedInterests.length) {
    reasons.push(`focuses on ${matchedInterests.slice(0, 2).join(" and ")}`);
  }

  // Skill match
  const skillOverlap = overlapRatio(eventSkills, profileSkills);
  const skillPts = Math.round(skillOverlap * WEIGHTS.skillMatch);
  score += skillPts;
  const matchedSkills = eventSkills.filter((s) =>
    profileSkills.map((p) => p.toLowerCase()).includes(s.toLowerCase())
  );
  if (matchedSkills.length) {
    reasons.push(`matches your ${matchedSkills.slice(0, 2).join(" and ")} skills`);
  }

  // Mode preference
  let modePts = 0;
  if (profile.modePreference === "ANY" || profile.modePreference === event.mode) {
    modePts = WEIGHTS.modeMatch;
    if (event.mode === "ONLINE") reasons.push("is online, so no travel needed");
  } else if (event.mode === "HYBRID") {
    modePts = Math.round(WEIGHTS.modeMatch * 0.6);
  }
  score += modePts;

  // Location (only matters for OFFLINE/HYBRID)
  let locationPts = WEIGHTS.locationMatch; // default full points (online, or no city set)
  if (event.mode !== "ONLINE" && profile.city) {
    locationPts = event.location.toLowerCase().includes(profile.city.toLowerCase())
      ? WEIGHTS.locationMatch
      : Math.round(WEIGHTS.locationMatch * 0.3);
    if (locationPts === WEIGHTS.locationMatch) {
      reasons.push(`is happening in ${event.location}, close to you`);
    }
  }
  score += locationPts;

  // Team size compatibility
  let teamPts = WEIGHTS.teamSizeMatch;
  if (profile.preferredTeamSize && event.teamSizeMin && event.teamSizeMax) {
    const fits =
      profile.preferredTeamSize >= event.teamSizeMin &&
      profile.preferredTeamSize <= event.teamSizeMax;
    teamPts = fits ? WEIGHTS.teamSizeMatch : Math.round(WEIGHTS.teamSizeMatch * 0.4);
    if (fits) reasons.push(`allows teams of ${event.teamSizeMin}\u2013${event.teamSizeMax}`);
  }
  score += teamPts;

  // Opportunity quality: prize pool tier + eligibility openness as a crude proxy
  // for "event reputation" until a real signal (e.g. past attendance) exists.
  let qualityPts = Math.round(WEIGHTS.quality * 0.5);
  if (event.prizePool && event.prizePool >= 200000) qualityPts = WEIGHTS.quality;
  else if (event.prizePool && event.prizePool >= 50000) qualityPts = Math.round(WEIGHTS.quality * 0.75);
  score += qualityPts;

  score = Math.max(0, Math.min(100, score));

  const explanation = reasons.length
    ? `${score}% match because this hackathon ${reasons.join(", ")}.`
    : `${score}% match based on your profile and preferences.`;

  return {
    score,
    breakdown: {
      interestMatch: interestPts,
      skillMatch: skillPts,
      modeMatch: modePts,
      locationMatch: locationPts,
      teamSizeMatch: teamPts,
      quality: qualityPts,
    },
    explanation,
  };
}

module.exports = { scoreEvent, WEIGHTS };
