// const SearchResults = ({ results = [], count = 0 }) => {
//     return (
//         <div className="search-results-container">
//             <p className="results-count">{count} items found</p>

//             <div className="results-grid">
//                 {results.length > 0 ? (
//                     results.map((item) => (
//                         <div key={item.post_id} className="result-card">
//                             <img
//                                 src={item.image_url}
//                                 alt={item.item_title}
//                                 className="result-image"
//                             />

//                             <div className="result-info">
//                                 <h3>{item.item_title}</h3>
//                                 <p>{item.item_description}</p>
//                                 <p className="price">${item.item_price}</p>
//                             </div>
//                         </div>
//                     ))
//                 ) : (
//                     <p>No items found.</p>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default SearchResults;








// Modified by: Guiran Liu
// Reason: Added onClick navigation to post detail page (/posts/:post_id)
// so users can click a search result card to view full post details.

import { useNavigate } from "react-router-dom";

const SearchResults = ({ results = [], count = 0 }) => {
    const navigate = useNavigate();
    const BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

    const getImageUrl = (url) => {
        if (!url) return "/placeholder-image.png";
        const firstUrl = url.split(",")[0].trim();
        if (firstUrl.startsWith("http")) return firstUrl;
        return `${BASE_URL}${firstUrl}`;
    };
        
    return (
        <div className="search-results-container">
            <p className="results-count">{count} items found</p>
            <div className="results-grid">
                {results.length > 0 ? (
                    results.map((item) => (
                        <div 
                            key={item.post_id} 
                            className="result-card"
                            onClick={() => navigate(`/posts/${item.post_id}`)}
                            style={{ cursor: "pointer" }}
                        >
                            <img
                                src={getImageUrl(item.image_url)}
                                alt={item.item_title}
                                className="result-image"
                            />
                            <div className="result-info">
                                <h3>{item.item_title}</h3>
                                <p>{item.item_description}</p>
                                <p className="price">${item.item_price}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No items found.</p>
                )}
            </div>
        </div>
    );
};
export default SearchResults;