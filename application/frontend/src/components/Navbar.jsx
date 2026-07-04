import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

const Navbar = () => {
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("");
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem("user") || "null");
    const isLoggedIn = !!user;

    const [notifCount, setNotifCount] = useState(0);

    useEffect(() => {
        if (!isLoggedIn) return;
        const token = localStorage.getItem("token");
        const BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
        const currentUserId = user?.user_id;

        Promise.all([
            fetch(`${BASE_URL}/api/conversations`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
            fetch(`${BASE_URL}/api/meetup_requests/received`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        ]).then(([convData, meetupData]) => {
            const unread = (convData.results || []).filter(
                c => c.last_sender_id && c.last_sender_id !== currentUserId
            ).length;
            const pending = (meetupData.results || []).filter(
                r => r.request_status === "pending"
            ).length;
            setNotifCount(unread + pending);
        }).catch(() => {});
    }, [isLoggedIn]);

    const handleSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (query.trim()) params.append("keyword", query.trim());
        if (category) params.append("category_id", category);
        navigate(`/search?${params.toString()}`);
    };

    const handleCreatePost = () => {
        if (isLoggedIn) navigate("/create-post");
        else navigate("/login");
    };

    const handleAccount = () => {
        if (isLoggedIn) navigate("/user");
        else navigate("/login");
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    return (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", zIndex: 1000 }}>
            <div style={{ background: "#1a1a2e", color: "white", textAlign: "center", padding: "6px", fontSize: "12px" }}>
                For Demonstration Only
            </div>
            <nav className="navbar" style={{ position: "relative", zIndex: "auto" }}>
                <div className="navbar-left">
                    <button type="button" className="navbar-logo-button" onClick={() => navigate("/")}>
                        <img src={logo} alt="Home" className="navbar-logo" />
                    </button>

                    <form onSubmit={handleSearch} className="navbar-search">
                        <select className="navbar-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                            <option value="">All</option>
                            <option value="1">Books</option>
                            <option value="2">Electronics</option>
                            <option value="3">Furniture</option>
                        </select>
                        <input
                            className="navbar-input"
                            type="text"
                            placeholder="Search listings..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            maxLength={40}
                        />
                        <button type="submit" className="navbar-button navbar-search-button">🔍</button>
                    </form>
                </div>

                <div className="navbar-right">
                    <button type="button" className="navbar-button" onClick={handleCreatePost}>
                        Create Post
                    </button>

                    {isLoggedIn ? (
                        <>
                            <span className="navbar-greeting">Hi, {user.display_name || "User"}</span>

                            <button
                                type="button"
                                className="navbar-button"
                                onClick={handleAccount}
                                style={{ position: "relative" }}
                            >
                                Account
                                {notifCount > 0 && (
                                    <span style={{
                                        position: "absolute",
                                        top: "-6px",
                                        right: "-6px",
                                        background: "#e53e3e",
                                        color: "white",
                                        borderRadius: "999px",
                                        padding: "1px 6px",
                                        fontSize: "10px",
                                        fontWeight: "700",
                                    }}>
                                        {notifCount}
                                    </span>
                                )}
                            </button>

                            <button type="button" className="navbar-button" onClick={handleLogout}>
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <button type="button" className="navbar-button" onClick={() => navigate("/login")}>Login</button>
                            <button type="button" className="navbar-button" onClick={() => navigate("/register")}>Register</button>
                        </>
                    )}
                </div>
            </nav>
        </div>
    );
};

export default Navbar;