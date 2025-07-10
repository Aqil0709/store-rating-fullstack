import React from "react";
import DashboardAdmin from "../components/DashboardAdmin";
import DashboardOwner from "../components/DashboardOwner";
import DashboardUser from "../components/DashboardUser";
import { jwtDecode } from "jwt-decode";

export default function DashboardPage() {
  const token = localStorage.getItem("token");
  if (!token) return <div>Please login</div>;

  const decoded = jwtDecode(token);
  const role = decoded.role;

  return (
    <>
      {role === "admin" && <DashboardAdmin />}
      {role === "owner" && <DashboardOwner />}
      {role === "user" && <DashboardUser />}
    </>
  );
}
