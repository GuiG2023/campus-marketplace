/**
 * Login.jsx
 * Login page for existing SFSU Marketplace users.
 * Handles frontend credential validation before API submission.
 *
 * Author: Binrong Zhu
 */
import "../styles/Login.css";
import { useState } from "react";

function Login() {
    const [formData, setFormData] = useState({
        sfsu_email: "",
        password: "",
    });

    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState("");

    // Update form fields as user types
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Validate all fields before submission
    const validate = () => {
        const newErrors = {};

        const email = formData.sfsu_email.trim();
        const password = formData.password.trim();

        if (!email) {
            newErrors.sfsu_email = "SFSU email is required";
        } else if (!email.endsWith("@sfsu.edu")) {
            newErrors.sfsu_email = "Email must be an SFSU email (@sfsu.edu)";
        }

        if (!password) {
            newErrors.password = "Password is required";
        } else if (password.length < 8) {
            newErrors.password = "Password must be at least 8 characters";
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = validate();

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});

        const BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
        try {
            const res = await fetch(`${BASE_URL}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sfsu_email: formData.sfsu_email.trim(),
                    password: formData.password
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Login failed");

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            setSuccess("Login successful!");
            setTimeout(() => { window.location.href = "/"; }, 1500);
        } catch (err) {
            setErrors({ general: err.message });
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <h2>Login</h2>
                <form onSubmit={handleSubmit}>

                    <div>
                        <label>SFSU Email</label>
                        <input
                            type="email"
                            name="sfsu_email"
                            value={formData.sfsu_email}
                            onChange={handleChange}
                            placeholder="example@sfsu.edu"
                        />
                        {errors.sfsu_email && <p className="error">{errors.sfsu_email}</p>}
                    </div>

                    <div>
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter password"
                        />
                        {errors.password && <p className="error">{errors.password}</p>}
                    </div>

                    {errors.general && <p className="error">{errors.general}</p>}
                    {success && <p style={{color: "green", fontSize: "14px", marginTop: "8px"}}>Login successful!</p>}

                    <button type="submit">Login</button>

                    <p className="register-link">
                        Don't have an account? <a href="/register">Register</a>
                    </p>

                </form>
            </div>
        </div>
    );
}

export default Login;