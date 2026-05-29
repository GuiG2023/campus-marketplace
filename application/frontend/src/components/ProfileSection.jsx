/**
 * ProfileSection.jsx
 * Section of the account page for viewing and updating profile info.
 * Users can edit their name, username, bio, and preferred meetup location.
 * SFSU email is read-only since it ties to authentication.
 *
 * Author: Bart Beltran
 * Skeleton by: Andres Pineda
 */
import { useState } from "react";

function ProfileSection() {
  const [editing, setEditing] = useState(false);

  // TODO: pull real profile data from backend GET /api/users/:id
  // TODO: replace with real user ID from auth once login is merged
  const [profile, setProfile] = useState({
    fullName: "",
    username: "",
    email: "",
    bio: "",
    preferredMeetup: "",
    joined: "",
    initials: "--",
  });

  const handleChange = (field, value) => {
    setProfile({ ...profile, [field]: value });
  };

  const handleSave = () => {
    // TODO: wire to backend endpoint PATCH /api/users/:id
    setEditing(false);
  };

  const handleChangePassword = () => {
    // TODO: open change password modal or navigate to a dedicated route
    alert("Change password flow not yet implemented.");
  };

  const handleLogout = () => {
    // TODO: clear auth token/context and redirect to home once auth is merged
    alert("Logout flow not yet implemented.");
  };

  return (
    <section className="profile-section">
      <div className="section-head">
        <h2>Profile</h2>
        {editing ? (
          <button className="btn-primary btn-small" onClick={handleSave}>
            Save
          </button>
        ) : (
          <button className="btn-small" onClick={() => setEditing(true)}>
            Edit
          </button>
        )}
      </div>

      <div className="profile-card">
        <div className="profile-head">
          <div className="account-avatar account-avatar-lg">
            {profile.initials}
          </div>
          <div>
            <div className="profile-name">{profile.fullName}</div>
            <div className="profile-joined">Joined {profile.joined}</div>
          </div>
        </div>

        <div className="profile-fields">
          <div className="field-label">Full name</div>
          <div className="field-value">
            {editing ? (
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
              />
            ) : (
              profile.fullName
            )}
          </div>

          <div className="field-label">Username</div>
          <div className="field-value">
            {editing ? (
              <input
                type="text"
                value={profile.username}
                onChange={(e) => handleChange("username", e.target.value)}
              />
            ) : (
              profile.username
            )}
          </div>

          <div className="field-label">SFSU email</div>
          <div className="field-value field-locked">
            {profile.email}
            <span className="locked-pill">locked</span>
          </div>

          <div className="field-label">Bio</div>
          <div className="field-value">
            {editing ? (
              <input
                type="text"
                value={profile.bio}
                onChange={(e) => handleChange("bio", e.target.value)}
              />
            ) : (
              profile.bio
            )}
          </div>

          <div className="field-label">Preferred meetup</div>
          <div className="field-value">
            {editing ? (
              <input
                type="text"
                value={profile.preferredMeetup}
                onChange={(e) => handleChange("preferredMeetup", e.target.value)}
              />
            ) : (
              profile.preferredMeetup
            )}
          </div>
        </div>

        <div className="profile-footer">
          <button className="btn-small" onClick={handleChangePassword}>
            Change password
          </button>
          <button className="btn-small btn-delete" onClick={handleLogout}>
            Log out
          </button>
        </div>
        <div className="todo-note">
          TODO: wire save + password change + logout once auth is merged
        </div>
      </div>
    </section>
  );
}

export default ProfileSection;
