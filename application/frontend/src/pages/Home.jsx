import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { teamMembers } from "../template/TeamData";
import "../styles/Home.css";
function Home() {

    const navigate = useNavigate();
    const [results, setResults] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [sortBy, setSortBy] = useState("newest");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [condition, setCondition] = useState([]);

    const BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
    
    /*Guiran debugging for multi imgs on crateposts*/

    const getImageUrl = (url) => {
    if (!url) return "/placeholder-image.png";
    const firstUrl = url.split(",")[0].trim();
    if (firstUrl.startsWith("http")) return firstUrl;
    return `${BASE_URL}${firstUrl}`;
};

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                setLoading(true);
                setError("");

                const res = await fetch(`${BASE_URL}/api/posts/search`);

                if (!res.ok) {
                    throw new Error("Failed to fetch posts");
                }

                const data = await res.json();
                setResults(data.results || []);
            } catch (err) {
                console.error("Error fetching posts:", err);
                setError("Could not load posts.");
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();

        const fetchCategories = async () => {
            try {
                const res = await fetch(`${BASE_URL}/api/categories`);
                const data = await res.json();
                setCategories(data.results || []);
            } catch (err) {
                console.error("Error fetching categories:", err);
            }
        };

        fetchCategories();
    }, [BASE_URL]);

    const filteredResults = results.filter((item) => {
        if (minPrice && item.item_price < parseFloat(minPrice)) return false;
        if (maxPrice && item.item_price > parseFloat(maxPrice)) return false;
        if (condition.length > 0 && !condition.includes(item.item_condition)) return false;
        return true;
    });

    const sortedResults = [...filteredResults].sort((a, b) => {
        if (sortBy === "price_asc") return a.item_price - b.item_price;
        if (sortBy === "price_desc") return b.item_price - a.item_price;
        return new Date(b.created_at) - new Date(a.created_at);
    });

    return (
        <div className="home-page">
            <main className="home-container">
                <section className="home-hero">
                    <h1>Gator Mart</h1>
                    <p>
                        One students trash or oversized couch is another students treasure!
                        This is a website that makes getting rid of your extra belongings that
                        you can't fit in you car on the way back home. Buy and sell unwanted items
                        with other SFSU students on campus.
                    </p>

                    <div className="hero-buttons">
                        <button>Browse Listing</button>
                        <button className="secondary-btn">Learn More</button>
                    </div>
                </section>

                <div className="home-layout">
                    <aside className="home-sidebar">
                        <div className="sidebar-card">
                            <h3>Filters</h3>

                            <label>Price Range</label>
                            <div className="price-inputs">
                                <input 
                                    placeholder="Min" 
                                    value={minPrice}
                                    onChange={(e) => setMinPrice(e.target.value)}
                                />
                                <input 
                                    placeholder="Max"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                />
                            </div>

                            <label>Condition</label>
                            <div className="checkbox-group">
                                <label><input type="checkbox" value="New" onChange={(e) => {
                                    setCondition(prev => e.target.checked ? [...prev, e.target.value] : prev.filter(c => c !== e.target.value))
                                }} /> New</label>
                                <label><input type="checkbox" value="Like New" onChange={(e) => {
                                    setCondition(prev => e.target.checked ? [...prev, e.target.value] : prev.filter(c => c !== e.target.value))
                                }} /> Like New</label>
                                <label><input type="checkbox" value="Well Used" onChange={(e) => {
                                    setCondition(prev => e.target.checked ? [...prev, e.target.value] : prev.filter(c => c !== e.target.value))
                                }} /> Well Used</label>
                            </div>
                        </div>

                        <div className="sidebar-card">
                            <h3>Currently Available</h3>
                            {categories.map((cat) => (
                                <p key={cat.category_id}>{cat.category_name}</p>
                            ))}
                        </div>
                    </aside>

                    <section className="postings-section">
                        <div className="section-header">
                            <h2>Recent Postings</h2>
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                <option value="newest">Newest First</option>
                                <option value="price_asc">Price: Low to High</option>
                                <option value="price_desc">Price: High to Low</option>
                            </select>
                        </div>

                        {loading && <p>Loading posts...</p>}
                        {error && <p>{error}</p>}

                        <div className="post-grid">
                            {sortedResults.map((item) => (
                                <div className="post-card" key={item.post_id}>
                                    <div className="post-image-wrapper">
                                    <img src={getImageUrl(item.image_url)} alt={item.item_title} />                                        <span className="price-tag">${item.item_price}</span>
                                    </div>

                                    <div className ="post-info">
                                        <h3>{item.item_title}</h3>
                                        <p>{item.item_description}</p>
                                        <button onClick={() => navigate(`/posts/${item.post_id}`)}>
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <section className="team-section">
                    <h2>Meet the Team</h2>

                    <div className="team-grid">
                        {teamMembers.map((member) => (
                            <button
                                className="team-box"
                                key={member.slug}
                                onClick={() => navigate(`/about/${member.slug}`)}
                            >
                                {member.name}
                            </button>
                            ))}
                    </div>
                </section>
            </main>
        </div>
    );
}

export default Home;