import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import SearchResults from "../components/SearchResults";

function SearchPage() {
    const location = useLocation();
    const [results, setResults] = useState([]);
    const [count, setCount] = useState(0);

    useEffect(() => {
        const fetchResults = async () => {
            const queryString = location.search;
            const url = `/api/posts/search${queryString}`;

            console.log("location.search:", location.search);
            console.log("fetching URL:", url);

            try {
                const res = await fetch(url);
                const data = await res.json();

                console.log("backend response:", data);

                setResults(data.results || []);
                setCount(data.count || 0);
            } catch (err) {
                console.error("Error fetching results:", err);
            }
        };

        fetchResults();
    }, [location.search]);

    return (
        <div>
            <Navbar />
            <SearchResults results={results} count={count} />
        </div>
    );
}

export default SearchPage;