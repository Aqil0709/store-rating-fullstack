import React, { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

export default function SignupForm() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    password: "",
    role: "user",
  });

  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    const { name, address, password, email } = form;
    if (name.length < 20 || name.length > 60) return "Name must be 20–60 chars";
    if (address.length > 400) return "Address too long";
    if (!password.match(/^(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,16}$/))
      return "Password must include uppercase, special char & be 8–16 chars";
    if (!email.match(/^\S+@\S+\.\S+$/)) return "Invalid email";
    return null;
  };

  const signup = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return setError(err);
    setError("");

    try {
      await api.post("/auth/signup", form);
      alert("Signup successful! Please login.");
      navigate("/");
    } catch (err) {
      setError("Signup failed: " + (err.response?.data || "Server error"));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-600 to-indigo-700 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full animate-fade-in">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Create Your Account</h2>

        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={signup} className="space-y-4">
          <div>
            <label className="text-sm text-gray-600">Name</label>
            <input
              name="name"
              placeholder="Full name"
              className="w-full px-4 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Email</label>
            <input
              name="email"
              placeholder="Email"
              type="email"
              className="w-full px-4 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Address</label>
            <input
              name="address"
              placeholder="Your address"
              className="w-full px-4 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Strong password"
              className="w-full px-4 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Role</label>
            <select
              name="role"
              className="w-full px-4 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              onChange={handleChange}
              defaultValue="user"
            >
              <option value="user">Normal User</option>
              <option value="owner">Store Owner</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition duration-300"
          >
            Sign Up
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <span
            className="text-blue-600 hover:underline cursor-pointer"
            onClick={() => navigate("/")}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}
