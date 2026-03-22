import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  return (
    <div className="relative">
      <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
      <Input
        type="search"
        placeholder={t("search.placeholder")}
        className="h-9 w-40 pr-8 pl-9 [&::-webkit-search-cancel-button]:hidden lg:w-56"
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onChange(e.target.value)
        }
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-0.5 right-0.5 h-8 w-8"
          onClick={onClear}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
      {noResults && (
        <p className="bg-popover text-muted-foreground absolute top-full left-0 z-10 mt-1 border-2 px-3 py-1.5 text-xs">
          {t("search.noResults")}
        </p>
      )}
    </div>
  );
}
