// src/pages/Admin/Complaints.jsx
import React, { useState } from "react";
import { useData } from "../../context/DataContext";
import "./Complaints.css";

function Complaints() {
  const { complaints, employees, updateComplaintStatus } = useData(); // ✅ added employees
  const [filter, setFilter] = useState("all");

  const filteredComplaints =
    filter === "all"
      ? complaints
      : complaints.filter((c) => c?.status === filter);

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>
      <div className="complaints-page card" style={{ boxShadow: "none" }}>
        <h2 style={{ marginTop: 0 }}>Employee Complaints</h2>

        {/* ✅ Filter Dropdown */}
        <div className="filter-row">
          <label>Filter:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="solved">Solved</option>
          </select>
        </div>

        {/* ✅ Complaints Table */}
        {(!filteredComplaints || filteredComplaints.length === 0) ? (
          <p>No complaints to display.</p>
        ) : (
          <table className="styled-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Reason</th>
                <th>Description</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.map((complaint, idx) => {
                const employee = employees.find(
                  (e) => e.id === complaint.employeeId
                );
                return (
                  <tr key={idx}>
                    <td>{employee?.name || "Unknown Employee"}</td>
                    <td>{complaint.reason}</td>
                    <td>{complaint.description}</td>
                    <td>
                      {complaint.date
                        ? new Date(complaint.date).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>{complaint.status}</td>
                    <td>
                      {complaint.status !== "solved" && (
                        <button
                          className="btn primary"
                          onClick={() =>
                            updateComplaintStatus(complaint.id, "solved")
                          }
                        >
                          Mark Solved
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Complaints;
