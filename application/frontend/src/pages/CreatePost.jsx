/**
 * CreatePost.jsx
 * Component for creating a new post.
 *
 * Author: Kyler Simmons Ayala
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/Navbar";
import "../styles/CreatePost.css";

function CreatePost() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [condition, setCondition] = useState("Good");
    const [message, setMessage] = useState("");
    const [errors, setErrors] = useState({});
    const [photos, setPhotos] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();

    const addPhotos = (files) => {
        const imageFiles = Array.from(files)
            .filter((file) => file.type.startsWith("image/"))
            .map((file) => ({
                file,
                preview: URL.createObjectURL(file),
            }));

        setPhotos((prevPhotos) => {
            const combinedPhotos = [...prevPhotos, ...imageFiles];
            return combinedPhotos.slice(0, 4);
        });
    };

    const handlePhotoUpload = (e) => {
        addPhotos(e.target.files);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        addPhotos(e.dataTransfer.files);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!title.trim()) newErrors.title = "Required field";
    if (!description.trim()) newErrors.description = "Required field";
    if (!price) newErrors.price = "Required field";
    if (!categoryId) newErrors.categoryId = "Required field";

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
    }

    setErrors({});
    setIsSubmitting(true);

    const token = localStorage.getItem("token");
    if (!token) {
        navigate("/login");
        return;
    }

    try {
        const BASE_URL = import.meta.env.VITE_API_URL || "";
        const formData = new FormData();
        formData.append("item_title", title);
        formData.append("item_description", description);
        formData.append("item_price", parseFloat(price));
        formData.append("category_id", parseInt(categoryId));
        formData.append("item_condition", condition);

        photos.forEach((photo, index) => {
            formData.append(`image${index + 1}`, photo.file);
        });

        const res = await fetch(`${BASE_URL}/api/posts/`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: formData
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to create post");

        navigate("/Post-Submitted", { state: { status: data.post_status, message: data.message } });

    } catch (err) {
        setErrors({ general: err.message });
        setIsSubmitting(false);
    }
};

    const removePhoto = (indexToRemove) => {
        setPhotos((prevPhotos) => 
            prevPhotos.filter((_, index) => index !== indexToRemove)
        );
    }

    return (
        <div>
            <NavBar />

            <div className="create-post-page">
                <div className="create-post-container">
                    <h1>Create Post</h1>


                    <form onSubmit={handleSubmit} className="create-post-form">
                        <div className="form-left">
                            <div>
                                <label>Title:</label>
                                <input
                                    type="text"
                                    placeholder="Enter item title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                                {errors.title && <p className="error">{errors.title}</p>}
                            </div>

                            <div>
                                <label>Description:</label>
                                <textarea
                                    placeholder="Enter item description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    maxLength={400}
                                />


                                {description.length >= 350 && description.length < 400 && (
                                    <p className="limit-warning">
                                        {description.length}/400 character limit
                                    </p>
                                )}

                            </div>

                            <div>
                                <label>Price:</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="Enter price"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                />
                                {errors.price && <p className="error">{errors.price}</p>}
                            </div>

                            <div>
                                <label>Category:</label>
                                <select
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                >
                                    <option value="">Select category</option>
                                    <option value="1">Books</option>
                                    <option value="2">Electronics</option>
                                    <option value="3">Furniture</option>
                                </select>
                                {errors.categoryId && (
                                    <p className="error">{errors.categoryId}</p>
                                )}
                            </div>

                            <div>
                                <label>Condition:</label>
                                <select
                                    value={condition}
                                    onChange={(e) => setCondition(e.target.value)}
                                >
                                    <option value="New">New</option>
                                    <option value="Like New">Like New</option>
                                    <option value="Good">Good</option>
                                    <option value="Fair">Fair</option>
                                </select>
                            </div>

                             <button type="submit" disabled={isSubmitting}>
                                 {isSubmitting ? "Analyzing & Posting..." : "Create Post"}
                             </button>
                        </div>

                        <div className="form-right">
                            <label>Photos: (Up to 4)</label>

                            <label
                                className="photo-drop-box"
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                            >
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    hidden
                                    onChange={handlePhotoUpload}
                                />

                                {photos.length > 0 ? (
                                    <div className={`photo-preview-grid photo-count-${photos.length}`}>
                                        {photos.map((photo, index) => (
                                            <div key = {index} className="photo-wrapper">
                                                <img
                                                    src={photo.preview}
                                                    alt={`Preview ${index + 1}`}
                                                />

                                                <button
                                                    type="button"
                                                    className="remove-photo-btn"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        removePhoto(index);
                                                    }}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <>
                                        <span className="drop-icon">📷</span>
                                        <p>Drag photos or click to upload</p>
                                        <small>Up to 4 photos</small>
                                    </>
                                )}
                            </label>

                            {photos.length > 0 && (
                                <div className="photo-url-list">
                                    {photos.map((photo, index) => (
                                        <p key={index}>
                                            Photo {index + 1}: {photo.file.name}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>
                    </form>

                    {message && <p className="success-message">{message}</p>}
                </div>
            </div>
        </div>
    );
}

export default CreatePost;