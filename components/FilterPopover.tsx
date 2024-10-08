import { ArxivJournal } from "@/app/lib/types";
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

  const handleStartDateSelect = (date: Date | undefined) => {
    setStartDate(date);
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    setEndDate(date);
  };

  const getJournalName = (journal: string | ArxivJournal): string => {
    if (typeof journal === "string") {
      return journal;
    }
    if (journal && typeof journal === "object" && "_" in journal) {
      return journal._;
    }
    return "Unknown Journal";
  };

  const isJournalSelected = (journal: string | ArxivJournal): boolean => {
    const journalName = getJournalName(journal);
    return selectedJournals.includes(journalName);
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
          <div className="space-y-2">
            <h3 className="font-medium">Date Range</h3>
            <div className="flex gap-2">
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
                    selected={startDate || undefined}
                    onSelect={handleStartDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

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
                    selected={endDate || undefined}
                    onSelect={handleEndDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Journal/Source</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {availableJournals.map((journal, index) => {
                const journalName = getJournalName(journal);
                return (
                  <label key={index} className="flex items-center space-x-2">
                    <Checkbox
                      checked={isJournalSelected(journal)}
                      onCheckedChange={(checked: boolean) => {
                        setSelectedJournals(
                          checked
                            ? [...selectedJournals, journalName]
                            : selectedJournals.filter((j) => j !== journalName)
                        );
                      }}
                    />
                    <span>{journalName}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Minimum Citations</h3>
            <Input
              type="number"
              value={minCitations}
              onChange={(e) => setMinCitations(e.target.value)}
              placeholder="Enter minimum citations"
            />
          </div>

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
