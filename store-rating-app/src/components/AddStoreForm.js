import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function AddStoreForm() {
  const [form, setForm] = useState({ name: "", address: "", owner_id: "" });
  const [owners, setOwners] = useState([]);

  useEffect(() => {
    const fetchOwners = async () => {
      const token = localStorage.getItem("token");
      const res = await api.get("/users/owners", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOwners(res.data);
    };
    fetchOwners();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      await api.post("/admin/stores/add", form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Store added");
      setForm({ name: "", address: "", owner_id: "" });
    } catch {
      alert("Failed to add store");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Add New Store</h3>
      <input name="name" value={form.name} onChange={handleChange} placeholder="Store Name" />
      <input name="address" value={form.address} onChange={handleChange} placeholder="Address" />
      <select name="owner_id" value={form.owner_id} onChange={handleChange}>
        <option value="">Select Owner</option>
        {owners.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name} - {o.email}
          </option>
        ))}
      </select>
      <button type="submit">Add Store</button>
    </form>
  );
}
