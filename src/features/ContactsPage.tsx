import { useState, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { Mail, Phone, Linkedin, Plus, MoreVertical, Trash2, Search, Filter } from "lucide-react";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { CompanyAvatar } from "@/components/common/CompanyAvatar";
import { EmptyState } from "@/components/common/EmptyState";
import { FormDialog } from "@/components/common/FormDialog";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listContacts,
  listCompanies,
  createContact,
  deleteContact,
} from "@/services";
import type { Contact } from "@/types";
import { DataPagination } from "@/components/common/DataPagination";
import { TruncateWithTooltip } from "@/components/common/TruncateWithTooltip";

export function ContactsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["contacts"], queryFn: listContacts });
  const companies = useQuery({ queryKey: ["companies"], queryFn: listCompanies });

  const [openCreate, setOpenCreate] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    role: "",
    email: "",
    phone: "",
    company_id: "",
  });

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [q, setQ] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");

  const filtered = useMemo(() => {
    return data.filter((c) => {
      if (companyFilter !== "all" && c.company_id !== companyFilter) return false;
      if (q) {
        const term = q.toLowerCase();
        if (!c.name.toLowerCase().includes(term) && !(c.role ?? "").toLowerCase().includes(term) && !(c.email ?? "").toLowerCase().includes(term) && !(c.company?.name ?? "").toLowerCase().includes(term)) return false;
      }
      return true;
    });
  }, [data, q, companyFilter]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedContacts = useMemo(() => {
    return filtered.slice(startIndex, endIndex);
  }, [filtered, startIndex, endIndex]);

  const createMut = useMutation({
    mutationFn: () =>
      createContact({
        name: form.name,
        role: form.role || null,
        email: form.email || null,
        phone: form.phone || null,
        company_id: form.company_id || null,
      } as Partial<Contact>),
    onSuccess: () => {
      toast.success(t("contacts.created"));
      setForm({ name: "", role: "", email: "", phone: "", company_id: "" });
      setOpenCreate(false);
      void qc.invalidateQueries({ queryKey: ["contacts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteContact(id),
    onSuccess: () => {
      toast.success(t("contacts.deleted"));
      setConfirmId(null);
      void qc.invalidateQueries({ queryKey: ["contacts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell>
      <PageHeader
        title={t("contacts.title")}
        description={t("contacts.description")}
        count={data.length}
        actions={
          <button
            onClick={() => setOpenCreate(true)}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-active transition-colors"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            <span className="hidden sm:inline">{t("contacts.new")}</span>
          </button>
        }
      />

      {data.length === 0 ? (
        <EmptyState title={t("empty.title")} description={t("empty.description")} />
      ) : (
        <>
          {/* Filter bar */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px] sm:min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint pointer-events-none" strokeWidth={1.75} />
              <input
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
                placeholder={t("contacts.searchPlaceholder", { defaultValue: "Cari nama, peran, email, perusahaan…" })}
                className="w-full h-9 pl-9 pr-3 rounded-md bg-surface border border-hairline text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
            <Select value={companyFilter} onValueChange={(v) => { setCompanyFilter(v); setPage(1); }}>
              <SelectTrigger className="h-9 w-auto min-w-[140px] rounded-md bg-surface border border-hairline text-sm text-ink hover:bg-surface-muted focus:outline-none focus:ring-1 focus:ring-primary transition-colors cursor-pointer">
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 text-ink-faint shrink-0" strokeWidth={1.75} />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all", { defaultValue: "Semua" })} {t("contacts.form.company")}</SelectItem>
                {(companies.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <EmptyState title={t("empty.title")} description={t("empty.description")} />
          ) : (
          <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-lg bg-surface border border-hairline shadow-soft overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <div className="min-w-[700px]">
                <div className="grid grid-cols-[48px_minmax(200px,2fr)_1.4fr_1.4fr_32px] gap-4 px-5 py-3 border-b border-hairline bg-surface-muted/50 text-eyebrow text-ink-muted whitespace-nowrap">
                  <span className="sticky left-0 bg-surface-muted z-20 border-r border-hairline shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] px-1">#</span>
                  <span>{t("contacts.form.name")} / {t("contacts.form.company")}</span>
                  <span>{t("contacts.form.role")}</span>
                  <span>{t("common.actions")}</span>
                  <span></span>
                </div>
                <ul>
                  {paginatedContacts.map((c, i) => (
                    <li
                      key={c.id}
                      className="grid grid-cols-[48px_minmax(200px,2fr)_1.4fr_1.4fr_32px] items-center gap-4 px-5 py-3.5 border-b border-hairline last:border-0 hover:bg-surface-muted/50 transition-colors group"
                    >
                      <span className="text-xs font-semibold text-ink-muted tabular-nums sticky left-0 bg-surface z-20 border-r border-hairline shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] px-1">{(page - 1) * pageSize + i + 1}</span>
                      <div className="flex items-center gap-3 min-w-0">
                        <CompanyAvatar name={c.name} size={34} />
                        <div className="min-w-0 overflow-hidden">
                          <div className="text-sm font-medium text-ink truncate">
                            <TruncateWithTooltip text={c.name} className="text-sm font-medium text-ink" />
                          </div>
                          <div className="text-xs text-ink-muted truncate">
                            <TruncateWithTooltip text={c.company?.name ?? "-"} className="text-xs text-ink-muted" />
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-ink-secondary truncate min-w-0">
                        <TruncateWithTooltip text={c.role ?? "-"} className="text-sm text-ink-secondary" />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-ink-muted min-w-0 overflow-hidden">
                        {c.email && (
                          <a href={`mailto:${c.email}`} className="flex items-center gap-1 hover:text-primary truncate min-w-0">
                            <Mail className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                            <TruncateWithTooltip text={c.email} className="hover:text-primary" />
                          </a>
                        )}
                        {c.phone && (
                          <span className="flex items-center gap-1 shrink-0">
                            <Phone className="h-3.5 w-3.5" strokeWidth={1.75} />
                            {c.phone}
                          </span>
                        )}
                        {c.linkedin && (
                          <a href={`https://${c.linkedin}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary shrink-0">
                            <Linkedin className="h-3.5 w-3.5" strokeWidth={1.75} />
                          </a>
                        )}
                      </div>
                      <RowMenu onDelete={() => setConfirmId(c.id)} deleteLabel={t("common.delete")} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <DataPagination total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(n) => { setPageSize(n); setPage(1); }} />
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            <ul className="space-y-2">
              {paginatedContacts.map((c, i) => (
                <li key={c.id} className="rounded-lg bg-surface border border-hairline p-3 shadow-soft">
                  <div className="flex items-start gap-3">
                    <CompanyAvatar name={c.name} size={36} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ink truncate">
                        {(page - 1) * pageSize + i + 1}. {c.name}
                      </div>
                      <div className="text-xs text-ink-muted truncate">
                        {c.role ?? "-"}{c.company?.name ? ` · ${c.company.name}` : ""}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
                        {c.email && (
                          <a href={`mailto:${c.email}`} className="flex items-center gap-1 hover:text-primary">
                            <Mail className="h-3 w-3" />
                            <span className="truncate max-w-[160px]">{c.email}</span>
                          </a>
                        )}
                        {c.phone && (
                          <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>
                        )}
                      </div>
                    </div>
                    <RowMenu onDelete={() => setConfirmId(c.id)} deleteLabel={t("common.delete")} />
                  </div>
                </li>
              ))}
            </ul>
            <DataPagination total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(n) => { setPageSize(n); setPage(1); }} />
          </div>
          </>
          )}
        </>
      )}

      <FormDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        title={t("contacts.new")}
        submitLabel={t("common.create")}
        onSubmit={async () => {
          if (!form.name.trim()) { toast.error(t("common.required")); return; }
          await createMut.mutateAsync();
        }}
      >
        <Field label={t("contacts.form.name")}>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t("contacts.form.namePlaceholder")} className={inputCls} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={t("contacts.form.role")}>
            <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder={t("contacts.form.rolePlaceholder")} className={inputCls} />
          </Field>
          <Field label={t("contacts.form.company")}>
            <Select
              value={form.company_id || "_none"}
              onValueChange={(val) => setForm({ ...form, company_id: val === "_none" ? "" : val })}
            >
              <SelectTrigger className={inputCls}>
                <SelectValue placeholder={t("contacts.form.selectCompany")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">{t("contacts.form.selectCompany")}</SelectItem>
                {(companies.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={t("contacts.form.email")}>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={t("contacts.form.emailPlaceholder")} className={inputCls} />
          </Field>
          <Field label={t("contacts.form.phone")}>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={t("contacts.form.phonePlaceholder")} className={inputCls} />
          </Field>
        </div>
      </FormDialog>

      <ConfirmDialog
        open={!!confirmId}
        onOpenChange={(v) => !v && setConfirmId(null)}
        loading={deleteMut.isPending}
        onConfirm={() => { if (confirmId) deleteMut.mutate(confirmId); }}
      />
    </AppShell>
  );
}

function RowMenu({ onDelete, deleteLabel }: { onDelete: () => void; deleteLabel: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="h-7 w-7 grid place-items-center rounded-md text-ink-faint hover:text-ink hover:bg-surface-muted transition-colors shrink-0">
        <MoreVertical className="h-4 w-4" strokeWidth={1.75} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
          <Trash2 className="h-3.5 w-3.5 mr-2" />
          {deleteLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const inputCls =
  "w-full h-9 px-3 rounded-md bg-surface border border-hairline text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink-secondary mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
