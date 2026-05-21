// src/pages/Admin/EmployeeList.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiUserPlus } from "react-icons/fi";
import { useData } from "../../context/DataContext";
import Modal from "../../components/ui/Modal";
import PageShell from "../../components/layout/PageShell";

function EmployeeList() {
  const navigate = useNavigate();
  const { employees, updateEmployee, deleteEmployee } = useData();
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    position: "",
    department: "",
    phone: "",
    idNumber: "",
  });

  const startEdit = (emp) => {
    setEditing(emp.id);
    setForm({
      name: emp.name,
      email: emp.email,
      position: emp.position,
      department: emp.department,
      phone: emp.phone,
      idNumber: emp.idNumber,
    });
  };

  const save = () => {
    updateEmployee(editing, form);
    setEditing(null);
  };

  const cancel = () => setEditing(null);

  const confirmDelete = (emp) => {
    setDeleting(emp);
  };

  const handleDelete = () => {
    if (deleting) {
      deleteEmployee(deleting.id);
      setDeleting(null);
    }
  };

  const cancelDelete = () => {
    setDeleting(null);
  };

  return (
    <PageShell
      title="Employees"
      subtitle="Manage staff records, roles, and contact details."
      actions={
        <button type="button" className="btn primary" onClick={() => navigate("/addEmployee")}>
          <FiUserPlus /> Add employee
        </button>
      }
      wide
    >
      <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Employee ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Position</th>
            <th>Department</th>
            <th>Photo</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees?.map((emp) => (
            <tr key={emp.id}>
              <td>{emp.idNumber}</td>
              <td>{emp.name}</td>
              <td>{emp.email}</td>
              <td>{emp.phone}</td>
              <td>{emp.position}</td>
              <td>{emp.department}</td>
              <td>
                <img
                  src={emp.photo || "https://via.placeholder.com/50"}
                  alt={emp.name}
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              </td>
              <td>
                <button type="button" className="btn sm" onClick={() => startEdit(emp)}>
                  Edit
                </button>{" "}
                <button
                  type="button"
                  className="btn sm"
                  style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
                  onClick={() => confirmDelete(emp)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {/* Edit Modal */}
      <Modal
        open={!!editing}
        title="Edit Employee"
        onClose={cancel}
        footer={
          <>
            <button className="btn" onClick={cancel}>
              Cancel
            </button>
            <button className="btn primary" onClick={save}>
              Save
            </button>
          </>
        }
      >
        <div style={{ display: "grid", gap: 12 }}>
          <label>
            Name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label>
            Email
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label>
            Phone
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
          <label>
            Employee ID
            <input
              value={form.idNumber}
              onChange={(e) => setForm({ ...form, idNumber: e.target.value })}
            />
          </label>
          <label>
            Position
            <input
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
            />
          </label>
          <label>
            Department
            <input
              value={form.department}
              onChange={(e) =>
                setForm({ ...form, department: e.target.value })
              }
            />
          </label>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleting}
        title="Confirm Deletion"
        onClose={cancelDelete}
        footer={
          <>
            <button className="btn" onClick={cancelDelete}>
              No keep it
            </button>
            <button className="btn danger" onClick={handleDelete}>
              Yes delete it
            </button>
          </>
        }
      >
        <div style={{ padding: "20px 0" }}>
          <p>Are you sure to delete this employee?</p>
          {deleting && (
            <div style={{ marginTop: "15px", padding: "10px", background: "#f8f9fa", borderRadius: "8px" }}>
              <strong>Name:</strong> {deleting.name}<br />
              <strong>ID:</strong> {deleting.idNumber}<br />
              <strong>Position:</strong> {deleting.position}
            </div>
          )}
        </div>
      </Modal>
    </PageShell>
  );
}

export default EmployeeList;
