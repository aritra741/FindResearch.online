import { SortOption } from "@/app/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React from "react";
import { useResearchStore } from "../app/store/researchStore";

const SortSelect: React.FC = () => {
  const { sortOption, handleSortChange } = useResearchStore();

  return (
    <Select
      onValueChange={(value) => handleSortChange(value as SortOption)}
      defaultValue={sortOption}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="relevance">Relevance</SelectItem>
        <SelectItem value="citationCount">Citation Count</SelectItem>
        <SelectItem value="date">Publication Date</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default SortSelect;
