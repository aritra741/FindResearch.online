import { useModel } from "@/app/hooks/useModel";
import { Input } from "@/components/ui/input";
import React from "react";
import { useResearchStore } from "../app/store/researchStore";

const SearchBar: React.FC = () => {
  const { searchInput, setSearchInput, handleSearch } = useResearchStore();
  const model = useModel();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchInput.trim()) {
      e.preventDefault();
      handleSearch(model);
    }
  };

  return (
    <Input
      type="text"
      placeholder="Enter search terms (searches titles and abstracts)..."
      value={searchInput}
      onChange={handleInputChange}
      onKeyDown={handleKeyDown}
    />
  );
};

export default SearchBar;
