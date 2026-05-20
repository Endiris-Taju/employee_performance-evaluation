import React from "react";
import { useAuth } from "../../context/AuthContext";

const Settings = () => {
	const { theme, toggleTheme } = useAuth();
	return (
		<div style={{ padding: 24 }}>
			<h2>Settings</h2>
			<div style={{ marginTop: 16 }}>
				<label style={{ display: "flex", alignItems: "center", gap: 8 }}>
					<input type="checkbox" checked={theme === "dark"} onChange={toggleTheme} />
					Dark Theme
				</label>
			</div>
		</div>
	);
};

export default Settings;



