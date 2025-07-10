import React, { useEffect, useState } from "react";
import api from "../services/api";
import { FaSortUp, FaSortDown } from "react-icons/fa";

export default function DashboardOwner() {
  const [store, setStore] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [sortField, setSortField] = useState("userName");
  const [sortOrder, setSortOrder] = useState("asc");
  const [error, setError] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
  });
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");

  useEffect(() => {
    loadDashboard();
  }, [sortField, sortOrder]);

  const loadDashboard = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(
        `/stores/owner?sortField=${sortField}&sortOrder=${sortOrder}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setStore(res.data.store);
      setRatings(res.data.ratings);
    } catch (err) {
      console.error(err);
      setError(err.response?.data || "Failed to load store dashboard");
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPassError("");
    setPassSuccess("");

    try {
      const token = localStorage.getItem("token");
      await api.post("/auth/update-password", passwordForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPassSuccess("Password updated successfully");
      setPasswordForm({ newPassword: "" });
    } catch (err) {
      setPassError(err.response?.data || "Error updating password");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  if (error)
    return <div className="p-6 text-center text-red-600">{error}</div>;
  if (!store)
    return <div className="p-6 text-center">Loading store info...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-8">
      <div className="flex justify-between items-center max-w-5xl mx-auto mb-6">
        <h2 className="text-3xl font-bold text-indigo-700">
          Store Owner Dashboard
        </h2>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-md mb-8">
        <h3 className="text-2xl font-semibold text-gray-800 mb-2">
          {store.name}
        </h3>
        <p className="text-gray-600 mb-1">
          <strong>Address:</strong> {store.address}
        </p>
        <p className="text-gray-600 mb-4">
          <strong>Average Rating:</strong> {store.avgRating || "N/A"}
        </p>

        <div className="mb-4">
          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {showPasswordForm ? "Hide Password Form" : "Update Password"}
          </button>
        </div>

        {showPasswordForm && (
          <div className="bg-blue-50 p-5 rounded-md border border-blue-200 mt-4">
            <h4 className="text-lg font-semibold mb-3 text-blue-800">
              Update Password
            </h4>
            {passError && <p className="text-red-600 mb-2">{passError}</p>}
            {passSuccess && (
              <p className="text-green-600 mb-2">{passSuccess}</p>
            )}
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <input
                type="password"
                placeholder="New Password"
                className="w-full px-4 py-2 border rounded"
                required
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    newPassword: e.target.value,
                  })
                }
              />
              <button
                type="submit"
                className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800"
              >
                Save Password
              </button>
            </form>
          </div>
        )}

        <h4 className="text-xl font-semibold mb-2 text-gray-700 mt-6">
          User Ratings
        </h4>
        <table className="w-full border border-gray-300 rounded overflow-hidden">
          <thead className="bg-gray-200 text-gray-700">
            <tr>
              {[
                { key: "userName", label: "User Name" },
                { key: "email", label: "Email" },
                { key: "rating_value", label: "Rating" },
                { key: "submittedAt", label: "Submitted At" },
              ].map(({ key, label }) => (
                <th
                  key={key}
                  onClick={() => toggleSort(key)}
                  className="cursor-pointer px-4 py-2 text-left"
                >
                  {label}
                  {sortField === key &&
                    (sortOrder === "asc" ? (
                      <FaSortUp className="inline ml-1" />
                    ) : (
                      <FaSortDown className="inline ml-1" />
                    ))}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ratings.length > 0 ? (
              ratings.map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-2">{r.userName}</td>
                  <td className="px-4 py-2">{r.email}</td>
                  <td className="px-4 py-2">{r.rating_value}</td>
                  <td className="px-4 py-2">
                    {r.submittedAt
                      ? new Date(r.submittedAt).toLocaleString()
                      : "N/A"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-4 py-3 text-center text-gray-500">
                  No ratings submitted yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
