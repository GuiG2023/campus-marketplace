/**
 * ManagePosts.jsx
 * Lets users view and manage their listings, split across
 * Active, Archived, and Sold sub-tabs.
 *
 * Author: Andres Pineda
 * Co-Author: Guiran
 */
import { useState, useEffect } from "react";
import "../styles/ManagePosts.css";

function ManagePosts() {
  const [subTab, setSubTab] = useState("active");
  const [posts, setPosts] = useState({ active: [], archived: [], sold: [] });
  const [loading, setLoading] = useState(true);

  const BASE_URL = import.meta.env.VITE_API_URL;
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = storedUser.user_id;
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!userId) return;
    const fetchPosts = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/posts/search?seller_user_id=${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        const allPosts = data.results || [];
        setPosts({
          active:   allPosts.filter(p => p.post_status === "active"),
          archived: allPosts.filter(p => p.post_status === "archived"),
          sold:     allPosts.filter(p => p.post_status === "sold"),
        });
      } catch (err) {
        console.error("Failed to load posts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [userId]);

  const updatePostStatus = async (postId, newStatus) => {
    try {
      await fetch(`${BASE_URL}/api/posts/${postId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ post_status: newStatus })
      });
    } catch (err) {
      console.error("Failed to update post:", err);
    }
  };

  const handleArchive = async (id) => {
    await updatePostStatus(id, "archived");
    setPosts(prev => {
      const post = prev.active.find(p => p.post_id === id);
      if (!post) return prev;
      return {
        ...prev,
        active: prev.active.filter(p => p.post_id !== id),
        archived: [...prev.archived, { ...post, post_status: "archived" }],
      };
    });
  };

  const handleMarkSold = async (id) => {
    await updatePostStatus(id, "sold");
    setPosts(prev => {
      const post = prev.active.find(p => p.post_id === id);
      if (!post) return prev;
      return {
        ...prev,
        active: prev.active.filter(p => p.post_id !== id),
        sold: [...prev.sold, { ...post, post_status: "sold" }],
      };
    });
  };

  const handleRestore = async (id) => {
    await updatePostStatus(id, "active");
    setPosts(prev => {
      const post = [...prev.archived, ...prev.sold].find(p => p.post_id === id);
      if (!post) return prev;
      return {
        ...prev,
        archived: prev.archived.filter(p => p.post_id !== id),
        active: [...prev.active, { ...post, post_status: "active" }],
        sold: prev.sold.filter(p => p.post_id !== id),
      };
    });
  };

  const renderPostCard = (post, actions) => (
    <li key={post.post_id} className="manage-posts-item">
      {post.image_url && (
        <img
         src={(() => {
    const firstUrl = post.image_url.split(",")[0].trim();
    return firstUrl.startsWith("http") ? firstUrl : `${BASE_URL}${firstUrl}`;
})()}
          alt={post.item_title}
          className="manage-posts-item-image"
        />
      )}
      <div className="manage-posts-item-info">
        <div className="manage-posts-item-title">{post.item_title}</div>
        <div className="manage-posts-item-meta">
          ${post.item_price} · {post.item_condition}
        </div>
      </div>
      <div className="manage-posts-item-actions">{actions}</div>
    </li>
  );

  const renderContent = () => {
    if (loading) return <p>Loading...</p>;
    if (subTab === "active") {
      if (!posts.active.length) return <p className="manage-posts-empty">You have no active listings.</p>;
      return (
        <ul className="manage-posts-list">
          {posts.active.map(post => renderPostCard(post,
            <>
              <button className="manage-posts-btn-secondary" onClick={() => handleMarkSold(post.post_id)}>Mark Sold</button>
              <button className="manage-posts-btn-danger" onClick={() => handleArchive(post.post_id)}>Archive</button>
            </>
          ))}
        </ul>
      );
    }
    if (subTab === "archived") {
      if (!posts.archived.length) return <p className="manage-posts-empty">No archived posts.</p>;
      return (
        <ul className="manage-posts-list">
          {posts.archived.map(post => renderPostCard(post,
            <button className="manage-posts-btn-secondary" onClick={() => handleRestore(post.post_id)}>Restore</button>
          ))}
        </ul>
      );
    }
    if (subTab === "sold") {
      if (!posts.sold.length) return <p className="manage-posts-empty">No sold items yet.</p>;
      return (
        <ul className="manage-posts-list">
          {posts.sold.map(post => renderPostCard(post, <button className="manage-posts-btn-secondary" onClick={() => handleRestore(post.post_id)}>Restore</button>))}
        </ul>
      );
    }
  };

  return (
    <section className="manage-posts">
      <header className="manage-posts-header"><h2>Manage Posts</h2></header>
      <div className="manage-posts-subnav">
        <button className={`manage-posts-subnav-btn ${subTab === "active" ? "active" : ""}`} onClick={() => setSubTab("active")}>Active ({posts.active.length})</button>
        <button className={`manage-posts-subnav-btn ${subTab === "archived" ? "active" : ""}`} onClick={() => setSubTab("archived")}>Archived ({posts.archived.length})</button>
        <button className={`manage-posts-subnav-btn ${subTab === "sold" ? "active" : ""}`} onClick={() => setSubTab("sold")}>Sold ({posts.sold.length})</button>
      </div>
      <div className="manage-posts-content">{renderContent()}</div>
    </section>
  );
}

export default ManagePosts;