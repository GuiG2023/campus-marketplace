/**
 * Register.jsx
 * Registration page for new SFSU Marketplace users.
 * Handles frontend credential validation before API submission.
 *
 * 
 * Author: Guiran Liu
 */
import "../styles/Register.css";
import { useState } from "react";

function Register() {
    const [formData, setFormData] = useState({
        sfsu_email: "",
        display_name: "",
        password: "",
        confirm_password: "",
    });

    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState("");

    // Update form fields as user types
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Validate all fields before submission
    const validate = () => {
        const newErrors = {};

        if (!formData.sfsu_email.endsWith("@sfsu.edu")) {
            newErrors.sfsu_email = "Email must be an SFSU email (@sfsu.edu)";
        }
        if (!formData.display_name) {
            newErrors.display_name = "Display name is required";
        }
        if (!formData.password) {
            newErrors.password = "Password is required";
        }
        if (formData.password !== formData.confirm_password) {
            newErrors.confirm_password = "Passwords do not match";
        }
        if (formData.password.length < 8) {
            newErrors.password = "Password must be at least 8 characters";
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
    } else {
        setErrors({});
        const BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
        try {
            const res = await fetch(`${BASE_URL}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sfsu_email: formData.sfsu_email.trim(),
                    display_name: formData.display_name.trim(),
                    password: formData.password
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Registration failed");
            
            // Save token and user info
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            
            
            // Show success message then redirect
            setMessage("Registration successful! Redirecting to home...");
            setTimeout(() => {
                window.location.href = "/";
            }, 2000);
        } catch (err) {
            setErrors({ general: err.message });
        }
    }
};

    return (
          <div className="register-page">
            <div className="register-container">
            <h2>Create an Account</h2>
            <p className="required-note">
                <span className="required">*</span> Required fields
                </p>
            <form onSubmit={handleSubmit}>

                <div>
                    <label>SFSU Email <span className="required">*</span></label>
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
                    <label>Display Name <span className="required">*</span></label>
                    <input
                        type="text"
                        name="display_name"
                        value={formData.display_name}
                        onChange={handleChange}
                        placeholder="Your name"
                    />
                    {errors.display_name && <p className="error">{errors.display_name}</p>}
                </div>

                <div>
                    <label>Password <span className="required">*</span></label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter password"
                    />
                    {errors.password && <p className="error">{errors.password}</p>}
                </div>

                <div>
                    <label>Confirm Password <span className="required">*</span></label>
                    <input
                        type="password"
                        name="confirm_password"
                        value={formData.confirm_password}
                        onChange={handleChange}
                        placeholder="Re-enter password"
                    />
                    {errors.confirm_password && <p className="error">{errors.confirm_password}</p>}
                </div>
                
                {errors.general && <p className="error">{errors.general}</p>}
                
                <div className="terms-container">
                    <input
                        type="checkbox"
                        name="terms"
                        id="terms"
                        required
                    />
                    <label htmlFor="terms" className="terms-label">
                        I agree to the{" "}
                        <span className="terms-tooltip">
                            Terms and Conditions
                            <span className="tooltip-content">
                                <strong>GatorMart Terms and Conditions</strong><br /><br />
                                1. You must be a current SFSU student to use this platform.<br /><br />
                                2. All listings must be accurate and not misleading.<br /><br />
                                3. Transactions are conducted between students at your own risk.<br /><br />
                                4. GatorMart is not responsible for any disputes between buyers and sellers.<br /><br />
                                5. All meetups must take place in designated safe campus locations.<br /><br />
                                6. Do not list illegal or prohibited items.<br /><br />
                                7. GatorMart reserves the right to remove any listing at any time.
                            </span>
                        </span>
                    </label>
                </div>
                
                <button type="submit">Register</button>
                
                <p className="login-link">
                    Already have an account? <a href="/login">Login</a>
                </p>

            </form>
             {message && <p className="success-message">{message}</p>}
            </div>
        </div>
    );
}

export default Register;