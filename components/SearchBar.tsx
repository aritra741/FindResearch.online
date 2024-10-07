import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import React from "react";

interface SearchBarProps {
  searchInput: string;
  setSearchInput: (value: string) => void;
  handleSearch: () => void;
  isLoading: boolean;
  clearSearch: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchInput,
  setSearchInput,
  handleSearch,
  isLoading,
  clearSearch,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchInput.trim()) {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <Input
        type="text"
        placeholder="Enter search terms (searches titles and abstracts)..."
        value={searchInput}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
      />

      <div className="flex justify-center space-x-4">
        <Button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Searching...
            </>
          ) : (
            <>
              <Search className="mr-2" />
              Search Articles
            </>
          )}
        </Button>
        <Button variant="outline" onClick={clearSearch}>
          Clear Search
        </Button>
      </div>
    </div>
  );
};

export default SearchBar;
