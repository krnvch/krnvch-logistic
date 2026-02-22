import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  noResults?: boolean;
}

export function SearchInput({
  value,
  onChange,
  onClear,
  noResults,
}: SearchInputProps) {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Поиск заказа..."
        className="h-9 w-40 pl-9 pr-8 lg:w-56"
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onChange(e.target.value)
        }
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0.5 top-0.5 h-8 w-8"
          onClick={onClear}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
      {noResults && (
        <p className="absolute left-0 top-full z-10 mt-1 rounded-md border bg-popover px-3 py-1.5 text-xs text-muted-foreground shadow-md">
          Ничего не найдено
        </p>
      )}
    </div>
  );
}
