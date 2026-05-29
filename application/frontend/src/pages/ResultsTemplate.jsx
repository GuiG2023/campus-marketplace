import Navbar from "../components/Navbar";
import SearchResults from "../components/SearchResults";

function SearchPage() {
    return (
        <div>
            <Navbar />
            <SearchResults results={fakeResults} count={fakeResults.length} />
        </div>
    );
}

export default SearchPage;