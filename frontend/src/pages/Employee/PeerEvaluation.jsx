import React, { useEffect, useMemo, useState } from "react";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import PageShell from "../../components/layout/PageShell";
import { FiCheckCircle, FiAlertTriangle, FiUsers } from "react-icons/fi";
import { apiFetch } from "../../services/api";
import { getPeerCandidatesFromTeam } from "../../utils/evaluationHelpers";

const CATEGORIES = [
  { key: "teamwork", label: "Teamwork" },
  { key: "communication", label: "Communication" },
  { key: "problemSolving", label: "Problem solving" },
  { key: "initiative", label: "Initiative" },
  { key: "reliability", label: "Reliability" },
  { key: "leadership", label: "Leadership" },
  { key: "collaboration", label: "Collaboration" },
  { key: "timeManagement", label: "Time management" },
  { key: "ethicsCompliance", label: "Ethics & compliance" },
  { key: "innovation", label: "Innovation" },
  { key: "overallContribution", label: "Overall contribution" },
];

const DEFAULT_SCORES = Object.fromEntries(CATEGORIES.map((c) => [c.key, 4]));

function PeerEvaluation() {
  const { employees, submitPeerEvaluation, fetchTeams } = useData();
  const { email, userId, token } = useAuth();
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [myTeams, setMyTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamsError, setTeamsError] = useState("");

  const me =
    employees.find((e) => e.email === email) ||
    employees.find((e) => String(e.id) === String(userId));

  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedColleagueId, setSelectedColleagueId] = useState("");
  const [peerScores, setPeerScores] = useState(DEFAULT_SCORES);
  const [peerComments, setPeerComments] = useState({
    strengths: "",
    areasForImprovement: "",
    collaborationNotes: "",
    overallFeedback: "",
  });

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      setTeamsLoading(true);
      setTeamsError("");
      try {
        const data = await apiFetch("/teams/mine", { token });
        if (!cancelled) {
          const list = Array.isArray(data) ? data : [];
          setMyTeams(list);
          if (list.length === 1) {
            setSelectedTeamId(String(list[0].id));
          }
        }
        await fetchTeams?.();
      } catch (e) {
        if (!cancelled) {
          setTeamsError(e.message || "Failed to load your teams");
          setMyTeams([]);
        }
      } finally {
        if (!cancelled) setTeamsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, fetchTeams]);

  const selectedTeam = useMemo(
    () => myTeams.find((t) => String(t.id) === String(selectedTeamId)),
    [myTeams, selectedTeamId]
  );

  const colleagues = useMemo(
    () => getPeerCandidatesFromTeam(selectedTeam, me?.id || userId),
    [selectedTeam, me?.id, userId]
  );

  const selectedColleague = colleagues.find(
    (e) => String(e.id) === String(selectedColleagueId)
  );

  const peerTotalScore = Object.values(peerScores).reduce((s, v) => s + Number(v), 0);
  const peerMaxScore = CATEGORIES.length * 5;
  const peerPercentage =
    peerMaxScore > 0 ? ((peerTotalScore / peerMaxScore) * 100).toFixed(1) : 0;

  const handleTeamChange = (teamId) => {
    setSelectedTeamId(teamId);
    setSelectedColleagueId("");
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!me?.id) {
      setError("Profile not found.");
      return;
    }
    if (!selectedTeamId) {
      setError("Select your team first.");
      return;
    }
    if (!selectedColleagueId) {
      setError("Select a team member to evaluate.");
      return;
    }
    try {
      setSubmitting(true);
      await submitPeerEvaluation({
        employeeId: selectedColleagueId,
        evaluatorId: me.id,
        scores: peerScores,
        comments: peerComments,
        totalScore: peerTotalScore,
        maxScore: peerMaxScore,
        percentage: Number(peerPercentage),
      });
      setSuccess(
        `Peer evaluation for ${selectedColleague?.name} saved (${peerPercentage}% — 10% weight).`
      );
      setPeerScores(DEFAULT_SCORES);
      setPeerComments({
        strengths: "",
        areasForImprovement: "",
        collaborationNotes: "",
        overallFeedback: "",
      });
      setSelectedColleagueId("");
    } catch (err) {
      setError(err.message || "Failed to save.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell
      title="Peer evaluation"
      subtitle="Select your team, then choose a teammate to evaluate (10% weight toward their efficiency score)."
      backTo="/employee"
    >
      <div className="card card--flat">
        <p style={{ margin: 0 }}>
          <strong>Your score preview:</strong> {peerPercentage}% ({peerTotalScore} / {peerMaxScore})
        </p>
      </div>

      {success && (
        <div className="alert alert--success">
          <FiCheckCircle /> {success}
        </div>
      )}
      {error && (
        <div className="alert alert--error">
          <FiAlertTriangle /> {error}
        </div>
      )}
      {teamsError && (
        <div className="alert alert--error">
          <FiAlertTriangle /> {teamsError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="stack">
        <div className="card">
          <h3 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <FiUsers /> Your team
          </h3>
          {teamsLoading ? (
            <p style={{ color: "var(--muted)", margin: 0 }}>Loading teams…</p>
          ) : myTeams.length === 0 ? (
            <p style={{ color: "var(--muted)", margin: 0 }}>
              You are not assigned to any team yet. Ask an admin to add you to a team roster before
              submitting peer evaluations.
            </p>
          ) : (
            <>
              <div className="form-field">
                <label>Select team *</label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => handleTeamChange(e.target.value)}
                  required
                >
                  <option value="">Choose your team…</option>
                  {myTeams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                      {team.leader_name ? ` — Leader: ${team.leader_name}` : ""}
                      {` (${(team.members || []).length} members)`}
                    </option>
                  ))}
                </select>
              </div>
              {selectedTeam && (
                <div style={{ marginTop: 12, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                  <p style={{ margin: "0 0 8px" }}>
                    <strong>Team leader:</strong> {selectedTeam.leader_name || "Not assigned"}
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>Roster:</strong>{" "}
                    {(selectedTeam.members || [])
                      .map((m) => m.name)
                      .join(", ") || "No members listed"}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {selectedTeam && (
          <div className="card">
            <div className="form-field">
              <label>Select team member to evaluate *</label>
              <select
                value={selectedColleagueId}
                onChange={(e) => setSelectedColleagueId(e.target.value)}
                required
              >
                <option value="">Choose a colleague…</option>
                {colleagues.map((peer) => (
                  <option key={peer.id} value={peer.id}>
                    {peer.name} — {peer.department || peer.position || "Team member"}
                  </option>
                ))}
              </select>
              {colleagues.length === 0 && (
                <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: 8 }}>
                  No other members on this team to evaluate. You need at least one teammate besides
                  yourself.
                </p>
              )}
            </div>
          </div>
        )}

        {selectedColleague && (
          <>
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Ratings for {selectedColleague.name}</h3>
              {CATEGORIES.map((cat) => (
                <div
                  key={cat.key}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: "1px solid var(--border)",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <span>{cat.label}</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={`btn sm ${Number(peerScores[cat.key]) === n ? "primary" : ""}`}
                        onClick={() =>
                          setPeerScores({ ...peerScores, [cat.key]: n })
                        }
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="card">
              <h3 style={{ marginTop: 0 }}>Feedback</h3>
              <div className="grid grid-2">
                {Object.entries(peerComments).map(([key, val]) => (
                  <div key={key} className="form-field">
                    <label style={{ textTransform: "capitalize" }}>
                      {key.replace(/([A-Z])/g, " $1")}
                    </label>
                    <textarea
                      rows={3}
                      value={val}
                      onChange={(e) =>
                        setPeerComments({ ...peerComments, [key]: e.target.value })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <button
          type="submit"
          className="btn primary"
          disabled={
            submitting ||
            teamsLoading ||
            !selectedTeamId ||
            !selectedColleagueId ||
            colleagues.length === 0
          }
        >
          {submitting ? "Submitting…" : "Submit peer evaluation"}
        </button>
      </form>
    </PageShell>
  );
}

export default PeerEvaluation;
