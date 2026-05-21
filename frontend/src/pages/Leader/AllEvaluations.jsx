import React, { useMemo, useState } from "react";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import PageShell from "../../components/layout/PageShell";
import EvaluationDetailCard from "../../components/EvaluationDetailCard";
import {
  aggregateByEmployee,
  exportEvaluationsCsv,
  formatEvalType,
  getEmployeeName,
  getEvaluatorName,
  filterTeamMembers,
} from "../../utils/evaluationHelpers";

function AllEvaluations() {
  const { employees, evaluations, teams } = useData();
  const { role, userId } = useAuth();
  const [filterType, setFilterType] = useState("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("summary");

  const roster =
    role === "leader" ? filterTeamMembers(employees, teams, userId) : employees;

  const scopedEvaluations = useMemo(() => {
    if (role !== "leader") return evaluations;
    const ids = new Set(roster.map((e) => Number(e.id)));
    return evaluations.filter((ev) => ids.has(Number(ev.employee_id)));
  }, [evaluations, role, roster]);

  const summary = useMemo(
    () => aggregateByEmployee(scopedEvaluations, employees),
    [scopedEvaluations, employees]
  );

  const filteredList = useMemo(() => {
    return scopedEvaluations.filter((ev) => {
      const matchType = filterType === "all" || ev.type === filterType;
      const name = getEmployeeName(employees, ev.employee_id).toLowerCase();
      const matchSearch =
        !search ||
        name.includes(search.toLowerCase()) ||
        String(ev.type).includes(search.toLowerCase());
      return matchType && matchSearch;
    });
  }, [scopedEvaluations, filterType, search, employees]);

  const backPath = role === "admin" ? "/admin" : "/leader";

  const handleExport = () => {
    exportEvaluationsCsv(
      filteredList.map((ev) => ({
        employeeName: getEmployeeName(employees, ev.employee_id),
        type: ev.type,
        total_score: ev.total_score,
        max_score: ev.max_score,
        percentage: ev.percentage,
        date: ev.date,
        evaluatorName: getEvaluatorName(employees, ev),
      })),
      `evaluations_${new Date().toISOString().split("T")[0]}.csv`
    );
  };

  return (
    <PageShell
      title="Evaluations"
      subtitle="Review all submitted evaluations. Summary shows latest score per type per employee."
      backTo={backPath}
      actions={
        <button type="button" className="btn" onClick={handleExport}>
          Export CSV
        </button>
      }
      wide
    >
      <div className="tabs">
        <button
          type="button"
          className={view === "summary" ? "is-active" : ""}
          onClick={() => setView("summary")}
        >
          Summary
        </button>
        <button
          type="button"
          className={view === "detail" ? "is-active" : ""}
          onClick={() => setView("detail")}
        >
          All submissions ({scopedEvaluations.length})
        </button>
      </div>

      <div className="card card--flat">
        <div className="grid grid-3">
          <div className="form-field">
            <label>Type</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">All types</option>
              <option value="self">Self</option>
              <option value="peer">Peer</option>
              <option value="behavioral">Behavioral</option>
              <option value="workrate">Work rate</option>
            </select>
          </div>
          <div className="form-field" style={{ gridColumn: "span 2" }}>
            <label>Search</label>
            <input
              placeholder="Employee name or type…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {view === "summary" && (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Self (5%)</th>
                <th>Peer (10%)</th>
                <th>Leader (15%)</th>
                <th>Work (70%)</th>
                <th>Est. efficiency</th>
              </tr>
            </thead>
            <tbody>
              {summary.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ color: "var(--muted)" }}>
                    No evaluations found.
                  </td>
                </tr>
              ) : (
                summary.map((row) => (
                  <tr key={row.employeeId}>
                    <td>{row.name}</td>
                    <td>{row.department}</td>
                    <td>{row.self ? `${Number(row.self.percentage || 0).toFixed(0)}%` : "—"}</td>
                    <td>{row.peer ? `${Number(row.peer.percentage || 0).toFixed(0)}%` : "—"}</td>
                    <td>
                      {row.behavioral
                        ? `${Number(row.behavioral.percentage || 0).toFixed(0)}%`
                        : "—"}
                    </td>
                    <td>
                      {row.workrate ? `${Number(row.workrate.percentage || 0).toFixed(0)}%` : "—"}
                    </td>
                    <td>
                      <strong>{row.efficiencyEstimate}%</strong>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {view === "detail" && (
        <div>
          {filteredList.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>No evaluations match your filters.</p>
          ) : (
            filteredList.map((ev) => (
              <EvaluationDetailCard
                key={ev.id}
                evaluation={ev}
                employees={employees}
              />
            ))
          )}
        </div>
      )}
    </PageShell>
  );
}

export default AllEvaluations;
