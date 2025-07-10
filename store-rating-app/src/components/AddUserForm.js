import React, { useState } from "react";
import api from "../services/api";

export default function AddUserForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    address: "",
    role: "user",
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      await api.post("/admin/users/add", form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("User added");
      setForm({ name: "", email: "", password: "", address: "", role: "user" });
    } catch (err) {
      alert("Failed to add user");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Add New User</h3>
      <input name="name" value={form.name} onChange={handleChange} placeholder="Full Name" />
      <input name="email" value={form.email} onChange={handleChange} placeholder="Email" />
      <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Password" />
      <input name="address" value={form.address} onChange={handleChange} placeholder="Address" />
      <select name="role" value={form.role} onChange={handleChange}>
        <option value="user">Normal User</option>
        <option value="admin">Admin</option>
        <option value="owner">Store Owner</option>
      </select>
      <button type="submit">Add User</button>
    </form>
  );
}
