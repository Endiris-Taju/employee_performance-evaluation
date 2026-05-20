// src/pages/Admin/AddEmployee.jsx
import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./AddEmployee.css";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import { FiCamera, FiCameraOff, FiUser } from "react-icons/fi";
import databaseService from "../../services/DatabaseService";

function AddEmployee() {
  const { addEmployee, fetchEmployees } = useData();
  const { name } = useAuth();
  const navigate = useNavigate();
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "employee",
    department: "",
    rank: "",
    password: "",
    employeeId: "",
    phone: "",
    position: ""
  });

  // Camera states
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const departments = [
    "Engineering",
    "Marketing", 
    "Sales",
    "Human Resources",
    "Finance",
    "Operations",
    "Design",
    "Quality Assurance",
    "Customer Support",
    "Management"
  ];

  const roles = [
    { value: "employee", label: "Employee", description: "Regular team member" },
    { value: "leader", label: "Team Leader", description: "Manages a team" },
    { value: "admin", label: "Administrator", description: "Full system access" }
  ];

  // Removed auto-generate password; password is manually typed by the admin

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError("");
    if (success) setSuccess("");
  };

  // Camera functions
  const startCamera = async () => {
    setCameraError("");
    try {
      if (!window.isSecureContext) {
        setCameraError("Camera requires HTTPS or localhost");
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("Camera API not supported in this browser");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false,
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraOn(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError("Failed to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    const s = streamRef.current;
    if (s) {
      s.getTracks().forEach((t) => t.stop());
    }
    streamRef.current = null;
    setIsCameraOn(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      setCameraError("Camera not available");
      return;
    }

    if (video.readyState !== 4) {
      setCameraError("Camera not ready");
      return;
    }

    const w = 640;
    const h = 480;
    
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    
    ctx.drawImage(video, 0, 0, w, h);
    
    // Add timestamp overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, h - 40, w, 40);
    ctx.fillStyle = "white";
    ctx.font = "14px Arial";
    ctx.fillText(`Employee: ${formData.name || 'Unknown'} - ${new Date().toLocaleString()}`, 10, h - 15);
    
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setPhotoDataUrl(dataUrl);
    setCameraError("");
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Validate photo is captured
    if (!photoDataUrl) {
      setError("Please capture employee photo before submitting");
      setLoading(false);
      return;
    }

    try {
      // First create user account
      const userResponse = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: formData.role,
          name: formData.name,
          department: formData.department,
          rank: formData.rank,
          employeeId: formData.employeeId,
          phone: formData.phone,
          position: formData.position
        })
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        throw new Error(errorData.error || "Failed to create user account");
      }

      const userData = await userResponse.json();
      
      // Store employee photo in database for attendance verification
      try {
        const photoData = {
          employeeId: userData.user?.id || userData.id,
          employeeName: formData.name,
          dataUrl: photoDataUrl,
          type: 'employee_photo',
          createdAt: new Date().toISOString(),
          department: formData.department,
          position: formData.position
        };
        
        await databaseService.storePhoto(photoData);
        console.log('Employee photo stored successfully');
      } catch (photoError) {
        console.error('Failed to store employee photo:', photoError);
        // Don't fail the whole process if photo storage fails
      }
      
      setSuccess(`Employee added successfully! Login credentials: ${formData.email} / ${formData.password}`);
      
      // Refresh employees list so new employee appears in dropdowns
      if (typeof fetchEmployees === "function") {
        await fetchEmployees();
      }
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({
          name: "",
          email: "",
          role: "employee",
          department: "",
          rank: "",
          password: "",
          employeeId: "",
          phone: "",
          position: ""
        });
        setPhotoDataUrl("");
        setSuccess("");
        stopCamera();
      }, 5000);

    } catch (err) {
      setError(err.message || "Failed to add employee");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-employee">
      <div className="add-employee-container">
        <header className="header">
          <div className="header-content">
            <div className="header-text">
              <h1>Add New Employee</h1>
              <p>Create a new employee account with login credentials</p>
            </div>
            <Link to="/admin" className="back-btn">
              <span className="back-icon">←</span>
              Back to Dashboard
            </Link>
          </div>
        </header>

        <div className="form-container">
          <form onSubmit={handleSubmit} className="employee-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  <span className="label-icon">👤</span>
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter full name"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  <span className="label-icon">📧</span>
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter email address"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="role" className="form-label">
                  <span className="label-icon">🎭</span>
                  Role *
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  className="form-select"
                >
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label} - {role.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="department" className="form-label">
                  <span className="label-icon">🏢</span>
                  Department
                </label>
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="rank" className="form-label">
                  <span className="label-icon">⭐</span>
                  Position/Rank
                </label>
                <input
                  type="text"
                  id="rank"
                  name="rank"
                  value={formData.rank}
                  onChange={handleChange}
                  placeholder="e.g., Senior Developer, Manager"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="employeeId" className="form-label">
                  <span className="label-icon">🆔</span>
                  Employee ID *
                </label>
                <input
                  type="text"
                  id="employeeId"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  required
                  placeholder="e.g., EMP001, 2024001"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone" className="form-label">
                  <span className="label-icon">📞</span>
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g., +1-234-567-8900"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="position" className="form-label">
                  <span className="label-icon">💼</span>
                  Job Position
                </label>
                <input
                  type="text"
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  placeholder="e.g., Software Engineer, Project Manager"
                  className="form-input"
                />
              </div>

              <div className="form-group password-group">
                <label htmlFor="password" className="form-label">
                  <span className="label-icon">��</span>
                  Login Password *
                </label>
                <div className="password-input-group">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Enter a secure password"
                    className="form-input password-input"
                    
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle"
                  >
                    {showPassword ? "��️" : "��️‍🗨️"}
                  </button>
                </div>
                
              </div>
            </div>

            {/* Employee Photo Section */}
            <div className="photo-section">
              <h3 className="section-title">
                <FiCamera /> Employee Photo (Required for Attendance)
              </h3>
              
              <div className="camera-container">
                <div className="camera-controls">
                  {!isCameraOn ? (
                    <button 
                      type="button" 
                      className="camera-btn start" 
                      onClick={startCamera}
                    >
                      <FiCamera /> Start Camera
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      className="camera-btn stop" 
                      onClick={stopCamera}
                    >
                      <FiCameraOff /> Stop Camera
                    </button>
                  )}
                  
                  {isCameraOn && (
                    <button 
                      type="button" 
                      className="capture-btn" 
                      onClick={capturePhoto}
                    >
                      <FiCamera /> Capture Photo
                    </button>
                  )}
                </div>

                <div className="camera-grid">
                  <div className="camera-feed">
                    <h4>Live Camera</h4>
                    <div className="video-container">
                      <video 
                        ref={videoRef} 
                        className={`video-feed ${isCameraOn ? 'active' : ''}`}
                        playsInline 
                        autoPlay
                        muted
                      />
                      {!isCameraOn && (
                        <div className="camera-placeholder">
                          <FiCamera />
                          <p>Click "Start Camera" to capture employee photo</p>
                        </div>
                      )}
                    </div>
                    <canvas ref={canvasRef} style={{ display: "none" }} />
                  </div>

                  <div className="photo-preview">
                    <h4>Captured Photo</h4>
                    <div className="preview-container">
                      {photoDataUrl ? (
                        <img src={photoDataUrl} alt="Employee" className="captured-photo" />
                      ) : (
                        <div className="photo-placeholder">
                          <FiUser />
                          <p>No photo captured yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {cameraError && (
                  <div className="camera-error">
                    <span className="error-icon">⚠️</span>
                    {cameraError}
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}
            
            {success && (
              <div className="success-message">
                <span className="success-icon">✅</span>
                {success}
              </div>
            )}

            <div className="form-actions">
              <button 
                type="submit" 
                className={`submit-btn ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Adding Employee...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">➕</span>
                    Add Employee
                  </>
                )}
              </button>
              <Link to="/admin" className="cancel-btn">
                <span className="btn-icon">❌</span>
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddEmployee;
