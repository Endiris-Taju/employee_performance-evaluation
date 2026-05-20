import React from "react";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";

const EmployeeReports = () => {
	const { teams, employees, computeAggregatesForTeam } = useData();
	const { email } = useAuth();
	const me = employees.find((e) => e.email === email);
	const myTeam = teams.find((t) => (t.memberIds || []).includes(me && me.id));

	if (!myTeam || !me) return <div className="container" style={{ padding: 24 }}><h2>No report available</h2></div>;

	const build = computeAggregatesForTeam(myTeam.id);
	const a = build(me.id);

	return (
		<div className="container" style={{ padding: 24 }}>
			<h2>My Report</h2>
			<div className="card" style={{ marginTop: 16 }}>
				<p>Task (70%): {a.taskPct.toFixed(1)}%</p>
				<p>Leader (10%): {a.leaderPct.toFixed(1)}%</p>
				<p>Self (5%): {a.selfPct.toFixed(1)}%</p>
				<p>Peer (15%): {a.peerPct.toFixed(1)}%</p>
				<h3>Total: {a.totalPct.toFixed(1)}%</h3>
			</div>
		</div>
	);
};

export default EmployeeReports;



