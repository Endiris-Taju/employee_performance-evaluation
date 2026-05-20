import React, { useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";

const Profile = () => {
	const { name, email } = useAuth();
	const [avatarPreview, setAvatarPreview] = useState("");
	const [message, setMessage] = useState("");
	const passwordRef = useRef(null);
	const newPasswordRef = useRef(null);
	const confirmPasswordRef = useRef(null);

	const onAvatarChange = (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => setAvatarPreview(String(reader.result || ""));
		reader.readAsDataURL(file);
	};

const onSave = (e) => {
	e.preventDefault();
	const newPwd = newPasswordRef.current?.value || "";
	const confirmPwd = confirmPasswordRef.current?.value || "";
	if (newPwd && newPwd.length < 6) {
		setMessage("Password must be at least 6 characters.");
		return;
	}
	if (newPwd && newPwd !== confirmPwd) {
		setMessage("Passwords do not match.");
		return;
	}
	setMessage("Profile updated (frontend only).");
};

	return (
		<div style={{ padding: 24 }}>
			<h2>Profile</h2>
			<form onSubmit={onSave} style={{ display: "grid", gap: 16, maxWidth: 420 }}>
				<div>
					<label>Name</label>
					<input type="text" value={name} readOnly style={{ width: "100%" }} />
				</div>
				<div>
					<label>Email</label>
					<input type="email" value={email} readOnly style={{ width: "100%" }} />
				</div>
				<div>
					<label>Profile Picture</label>
					<input type="file" accept="image/*" onChange={onAvatarChange} />
					{avatarPreview && (
						<img src={avatarPreview} alt="Preview" style={{ marginTop: 8, width: 96, height: 96, borderRadius: 8, objectFit: "cover" }} />
					)}
				</div>
				<div>
					<label>Current Password</label>
					<input type="password" ref={passwordRef} placeholder="Current password" style={{ width: "100%" }} />
				</div>
				<div>
					<label>New Password</label>
					<input type="password" ref={newPasswordRef} placeholder="New password" style={{ width: "100%" }} />
				</div>
				<div>
					<label>Confirm New Password</label>
					<input type="password" ref={confirmPasswordRef} placeholder="Confirm new password" style={{ width: "100%" }} />
				</div>
				{message && <div style={{ color: "#0a7", fontSize: 14 }}>{message}</div>}
				<button type="submit" className="btn primary">Save</button>
			</form>
		</div>
	);
};

export default Profile;



