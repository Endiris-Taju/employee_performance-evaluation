import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  FiCamera,
  FiCameraOff,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiMapPin,
} from "react-icons/fi";
import PageShell from "../../components/layout/PageShell";
import StatCard from "../../components/ui/StatCard";
import { getDeviceLocation } from "../../utils/geolocation";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function parseDeviceInfo(raw) {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export default function AttendanceCamera() {
  const { token, role } = useAuth();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [status, setStatus] = useState({ type: "", message: "" });
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const [myLogs, setMyLogs] = useState([]);
  const [location, setLocation] = useState("Detecting location…");
  const [locLoading, setLocLoading] = useState(true);
  const [locError, setLocError] = useState("");
  const [coords, setCoords] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState({
    presentToday: false,
    checkins: 0,
    checkouts: 0,
  });

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token]
  );

  const backPath =
    role === "admin" ? "/admin" : role === "leader" ? "/leader" : "/employee";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLocLoading(true);
      setLocError("");
      try {
        const loc = await getDeviceLocation();
        if (!cancelled) {
          setLocation(loc.label);
          setCoords({ latitude: loc.latitude, longitude: loc.longitude });
        }
      } catch (e) {
        if (!cancelled) {
          setLocError(e.message);
          setLocation("Location unavailable");
        }
      } finally {
        if (!cancelled) setLocLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshLocation = async () => {
    setLocLoading(true);
    setLocError("");
    try {
      const loc = await getDeviceLocation();
      setLocation(loc.label);
      setCoords({ latitude: loc.latitude, longitude: loc.longitude });
    } catch (e) {
      setLocError(e.message);
    } finally {
      setLocLoading(false);
    }
  };

  const startCamera = async () => {
    setStatus({ type: "", message: "" });
    if (!window.isSecureContext) {
      setStatus({ type: "error", message: "Camera requires HTTPS or localhost." });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraOn(true);
      }
    } catch (err) {
      setStatus({ type: "error", message: err.message || "Camera access denied." });
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setIsCameraOn(false);
  };

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== 4) {
      setStatus({ type: "error", message: "Camera not ready." });
      return;
    }
    canvas.width = 640;
    canvas.height = 480;
    canvas.getContext("2d").drawImage(video, 0, 0, 640, 480);
    setPhotoDataUrl(canvas.toDataURL("image/jpeg", 0.6));
    setStatus({ type: "success", message: "Photo captured. Check in or check out to save." });
  };

  const refreshMyLogs = async () => {
    const res = await fetch(`${API_URL}/attendance/me`, { headers });
    const data = await res.json().catch(() => []);
    if (res.ok) setMyLogs(Array.isArray(data) ? data : []);
  };

  const refreshAttendanceStats = async () => {
    const today = new Date().toISOString().split("T")[0];
    const res = await fetch(`${API_URL}/attendance/me?date=${today}`, { headers });
    const logs = res.ok ? await res.json() : [];
    const list = Array.isArray(logs) ? logs : [];
    setAttendanceStats({
      presentToday: list.some((r) => r.event_type === "checkin"),
      checkins: list.filter((r) => r.event_type === "checkin").length,
      checkouts: list.filter((r) => r.event_type === "checkout").length,
    });
  };

  const submitEvent = async (eventType) => {
    if (!photoDataUrl) {
      setStatus({ type: "error", message: "Capture a photo first." });
      return;
    }
    if (locError && !coords) {
      setStatus({ type: "error", message: "Enable location access to mark attendance." });
      return;
    }
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_URL}/attendance/${eventType}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          photo_data_url: photoDataUrl.slice(0, 200000),
          device_info: {
            userAgent: navigator.userAgent,
            location,
            latitude: coords?.latitude,
            longitude: coords?.longitude,
            timestamp: new Date().toISOString(),
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      setStatus({
        type: "success",
        message: eventType === "checkin" ? "Checked in successfully." : "Checked out successfully.",
      });
      setPhotoDataUrl("");
      await refreshMyLogs();
      await refreshAttendanceStats();
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (token) {
      refreshMyLogs();
      refreshAttendanceStats();
    }
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <PageShell
      title="Attendance"
      subtitle="Check in or out with photo verification and GPS location."
      backTo={backPath}
      actions={
        <button type="button" className="btn" onClick={refreshLocation} disabled={locLoading}>
          <FiMapPin /> {locLoading ? "Locating…" : "Refresh location"}
        </button>
      }
      wide
    >
      <div className="card card--flat" style={{ marginBottom: 16 }}>
        <FiMapPin style={{ verticalAlign: "middle", marginRight: 8 }} />
        <strong>Current location:</strong> {location}
        {locError && (
          <p style={{ color: "var(--danger)", margin: "8px 0 0", fontSize: "0.875rem" }}>
            {locError}
          </p>
        )}
      </div>

      {status.message && (
        <div className={`alert alert--${status.type === "success" ? "success" : "error"}`}>
          {status.message}
        </div>
      )}

      <div className="grid grid-3">
        <StatCard
          label="Today"
          value={attendanceStats.presentToday ? "Present" : "Not checked in"}
          variant={attendanceStats.presentToday ? "success" : "warning"}
        />
        <StatCard label="Check-ins today" value={attendanceStats.checkins} />
        <StatCard label="Check-outs today" value={attendanceStats.checkouts} />
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Camera</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {!isCameraOn ? (
              <button type="button" className="btn primary" onClick={startCamera}>
                <FiCamera /> Start camera
              </button>
            ) : (
              <button type="button" className="btn" onClick={stopCamera}>
                <FiCameraOff /> Stop
              </button>
            )}
            <button type="button" className="btn" onClick={capture} disabled={!isCameraOn}>
              Capture photo
            </button>
          </div>
          <div
            style={{
              background: "var(--surface-2)",
              borderRadius: 12,
              overflow: "hidden",
              aspectRatio: "4/3",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
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
              <span style={{ color: "var(--muted)" }}>Camera off</span>
            )}
          </div>
          <canvas ref={canvasRef} style={{ display: "none" }} />
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn primary"
              disabled={!photoDataUrl || isProcessing}
              onClick={() => submitEvent("checkin")}
            >
              <FiCheckCircle /> Check in
            </button>
            <button
              type="button"
              className="btn"
              disabled={!photoDataUrl || isProcessing}
              onClick={() => submitEvent("checkout")}
            >
              <FiXCircle /> Check out
            </button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Captured photo</h3>
          {photoDataUrl ? (
            <img
              src={photoDataUrl}
              alt="Captured"
              style={{ width: "100%", borderRadius: 12, border: "1px solid var(--border)" }}
            />
          ) : (
            <p style={{ color: "var(--muted)" }}>No photo yet.</p>
          )}
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>Recent events</h3>
          <button type="button" className="btn sm" onClick={refreshMyLogs}>
            <FiRefreshCw /> Refresh
          </button>
        </div>
        <div className="data-table-wrap" style={{ marginTop: 16 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Type</th>
                <th>Location</th>
                <th>Photo</th>
              </tr>
            </thead>
            <tbody>
              {myLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ color: "var(--muted)" }}>
                    No attendance events yet.
                  </td>
                </tr>
              ) : (
                myLogs.map((row) => {
                  const info = parseDeviceInfo(row.device_info);
                  return (
                    <tr key={row.id}>
                      <td>
                        {row.event_time
                          ? new Date(row.event_time).toLocaleString()
                          : "—"}
                      </td>
                      <td>
                        <span className="badge badge--success">
                          {row.event_type === "checkin" ? "Check in" : "Check out"}
                        </span>
                      </td>
                      <td style={{ maxWidth: 280 }}>{info.location || "—"}</td>
                      <td>
                        {row.photo_data_url ? (
                          <a href={row.photo_data_url} target="_blank" rel="noreferrer">
                            View
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
}
