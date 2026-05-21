import React, { useEffect, useMemo, useState } from "react";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import PageShell from "../../components/layout/PageShell";
import StatCard from "../../components/ui/StatCard";
import EvaluationDetailCard from "../../components/EvaluationDetailCard";
import { apiFetch } from "../../services/api";
import { getLeaderTeams } from "../../utils/evaluationHelpers";

const LeaderReports = () => {
  const { teams, employees, evaluations } = useData();
  const { token, userId, email } = useAuth();
  const me = employees.find(
    (e) => String(e.id) === String(userId) || e.email === email
  );

  const myTeams = useMemo(
    () => getLeaderTeams(teams, me?.id || userId),
    [teams, me?.id, userId]
  );

  const [selectedTeamId, setSelectedTeamId] = useState(
    myTeams[0]?.id ? String(myTeams[0].id) : ""
  );

  const selectedTeam = myTeams.find((t) => String(t.id) === String(selectedTeamId));

  const roster = useMemo(() => {
    if (!selectedTeam) return [];
    const ids = new Set((selectedTeam.member_ids || []).map(Number));
    return employees.filter((e) => ids.has(Number(e.id)));
  }, [selectedTeam, employees]);

  const teamEvaluations = useMemo(() => {
    const ids = new Set(roster.map((e) => Number(e.id)));
    return evaluations.filter((ev) => ids.has(Number(ev.employee_id)));
  }, [evaluations, roster]);

  const [efficiencyByMember, setEfficiencyByMember] = useState({});
  const [loadingEff, setLoadingEff] = useState(false);

  useEffect(() => {
    if (!token || roster.length === 0) return;
    let cancelled = false;
    (async () => {
      setLoadingEff(true);
      const results = {};
      await Promise.all(
        roster.map(async (member) => {
          try {
            const data = await apiFetch(`/efficiency/employee/${member.id}`, { token });
            results[member.id] = data;
          } catch {
            results[member.id] = null;
          }
        })
      );
      if (!cancelled) setEfficiencyByMember(results);
      setLoadingEff(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [token, roster, selectedTeamId]);

  if (myTeams.length === 0) {
    return (
      <PageShell title="Team reports" backTo="/leader">
        <div className="alert alert--error">
          No teams assigned to you. Ask an admin to create a team and set you as leader.
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Team reports"
      subtitle="Performance and evaluation detail for your team members."
      backTo="/leader"
      wide
    >
      <div className="form-field" style={{ maxWidth: 400 }}>
        <label>Select team</label>
        <select
          value={selectedTeamId}
          onChange={(e) => setSelectedTeamId(e.target.value)}
        >
          {myTeams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({(t.member_ids || []).length} members)
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-3">
        <StatCard label="Team members" value={roster.length} />
        <StatCard label="Evaluations" value={teamEvaluations.length} />
        <StatCard
          label="Avg efficiency"
          value={
            loadingEff
              ? "…"
              : roster.length
                ? `${(
                    roster.reduce((s, m) => {
                      const eff = efficiencyByMember[m.id];
                      return s + (eff?.efficiency_percent || 0);
                    }, 0) / roster.length
                  ).toFixed(1)}%`
                : "—"
          }
        />
      </div>

      <section>
        <h2 className="section-title">Member efficiency</h2>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Self (5%)</th>
                <th>Peer (10%)</th>
                <th>Leader (15%)</th>
                <th>Work (70%)</th>
                <th>Overall</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((m) => {
                const eff = efficiencyByMember[m.id];
                const b = eff?.breakdown_percent || {};
                return (
                  <tr key={m.id}>
                    <td>{m.name}</td>
                    <td>{b.self != null ? `${b.self}%` : "—"}</td>
                    <td>{b.peer != null ? `${b.peer}%` : "—"}</td>
                    <td>{b.leader != null ? `${b.leader}%` : "—"}</td>
                    <td>{b.admin != null ? `${b.admin}%` : "—"}</td>
                    <td>
                      <strong>
                        {eff?.efficiency_percent != null
                          ? `${eff.efficiency_percent}%`
                          : "—"}
                      </strong>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="section-title">Evaluation details</h2>
        {teamEvaluations.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No evaluations for this team yet.</p>
        ) : (
          teamEvaluations.map((ev) => (
            <EvaluationDetailCard
              key={ev.id}
              evaluation={ev}
              employees={employees}
            />
          ))
        )}
      </section>
    </PageShell>
  );
};

export default LeaderReports;
