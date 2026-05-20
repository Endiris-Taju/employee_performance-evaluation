// src/pages/PerformanceForm.jsx
import React, { useState } from "react";
import { useData } from "../context/DataContext";
import EvaluationFormCore from "../components/EvaluationFormCore";

export default function PerformanceForm() {
  const { teams, employees, submitPerformance } = useData();
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");

  const norm = (v) => (v == null ? "" : String(v));

  const team = teams.find((t) => norm(t.id ?? t._id) === norm(selectedTeam));

  const availableEmployees = team
    ? employees.filter((e) => {
        const empId = norm(e.id ?? e._id);
        const leaderId = norm(team.leaderId ?? team.leader_id ?? "");
        const memberIds = (team.memberIds || team.member_ids || []).map(norm);
        return empId === leaderId || memberIds.includes(empId);
      })
    : [];

  const employee = employees.find((e) => norm(e.id ?? e._id) === norm(selectedEmployee));

  const handleSubmit = async ({ employeeId, evaluatorType, scores, totalScore }) => {
    await submitPerformance({
      employeeId,
      scores,
      totalScore,
    });
  };

  return (
    <div className="container" style={{ padding: 24 }}>
      <h2>Performance Evaluation</h2>

      <label>
        Select Team
        <select
          value={selectedTeam}
          onChange={(e) => {
            setSelectedTeam(e.target.value);
            setSelectedEmployee("");
          }}
        >
          <option value="">-- Select Team --</option>
          {teams.map((t) => (
            <option key={t.id ?? t._id} value={t.id ?? t._id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>

      {team && (
        <label style={{ marginTop: 12 }}>
          Select Employee
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
          >
            <option value="">-- Select Employee --</option>
            {availableEmployees.map((emp) => (
              <option key={emp.id ?? emp._id} value={emp.id ?? emp._id}>
                {emp.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <EvaluationFormCore
        employee={employee}
        evaluatorType="performance"
        onSubmit={({
          evaluatorType, // unused here
          scores,
          totalScore,
        }) =>
          handleSubmit({
            employeeId: employee?.id ?? employee?._id,
            evaluatorType,
            scores,
            totalScore,
          })
        }
      />
    </div>
  );
}