import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../../context/DataContext";
import { FiCamera, FiCameraOff, FiUser, FiEye, FiEyeOff } from "react-icons/fi";
import PageShell from "../../components/layout/PageShell";

const DEPARTMENTS = [
  "Engineering",
  "Marketing",
  "Sales",
  "Human Resources",
  "Finance",
  "Operations",
  "Design",
  "Quality Assurance",
  "Customer Support",
  "Management",
];

const ROLES = [
  { value: "member", label: "Employee" },
  { value: "leader", label: "Team leader" },
  { value: "admin", label: "Administrator" },
];

function AddEmployee() {
  const { addEmployee, fetchEmployees } = useData();
  const navigate = useNavigate();
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "member",
    department: "",
    rank: "",
    password: "",
    employeeId: "",
    phone: "",
    position: "",
  });

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const startCamera = async () => {
    setCameraError("");
    try {
      if (!window.isSecureContext) {
        setCameraError("Camera requires HTTPS or localhost.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraOn(true);
      }
    } catch {
      setCameraError("Could not access camera. Check browser permissions.");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setIsCameraOn(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== 4) {
      setCameraError("Camera not ready.");
      return;
    }
    canvas.width = 640;
    canvas.height = 480;
    canvas.getContext("2d").drawImage(video, 0, 0, 640, 480);
    setPhotoDataUrl(canvas.toDataURL("image/jpeg", 0.8));
    setCameraError("");
  };

  useEffect(() => () => stopCamera(), []);

  const validateStep1 = () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.password || !formData.employeeId.trim()) {
      setError("Name, email, employee ID, and password are required.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photoDataUrl) {
      setError("Capture a profile photo before submitting.");
      setStep(2);
      return;
    }
    setLoading(true);
    setError("");
    try {
      await addEmployee({
        name: formData.name,
        email: formData.email,
        role: formData.role,
        password: formData.password,
        department: formData.department,
        rank: formData.rank,
        employeeId: formData.employeeId,
        phone: formData.phone,
        position: formData.position,
        profile_photo_data_url: photoDataUrl.slice(0, 200000),
      });
      await fetchEmployees?.();
      setSuccess(`Employee added. They can sign in with ${formData.email}`);
      setTimeout(() => navigate("/employee-list"), 2000);
    } catch (err) {
      setError(err.message || "Failed to add employee");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell
      title="Add employee"
      subtitle="Create an account with role, department, and profile photo for attendance."
      backTo="/employee-list"
      actions={
        <button type="button" className="btn" onClick={() => navigate("/employee-list")}>
          View all employees
        </button>
      }
      wide
    >
      <div className="tabs" style={{ marginBottom: 20 }}>
        <button
          type="button"
          className={step === 1 ? "is-active" : ""}
          onClick={() => setStep(1)}
        >
          1. Account details
        </button>
        <button
          type="button"
          className={step === 2 ? "is-active" : ""}
          onClick={() => validateStep1() && setStep(2)}
        >
          2. Profile photo
        </button>
      </div>

      {error && <div className="alert alert--error">{error}</div>}
      {success && <div className="alert alert--success">{success}</div>}

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div className="card">
            <div className="grid grid-2">
              <div className="form-field">
                <label htmlFor="name">Full name *</label>
                <input id="name" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="form-field">
                <label htmlFor="email">Email *</label>
                <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="form-field">
                <label htmlFor="employeeId">Employee ID *</label>
                <input id="employeeId" name="employeeId" value={formData.employeeId} onChange={handleChange} required />
              </div>
              <div className="form-field">
                <label htmlFor="role">Role *</label>
                <select id="role" name="role" value={formData.role} onChange={handleChange}>
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="department">Department</label>
                <select id="department" name="department" value={formData.department} onChange={handleChange}>
                  <option value="">Select department</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="position">Job position</label>
                <input id="position" name="position" value={formData.position} onChange={handleChange} />
              </div>
              <div className="form-field">
                <label htmlFor="rank">Rank / title</label>
                <input id="rank" name="rank" value={formData.rank} onChange={handleChange} />
              </div>
              <div className="form-field">
                <label htmlFor="phone">Phone</label>
                <input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} />
              </div>
              <div className="form-field">
                <label htmlFor="password">Password *</label>
                <div className="input-wrapper">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password"
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="btn primary"
              style={{ marginTop: 16 }}
              onClick={() => validateStep1() && setStep(2)}
            >
              Next: profile photo
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Profile photo (required)</h3>
            <p style={{ color: "var(--muted)", marginTop: 0 }}>
              Used for attendance verification.
            </p>
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              {!isCameraOn ? (
                <button type="button" className="btn primary" onClick={startCamera}>
                  <FiCamera /> Start camera
                </button>
              ) : (
                <button type="button" className="btn" onClick={stopCamera}>
                  <FiCameraOff /> Stop
                </button>
              )}
              {isCameraOn && (
                <button type="button" className="btn" onClick={capturePhoto}>
                  Capture
                </button>
              )}
            </div>
            <div className="grid grid-2">
              <div
                style={{
                  background: "var(--surface-2)",
                  borderRadius: 12,
                  aspectRatio: "4/3",
                  overflow: "hidden",
                }}
              >
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: isCameraOn ? "block" : "none" }}
                />
                {!isCameraOn && (
                  <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
                    <FiCamera size={32} />
                    <p>Start camera to capture</p>
                  </div>
                )}
              </div>
              <div style={{ textAlign: "center" }}>
                {photoDataUrl ? (
                  <img
                    src={photoDataUrl}
                    alt="Profile"
                    style={{ maxWidth: "100%", borderRadius: 12, border: "1px solid var(--border)" }}
                  />
                ) : (
                  <div style={{ padding: 40, color: "var(--muted)" }}>
                    <FiUser size={48} />
                    <p>No photo captured</p>
                  </div>
                )}
              </div>
            </div>
            <canvas ref={canvasRef} style={{ display: "none" }} />
            {cameraError && <p className="error">{cameraError}</p>}
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button type="button" className="btn" onClick={() => setStep(1)}>
                Back
              </button>
              <button type="submit" className="btn primary" disabled={loading || !photoDataUrl}>
                {loading ? "Adding…" : "Add employee"}
              </button>
            </div>
          </div>
        )}
      </form>
    </PageShell>
  );
}

export default AddEmployee;
