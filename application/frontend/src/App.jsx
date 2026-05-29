// import Home from "./pages/Home";
//
// function App() {
//     return (
//         <Home />
//     );
// }
//
// export default App;

/**
 * App.jsx
 * Main application component with routing configuration.
 * Each Route maps a URL path to a page component.
 *
 * Modified by: Guiran Liu - added /register route
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import About from "./pages/About";
import "./App.css";
import SearchPage from "./pages/SearchPage";
import UserPage from "./pages/UserPage";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ViewPostPage from "./pages/ViewPostPage";
import CreatePost from "./pages/CreatePost";
import PostSubmitted from "./pages/PostSubmitted";

function App () {
    return (
        <BrowserRouter>
            <Navbar />
            <main className="app-content">
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    style={{
                        position: "fixed",
                        bottom: "24px",
                        right: "24px",
                        zIndex: 999,
                        background: "#6b46c1",
                        color: "white",
                        border: "none",
                        borderRadius: "50%",
                        width: "44px",
                        height: "44px",
                        fontSize: "20px",
                        cursor: "pointer",
                    }}
                >
                    ⬆
                </button>

                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/about/:slug" element={<About />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/user" element={<UserPage />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/posts/:postId" element={<ViewPostPage />} />
                    <Route path="/create-post" element={<CreatePost />} />
                    <Route path="/Post-Submitted" element={<PostSubmitted />} />
                </Routes>
            </main>
        </BrowserRouter>
    );
}

export default App;