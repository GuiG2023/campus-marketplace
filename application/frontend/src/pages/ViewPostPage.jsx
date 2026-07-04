import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/ViewPostPage.css";

function ViewPostPage() {
    const { postId } = useParams();
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem("user") || "null");
    const BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
    /**
     * fixing imge demo issue
     * Guiran
     */

    const getImageUrl = (url) => {
    if (!url) return "/placeholder-image.png";
    const firstUrl = url.split(",")[0].trim();
    if (firstUrl.startsWith("http")) return firstUrl;
    return `${BASE_URL}${firstUrl}`;
};
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [meetupSent, setMeetupSent] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [meetupMessage, setMeetupMessage] = useState("");

    const handleMeetupSubmit = async (e) => {
        e.preventDefault();

        if (!currentUser) {
            navigate("/login");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/api/conversations`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ post_id: Number(postId) }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Failed");
            navigate("/user", { state: { openConversationId: data.conversation_id } });
        } catch (err) {
            alert(err.message || "Could not start conversation.");
        }
    };

    useEffect(() => {
    const fetchPost = async () => {
        try {
            setLoading(true);
            setError("");

            const res = await fetch(`${BASE_URL}/api/posts/${postId}`);

            if (!res.ok) {
                throw new Error("Failed to fetch post");
            }

            const data = await res.json();

            setPost(data);

            const firstImage =
            data.images?.[0] ||
            (data.image_url ? data.image_url.split(",")[0].trim() : "/placeholder-image.png");

        } catch (err) {
            console.error("Error:", err);
            setError("Could not load post.");
        } finally {
            setLoading(false);
        }
    };

    fetchPost();
}, [postId]);


    if (loading) {
        return (
            <div className="page">
                <div className="view-post-status">Loading post...</div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="page">
                <div className="view-post-status">{error || "Post not found."}</div>
            </div>
        );
    }

    const images = post.image_url
    ? post.image_url.split(",").map(url => getImageUrl(url.trim()))
    : [];
    
    const mainImage = selectedImage || images[0] || "/placeholder-image.png";
    const title = post.title || post.item_title || "Untitled Post";
    const description = post.description || post.item_description || "No description available.";
    const price = post.price ?? post.item_price ?? 0;
    const categoryName = post.category_name || "Category";

    const currentImageIndex = images.indexOf(mainImage);

    const handlePrevImage = () => {
        const newIndex = currentImageIndex <= 0 ? images.length - 1 : currentImageIndex - 1;
        setSelectedImage(images[newIndex]);
    };

    const handleNextImage = () => {
        const newIndex = currentImageIndex === images.length - 1 ? 0 : currentImageIndex + 1;
        setSelectedImage(images[newIndex]);
    };

    return (
        <div className="page">

            <main className="view-post-page">
                <div className="breadcrumb-row">
                    <span>Home</span>
                    <span>/</span>
                    <span>{categoryName}</span>
                    <span>/</span>
                    <span className="current">{title}</span>
                </div>

                <section className="hero-row">
                    <div>
                        <h1 className="post-title">{title}</h1>
                        <p className="post-meta">
                            Posted {post.created_at ? new Date(post.created_at).toLocaleDateString() : "Recently"}
                        </p>
                    </div>

                    <div className="price-box">
                        <span className="price-label">Price</span>
                        <span className="price-value">${Number(price).toFixed(2)}</span>
                    </div>
                </section>

                <section className="view-post-grid">
                    <div className="left-column">
                        <section className="image-gallery">
                            <div className="main-image-wrapper">
                                {images.length > 1 && (
                                    <button
                                        type="button"
                                        className="image-nav-btn left-btn"
                                        onClick={handlePrevImage}
                                    >
                                        ‹
                                    </button>
                                )}
                                <img
                                    src={getImageUrl(mainImage)}
                                    alt={title}
                                    className="main-image"
                                />

                                {images.length > 1 && (
                                    <button
                                        type="button"
                                        className="image-nav-btn right-btn"
                                        onClick={handleNextImage}
                                    >
                                        ›
                                    </button>

                                )}
                            </div>

                            {images.length > 0 && (
                                <div className="thumbnail-grid">
                                    {images.slice(0, 5).map((img, index) => (
                                        <img
                                            key={index}
                                            src={img}
                                            alt={`${title} ${index + 1}`}
                                            className={`thumbnail ${mainImage === img ? "active-thumbnail" : ""}`}
                                            onClick={() => setSelectedImage(img)}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="description-section">
                            <h2>Description</h2>
                            <p>{description}</p>
                        </section>
                    </div>

                    <aside className="right-column">
                        <div className="seller-card">
                            <h3>Seller Information</h3>
                            <p><strong>Name:</strong> {post.seller_name || "Unknown Seller"}</p>
                            <p>
                                <strong>Email:</strong>{" "}
                                {currentUser ? (
                                    post.seller_email || "Not available"
                                ) : (
                                    <span style={{ color: "gray" }}>Login to view seller email</span>
                                )}
                            </p>

                        </div>

                        <div className="meetup-card">
                            <h3>Request a Meetup</h3>

                            <form onSubmit={handleMeetupSubmit} className="meetup-form">

                                {meetupSent && (
                                    <div className="meetup-success">
                                        Meetup request sent!
                                    </div>
                                )}

                                <div className="form-group">
                                    <button type="submit" className="meetup-btn">
                                        Send Meetup Message
                                    </button>
                                </div>
                            </form>
                        </div>
                    </aside>
                </section>
            </main>
        </div>
    );
}

export default ViewPostPage;
