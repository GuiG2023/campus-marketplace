/**
 * MeetupRequests.jsx
 * Displays incoming and outgoing meetup requests for the user.
 *
 * Author: Andres Pineda / Binrong Zhu (real API wiring)
 */
import { useEffect, useState } from "react";

const BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

function MeetupRequests({ onPendingCount }) {
  const [activeTab, setActiveTab] = useState("received");
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${BASE_URL}/api/meetup_requests/received`, { headers }).then(r => r.json()),
      fetch(`${BASE_URL}/api/meetup_requests/sent`, { headers }).then(r => r.json()),
    ])
      .then(([recData, sentData]) => {
        const receivedList = recData.results || [];
        setReceived(receivedList);
        setSent(sentData.results || []);
        const pending = receivedList.filter(r => r.request_status === "pending").length;
        onPendingCount?.(pending);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleStatusUpdate = async (requestId, newStatus) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${BASE_URL}/api/meetup_requests/${requestId}?status=${newStatus}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.detail || "Failed to update meetup status.");
        return;
      }
      
      // Update local state dynamically
      setReceived(prev => prev.map(r => r.meetup_request_id === requestId ? { ...r, request_status: newStatus } : r));
      
      // Update pending count badge in parent Navbar
      const newReceived = received.map(r => r.meetup_request_id === requestId ? { ...r, request_status: newStatus } : r);
      const pendingCount = newReceived.filter(r => r.request_status === "pending").length;
      onPendingCount?.(pendingCount);
    } catch {
      alert("Network error updating status.");
    }
  };

  const renderRequest = (req) => (
    <div key={req.meetup_request_id} className="meetup-request-card" style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
      <div className="meetup-request-title" style={{ fontWeight: "600", fontSize: "14px" }}>{req.item_title}</div>
      <div className="meetup-request-info" style={{ color: "#555", fontSize: "12px", margin: "4px 0" }}>
        {activeTab === "received" ? `From: ${req.buyer_name}` : `To: seller`}
      </div>
      {req.location_name && (
        <div className="meetup-request-info" style={{ fontSize: "12px", margin: "4px 0" }}>📍 {req.location_name}</div>
      )}
      {req.requested_time && (
        <div className="meetup-request-info" style={{ fontSize: "12px", margin: "4px 0" }}>🕐 {new Date(req.requested_time).toLocaleString()}</div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
        <span className={`meetup-request-status status-${req.request_status}`} style={{ fontSize: "11px", padding: "2px 6px", borderRadius: "4px" }}>
          {req.request_status}
        </span>
        {activeTab === "received" && req.request_status === "pending" && (
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => handleStatusUpdate(req.meetup_request_id, "accepted")}
              style={{
                background: "#4caf50",
                color: "white",
                border: "none",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "11px",
                cursor: "pointer"
              }}
            >
              Accept
            </button>
            <button
              onClick={() => handleStatusUpdate(req.meetup_request_id, "rejected")}
              style={{
                background: "#f44336",
                color: "white",
                border: "none",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "11px",
                cursor: "pointer"
              }}
            >
              Decline
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const list = activeTab === "received" ? received : sent;

  return (
    <section className="meetup-requests">
      <div className="messages-role-toggle">
        <button
          className={`role-btn ${activeTab === "received" ? "active" : ""}`}
          onClick={() => setActiveTab("received")}
        >
          Received
        </button>
        <button
          className={`role-btn ${activeTab === "sent" ? "active" : ""}`}
          onClick={() => setActiveTab("sent")}
        >
          Sent
        </button>
      </div>

      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : list.length === 0 ? (
        <div className="empty-state">No meetup requests.</div>
      ) : (
        <div className="meetup-request-list">
          {list.map(renderRequest)}
        </div>
      )}
    </section>
  );
}

export default MeetupRequests;