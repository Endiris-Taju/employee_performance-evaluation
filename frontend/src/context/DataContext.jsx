// src/context/DataContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useAuth } from "./AuthContext";

const DataContext = createContext(null);
export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function parseJsonError(res, fallback) {
  const data = await res.json().catch(() => ({}));
  throw new Error(data.error || data.message || fallback);
}

export const DataProvider = ({ children }) => {
  const { token, role, userId } = useAuth();

  const [employees, setEmployees] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const authHeaders = useMemo(
    () =>
      token
        ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        : { "Content-Type": "application/json" },
    [token]
  );

  const isStaff = role === "admin" || role === "leader";

  const fetchData = useCallback(
    async (endpoint, setter) => {
      const res = await fetch(`${API_URL}/${endpoint}`, { headers: authHeaders });
      if (!res.ok) await parseJsonError(res, `Failed to fetch ${endpoint}`);
      const data = await res.json();
      setter(data);
    },
    [authHeaders]
  );

  const fetchEvaluationsForRole = useCallback(async () => {
    if (!token) return;
    if (isStaff) {
      await fetchData("evaluations", setEvaluations);
      return;
    }
    if (!userId) {
      setEvaluations([]);
      return;
    }
    const res = await fetch(`${API_URL}/evaluations/employee/${userId}`, {
      headers: authHeaders,
    });
    if (!res.ok) await parseJsonError(res, "Failed to fetch evaluations");
    setEvaluations(await res.json());
  }, [token, isStaff, userId, authHeaders, fetchData]);

  useEffect(() => {
    if (!token) {
      setEmployees([]);
      setTeams([]);
      setTasks([]);
      setEvaluations([]);
      setComplaints([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const loads = [
      fetchData("employees", setEmployees),
      fetchData("teams", setTeams),
      fetchData("tasks", setTasks),
      fetchEvaluationsForRole(),
    ];

    if (role === "admin") {
      loads.push(fetchData("complaints", setComplaints));
    } else {
      setComplaints([]);
    }

    Promise.all(loads)
      .catch((err) => console.error("Data load error:", err))
      .finally(() => setLoading(false));
  }, [token, role, userId, fetchData, fetchEvaluationsForRole]);

  const normId = (val) => {
    if (val == null) return null;
    const n = Number(val);
    return Number.isNaN(n) ? val : n;
  };

  const postEvaluation = async (payload) => {
    const res = await fetch(`${API_URL}/evaluations`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify(payload),
    });
    if (!res.ok) await parseJsonError(res, "Failed to submit evaluation");
    const newEval = await res.json();
    setEvaluations((prev) => [newEval, ...prev]);
    return newEval;
  };

  // ---------------- EMPLOYEES ----------------
  const addEmployee = async (employee) => {
    const payload = {
      ...employee,
      role: employee.role === "employee" ? "member" : employee.role,
      profile_photo_data_url:
        employee.profile_photo_data_url ?? employee.profilePhotoDataUrl,
    };
    const res = await fetch(`${API_URL}/employees`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify(payload),
    });
    if (!res.ok) await parseJsonError(res, "Failed to add employee");
    const newEmployee = await res.json();
    setEmployees((prev) => [newEmployee, ...prev]);
    return newEmployee;
  };

  const updateEmployee = async (id, updates) => {
    const res = await fetch(`${API_URL}/employees/${id}`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify(updates),
    });
    if (!res.ok) await parseJsonError(res, "Failed to update employee");
    const updated = await res.json();
    setEmployees((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    return updated;
  };

  const deleteEmployee = async (id) => {
    const res = await fetch(`${API_URL}/employees/${id}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    if (!res.ok) await parseJsonError(res, "Failed to delete employee");
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  };

  // ---------------- TEAMS ----------------
  const addTeam = async (team) => {
    const res = await fetch(`${API_URL}/teams`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify(team),
    });
    if (!res.ok) await parseJsonError(res, "Failed to add team");
    const newTeam = await res.json();
    setTeams((prev) => [newTeam, ...prev]);
    return newTeam;
  };

  const updateTeam = async (id, updates) => {
    const res = await fetch(`${API_URL}/teams/${id}`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify(updates),
    });
    if (!res.ok) await parseJsonError(res, "Failed to update team");
    const updated = await res.json();
    setTeams((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    return updated;
  };

  const deleteTeam = async (id) => {
    const res = await fetch(`${API_URL}/teams/${id}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    if (!res.ok) await parseJsonError(res, "Failed to delete team");
    setTeams((prev) => prev.filter((t) => t.id !== id));
  };

  const setTeamMembers = async (teamId, userIds) => {
    const res = await fetch(`${API_URL}/teams/${teamId}/members`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({ user_ids: userIds }),
    });
    if (!res.ok) await parseJsonError(res, "Failed to update team members");
    const updated = await res.json();
    setTeams((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    return updated;
  };

  // ---------------- TASKS ----------------
  const addTask = async (task) => {
    const res = await fetch(`${API_URL}/tasks`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify(task),
    });
    if (!res.ok) await parseJsonError(res, "Failed to add task");
    const newTask = await res.json();
    setTasks((prev) => [newTask, ...prev]);
    return newTask;
  };

  const updateTask = async (id, updates) => {
    const res = await fetch(`${API_URL}/tasks/${id}`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify(updates),
    });
    if (!res.ok) await parseJsonError(res, "Failed to update task");
    const updated = await res.json();
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    return updated;
  };

  const deleteTask = async (id) => {
    const res = await fetch(`${API_URL}/tasks/${id}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    if (!res.ok) await parseJsonError(res, "Failed to delete task");
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // ---------------- EVALUATIONS ----------------
  const submitEvaluation = async (evaluation) => postEvaluation(evaluation);

  const submitPerformance = async ({ employeeId, scores, totalScore }) => {
    const payload = {
      employee_id: normId(employeeId),
      type: "performance",
      scores,
      total_score: totalScore,
      max_score: Object.keys(scores || {}).length * 10,
      percentage:
        Object.keys(scores || {}).length > 0
          ? (totalScore / (Object.keys(scores).length * 10)) * 100
          : 0,
      date: new Date().toISOString(),
    };
    return postEvaluation(payload);
  };

  const submitBehavioral = async (evaluation) => {
    const {
      employeeId,
      evaluatorId,
      scores,
      totalScore,
      maxScore,
      percentage,
      date,
    } = evaluation;
    const payload = {
      employee_id: normId(employeeId),
      evaluator_id: normId(evaluatorId),
      type: "behavioral",
      scores,
      total_score: totalScore,
      max_score: maxScore ?? Object.keys(scores || {}).length * 5,
      percentage:
        percentage ??
        (Object.keys(scores || {}).length > 0
          ? (totalScore / (Object.keys(scores).length * 5)) * 100
          : 0),
      date: date || new Date().toISOString(),
    };
    return postEvaluation(payload);
  };

  const saveWorkRateEvaluation = async (evaluation) => {
    const { employeeId, tasks, totalScore, maxScore, percentage, date } = evaluation;
    const sumPerc = Array.isArray(tasks)
      ? tasks.reduce((s, t) => s + (Number(t.percent) || 0), 0)
      : 0;
    const payload = {
      employee_id: normId(employeeId),
      type: "workrate",
      tasks,
      total_score: totalScore,
      max_score: maxScore ?? sumPerc,
      percentage:
        percentage ?? (sumPerc > 0 ? (totalScore / sumPerc) * 100 : 0),
      date: date || new Date().toISOString(),
    };
    return postEvaluation(payload);
  };

  const saveSelfEvaluation = async ({ employeeId, scores, comments, totalScore, maxScore, percentage, date }) => {
    const keyCount = Object.keys(scores || {}).length;
    const max = maxScore ?? keyCount * 5;
    const payload = {
      employee_id: normId(employeeId),
      type: "self",
      scores: { ...scores, comments: comments || {} },
      total_score: totalScore,
      max_score: max,
      percentage:
        percentage ?? (keyCount > 0 ? (totalScore / max) * 100 : 0),
      date: date || new Date().toISOString(),
    };
    return postEvaluation(payload);
  };

  const submitPeerEvaluation = async ({
    employeeId,
    evaluatorId,
    scores,
    comments,
    totalScore,
    maxScore,
    percentage,
    date,
  }) => {
    const keyCount = Object.keys(scores || {}).length;
    const max = maxScore ?? keyCount * 5;
    const payload = {
      employee_id: normId(employeeId),
      evaluator_id: normId(evaluatorId),
      type: "peer",
      scores: { ...scores, comments: comments || {} },
      total_score: totalScore,
      max_score: max,
      percentage:
        percentage ?? (keyCount > 0 ? (totalScore / max) * 100 : 0),
      date: date || new Date().toISOString(),
    };
    return postEvaluation(payload);
  };

  // ---------------- COMPLAINTS ----------------
  const submitComplaint = async (complaint) => {
    const res = await fetch(`${API_URL}/complaints`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify(complaint),
    });
    if (!res.ok) await parseJsonError(res, "Failed to submit complaint");
    const newComplaint = await res.json();
    setComplaints((prev) => [newComplaint, ...prev]);
    return newComplaint;
  };

  const updateComplaintStatus = async (id, status) => {
    const res = await fetch(`${API_URL}/complaints/${id}`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({ status }),
    });
    if (!res.ok) await parseJsonError(res, "Failed to update complaint status");
    const updated = await res.json();
    setComplaints((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
    return updated;
  };

  const fetchEmployees = useCallback(() => fetchData("employees", setEmployees), [fetchData]);
  const fetchTeams = useCallback(() => fetchData("teams", setTeams), [fetchData]);
  const fetchTasks = useCallback(() => fetchData("tasks", setTasks), [fetchData]);
  const fetchEvaluations = useCallback(() => fetchEvaluationsForRole(), [fetchEvaluationsForRole]);

  return (
    <DataContext.Provider
      value={{
        employees,
        teams,
        tasks,
        evaluations,
        collectedEvaluations: evaluations,
        complaints,
        loading,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        addTeam,
        updateTeam,
        deleteTeam,
        setTeamMembers,
        addTask,
        updateTask,
        deleteTask,
        submitEvaluation,
        submitBehavioral,
        saveWorkRateEvaluation,
        saveSelfEvaluation,
        submitPeerEvaluation,
        submitPerformance,
        submitComplaint,
        updateComplaintStatus,
        fetchEmployees,
        fetchTeams,
        fetchTasks,
        fetchEvaluations,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
