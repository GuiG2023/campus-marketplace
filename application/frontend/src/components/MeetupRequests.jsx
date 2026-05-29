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

  const renderRequest = (req) => (
    <div key={req.meetup_request_id} className="meetup-request-card">
      <div className="meetup-request-title">{req.item_title}</div>
      <div className="meetup-request-info">
        {activeTab === "received" ? `From: ${req.buyer_name}` : `To: seller`}
      </div>
      {req.location_name && (
        <div className="meetup-request-info">📍 {req.location_name}</div>
      )}
      {req.requested_time && (
        <div className="meetup-request-info">🕐 {new Date(req.requested_time).toLocaleString()}</div>
      )}
      <div className={`meetup-request-status status-${req.request_status}`}>
        {req.request_status}
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