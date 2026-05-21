import React, { useMemo, useState } from "react";
import { useData } from "../../context/DataContext";
import PageShell from "../../components/layout/PageShell";
import EvaluationDetailCard from "../../components/EvaluationDetailCard";
import StatCard from "../../components/ui/StatCard";
import {
  exportEvaluationsCsv,
  getEmployeeName,
  getEvaluatorName,
} from "../../utils/evaluationHelpers";

function Reports() {
  const { collectedEvaluations, employees } = useData();
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const stats = useMemo(() => {
    const evs = collectedEvaluations || [];
    return {
      total: evs.length,
      workrate: evs.filter((e) => e.type === "workrate").length,
      behavioral: evs.filter((e) => e.type === "behavioral").length,
      peer: evs.filter((e) => e.type === "peer").length,
      self: evs.filter((e) => e.type === "self").length,
    };
  }, [collectedEvaluations]);

  const filteredEvaluations = useMemo(() => {
    return (collectedEvaluations || []).filter((evaluation) => {
      const matchesType = filterType === "all" || evaluation.type === filterType;
      const name = getEmployeeName(employees, evaluation.employee_id).toLowerCase();
      const matchesSearch =
        searchTerm === "" ||
        name.includes(searchTerm.toLowerCase()) ||
        String(evaluation.type).toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [collectedEvaluations, filterType, searchTerm, employees]);

  const exportToCSV = () => {
    exportEvaluationsCsv(
      filteredEvaluations.map((ev) => ({
        employeeName: getEmployeeName(employees, ev.employee_id),
        type: ev.type,
        total_score: ev.total_score,
        max_score: ev.max_score,
        percentage: ev.percentage,
        date: ev.date,
        evaluatorName: getEvaluatorName(employees, ev),
      })),
      `reports_${filterType}_${new Date().toISOString().split("T")[0]}.csv`
    );
  };

  return (
    <PageShell
      title="Evaluation reports"
      subtitle="Full detail for every evaluation submission across the organization."
      backTo="/admin"
      actions={
        <button type="button" className="btn primary" onClick={exportToCSV}>
          Export CSV
        </button>
      }
      wide
    >
      <div className="grid grid-5">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Work rate" value={stats.workrate} />
        <StatCard label="Behavioral" value={stats.behavioral} />
        <StatCard label="Peer" value={stats.peer} />
        <StatCard label="Self" value={stats.self} />
      </div>

      <div className="card card--flat">
        <div className="grid grid-3">
          <div className="form-field">
            <label>Filter by type</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">All types</option>
              <option value="workrate">Work rate</option>
              <option value="behavioral">Behavioral</option>
              <option value="peer">Peer</option>
              <option value="self">Self</option>
            </select>
          </div>
          <div className="form-field" style={{ gridColumn: "span 2" }}>
            <label>Search</label>
            <input
              type="text"
              placeholder="Employee name or evaluation type…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <section>
        <h2 className="section-title">
          {filteredEvaluations.length} report{filteredEvaluations.length !== 1 ? "s" : ""}
        </h2>
        {filteredEvaluations.length === 0 ? (
          <div className="card">
            <p style={{ color: "var(--muted)", margin: 0 }}>No evaluations match your filters.</p>
          </div>
        ) : (
          filteredEvaluations.map((evaluation) => (
            <EvaluationDetailCard
              key={evaluation.id}
              evaluation={evaluation}
              employees={employees}
              defaultOpen={expandedId === evaluation.id}
            />
          ))
        )}
      </section>
    </PageShell>
  );
}

export default Reports;
