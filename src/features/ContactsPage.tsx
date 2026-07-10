import { useState, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { Mail, Phone, Linkedin, Plus, MoreVertical, Trash2 } from "lucide-react";
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
  listContacts,
  listCompanies,
  createContact,
  deleteContact,
} from "@/services";
import type { Contact } from "@/types";

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
  const pageSize = 10;

  const totalItems = data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedContacts = useMemo(() => {
    return data.slice(startIndex, endIndex);
  }, [data, startIndex, endIndex]);

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
          {/* Desktop table */}
          <div className="hidden md:block rounded-lg bg-surface border border-hairline shadow-soft overflow-hidden">
            <div className="grid grid-cols-[48px_minmax(220px,2fr)_1.4fr_1.4fr_32px] gap-4 px-5 py-3 border-b border-hairline bg-surface-muted/50 text-eyebrow text-ink-muted">
              <span>#</span>
              <span>{t("contacts.form.name")} / {t("contacts.form.company")}</span>
              <span>{t("contacts.form.role")}</span>
              <span>{t("common.actions")}</span>
              <span></span>
            </div>
            <ul>
              {paginatedContacts.map((c, i) => (
                <li
                  key={c.id}
                  className="grid grid-cols-[48px_minmax(220px,2fr)_1.4fr_1.4fr_32px] items-center gap-4 px-5 py-3.5 border-b border-hairline last:border-0 hover:bg-surface-muted/50 transition-colors"
                >
                  <span className="text-xs font-semibold text-ink-muted tabular-nums">{(page - 1) * pageSize + i + 1}</span>
                  <div className="flex items-center gap-3 min-w-0">
                    <CompanyAvatar name={c.name} size={34} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-ink truncate">{c.name}</div>
                      <div className="text-xs text-ink-muted truncate">{c.company?.name ?? "-"}</div>
                    </div>
                  </div>
                  <div className="text-sm text-ink-secondary truncate">{c.role ?? "-"}</div>
                  <div className="flex items-center gap-3 text-xs text-ink-muted min-w-0">
                    {c.email && (
                      <a href={`mailto:${c.email}`} className="flex items-center gap-1 hover:text-primary truncate">
                        <Mail className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                        <span className="truncate">{c.email}</span>
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

          {/* Mobile cards */}
          <ul className="md:hidden space-y-2">
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 border-t border-hairline pt-4">
              <div className="text-xs text-ink-muted">
                Menampilkan {startIndex + 1} - {endIndex} dari {totalItems} kontak
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 px-3 rounded-md border border-hairline text-xs font-semibold hover:bg-surface-muted transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed text-ink bg-surface"
                >
                  {t("calendar.previous")}
                </button>
                <div className="text-xs font-medium text-ink">
                  Halaman {page} dari {totalPages}
                </div>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 px-3 rounded-md border border-hairline text-xs font-semibold hover:bg-surface-muted transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed text-ink bg-surface"
                >
                  {t("calendar.next")}
                </button>
              </div>
            </div>
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
            <select value={form.company_id} onChange={(e) => setForm({ ...form, company_id: e.target.value })} className={inputCls}>
              <option value="">{t("contacts.form.selectCompany")}</option>
              {(companies.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
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
