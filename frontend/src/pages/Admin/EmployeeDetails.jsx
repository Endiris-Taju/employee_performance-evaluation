import React from "react";
import { useParams, Link } from "react-router-dom";
import { useData } from "../../context/DataContext";
import "./EmployeeDetails.css";

function EmployeeDetails() {
  const { id } = useParams();
  const { employees } = useData();

  const employee = employees.find((emp) => String(emp.ID) === id);

  if (!employee) {
    return (
      <div className="employee-details">
        <h2>Employee Not Found</h2>
        <Link to="/employee-list" className="btn">Back to List</Link>
      </div>
    );
  }

  return (
    <div className="employee-details">
      <h2>{employee.name}</h2>
      <img src={employee.photo} alt={employee.name} className="employee-photo" />
      <p><strong>ID:</strong> {employee.ID}</p>
      <p><strong>Position:</strong> {employee.position}</p>
      <p><strong>Department:</strong> {employee.department}</p>
      <p><strong>Email:</strong> {employee.email}</p>
      <p><strong>Phone:</strong> {employee.phone}</p>

      <Link to="/employee-list" className="btn">Back to List</Link>
    </div>
  );
}

export default EmployeeDetails;
