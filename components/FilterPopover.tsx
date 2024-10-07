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

interface FilterPopoverProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  startDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;
  endDate: Date | undefined;
  setEndDate: (date: Date | undefined) => void;
  selectedJournals: string[];
  setSelectedJournals: (journals: string[]) => void;
  minCitations: string;
  setMinCitations: (citations: string) => void;
  availableJournals: string[];
  applyFilters: () => void;
  clearFilters: () => void;
}

const FilterPopover: React.FC<FilterPopoverProps> = ({
  isOpen,
  setIsOpen,
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
}) => {
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
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
                    {startDate ? format(startDate, "dd/MM/yyyy") : "Start Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
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
                    {endDate ? format(endDate, "dd/MM/yyyy") : "End Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
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
            <Button
              onClick={() => {
                applyFilters();
                setIsOpen(false);
              }}
            >
              Apply Filters
            </Button>
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
