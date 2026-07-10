import { useTranslation } from "react-i18next";
import { Languages, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SUPPORTED_LANGUAGES, setLanguage, type LanguageCode } from "@/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ compact = true }: { compact?: boolean }) {
  const { i18n, t } = useTranslation();
  const rawLang = i18n.resolvedLanguage ?? i18n.language ?? "id";
  const current = (rawLang.startsWith("en") ? "en" : "id") as LanguageCode;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("topbar.language")}
          className={cn(
            "h-8 flex items-center justify-center rounded-md border border-hairline bg-surface hover:bg-surface-muted transition-colors text-ink-muted hover:text-ink focus:outline-none focus:ring-0",
            compact ? "w-8" : "px-2.5 gap-1.5 text-xs font-medium",
          )}
        >
          <Languages className="h-4 w-4" strokeWidth={1.75} />
          {!compact && <span className="uppercase">{current}</span>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className="flex items-center gap-2 text-sm cursor-pointer"
          >
            <span className="text-base">{lang.flag}</span>
            <span className="flex-1">{lang.label}</span>
            {lang.code === current && <Check className="h-3.5 w-3.5 text-ink" strokeWidth={2} />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
