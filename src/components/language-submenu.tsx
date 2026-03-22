import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import {
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

export function LanguageSubmenu() {
  const { t, i18n } = useTranslation();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Languages className="mr-2 h-4 w-4" />
        {t("language.title")}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuRadioGroup
          value={i18n.language}
          onValueChange={(lng) => i18n.changeLanguage(lng)}
        >
          <DropdownMenuRadioItem value="en">
            {t("language.en")}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="ru">
            {t("language.ru")}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
