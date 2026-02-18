import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const UserDashboard = ({ user: initialUser }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(initialUser || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMe = async () => {
      if (!initialUser?.id) return;
      try {
        setLoading(true);
        const { data } = await api.get("/auth/me", {
          params: { id: initialUser.id },
        });
        const updated = data?.user || null;
        if (updated) {
          setUser({
            id: updated.id,
            email: updated.email,
            role: updated.role,
            subscription: updated.subscription,
            freePlayEndsAt: updated.freePlayEndsAt,
          });
          localStorage.setItem("sparked_user", JSON.stringify(updated));
        }
      } catch {
        void 0;
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [initialUser?.id]);

  const planLabel = useMemo(() => {
    const plan = user?.subscription?.plan;
    if (!plan) return user?.role === "vip" ? "VIP" : "Free";
    if (plan === "1m") return "VIP • Monthly";
    if (plan === "6m") return "VIP • 6 Months";
    if (plan === "12m") return "VIP • 12 Months";
    return `VIP • ${plan}`;
  }, [user]);

  const expiresText = useMemo(() => {
    const dt = user?.subscription?.expiresAt
      ? new Date(user.subscription.expiresAt)
      : null;
    return dt ? dt.toLocaleString() : "—";
  }, [user]);

  return (
    <div
      className="screen-layout"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div className="menu-container" style={{ maxWidth: 560, width: "100%" }}>
        <h1 className="gradient-title" style={{ marginBottom: 8 }}>
          👤 Your Account
        </h1>
        <p className="subtitle" style={{ marginBottom: 24 }}>
          Manage your Sparked subscription
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              padding: 20,
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            <div style={{ opacity: 0.6, fontSize: 12, marginBottom: 6 }}>
              Email
            </div>
            <div style={{ fontWeight: 800 }}>
              {user?.email || initialUser?.email || "—"}
            </div>
          </div>

          <div
            style={{
              padding: 20,
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            <div style={{ opacity: 0.6, fontSize: 12, marginBottom: 6 }}>
              Plan
            </div>
            <div style={{ fontWeight: 800 }}>{planLabel}</div>
          </div>

          <div
            style={{
              padding: 20,
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            <div style={{ opacity: 0.6, fontSize: 12, marginBottom: 6 }}>
              Expires
            </div>
            <div style={{ fontWeight: 800 }}>{expiresText}</div>
          </div>

          <div
            style={{
              padding: 20,
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            <div style={{ opacity: 0.6, fontSize: 12, marginBottom: 6 }}>
              Status
            </div>
            <div style={{ fontWeight: 800 }}>
              {user?.subscription?.status ||
                (user?.role === "vip" ? "active" : "inactive")}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn btn-ghost" onClick={() => navigate("/")}>
            ← Back
          </button>
          <button
            className={`btn ${loading ? "btn-disabled" : "btn-secondary"}`}
            disabled={loading}
            onClick={() => window.location.reload()}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
