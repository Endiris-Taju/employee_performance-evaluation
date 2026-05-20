import React from "react";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";

const LeaderReports = () => {
	const { teams, employees, submitReport, computeAggregatesForTeam } = useData();
	const { email } = useAuth();
	const me = employees.find((e) => e.email === email);
	const myTeam = teams.find((t) => t.leaderId === (me && me.id));

	if (!myTeam) return <div className="container" style={{ padding: 24 }}><h2>No team found</h2></div>;

	const build = computeAggregatesForTeam(myTeam.id);
	const aggregates = (myTeam.memberIds || []).map((mid) => build(mid));

	return (
		<div className="container" style={{ padding: 24 }}>
			<h2>Team Report</h2>
			<div className="grid grid-auto" style={{ marginTop: 16 }}>
				{aggregates.map((a) => {
					const m = employees.find((e) => e.id === a.memberId);
					return (
						<div className="card" key={a.memberId}>
							<h3 style={{ marginTop: 0 }}>{m ? m.name : a.memberId}</h3>
							<p>Task (70%): {a.taskPct.toFixed(1)}%</p>
							<p>Leader (10%): {a.leaderPct.toFixed(1)}%</p>
							<p>Self (5%): {a.selfPct.toFixed(1)}%</p>
							<p>Peer (15%): {a.peerPct.toFixed(1)}%</p>
							<h4>Total: {a.totalPct.toFixed(1)}%</h4>
						</div>
					);
				})}
			</div>
			<div style={{ textAlign: 'right', marginTop: 12 }}>
				<button className="btn primary" onClick={() => {
					submitReport({ teamId: myTeam.id, leaderId: me.id });
					alert('Submitted report to Admin (frontend only).');
				}}>Submit to Admin</button>
			</div>
		</div>
	);
};

export default LeaderReports;



