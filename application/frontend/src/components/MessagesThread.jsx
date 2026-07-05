/**
 * MessagesThread.jsx
 * Renders an open conversation: messages, send box.
 *
 * Author: Joe Bowen / Andres / Marcelo / Binrong Zhu (real API wiring)
 */
import { useEffect, useState, useRef } from "react";

const BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

function MessageThread({ conversation, onMessageSent }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [meetupOpen, setMeetupOpen] = useState(false);
  const [meetupTime, setMeetupTime] = useState("");
  const [meetupLocationId, setMeetupLocationId] = useState("");
  const [meetupSent, setMeetupSent] = useState(false);
  const [meetupError, setMeetupError] = useState("");
  const [locations, setLocations] = useState([]);
  const [scheduleMode, setScheduleMode] = useState("manual"); // "manual" or "ai"
  const [timeframe, setTimeframe] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(true);
  const endRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

  // Fetch real messages when conversation changes
  useEffect(() => {
    if (!conversation) return;
    const token = localStorage.getItem("token");
    setLoading(true);
    fetch(`${BASE_URL}/api/conversations/${conversation.conversation_id}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setMessages(data.results || []))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, [conversation?.conversation_id]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch meetup locations
  useEffect(() => {
    fetch(`${BASE_URL}/api/meetup_requests/locations`)
      .then(r => r.json())
      .then(data => setLocations(data.results || []))
      .catch(() => {});
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `${BASE_URL}/api/conversations/${conversation.conversation_id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ body: draft.trim() }),
        }
      );
      if (!res.ok) throw new Error("Failed to send");
      // Append optimistically
      setMessages((prev) => [
        ...prev,
        {
          message_id: Date.now(),
          sender_user_id: currentUser?.user_id,
          body: draft.trim(),
          created_at: new Date().toISOString(),
        },
      ]);
      setDraft("");
      onMessageSent?.();
    } catch (err) {
      alert("Could not send message. Please try again.");
    }
  };

  const sendMeetupRequest = async (e) => {
    e.preventDefault();
    setMeetupError("");
    try {
      const res = await fetch(`${BASE_URL}/api/meetup_requests/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          post_id: conversation.post_id,
          meetup_location_id: meetupLocationId ? Number(meetupLocationId) : null,
          requested_time: meetupTime || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setMeetupError(data.detail || "Failed"); return; }
      setMeetupSent(true);
      setMeetupOpen(false);
    } catch {
      setMeetupError("Network error — please try again");
    }
  };

  const handleAiSchedule = async (e) => {
    e.preventDefault();
    if (!timeframe.trim()) return;
    setAiLoading(true);
    setMeetupError("");
    try {
      const res = await fetch(`${BASE_URL}/api/meetup_requests/auto-schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          post_id: Number(conversation.post_id),
          timeframe: timeframe.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMeetupError(data.detail || "Failed to schedule meetup with AI.");
        return;
      }
      setMeetupSent(true);
      setMeetupOpen(false);
    } catch {
      setMeetupError("Network error — please try again");
    } finally {
      setAiLoading(false);
    }
  };

  const isBuyer = conversation.role === "buyer";

  return (
    <div className="message-thread">
      <div className="thread-header">
        <div>
          <div className="thread-title">{conversation.item_title}</div>
          <div className="thread-subtitle">with {conversation.other_user_name}</div>
        </div>
        {isBuyer && (
          <button className="btn-small btn-meetup" onClick={() => setMeetupOpen(v => !v)}>
            {meetupOpen ? "Cancel" : "Request Meetup"}
          </button>
        )}
      </div>

      {meetupOpen && (
        <div className="meetup-inline-container" style={{
          background: "#f8f9fa",
          border: "1px solid #dee2e6",
          borderRadius: "8px",
          padding: "12px",
          marginBottom: "12px"
        }}>
          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <button
              type="button"
              className={`btn-small ${scheduleMode === "manual" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setScheduleMode("manual")}
            >
              Manual Proposal
            </button>
            <button
              type="button"
              className={`btn-small ${scheduleMode === "ai" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setScheduleMode("ai")}
              style={{ display: "flex", alignItems: "center", gap: "4px" }}
            >
              AI Auto-Scheduler 🤖
            </button>
          </div>

          {scheduleMode === "manual" ? (
            <form className="meetup-inline-form" onSubmit={sendMeetupRequest}>
              <label>Proposed Time
                <input type="datetime-local" value={meetupTime} onChange={e => setMeetupTime(e.target.value)} required />
              </label>
              <label>Location
                <select value={meetupLocationId} onChange={e => setMeetupLocationId(e.target.value)} required>
                  <option value="">Select a location…</option>
                  {locations.map(loc => (
                    <option key={loc.meetup_location_id} value={loc.meetup_location_id}>{loc.location_name}</option>
                  ))}
                </select>
              </label>
              <button type="submit" className="btn-primary">Send Request</button>
              {meetupError && <div className="meetup-error" style={{ color: "red", marginTop: "5px" }}>{meetupError}</div>}
            </form>
          ) : (
            <form className="meetup-inline-form" onSubmit={handleAiSchedule}>
              <label>Describe your preferred time (e.g. tomorrow afternoon, July 3 afternoon)
                <input
                  type="text"
                  placeholder="e.g., July 3, 2026 afternoon"
                  value={timeframe}
                  onChange={e => setTimeframe(e.target.value)}
                  required
                  disabled={aiLoading}
                  style={{ width: "100%", padding: "6px", margin: "6px 0", borderRadius: "4px", border: "1px solid #ccc" }}
                />
              </label>
              <button type="submit" className="btn-primary" disabled={aiLoading || !timeframe.trim()}>
                {aiLoading ? "AI Agent Coordinating..." : "Schedule with AI Agent 🤖"}
              </button>
              {meetupError && <div className="meetup-error" style={{ color: "red", marginTop: "5px" }}>{meetupError}</div>}
            </form>
          )}
        </div>
      )}
      {meetupSent && !meetupOpen && (
        <div className="meetup-confirmation">Meetup request sent ✓</div>
      )}

      <div className="thread-messages">
        {loading ? (
          <div className="empty-state">Loading messages…</div>
        ) : messages.length === 0 ? (
          <div className="empty-state">No messages yet — say hi 👋</div>
        ) : (
          messages.map((m) => {
            const isMine = m.sender_user_id === currentUser?.user_id;
            return (
              <div
                key={m.message_id}
                className={`thread-message ${isMine ? "mine" : "theirs"}`}
              >
                <div className="bubble">{m.body}</div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <form className="thread-composer" onSubmit={sendMessage}>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
        />
        <button type="submit" className="btn-primary">Send</button>
      </form>
    </div>
  );
}

export default MessageThread;