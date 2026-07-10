import { useState } from "react";
import { Menu } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { SidebarBody } from "./SidebarBody";

export function MobileNav() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={t("nav.openMenu")}
          className="lg:hidden h-9 w-9 grid place-items-center rounded-md border border-hairline bg-surface hover:bg-surface-muted text-ink-muted hover:text-ink transition-colors"
        >
          <Menu className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-[260px] bg-sidebar border-r border-hairline">
        <SheetTitle className="sr-only">{t("nav.workspace")}</SheetTitle>
        <SidebarBody onNavigate={() => setOpen(false)} layoutIdSuffix="-mobile" />
      </SheetContent>
    </Sheet>
  );
}
