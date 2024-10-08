import { useResearchStore } from "@/app/store/researchStore";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Filter } from "lucide-react";
import React from "react";

const FilterPopover: React.FC = () => {
  const {
    isFiltersOpen,
    setIsFiltersOpen,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    selectedJournals,
    setSelectedJournals,
    minCitations,
    setMinCitations,
    availableJournals,
    applyFilters,
    clearFilters,
  } = useResearchStore();

  // Log dates to debug
  console.log("startDate:", startDate, "endDate:", endDate);

  // Ensure dates are correctly set to Date objects or undefined
  const handleStartDateSelect = (date: Date | undefined) => {
    setStartDate(date); // Set to undefined when cleared
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    setEndDate(date); // Set to undefined when cleared
  };

  return (
    <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          {/* Date Range */}
          <div className="space-y-2">
            <h3 className="font-medium">Date Range</h3>
            <div className="flex gap-2">
              {/* Start Date */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[120px] justify-start text-left font-normal"
                  >
                    {startDate && !isNaN(new Date(startDate).getTime())
                      ? format(new Date(startDate), "dd/MM/yyyy")
                      : "Start Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate || undefined} // Use undefined if startDate is null
                    onSelect={handleStartDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* End Date */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[120px] justify-start text-left font-normal"
                  >
                    {endDate && !isNaN(new Date(endDate).getTime())
                      ? format(new Date(endDate), "dd/MM/yyyy")
                      : "End Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate || undefined} // Use undefined if endDate is null
                    onSelect={handleEndDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Journals */}
          <div className="space-y-2">
            <h3 className="font-medium">Journal/Source</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {availableJournals.map((journal) => (
                <label key={journal} className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedJournals.includes(journal)}
                    onCheckedChange={(checked) => {
                      setSelectedJournals(
                        checked
                          ? [...selectedJournals, journal]
                          : selectedJournals.filter((j) => j !== journal)
                      );
                    }}
                  />
                  <span>{journal}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Minimum Citations */}
          <div className="space-y-2">
            <h3 className="font-medium">Minimum Citations</h3>
            <Input
              type="number"
              value={minCitations}
              onChange={(e) => setMinCitations(e.target.value)}
              placeholder="Enter minimum citations"
            />
          </div>

          {/* Apply and Clear Buttons */}
          <div className="flex justify-between">
            <Button onClick={applyFilters}>Apply Filters</Button>
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default FilterPopover;
