import React, { useEffect, useState } from "react";
import api from "../services/api";
import { FaStar, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function DashboardUser() {
  const [stores, setStores] = useState([]);
  const [myRatings, setMyRatings] = useState({});
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    const token = localStorage.getItem("token");
    const res = await api.get("/stores/all", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setStores(res.data.stores);
    setMyRatings(res.data.myRatings || {});
  };

  const [pendingRatings, setPendingRatings] = useState({});

  const submitRating = async (storeId, rating) => {
    if (!rating) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      await api.post(
        "/ratings/submit",
        { storeId, rating },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Rating submitted successfully!");
      await loadStores();
    } catch (err) {
      alert("Error submitting rating.");
      console.error(err);
    }
    setSubmitting(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const filteredStores = stores.filter((s) =>
    `${s.name} ${s.address}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Logout button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-blue-700">Browse & Rate Stores</h2>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow-sm"
          >
            <FaSignOutAlt />
            Logout
          </button>
        </div>

        <input
          type="text"
          placeholder="Search by name or address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 mb-8 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredStores.map((store) => (
            <div
              key={store.id}
              className="bg-white p-6 rounded-xl border border-gray-200 shadow-md hover:shadow-xl transition duration-300"
            >
              <h3 className="text-2xl font-semibold text-gray-800">{store.name}</h3>
              <p className="text-gray-600 mt-1"><strong>Address:</strong> {store.address}</p>

              <div className="mt-3 text-gray-700">
                <strong>Average Rating:</strong>{" "}
                {!isNaN(parseFloat(store.avgRating)) ? (
                  <span className="inline-flex items-center gap-1 text-yellow-500 font-medium">
                    {parseFloat(store.avgRating).toFixed(1)} <FaStar />
                  </span>
                ) : (
                  "N/A"
                )}
              </div>

              <div className="text-gray-700">
                <strong>Your Rating:</strong>{" "}
                {myRatings[store.id] ? (
                  <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                    {myRatings[store.id]} <FaStar />
                  </span>
                ) : (
                  "Not rated yet"
                )}
              </div>

             <div className="mt-4 space-y-2">
  <select
    value={pendingRatings[store.id] ?? myRatings[store.id] ?? ""}
    onChange={(e) => {
      const newRating = parseInt(e.target.value);
      setPendingRatings((prev) => ({ ...prev, [store.id]: newRating }));
    }}
    className="w-full px-4 py-2 border border-blue-300 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
    disabled={submitting}
  >
    <option value="">Select rating</option>
    {[1, 2, 3, 4, 5].map((r) => (
      <option key={r} value={r}>{r}</option>
    ))}
  </select>

  <button
    onClick={() => submitRating(store.id, pendingRatings[store.id])}
    disabled={submitting || !pendingRatings[store.id]}
    className="w-full bg-blue-600 text-white font-medium py-2 rounded-md hover:bg-blue-700 transition"
  >
    {myRatings[store.id] ? "Update Rating" : "Submit Rating"}
  </button>
</div>

            </div>
          ))}
        </div>

        {filteredStores.length === 0 && (
          <p className="text-center text-gray-500 mt-10 text-lg">No stores found.</p>
        )}
      </div>
    </div>
  );
}
