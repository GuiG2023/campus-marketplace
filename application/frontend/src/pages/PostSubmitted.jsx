/**
 * PostSubmitted.jsx
 * Confirmation page displayed after a user successfully submits a new post.
 *
 * Author: Kyler Simmons Ayala
 */
import { useState } from "react";
import NavBar from "../components/Navbar";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/PostSubmitted.css";

function PostSubmitted() {
    const navigate = useNavigate();
    const location = useLocation();
    const { status, message } = location.state || { status: "active", message: "Your post has been submitted successfully!" };

    return (
        <div>
            <NavBar />

            <div className="post-submitted-page">
                
                <div className="confirmation-container">
                    <h1 className="confirmation-title" style={{ color: status === "active" ? "#4caf50" : "#f44336" }}>
                        {status === "active" ? "Post Approved & Published!" : "Post Submission Denied"}
                    </h1>
                    <p className="confirmation-message">
                        {message}
                    </p>

                    <div className="button-container">
                        <button onClick={() => navigate("/search")}>
                            View Active Posts
                        </button>
                        <button onClick={() => navigate("/create-post")}>
                            Create Another Post
                        </button>
                    </div>
                </div>

            </div>
        
        </div>
    )
};

export default PostSubmitted;
