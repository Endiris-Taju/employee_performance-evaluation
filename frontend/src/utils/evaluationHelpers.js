export const EVAL_TYPE_LABELS = {
  self: "Self evaluation",
  peer: "Peer evaluation",
  behavioral: "Behavioral (leader)",
  workrate: "Work rate",
  performance: "Performance",
  admin: "Admin / work rate",
};

export const EVAL_WEIGHTS = {
  self: 5,
  peer: 10,
  behavioral: 15,
  workrate: 70,
  performance: 70,
  admin: 70,
};

export function normalizeRole(role) {
  return role === "employee" ? "member" : role;
}

export function parseScores(scores) {
  if (!scores) return {};
  if (typeof scores === "string") {
    try {
      return JSON.parse(scores);
    } catch {
      return {};
    }
  }
  if (Array.isArray(scores)) {
    return scores.reduce((acc, s) => {
      const key = s.question || s.key;
      if (key) acc[key] = Number(s.score ?? s.value ?? 0);
      return acc;
    }, {});
  }
  return scores;
}

export function getEmployeeName(employees, id) {
  const emp = employees.find((e) => Number(e.id) === Number(id));
  return emp?.name || `Employee #${id}`;
}

export function getEvaluatorName(employees, evaluation) {
  const id = evaluation.evaluator_id ?? evaluation.evaluatorId;
  if (!id) return "—";
  return getEmployeeName(employees, id);
}

export function formatEvalType(type) {
  return EVAL_TYPE_LABELS[type] || String(type || "Unknown");
}

/** Teams where userId is a roster member (not leader-only) */
export function getMemberTeams(teams, userId) {
  const uid = Number(userId);
  return (teams || []).filter((t) =>
    (t.member_ids || []).some((id) => Number(id) === uid)
  );
}

/** Peer candidates: other members in the given team(s), excluding self */
export function getPeerCandidatesFromTeam(team, userId) {
  if (!team) return [];
  const uid = Number(userId);
  return (team.members || []).filter(
    (m) =>
      Number(m.id) !== uid &&
      ["member", "employee"].includes(m.role)
  );
}

export function filterTeamMembers(employees, teams, leaderId) {
  const myTeams = teams.filter((t) => Number(t.leader_id) === Number(leaderId));
  const memberIds = new Set();
  myTeams.forEach((t) => (t.member_ids || []).forEach((id) => memberIds.add(Number(id))));
  if (memberIds.size === 0) {
    return employees.filter((e) => ["member", "employee"].includes(e.role));
  }
  return employees.filter((e) => memberIds.has(Number(e.id)));
}

export function getLeaderTeams(teams, leaderId) {
  return teams.filter((t) => Number(t.leader_id) === Number(leaderId));
}

/** Latest evaluation per type per employee */
export function aggregateByEmployee(evaluations, employees) {
  const map = {};

  for (const ev of evaluations || []) {
    const empId = ev.employee_id;
    if (!empId) continue;
    if (!map[empId]) {
      const emp = employees.find((e) => Number(e.id) === Number(empId));
      map[empId] = {
        employeeId: empId,
        name: emp?.name || `Employee #${empId}`,
        department: emp?.department || "—",
        self: null,
        peer: null,
        behavioral: null,
        workrate: null,
      };
    }
    const type = String(ev.type || "").toLowerCase();
    const bucket =
      type === "self"
        ? "self"
        : type === "peer"
          ? "peer"
          : type === "behavioral"
            ? "behavioral"
            : "workrate";
    const existing = map[empId][bucket];
    const evDate = new Date(ev.date || ev.created_at || 0).getTime();
    if (
      !existing ||
      evDate >= new Date(existing.date || existing.created_at || 0).getTime()
    ) {
      map[empId][bucket] = ev;
    }
  }

  return Object.values(map).map((row) => {
    const weighted =
      (row.self ? Number(row.self.percentage || 0) * 0.05 : 0) +
      (row.peer ? Number(row.peer.percentage || 0) * 0.1 : 0) +
      (row.behavioral ? Number(row.behavioral.percentage || 0) * 0.15 : 0) +
      (row.workrate ? Number(row.workrate.percentage || 0) * 0.7 : 0);
    return { ...row, efficiencyEstimate: Number(weighted.toFixed(1)) };
  });
}

export function exportEvaluationsCsv(rows, filename = "evaluations.csv") {
  const headers = ["Employee", "Type", "Score", "Max", "Percentage", "Date", "Evaluator"];
  const csvData = rows.map((r) => [
    r.employeeName,
    r.type,
    r.total_score,
    r.max_score,
    r.percentage,
    r.date ? new Date(r.date).toLocaleString() : "",
    r.evaluatorName || "",
  ]);
  const csvContent = [headers, ...csvData]
    .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
