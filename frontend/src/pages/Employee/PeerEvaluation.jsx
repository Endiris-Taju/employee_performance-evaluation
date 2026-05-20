import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./PeerEvaluation.css";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import { FiUsers, FiAward, FiTarget, FiCheckCircle, FiAlertTriangle } from "react-icons/fi";
import databaseService from "../../services/DatabaseService";

function PeerEvaluation() {
  const { employees, savePeerEvaluation } = useData();
  const { email, name } = useAuth();
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const me = employees.find((e) => e.email === email);
  const today = new Date();
  const formattedDate = today.toISOString().split("T")[0];

  const [peerScores, setPeerScores] = useState({
    teamwork: "4",
    communication: "3",
    problemSolving: "4",
    initiative: "3",
    reliability: "4",
    leadership: "3",
    collaboration: "4",
    timeManagement: "3",
    ethicsCompliance: "4",
    innovation: "3",
    overallContribution: "4"
  });

  const [peerComments, setPeerComments] = useState({
    strengths: "",
    areasForImprovement: "",
    collaborationNotes: "",
    overallFeedback: ""
  });

  const [selectedPeer, setSelectedPeer] = useState("");
  const [peerList, setPeerList] = useState([
    { id: 1, name: "John Doe", department: "IT" },
    { id: 2, name: "Sara Ali", department: "HR" },
    { id: 3, name: "Michael Johnson", department: "Finance" },
    { id: 4, name: "Aben Kebede", department: "Marketing" },
    { id: 5, name: "Tigist Haile", department: "Operations" }
  ]);

  const evaluationCategories = [
    { key: 'teamwork', label: 'Teamwork & Collaboration', icon: <FiUsers />, description: 'Ability to work effectively with team members' },
    { key: 'communication', label: 'Communication Skills', icon: <FiTarget />, description: 'Clarity and effectiveness in communication' },
    { key: 'problemSolving', label: 'Problem Solving', icon: <FiAward />, description: 'Analytical thinking and solution finding' },
    { key: 'initiative', label: 'Initiative & Proactivity', icon: <FiTarget />, description: 'Taking initiative and driving projects' },
    { key: 'reliability', label: 'Reliability & Dependability', icon: <FiCheckCircle />, description: 'Consistency and trustworthiness' },
    { key: 'leadership', label: 'Leadership Qualities', icon: <FiAward />, description: 'Leadership potential and influence' },
    { key: 'collaboration', label: 'Cross-Functional Collaboration', icon: <FiUsers />, description: 'Working with different departments' },
    { key: 'timeManagement', label: 'Time Management', icon: <FiTarget />, description: 'Meeting deadlines and time efficiency' },
    { key: 'ethicsCompliance', label: 'Ethics & Compliance', icon: <FiCheckCircle />, description: 'Adherence to ethical standards' },
    { key: 'innovation', label: 'Innovation & Creativity', icon: <FiAward />, description: 'Creative thinking and innovation' },
    { key: 'overallContribution', label: 'Overall Contribution', icon: <FiTarget />, description: 'Total contribution to team success' }
  ];

  const handleScoreChange = (category, value) => {
    setPeerScores({ ...peerScores, [category]: value });
    setSuccess("");
    setError("");
  };

  const handleCommentChange = (field, value) => {
    setPeerComments({ ...peerComments, [field]: value });
    setSuccess("");
    setError("");
  };

  // Peer Evaluation: 15% of total
  const peerTotalScore = Object.values(peerScores).reduce(
    (sum, score) => sum + (Number(score) || 0),
    0
  );
  const peerMaxScore = 5; // Each category out of 5
  const peerTotalMaxScore = Object.keys(peerScores).length * peerMaxScore;
  const peerPercentage =
    peerTotalMaxScore > 0
      ? (
          (peerTotalScore / peerTotalMaxScore) *
          100
        ).toFixed(1)
      : 0;

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!me?.id) {
      setError("User not found. Please re-login.");
      return;
    }
    if (Object.values(peerScores).some((score) => score === "")) {
      setError("Please complete all categories.");
      return;
    }

    try {
      const evaluationData = {
        employeeId: me.id,
        peerEvaluation: {
          scores: peerScores,
          totalScore: peerTotalScore,
          maxScore: peerTotalMaxScore,
          percentage: peerPercentage,
          weight: 0.15 // 15% weight
        },
        comments: peerComments,
        evaluatorId: selectedPeer,
        evaluatedBy: "peer",
        date: new Date().toISOString(),
        evaluationType: "peer",
        governmentCompliance: {
          governmentId: "ETH-CIVIL-SERVICE-2025",
          evaluationPeriod: new Date().getFullYear(),
          complianceVersion: "1.0",
          timeZone: "Africa/Addis_Ababa",
          language: "en-US",
          department: me?.department || "General",
          position: me?.position || "Employee"
        }
      };

      try {
        await databaseService.storeEvaluation(evaluationData);
        setSuccess(
          `Peer evaluation submitted successfully! Score: ${peerPercentage}% (15% weight)`
        );

        // Generate peer evaluation report
        generatePeerReport(evaluationData);
      } catch (err) {
        console.error('Failed to store peer evaluation:', err);
        setError('Failed to save peer evaluation. Please try again.');
      }

      // Reset form
      setPeerScores({
        teamwork: "",
        communication: "",
        problemSolving: "",
        initiative: "",
        reliability: "",
        leadership: "",
        collaboration: "",
        timeManagement: "",
        ethicsCompliance: "",
        innovation: "",
        overallContribution: ""
      });
      setPeerComments({
        strengths: "",
        areasForImprovement: "",
        collaborationNotes: "",
        overallFeedback: ""
      });
      setSelectedPeer("");
    } catch (err) {
      console.error("Submit error:", err);
      setError("Failed to save peer evaluation. Please try again.");
    }
  };

  const generatePeerReport = (evaluationData) => {
    const report = {
      employeeInfo: {
        id: evaluationData.employeeId,
        name: me?.name || "Employee",
        department: me?.department || "General",
        position: me?.position || "Employee",
        evaluationDate: evaluationData.date
      },
      peerEvaluation: {
        weight: "15%",
        score: evaluationData.peerEvaluation.percentage,
        details: evaluationData.peerEvaluation.scores
      },
      comments: evaluationData.comments,
      compliance: evaluationData.governmentCompliance
    };

    // Create downloadable text file
    const reportContent = `
ETHIOPIAN CIVIL SERVICE - PEER EVALUATION REPORT
================================================

EMPLOYEE INFORMATION:
- Name: ${report.employeeInfo.name}
- ID: ${report.employeeInfo.id}
- Department: ${report.employeeInfo.department}
- Position: ${report.employeeInfo.position}
- Evaluation Date: ${new Date(report.employeeInfo.evaluationDate).toLocaleDateString()}

PEER EVALUATION RESULTS:
- Weight: ${report.peerEvaluation.weight}
- Percentage Score: ${report.peerEvaluation.score}%
- Total Score: ${evaluationData.peerEvaluation.totalScore}/${evaluationData.peerEvaluation.maxScore}

DETAILED SCORES:
${Object.entries(evaluationData.peerEvaluation.details).map(([key, value]) => 
  `- ${evaluationCategories.find(cat => cat.key === key)?.label || key}: ${value}/5`
).join('\n')}

PEER COMMENTS:
- Strengths: ${evaluationData.comments.strengths || 'Not provided'}
- Areas for Improvement: ${evaluationData.comments.areasForImprovement || 'Not provided'}
- Collaboration Notes: ${evaluationData.comments.collaborationNotes || 'Not provided'}
- Overall Feedback: ${evaluationData.comments.overallFeedback || 'Not provided'}

COMPLIANCE INFORMATION:
- Government ID: ${report.compliance.governmentId}
- Evaluation Period: ${report.compliance.evaluationPeriod}
- Compliance Version: ${report.compliance.complianceVersion}
- Time Zone: ${report.compliance.timeZone}

================================================
Report generated on: ${new Date().toLocaleString()}
    `;

    // Download the report
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `peer_evaluation_${report.employeeInfo.name}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="peer-evaluation">
      {/* Header */}
      <div className="header">
        <Link to="/employee">
          <img src="/logo.png" alt="Logo" className="form-logo" />
        </Link>
        <Link to="/employee" className="home-btn">
          Back to Dashboard
        </Link>
      </div>

      <h2>Peer Evaluation - 15% Weight</h2>

      {/* Evaluation Summary */}
      <div className="evaluation-summary">
        <div className="summary-card">
          <h3>Peer Score (15%)</h3>
          <p className="score-display">{peerPercentage}%</p>
          <p className="score-detail">{peerTotalScore} / {peerTotalMaxScore}</p>
        </div>
      </div>

      {/* Employee Info */}
      <div className="employee-info">
        <h3>Employee Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Name:</label>
            <span>{me?.name || "N/A"}</span>
          </div>
          <div className="info-item">
            <label>Department:</label>
            <span>{me?.department || "N/A"}</span>
          </div>
          <div className="info-item">
            <label>Position:</label>
            <span>{me?.position || "N/A"}</span>
          </div>
        </div>
      </div>

      {/* Peer Selection */}
      <div className="peer-selection">
        <h3>Select Peer Evaluator</h3>
        <select 
          value={selectedPeer} 
          onChange={(e) => setSelectedPeer(e.target.value)}
          className="peer-select"
        >
          <option value="">Choose a peer evaluator...</option>
          {peerList.map(peer => (
            <option key={peer.id} value={peer.id}>
              {peer.name} - {peer.department}
            </option>
          ))}
        </select>
      </div>

      {/* Peer Evaluation Form */}
      <div className="evaluation-section">
        <h3>Peer Assessment Categories</h3>
        <div className="categories-grid">
          {evaluationCategories.map((category) => (
            <div key={category.key} className="category-card">
              <div className="category-header">
                <span className="category-icon">{category.icon}</span>
                <h4>{category.label}</h4>
              </div>
              <p className="category-description">{category.description}</p>
              <div className="rating-options">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <label key={rating} className="rating-label">
                    <input
                      type="radio"
                      name={`peer-${category.key}`}
                      value={rating}
                      checked={Number(peerScores[category.key]) === rating}
                      onChange={() => handleScoreChange(category.key, rating)}
                    />
                    <span className="rating-number">{rating}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comments Section */}
      <div className="comments-section">
        <h3>Peer Feedback Comments</h3>
        <div className="comments-grid">
          <div className="comment-group">
            <label>Strengths</label>
            <textarea
              value={peerComments.strengths}
              onChange={(e) => handleCommentChange("strengths", e.target.value)}
              placeholder="Highlight the employee's key strengths..."
              rows={3}
            />
          </div>
          <div className="comment-group">
            <label>Areas for Improvement</label>
            <textarea
              value={peerComments.areasForImprovement}
              onChange={(e) => handleCommentChange("areasForImprovement", e.target.value)}
              placeholder="Suggest areas where improvement is needed..."
              rows={3}
            />
          </div>
          <div className="comment-group">
            <label>Collaboration Notes</label>
            <textarea
              value={peerComments.collaborationNotes}
              onChange={(e) => handleCommentChange("collaborationNotes", e.target.value)}
              placeholder="Comments on collaboration and teamwork..."
              rows={3}
            />
          </div>
          <div className="comment-group">
            <label>Overall Feedback</label>
            <textarea
              value={peerComments.overallFeedback}
              onChange={(e) => handleCommentChange("overallFeedback", e.target.value)}
              placeholder="Overall assessment and recommendations..."
              rows={4}
            />
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {success && (
        <div className="success-message">
          <FiCheckCircle className="status-icon" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="error-message">
          <FiAlertTriangle className="status-icon" />
          <span>{error}</span>
        </div>
      )}

      {/* Submit Button */}
      <div className="submit-section">
        <button 
          className="submit-btn" 
          onClick={handleSubmit}
          disabled={!selectedPeer || Object.values(peerScores).some(score => score === "")}
        >
          Submit Peer Evaluation (15%)
        </button>
      </div>
    </div>
  );
}

export default PeerEvaluation;
