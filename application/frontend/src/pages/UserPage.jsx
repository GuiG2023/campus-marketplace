/**
 * UserPage.jsx
 * Account management page for Gator Mart.
 * Provides a sidebar with tabs for managing posts, viewing messages,
 * meetup requests, and viewing/updating profile info.
 *
 * Author: Andres Pineda
 * Co-owner: Bart Beltran (Profile section)
 * Navbar: Kyler
 * Co-Author: Guiran 
 */
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import ManagePosts from "../components/ManagePosts";
import ProfileSection from "../components/ProfileSection";
import MessagesSection from "../components/MessagesSection";
import "../styles/UserPage.css";

function UserPage() {
  const [activeTab, setActiveTab] = useState("posts");
  const [openConversationId, setOpenConversationId] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.openConversationId) {
      setActiveTab("messages");
      setOpenConversationId(location.state.openConversationId);
    }
  }, []);

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const user = {
      initials: storedUser.display_name?.charAt(0).toUpperCase() || "?",
      displayName: storedUser.display_name || "Unknown User",
      username: storedUser.sfsu_email || "@unknown",
  };

  const renderTab = () => {
    if (activeTab === "posts") return <ManagePosts />;
    if (activeTab === "messages") return <MessagesSection openConversationId={openConversationId} />;
if (activeTab === "profile") return <ProfileSection />;
    return null;
  };

  return (
    <>
      <Navbar />
      <div className="account-page">
        <aside className="account-sidebar">
          <div className="account-user-card">
            <div className="account-avatar">{user.initials}</div>
            <div className="account-user-info">
              <div className="account-user-name">{user.displayName}</div>
              <div className="account-user-handle">{user.username}</div>
            </div>
          </div>

          <button
            className={`account-nav-btn ${activeTab === "posts" ? "active" : ""}`}
            onClick={() => setActiveTab("posts")}
          >
            Manage Posts
          </button>
          <button
            className={`account-nav-btn ${activeTab === "messages" ? "active" : ""}`}
            onClick={() => setActiveTab("messages")}
          >
            Messages
          </button>
<button
            className={`account-nav-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            Profile
          </button>
        </aside>

        <main className="account-content">{renderTab()}</main>
      </div>
    </>
  );
}

export default UserPage;