import React, { useEffect, useState } from "react";
import { FaUsers, FaStore, FaStar, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import api from "../services/api";

export default function DashboardAdmin() {
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [userSortBy, setUserSortBy] = useState("name");
  const [userOrder, setUserOrder] = useState("asc");
  const [storeSortBy, setStoreSortBy] = useState("s.name");
  const [storeOrder, setStoreOrder] = useState("asc");

  const [userFilters, setUserFilters] = useState({
  userName: "",
  userEmail: "",
  userAddress: "",
  userRole: ""
});

const [storeFilters, setStoreFilters] = useState({
  storeName: "",
  storeAddress: "",
  ownerEmail: ""
});


  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", address: "", role: "user" });
 const [newStore, setNewStore] = useState({
  name: "",
  email: "",
  address: "",
  owner_id: "" 
});


  const token = localStorage.getItem("token");
useEffect(() => {
  const timeout = setTimeout(() => {
    loadDashboard();
  }, 400); // optional debounce

  return () => clearTimeout(timeout);
}, [JSON.stringify(userFilters), JSON.stringify(storeFilters), userSortBy, userOrder, storeSortBy, storeOrder]);

 const loadDashboard = () => {
  const params = new URLSearchParams({
    userSortBy,
    userOrder,
    storeSortBy,
    storeOrder,
    ...userFilters,
    ...storeFilters,
  });

  api.get(`/users/admin/dashboard?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then((res) => {
      setStats(res.data.stats);
      setUsers(res.data.users);
      setStores(res.data.stores);
    });
};


  

  const handleSort = (field, type) => {
    if (type === "user") {
      if (userSortBy === field) {
        setUserOrder(userOrder === "asc" ? "desc" : "asc");
      } else {
        setUserSortBy(field);
        setUserOrder("asc");
      }
    } else {
      if (storeSortBy === field) {
        setStoreOrder(storeOrder === "asc" ? "desc" : "asc");
      } else {
        setStoreSortBy(field);
        setStoreOrder("asc");
      }
    }
  };

  const renderSortIcon = (field, type) => {
    const sortBy = type === "user" ? userSortBy : storeSortBy;
    const order = type === "user" ? userOrder : storeOrder;
    if (sortBy !== field) return <FaSort className="inline" />;
    return order === "asc" ? <FaSortUp className="inline" /> : <FaSortDown className="inline" />;
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/users", newUser, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("User added successfully");
      setNewUser({ name: "", email: "", password: "", address: "", role: "user" });
      loadDashboard();
    } catch (err) {
      alert("Error adding user: " + (err.response?.data || "Server error"));
    }
  };

  const handleStoreSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/stores", newStore, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Store added successfully");
      setNewStore({ name: "", email: "", address: "" });
      loadDashboard();
    } catch (err) {
      alert("Error adding store: " + (err.response?.data || "Server error"));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow p-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold text-blue-600">Admin Dashboard</h1>
        <button
          onClick={() => {
            localStorage.removeItem("token");
            window.location.reload();
          }}
          className="text-sm text-white bg-red-500 px-4 py-1 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </header>



      <main className="p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <div className="flex items-center gap-4">
              <FaUsers className="text-3xl text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-2xl font-bold">{stats.users || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <div className="flex items-center gap-4">
              <FaStore className="text-3xl text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Total Stores</p>
                <p className="text-2xl font-bold">{stats.stores || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <div className="flex items-center gap-4">
              <FaStar className="text-3xl text-yellow-500" />
              <div>
                <p className="text-sm text-gray-500">Total Ratings</p>
                <p className="text-2xl font-bold">{stats.ratings || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <section className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Add New User</h2>
          <form onSubmit={handleUserSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="p-2 border rounded" placeholder="Name" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} required />
            <input className="p-2 border rounded" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required />
            <input className="p-2 border rounded" type="password" placeholder="Password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required />
            <input className="p-2 border rounded" placeholder="Address" value={newUser.address} onChange={(e) => setNewUser({ ...newUser, address: e.target.value })} required />
            <select className="p-2 border rounded" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
              <option value="user">Normal User</option>
              <option value="admin">Admin</option>
              <option value="owner">Store Owner</option>
            </select>
            <button type="submit" className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition col-span-1 md:col-span-2">Add User</button>
          </form>
        </section>

      <section className="bg-white p-6 rounded-lg shadow space-y-4">
  <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Add New Store</h2>
  <form onSubmit={handleStoreSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <input
      className="p-2 border rounded"
      placeholder="Store Name"
      value={newStore.name}
      onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
      required
    />
    <input
      className="p-2 border rounded"
      placeholder="Email"
      value={newStore.email}
      readOnly
    />
    <input
      className="p-2 border rounded"
      placeholder="Address"
      value={newStore.address}
      onChange={(e) => setNewStore({ ...newStore, address: e.target.value })}
      required
    />
    <select
      className="p-2 border rounded"
      value={newStore.owner_id}
      onChange={(e) => {
        const selectedOwnerId = e.target.value;
        const selectedOwner = users.find((u) => u.id.toString() === selectedOwnerId);
        setNewStore({
          ...newStore,
          owner_id: selectedOwnerId,
          email: selectedOwner?.email || ""
        });
      }}
      required
    >
      <option value="">Select Owner</option>
      {users
        .filter((u) => u.role === "owner")
        .map((owner) => (
          <option key={owner.id} value={owner.id}>
            {owner.name} ({owner.email})
          </option>
        ))}
    </select>

    <button
      type="submit"
      className="bg-green-600 text-white py-2 rounded hover:bg-green-700 transition col-span-1 md:col-span-2"
    >
      Add Store
    </button>
  </form>
</section>

<div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
  <input
    className="p-2 border rounded"
    placeholder="Filter by Name"
    value={userFilters.userName}
    onChange={(e) => setUserFilters({ ...userFilters, userName: e.target.value })}
  />

  <input
    className="p-2 border rounded"
    placeholder="Filter by Email"
    value={userFilters.userEmail}
    onChange={(e) => setUserFilters({ ...userFilters, userEmail: e.target.value })}
  />

  <input
    className="p-2 border rounded"
    placeholder="Filter by Address"
    value={userFilters.userAddress}
    onChange={(e) => setUserFilters({ ...userFilters, userAddress: e.target.value })}
  />

  <select
    className="p-2 border rounded"
    value={userFilters.userRole}
    onChange={(e) => setUserFilters({ ...userFilters, userRole: e.target.value })}
  >
    <option value="">All Roles</option>
    <option value="user">Normal User</option>
    <option value="admin">Admin</option>
    <option value="owner">Store Owner</option>
  </select>
</div>


        <section className="bg-white p-6 rounded-lg shadow overflow-x-auto">
          <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Users</h2>
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border cursor-pointer" onClick={() => handleSort("name", "user")}>Name {renderSortIcon("name", "user")}</th>
                <th className="p-2 border cursor-pointer" onClick={() => handleSort("email", "user")}>Email {renderSortIcon("email", "user")}</th>
                <th className="p-2 border cursor-pointer" onClick={() => handleSort("address", "user")}>Address {renderSortIcon("address", "user")}</th>
<th className="p-2 border">Role</th>
<th className="p-2 border">Rating</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="p-2 border">{u.name}</td>
                  <td className="p-2 border">{u.email}</td>
                  <td className="p-2 border">{u.address}</td>
               <td className="p-2 border capitalize">{u.role}</td>
<td className="p-2 border">{u.role === "owner" ? (u.avgRating ?? "N/A") : "—"}</td>


                </tr>
              ))}
            </tbody>
          </table>
        </section>

<div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
  <input
    className="p-2 border rounded"
    placeholder="Filter by Store Name"
    value={storeFilters.storeName}
    onChange={(e) => setStoreFilters({ ...storeFilters, storeName: e.target.value })}
  />
  <input
    className="p-2 border rounded"
    placeholder="Filter by Address"
    value={storeFilters.storeAddress}
    onChange={(e) => setStoreFilters({ ...storeFilters, storeAddress: e.target.value })}
  />
  <input
    className="p-2 border rounded"
    placeholder="Filter by Owner Email"
    value={storeFilters.ownerEmail}
    onChange={(e) => setStoreFilters({ ...storeFilters, ownerEmail: e.target.value })}
  />
</div>


        <section className="bg-white p-6 rounded-lg shadow overflow-x-auto">
  <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Stores</h2>
  <table className="min-w-full border border-gray-200 text-sm">
    <thead className="bg-gray-100">
      <tr>
        <th className="p-2 border cursor-pointer" onClick={() => handleSort("s.name", "store")}>
          Store Name {renderSortIcon("s.name", "store")}
        </th>
       <th className="p-2 border cursor-pointer" onClick={() => handleSort("u.email", "store")}>
  Owner Email {renderSortIcon("u.email", "store")}
</th>

        <th className="p-2 border">Address</th>
        <th className="p-2 border cursor-pointer" onClick={() => handleSort("avgRating", "store")}>
          Avg. Rating {renderSortIcon("avgRating", "store")}
        </th>
      </tr>
    </thead>
    <tbody>
      {stores.map((s) => (
        <tr key={s.id} className="hover:bg-gray-50">
          <td className="p-2 border">{s.name}</td>
<td className="p-2 border">{s.owner_email || "N/A"}</td>
          <td className="p-2 border">{s.address}</td>
          <td className="p-2 border">{s.avgRating ?? "N/A"}</td>
        </tr>
      ))}
    </tbody>
  </table>
</section>


      </main>
    </div>
  );
}
