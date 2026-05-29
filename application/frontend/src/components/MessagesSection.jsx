/**
 * MessagesSection.jsx
 * Shows the user's conversations split into Buying / Selling,
 * and an open thread on the right.
 *
 * Author: Andres Pineda (UI), Marcelo Delgado (data wiring), 
 *         Joe Bowen (meetup integration), Binrong Zhu (real API wiring)
 */
import { useEffect, useState } from "react";
import MessageThread from "./MessagesThread";
import MeetupRequests from "./MeetupRequests";

const BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

function MessagesSection({ openConversationId }) {
  const [conversations, setConversations] = useState([]);
  const [activeRole, setActiveRole] = useState("buyer");
  const [selectedConvoId, setSelectedConvoId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("messages"); // "messages" or "meetups"
  const [pendingMeetupCount, setPendingMeetupCount] = useState(0);

  const fetchConversations = (autoOpenId = null) => {
    const token = localStorage.getItem("token");
    fetch(`${BASE_URL}/api/conversations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const results = data.results || [];
        setConversations(results);
        if (autoOpenId) {
          const convo = results.find(c => c.conversation_id === autoOpenId);
          if (convo) {
            setActiveRole(convo.role);
            setSelectedConvoId(autoOpenId);
          }
        }
      })
      .catch(() => setConversations([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchConversations(openConversationId);
  }, []);

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

  const unreadCount = conversations.filter(
    (c) => c.last_sender_id && c.last_sender_id !== currentUser?.user_id
  ).length;

  
  const filtered = conversations.filter((c) => c.role === activeRole);
  const selectedConvo = conversations.find(
    (c) => c.conversation_id === selectedConvoId
  );

  return (
    <section className="messages-section">
      <h2>Messages {unreadCount > 0 && <span className="badge">{unreadCount}</span>}</h2>

      <div className="messages-layout">
        {/* LEFT: conversation list */}
        <div className="messages-list-pane">
          <div className="messages-role-toggle">
            <button
              className={`role-btn ${activeTab === "messages" && activeRole === "buyer" ? "active" : ""}`}
              onClick={() => { setActiveTab("messages"); setActiveRole("buyer"); setSelectedConvoId(null); }}
            >
              Buying
            </button>
            <button
              className={`role-btn ${activeTab === "messages" && activeRole === "seller" ? "active" : ""}`}
              onClick={() => { setActiveTab("messages"); setActiveRole("seller"); setSelectedConvoId(null); }}
            >
              Selling
            </button>
            <button
              className={`role-btn ${activeTab === "meetups" ? "active" : ""}`}
              onClick={() => { setActiveTab("meetups"); setSelectedConvoId(null); }}
            >
              Meetups {pendingMeetupCount > 0 && <span className="badge">{pendingMeetupCount}</span>}
            </button>
          </div>


          {activeTab === "messages" && (
            loading ? (
              <div className="empty-state">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                {activeRole === "buyer"
                  ? "No conversations about items you're buying yet."
                  : "No conversations about items you're selling yet."}
              </div>
            ) : (
              <div className="message-list">
                {filtered.map((c) => (
                  <button
                    key={c.conversation_id}
                    className={`message-preview ${
                      selectedConvoId === c.conversation_id ? "selected" : ""
                    }`}
                    onClick={() => setSelectedConvoId(c.conversation_id)}
                  >
                    <div className="msg-avatar msg-accent-green">
                      {(c.other_user_name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="msg-body">
                      <div className="msg-head">
                        <span className="msg-name">{c.other_user_name}</span>
                      </div>
                      <div className="msg-snippet">
                        <strong>{c.item_title}</strong>
                        {c.last_message ? ` — ${c.last_message}` : " — no messages yet"}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )
          )}
          {activeTab === "meetups" && <MeetupRequests onPendingCount={setPendingMeetupCount} />}

        </div>

        {/* RIGHT: open thread */}
        {activeTab === "messages" && (
          <div className="messages-thread-pane">
            {selectedConvo ? (
              <MessageThread
                conversation={selectedConvo}
                onMessageSent={fetchConversations}
              />
            ) : (
              <div className="empty-state">Select a conversation to view messages.</div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default MessagesSection;