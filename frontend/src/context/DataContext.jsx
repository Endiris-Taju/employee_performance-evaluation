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

export const DataProvider = ({ children }) => {
  const { token } = useAuth();

  // State
  const [employees, setEmployees] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [collectedEvaluations, setCollectedEvaluations] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Always include JWT if present
  const authHeaders = useMemo(
    () =>
      token
        ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        : { "Content-Type": "application/json" },
    [token]
  );

  // Fetch helper
  const fetchData = useCallback(
    async (endpoint, setter) => {
      try {
        const res = await fetch(`${API_URL}/${endpoint}`, { headers: authHeaders });
        if (!res.ok) throw new Error(`Failed to fetch ${endpoint}`);
        const data = await res.json();
        setter(data);
      } catch (err) {
        console.error(`Error fetching ${endpoint}:`, err);
      }
    },
    [authHeaders]
  );

  // Load all data on mount / when token changes
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      fetchData("employees", setEmployees),
      fetchData("teams", setTeams),
      fetchData("tasks", setTasks),
      fetchData("evaluations", setEvaluations),
      // Use regular evaluations for collected evaluations
      fetchData("evaluations", setCollectedEvaluations),
      fetchData("complaints", setComplaints),
    ]).finally(() => setLoading(false));
  }, [token, fetchData]);

  // ---------------- EMPLOYEES ----------------
  const addEmployee = async (employee) => {
    try {
      const res = await fetch(`${API_URL}/employees`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(employee),
      });
      if (!res.ok) throw new Error("Failed to add employee");
      const newEmployee = await res.json();
      setEmployees((prev) => [newEmployee, ...prev]);
      return newEmployee;
    } catch (err) {
      console.error("Error adding employee:", err);
      throw err;
    }
  };

  const updateEmployee = async (id, updates) => {
    try {
      const res = await fetch(`${API_URL}/employees/${id}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update employee");
      const updated = await res.json();
      setEmployees((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      return updated;
    } catch (err) {
      console.error("Error updating employee:", err);
    }
  };

  const deleteEmployee = async (id) => {
    try {
      await fetch(`${API_URL}/employees/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      setEmployees((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error("Error deleting employee:", err);
    }
  };

  // ---------------- TEAMS ----------------
  const addTeam = async (team) => {
    try {
      const res = await fetch(`${API_URL}/teams`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(team),
      });
      if (!res.ok) throw new Error("Failed to add team");
      const newTeam = await res.json();
      setTeams((prev) => [newTeam, ...prev]);
      return newTeam;
    } catch (err) {
      console.error("Error adding team:", err);
    }
  };

  const updateTeam = async (id, updates) => {
    try {
      const res = await fetch(`${API_URL}/teams/${id}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update team");
      const updated = await res.json();
      setTeams((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      return updated;
    } catch (err) {
      console.error("Error updating team:", err);
    }
  };

  const deleteTeam = async (id) => {
    try {
      await fetch(`${API_URL}/teams/${id}`, { method: "DELETE", headers: authHeaders });
      setTeams((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Error deleting team:", err);
    }
  };

  // ---------------- TASKS ----------------
  const addTask = async (task) => {
    try {
      const res = await fetch(`${API_URL}/tasks`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(task),
      });
      if (!res.ok) throw new Error("Failed to add task");
      const newTask = await res.json();
      setTasks((prev) => [newTask, ...prev]);
      return newTask;
    } catch (err) {
      console.error("Error adding task:", err);
    }
  };

  const updateTask = async (id, updates) => {
    try {
      const res = await fetch(`${API_URL}/tasks/${id}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update task");
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      return updated;
    } catch (err) {
      console.error("Error updating task:", err);
    }
  };

  const deleteTask = async (id) => {
    try {
      await fetch(`${API_URL}/tasks/${id}`, { method: "DELETE", headers: authHeaders });
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  // ---------------- EVALUATIONS ----------------
  const submitEvaluation = async (evaluation) => {
    try {
      const res = await fetch(`${API_URL}/evaluations`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(evaluation),
      });
      if (!res.ok) throw new Error("Failed to submit evaluation");
      const newEval = await res.json();
      setEvaluations((prev) => [newEval, ...prev]);
      return newEval;
    } catch (err) {
      console.error("Error submitting evaluation:", err);
    }
  };

  // Normalize number-like ids
  const normId = (val) => {
    if (val == null) return null;
    const n = Number(val);
    return Number.isNaN(n) ? val : n;
  };

  const submitPerformance = async ({ employeeId, scores, totalScore }) => {
    try {
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
      const res = await fetch(`${API_URL}/evaluations`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to submit performance evaluation");
      const newEval = await res.json();
      setEvaluations((prev) => [newEval, ...prev]);
      return newEval;
    } catch (err) {
      console.error("Error submitting performance:", err);
    }
  };

  const submitBehavioral = async (evaluation) => {
    try {
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
        max_score: maxScore ?? (Object.keys(scores || {}).length * 5),
        percentage:
          percentage ??
          (Object.keys(scores || {}).length > 0
            ? (totalScore / (Object.keys(scores).length * 5)) * 100
            : 0),
        date: date || new Date().toISOString(),
      };
      const res = await fetch(`${API_URL}/evaluations`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to submit behavioral evaluation");
      const newEval = await res.json();
      setEvaluations((prev) => [newEval, ...prev]);
      return newEval;
    } catch (err) {
      console.error("Error submitting behavioral:", err);
    }
  };

  const saveWorkRateEvaluation = async (evaluation) => {
    try {
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
          percentage ??
          (sumPerc > 0 ? (totalScore / sumPerc) * 100 : 0),
        date: date || new Date().toISOString(),
      };
      const res = await fetch(`${API_URL}/evaluations`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save work rate evaluation");
      const newEval = await res.json();
      setEvaluations((prev) => [newEval, ...prev]);
      return newEval;
    } catch (err) {
      console.error("Error saving work rate evaluation:", err);
    }
  };

  const saveSelfEvaluation = async (evaluation) => {
    try {
      const { employeeId, scores, totalScore, maxScore, percentage, date } = evaluation;
      const payload = {
        employee_id: normId(employeeId),
        type: "self",
        scores,
        total_score: totalScore,
        max_score: maxScore ?? (Object.keys(scores || {}).length * 5),
        percentage:
          percentage ??
          (Object.keys(scores || {}).length > 0
            ? (totalScore / (Object.keys(scores).length * 5)) * 100
            : 0),
        date: date || new Date().toISOString(),
      };
      const res = await fetch(`${API_URL}/evaluations`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save self evaluation");
      const newEval = await res.json();
      setEvaluations((prev) => [newEval, ...prev]);
      return newEval;
    } catch (err) {
      console.error("Error saving self evaluation:", err);
    }
  };

  // ---------------- COMPLAINTS ----------------
  const submitComplaint = async (complaint) => {
    try {
      const res = await fetch(`${API_URL}/complaints`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(complaint),
      });
      if (!res.ok) throw new Error("Failed to submit complaint");
      const newComplaint = await res.json();
      setComplaints((prev) => [newComplaint, ...prev]);
      return newComplaint;
    } catch (err) {
      console.error("Error submitting complaint:", err);
    }
  };

  // ---------------- FETCH FUNCTIONS ----------------
  const fetchEmployees = useCallback(() => fetchData("employees", setEmployees), [fetchData]);
  const fetchTeams = useCallback(() => fetchData("teams", setTeams), [fetchData]);
  const fetchTasks = useCallback(() => fetchData("tasks", setTasks), [fetchData]);
  const fetchEvaluations = useCallback(() => fetchData("evaluations", setEvaluations), [fetchData]);

  return (
    <DataContext.Provider
      value={{
        employees,
        teams,
        tasks,
        evaluations,
        collectedEvaluations,
        complaints,
        loading,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        addTeam,
        updateTeam,
        deleteTeam,
        addTask,
        updateTask,
        deleteTask,
        submitEvaluation,
        submitBehavioral,
        saveWorkRateEvaluation,
        saveSelfEvaluation,
        submitPerformance,
        submitComplaint,
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