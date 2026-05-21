import React, { useState } from "react";
import { FiEdit2, FiTrash2, FiUsers, FiUser } from "react-icons/fi";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import PageShell from "../../components/layout/PageShell";
import Modal from "../../components/ui/Modal";

function Teams() {
  const { teams, employees, setTeamMembers, addTeam, updateTeam, deleteTeam } = useData();
  const { role } = useAuth();
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [draftMembers, setDraftMembers] = useState([]);
  const [saving, setSaving] = useState(false);

  const [newTeam, setNewTeam] = useState({ name: "", description: "", leader_id: "" });
  const [editTeam, setEditTeam] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const selected = teams.find((t) => t.id === selectedId);
  const leaders = employees.filter((e) => e.role === "leader");
  const memberCandidates = employees.filter((e) =>
    ["member", "employee"].includes(e.role)
  );

  const createTeam = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    try {
      const created = await addTeam({
        name: newTeam.name,
        description: newTeam.description,
        leader_id: newTeam.leader_id ? Number(newTeam.leader_id) : null,
      });
      setNewTeam({ name: "", description: "", leader_id: "" });
      setSelectedId(created.id);
      setDraftMembers([]);
      setMsg("Team created.");
    } catch (e) {
      setErr(e.message || "Failed to create team");
    }
  };

  const openTeam = (team) => {
    setSelectedId(team.id);
    setDraftMembers([...(team.member_ids || [])]);
    setMsg("");
    setErr("");
  };

  const toggleMember = (userId) => {
    setDraftMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const saveMembers = async () => {
    if (!selectedId) return;
    setSaving(true);
    setErr("");
    try {
      await setTeamMembers(selectedId, draftMembers);
      setMsg("Team members updated.");
    } catch (e) {
      setErr(e.message || "Failed to save members");
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    if (!editTeam) return;
    try {
      await updateTeam(editTeam.id, {
        name: editTeam.name,
        description: editTeam.description,
        leader_id: editTeam.leader_id ? Number(editTeam.leader_id) : null,
      });
      setEditTeam(null);
      setMsg("Team updated.");
    } catch (e) {
      setErr(e.message || "Failed to update team");
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteTeam(deleteConfirm.id);
      if (selectedId === deleteConfirm.id) setSelectedId(null);
      setDeleteConfirm(null);
      setMsg("Team deleted.");
    } catch (e) {
      setErr(e.message || "Failed to delete team");
    }
  };

  return (
    <PageShell
      title="Teams"
      subtitle="Create teams, assign leaders, and manage member rosters."
      wide
    >
      {msg && <div className="alert alert--success">{msg}</div>}
      {err && <div className="alert alert--error">{err}</div>}

      {role === "admin" && (
        <form className="card" onSubmit={createTeam}>
          <h3 style={{ marginTop: 0 }}>Create team</h3>
          <div className="grid grid-3">
            <div className="form-field">
              <label>Team name *</label>
              <input
                value={newTeam.name}
                onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                required
                placeholder="e.g. Engineering"
              />
            </div>
            <div className="form-field">
              <label>Description</label>
              <input
                value={newTeam.description}
                onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                placeholder="Optional"
              />
            </div>
            <div className="form-field">
              <label>Team leader</label>
              <select
                value={newTeam.leader_id}
                onChange={(e) => setNewTeam({ ...newTeam, leader_id: e.target.value })}
              >
                <option value="">No leader assigned</option>
                {leaders.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="btn primary" style={{ marginTop: 12 }}>
            Create team
          </button>
        </form>
      )}

      <div className="grid grid-2" style={{ alignItems: "start" }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>All teams ({teams.length})</h3>
          {teams.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>No teams yet.</p>
          ) : (
            <ul className="activity-list">
              {teams.map((team) => (
                <li key={team.id}>
                  <button
                    type="button"
                    onClick={() => openTeam(team)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      border: "none",
                      background:
                        selectedId === team.id ? "var(--primary-soft)" : "transparent",
                      padding: 8,
                      borderRadius: 8,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      color: "inherit",
                    }}
                  >
                    <strong>{team.name}</strong>
                    <span style={{ display: "block", fontSize: "0.8125rem", color: "var(--muted)" }}>
                      Leader: {team.leader_name || "—"} · {(team.members || []).length} members
                    </span>
                  </button>
                  {role === "admin" && (
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button
                        type="button"
                        className="btn sm"
                        onClick={() =>
                          setEditTeam({
                            id: team.id,
                            name: team.name,
                            description: team.description || "",
                            leader_id: team.leader_id || "",
                          })
                        }
                      >
                        <FiEdit2 /> Edit
                      </button>
                      <button
                        type="button"
                        className="btn sm"
                        style={{ color: "var(--danger)" }}
                        onClick={() => setDeleteConfirm(team)}
                      >
                        <FiTrash2 /> Delete
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          {!selected ? (
            <p style={{ color: "var(--muted)", margin: 0 }}>Select a team to view details and manage members.</p>
          ) : (
            <>
              <h3 style={{ marginTop: 0 }}>{selected.name}</h3>
              {selected.description && (
                <p style={{ color: "var(--text-secondary)" }}>{selected.description}</p>
              )}

              <div className="grid grid-2" style={{ marginTop: 16 }}>
                <div className="card card--flat">
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <FiUser />
                    <strong>Team leader</strong>
                  </div>
                  <p style={{ margin: 0 }}>
                    {selected.leader_name ||
                      employees.find((e) => Number(e.id) === Number(selected.leader_id))?.name ||
                      "Not assigned"}
                  </p>
                </div>
                <div className="card card--flat">
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <FiUsers />
                    <strong>Members</strong>
                  </div>
                  <p style={{ margin: 0 }}>{(selected.members || []).length} assigned</p>
                </div>
              </div>

              {(selected.members || []).length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <h4>Current roster</h4>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {(selected.members || []).map((m) => (
                      <li key={m.id}>
                        {m.name} — {m.department || "No department"} · {m.position || m.rank || "—"}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {role === "admin" && (
                <div style={{ marginTop: 20 }}>
                  <h4>Manage members</h4>
                  <div
                    style={{
                      maxHeight: 280,
                      overflowY: "auto",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      padding: 12,
                    }}
                  >
                    {memberCandidates.map((emp) => (
                      <label
                        key={emp.id}
                        style={{
                          display: "flex",
                          gap: 10,
                          alignItems: "center",
                          padding: "6px 0",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={draftMembers.includes(emp.id)}
                          onChange={() => toggleMember(emp.id)}
                        />
                        <span>
                          {emp.name} <span style={{ color: "var(--muted)" }}>({emp.department || "—"})</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="btn primary"
                    style={{ marginTop: 12 }}
                    disabled={saving}
                    onClick={saveMembers}
                  >
                    {saving ? "Saving…" : "Save members"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Modal
        open={!!editTeam}
        title="Edit team"
        onClose={() => setEditTeam(null)}
        footer={
          <>
            <button type="button" className="btn" onClick={() => setEditTeam(null)}>
              Cancel
            </button>
            <button type="button" className="btn primary" onClick={saveEdit}>
              Save
            </button>
          </>
        }
      >
        {editTeam && (
          <div className="stack">
            <div className="form-field">
              <label>Name</label>
              <input
                value={editTeam.name}
                onChange={(e) => setEditTeam({ ...editTeam, name: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Description</label>
              <input
                value={editTeam.description}
                onChange={(e) => setEditTeam({ ...editTeam, description: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Leader</label>
              <select
                value={editTeam.leader_id}
                onChange={(e) => setEditTeam({ ...editTeam, leader_id: e.target.value })}
              >
                <option value="">No leader</option>
                {leaders.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!deleteConfirm}
        title="Delete team"
        onClose={() => setDeleteConfirm(null)}
        footer={
          <>
            <button type="button" className="btn" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </button>
            <button type="button" className="btn primary" style={{ background: "var(--danger)", borderColor: "var(--danger)" }} onClick={confirmDelete}>
              Delete
            </button>
          </>
        }
      >
        <p>Delete team <strong>{deleteConfirm?.name}</strong>? Members will be unassigned from this team.</p>
      </Modal>
    </PageShell>
  );
}

export default Teams;
