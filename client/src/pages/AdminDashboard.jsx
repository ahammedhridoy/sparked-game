import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminAPI } from "../services/adminAPI";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const rows = await adminAPI.getUsers();
      setUsers(rows);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateUser = async (id, patch) => {
    setSaving(id);
    try {
      const payload = { ...patch };
      if (Object.prototype.hasOwnProperty.call(payload, "plan")) {
        if (payload.plan === "—") payload.plan = null;
      }
      const updated = await adminAPI.updateUser(id, payload);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, ...updated } : u))
      );
    } finally {
      setSaving(null);
    }
  };

  const rows = useMemo(
    () =>
      users.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        plan: u.subscription?.plan || "—",
        status:
          u.subscription?.status || (u.role === "vip" ? "active" : "inactive"),
        expiresAt: u.subscription?.expiresAt
          ? new Date(u.subscription.expiresAt).toLocaleString()
          : "—",
      })),
    [users]
  );

  return (
    <div
      className="screen-layout"
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
      }}
    >
      <div className="menu-container" style={{ width: "100%", maxWidth: 900 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <button className="btn btn-ghost" onClick={() => navigate("/")}>← Back</button>
          <div>
            <h1 className="gradient-title" style={{ marginBottom: 0 }}>🛠 Admin Dashboard</h1>
            <p className="subtitle" style={{ margin: 0 }}>Manage users and subscriptions</p>
          </div>
          <button className="btn btn-secondary" onClick={load} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
        <div style={{ height: 12 }} />

        <div
          style={{
            overflowX: "auto",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.06)" }}>
                {["Email", "Role", "Plan", "Status", "Expires", "Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: 12,
                        fontWeight: 800,
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: 16, opacity: 0.7 }}>
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 16, opacity: 0.7 }}>
                    No users
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr
                    key={r.id}
                    style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <td style={{ padding: 12 }}>{r.email}</td>
                    <td style={{ padding: 12 }}>
                      <select
                        defaultValue={r.role}
                        onChange={(e) =>
                          updateUser(r.id, { role: e.target.value })
                        }
                        disabled={saving === r.id}
                        style={{
                          background: "transparent",
                          color: "white",
                          border: "1px solid rgba(255,255,255,0.2)",
                          borderRadius: 8,
                          padding: "6px 8px",
                        }}
                      >
                        <option value="free">free</option>
                        <option value="vip">vip</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td style={{ padding: 12 }}>
                      <select
                        defaultValue={r.plan}
                        onChange={(e) =>
                          updateUser(r.id, { plan: e.target.value })
                        }
                        disabled={saving === r.id}
                        style={{
                          background: "transparent",
                          color: "white",
                          border: "1px solid rgba(255,255,255,0.2)",
                          borderRadius: 8,
                          padding: "6px 8px",
                        }}
                      >
                        <option value="—">—</option>
                        <option value="1m">1m</option>
                        <option value="6m">6m</option>
                        <option value="12m">12m</option>
                      </select>
                    </td>
                    <td style={{ padding: 12 }}>
                      <select
                        defaultValue={r.status}
                        onChange={(e) =>
                          updateUser(r.id, { status: e.target.value })
                        }
                        disabled={saving === r.id}
                        style={{
                          background: "transparent",
                          color: "white",
                          border: "1px solid rgba(255,255,255,0.2)",
                          borderRadius: 8,
                          padding: "6px 8px",
                        }}
                      >
                        <option value="active">active</option>
                        <option value="inactive">inactive</option>
                        <option value="canceled">canceled</option>
                      </select>
                    </td>
                    <td style={{ padding: 12 }}>{r.expiresAt}</td>
                    <td style={{ padding: 12 }}>
                      <button
                        className="btn btn-ghost"
                        onClick={() =>
                          updateUser(r.id, {
                            role: r.role,
                            plan: r.plan,
                            status: r.status,
                          })
                        }
                        disabled={saving === r.id}
                      >
                        {saving === r.id ? "Saving…" : "Apply"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
      </div>
    </div>
  );
}
