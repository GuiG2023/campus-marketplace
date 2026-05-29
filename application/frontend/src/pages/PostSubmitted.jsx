/**
 * PostSubmitted.jsx
 * Confirmation page displayed after a user successfully submits a new post.
 *
 * Author: Kyler Simmons Ayala
 */
import { useState } from "react";
import NavBar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import "../styles/PostSubmitted.css";

function PostSubmitted() {
    const navigate = useNavigate();

    return (
        <div>
            <NavBar />

            <div className="post-submitted-page">
                
                <div className="confirmation-container">
                    <h1 className="confirmation-title">
                        Post Submitted Successfully!
                    </h1>
                    <p className="confirmation-message">
                        Your post has been submitted and will be available to view after an ADMIN approval.
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
