import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import PageShell from "../../components/layout/PageShell";
import { apiFetch } from "../../services/api";

export default function Profile() {
  const { token, role, email: authEmail, setProfileFromUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    name: "",
    department: "",
    rank: "",
    phone: "",
    position: "",
    employee_id: "",
  });
  const [photoPreview, setPhotoPreview] = useState("");
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const backPath =
    role === "admin" ? "/admin" : role === "leader" ? "/leader" : "/employee";

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        setLoading(true);
        const data = await apiFetch("/auth/me", { token });
        setProfile(data);
        setForm({
          name: data.name || "",
          department: data.department || "",
          rank: data.rank || "",
          phone: data.phone || "",
          position: data.position || "",
          employee_id: data.employee_id || "",
        });
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const onPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    try {
      const updated = await apiFetch("/auth/me", {
        token,
        method: "PUT",
        body: {
          ...form,
          profile_photo_data_url: photoPreview
            ? photoPreview.slice(0, 200000)
            : undefined,
        },
      });
      setProfile(updated);
      if (setProfileFromUser) {
        setProfileFromUser(updated);
      }
      setMsg("Profile saved.");
    } catch (e) {
      setErr(e.message);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    if (pwd.next.length < 6) {
      setErr("New password must be at least 6 characters.");
      return;
    }
    if (pwd.next !== pwd.confirm) {
      setErr("Passwords do not match.");
      return;
    }
    try {
      await apiFetch("/auth/change-password", {
        token,
        method: "POST",
        body: {
          currentPassword: pwd.current,
          newPassword: pwd.next,
        },
      });
      setPwd({ current: "", next: "", confirm: "" });
      setMsg("Password updated.");
    } catch (e) {
      setErr(e.message);
    }
  };

  if (loading) {
    return (
      <PageShell title="Profile" backTo={backPath}>
        <div className="card">Loading…</div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Profile"
      subtitle={authEmail || profile?.email}
      backTo={backPath}
    >
      {err && (
        <div className="card" style={{ borderColor: "#ef4444", marginBottom: 16 }}>
          <p className="error" style={{ margin: 0 }}>{err}</p>
        </div>
      )}
      {msg && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p className="success" style={{ margin: 0 }}>{msg}</p>
        </div>
      )}

      <form className="card stack" onSubmit={saveProfile} style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Account details</h3>
        <label className="form-field">
          <span>Name</span>
          <input
            className="input-modern"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </label>
        <label className="form-field">
          <span>Email</span>
          <input className="input-modern" value={profile?.email || ""} readOnly />
        </label>
        <label className="form-field">
          <span>Role</span>
          <input className="input-modern" value={profile?.role || ""} readOnly />
        </label>
        <label className="form-field">
          <span>Department</span>
          <input
            className="input-modern"
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
          />
        </label>
        <label className="form-field">
          <span>Rank</span>
          <input
            className="input-modern"
            value={form.rank}
            onChange={(e) => setForm({ ...form, rank: e.target.value })}
          />
        </label>
        <label className="form-field">
          <span>Phone</span>
          <input
            className="input-modern"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </label>
        <label className="form-field">
          <span>Position</span>
          <input
            className="input-modern"
            value={form.position}
            onChange={(e) => setForm({ ...form, position: e.target.value })}
          />
        </label>
        <label className="form-field">
          <span>Employee ID</span>
          <input
            className="input-modern"
            value={form.employee_id}
            onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
          />
        </label>
        <label className="form-field">
          <span>Profile photo</span>
          <input type="file" accept="image/*" onChange={onPhotoChange} />
          {photoPreview && (
            <img
              src={photoPreview}
              alt="Preview"
              style={{ width: 96, height: 96, borderRadius: 8, objectFit: "cover", marginTop: 8 }}
            />
          )}
        </label>
        <button type="submit" className="btn primary">
          Save profile
        </button>
      </form>

      <form className="card stack" onSubmit={changePassword}>
        <h3 style={{ marginTop: 0 }}>Change password</h3>
        <label className="form-field">
          <span>Current password</span>
          <input
            type="password"
            className="input-modern"
            value={pwd.current}
            onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
            required
          />
        </label>
        <label className="form-field">
          <span>New password</span>
          <input
            type="password"
            className="input-modern"
            value={pwd.next}
            onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
            required
            minLength={6}
          />
        </label>
        <label className="form-field">
          <span>Confirm new password</span>
          <input
            type="password"
            className="input-modern"
            value={pwd.confirm}
            onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
            required
          />
        </label>
        <button type="submit" className="btn">
          Update password
        </button>
      </form>
    </PageShell>
  );
}
