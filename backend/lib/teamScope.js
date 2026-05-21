import pool from "../db.js";

/** User IDs assigned to teams led by this leader (excludes the leader). */
export async function getLeaderMemberIds(leaderId) {
  const teams = await pool.query(
    "SELECT id FROM teams WHERE leader_id = $1",
    [leaderId]
  );
  if (!teams.rows.length) return [];

  const teamIds = teams.rows.map((t) => t.id);
  const members = await pool.query(
    "SELECT DISTINCT user_id FROM team_members WHERE team_id = ANY($1::int[])",
    [teamIds]
  );
  return members.rows.map((r) => r.user_id);
}

export async function leaderManagesUser(leaderId, targetUserId) {
  const memberIds = await getLeaderMemberIds(leaderId);
  return memberIds.includes(Number(targetUserId));
}
