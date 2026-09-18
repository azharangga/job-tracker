"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { Plus, Trash2, Copy, Link as LinkIcon, Edit2, MoreVertical, Eye, Pencil, Search, Filter } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/common/EmptyState";
import { FormDialog } from "@/components/common/FormDialog";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { supabase } from "@/integrations/supabase/client";
import { formatRelative } from "@/lib/format";
import { DataPagination } from "@/components/common/DataPagination";
import { TruncateWithTooltip } from "@/components/common/TruncateWithTooltip";

type Shortlink = {
  id: string;
  short_code: string;
  target_url: string;
  is_active: boolean;
  created_at: string;
};

const DEMO_KEY = "demo_shortlinks";

function isDemo() {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("demo_user_session");
}

function getDemoData(): Shortlink[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(DEMO_KEY);
  return data ? JSON.parse(data) : [];
}

function saveDemoData(data: Shortlink[]) {
  localStorage.setItem(DEMO_KEY, JSON.stringify(data));
}

async function fetchShortlinks(): Promise<Shortlink[]> {
  if (isDemo()) {
    return getDemoData().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  const { data, error } = await supabase
    .from("shortlinks" as any)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as unknown as Shortlink[];
}

export function ShortlinksPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: shortlinks = [], isLoading } = useQuery({
    queryKey: ["shortlinks"],
    queryFn: fetchShortlinks,
  });

  const [openCreate, setOpenCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ target_url: "", custom_alias: "" });
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const filteredShortlinks = shortlinks.filter((link) => {
    if (statusFilter === "active" && !link.is_active) return false;
    if (statusFilter === "inactive" && link.is_active) return false;
    if (q) {
      const term = q.toLowerCase();
      if (!link.short_code.toLowerCase().includes(term) && !link.target_url.toLowerCase().includes(term)) return false;
    }
    return true;
  });

  const paginatedShortlinks = filteredShortlinks.slice((page - 1) * pageSize, page * pageSize);

  const createMut = useMutation({
    mutationFn: async (payload: { url: string; customAlias: string }) => {
      if (isDemo()) {
        const demoData = getDemoData();
        const short_code = payload.customAlias || Math.random().toString(36).substring(2, 8);
        if (demoData.some(d => d.short_code === short_code)) {
          throw new Error("Custom alias is already taken");
        }
        const newLink: Shortlink = {
          id: crypto.randomUUID(),
          target_url: payload.url,
          short_code,
          is_active: true,
          created_at: new Date().toISOString(),
        };
        saveDemoData([...demoData, newLink]);
        return newLink;
      }

      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create shortlink");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shortlinks"] });
      setOpenCreate(false);
      setForm({ target_url: "", custom_alias: "" });
      toast.success(t("shortlinks.created", "Shortlink created successfully!"));
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const updateMut = useMutation({
    mutationFn: async (payload: { id: string; target_url: string; short_code: string }) => {
      if (isDemo()) {
        const demoData = getDemoData();
        if (demoData.some(d => d.short_code === payload.short_code && d.id !== payload.id)) {
          throw new Error("Custom alias is already taken");
        }
        saveDemoData(demoData.map(d => d.id === payload.id ? { ...d, target_url: payload.target_url, short_code: payload.short_code } : d));
        return;
      }

      const { error } = await supabase
        .from("shortlinks" as any)
        .update({ target_url: payload.target_url, short_code: payload.short_code })
        .eq("id", payload.id);
      if (error) {
        if (error.code === '23505') throw new Error("Custom alias is already taken");
        throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shortlinks"] });
      setOpenCreate(false);
      setEditId(null);
      setForm({ target_url: "", custom_alias: "" });
      toast.success(t("common.saved", "Saved successfully"));
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const toggleStatusMut = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      if (isDemo()) {
        const demoData = getDemoData();
        saveDemoData(demoData.map(d => d.id === id ? { ...d, is_active } : d));
        return;
      }

      const { error } = await supabase
        .from("shortlinks" as any)
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shortlinks"] });
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      if (isDemo()) {
        const demoData = getDemoData();
        saveDemoData(demoData.filter(d => d.id !== id));
        return;
      }

      const { error } = await supabase.from("shortlinks" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shortlinks"] });
      setConfirmId(null);
      toast.success(t("common.deleted", "Deleted successfully"));
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const copyToClipboard = async (code: string) => {
    const url = `${window.location.origin}/s/${code}`;
    await navigator.clipboard.writeText(url);
    toast.success(t("common.copied", "Copied to clipboard"));
  };

  return (
    <AppShell>
      <PageHeader
        title={t("nav.shortlinks", "Shortlinks")}
        description={t("shortlinks.desc", "Manage all your shortened URLs")}
        actions={
          <button
            onClick={() => setOpenCreate(true)}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-active transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            {t("shortlinks.create", "Create New")}
          </button>
        }
      />

      {shortlinks.length === 0 && !isLoading ? (
        <EmptyState
          icon={<LinkIcon className="h-8 w-8 text-ink-faint" />}
          title={t("shortlinks.emptyTitle", "No Shortlinks")}
          description={t("shortlinks.emptyDesc", "You haven't created any shortened URLs yet.")}
          action={
            <button
              onClick={() => setOpenCreate(true)}
              className="mt-4 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-active transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              {t("shortlinks.create", "Create New")}
            </button>
          }
        />
      ) : (
        <>
          {/* Filter bar */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px] sm:min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint pointer-events-none" strokeWidth={1.75} />
              <input
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
                placeholder={t("shortlinks.searchPlaceholder", { defaultValue: "Cari alias, target URL…" })}
                className="w-full h-9 pl-9 pr-3 rounded-md bg-surface border border-hairline text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as any); setPage(1); }}>
              <SelectTrigger className="h-9 w-auto min-w-[140px] rounded-md bg-surface border border-hairline text-sm text-ink hover:bg-surface-muted focus:outline-none focus:ring-1 focus:ring-primary transition-colors cursor-pointer">
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 text-ink-faint shrink-0" strokeWidth={1.75} />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all", { defaultValue: "Semua" })} {t("common.status", { defaultValue: "Status" })}</SelectItem>
                <SelectItem value="active">{t("shortlinks.active", { defaultValue: "Aktif" })}</SelectItem>
                <SelectItem value="inactive">{t("shortlinks.inactive", { defaultValue: "Nonaktif" })}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredShortlinks.length === 0 ? (
            <EmptyState
              icon={<LinkIcon className="h-8 w-8 text-ink-faint" />}
              title={t("empty.title")}
              description={t("empty.description")}
            />
          ) : (
        <div className="bg-surface border border-hairline rounded-xl overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-sm whitespace-nowrap min-w-[720px]">
              <thead className="bg-surface-muted border-b border-hairline text-ink-muted text-eyebrow">
                <tr>
                  <th className="px-5 py-3 font-medium w-12 text-center sticky left-0 bg-surface-muted z-20 border-r border-hairline shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">#</th>
                  <th className="px-5 py-3 font-medium">Short Link</th>
                  <th className="px-5 py-3 font-medium">Target URL</th>
                  <th className="px-5 py-3 font-medium">{t("common.createdAt", "Created At")}</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium w-24">{t("common.actions", "Actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {paginatedShortlinks.map((link, index) => (
                  <tr key={link.id} className="hover:bg-surface-muted/50 transition-colors group">
                    <td className="px-5 py-4 text-ink-muted text-center tabular-nums sticky left-0 bg-surface z-20 border-r border-hairline shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">{(page - 1) * pageSize + index + 1}</td>
                    <td className="px-5 py-4 font-medium text-ink">
                      <div className="flex items-center gap-2">
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-mono">
                          /s/{link.short_code}
                        </span>
                        <button
                          onClick={() => copyToClipboard(link.short_code)}
                          className="text-ink-muted hover:text-ink transition-colors shrink-0"
                          title={t("common.copy", "Copy")}
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-ink-secondary max-w-[280px]">
                      <TruncateWithTooltip text={link.target_url} className="text-primary hover:underline" />
                    </td>
                    <td className="px-5 py-4 text-ink-secondary text-xs">
                      {formatRelative(link.created_at)}
                    </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => toggleStatusMut.mutate({ id: link.id, is_active: !link.is_active })}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        link.is_active ? "bg-primary" : "bg-surface-muted border border-hairline"
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-surface transition-transform ${
                          link.is_active ? "translate-x-5" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-7 w-7 grid place-items-center rounded-md bg-surface border border-hairline text-ink-faint hover:text-ink hover:bg-surface-muted transition-colors">
                        <MoreVertical className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { void navigator.clipboard.writeText(`${window.location.origin}/s/${link.short_code}`); toast.success(t("common.copied", "Copied to clipboard")); }}>
                          <Copy className="h-3.5 w-3.5 mr-2" />{t("common.copy", "Copy")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setEditId(link.id); setForm({ target_url: link.target_url, custom_alias: link.short_code }); setOpenCreate(true); }}>
                          <Pencil className="h-3.5 w-3.5 mr-2" />{t("common.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setConfirmId(link.id)} className="text-destructive focus:text-destructive">
                          <Trash2 className="h-3.5 w-3.5 mr-2" />{t("common.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
          <DataPagination total={filteredShortlinks.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(n) => { setPageSize(n); setPage(1); }} />
        </div>
          )}
        </>
      )}

      {/* Create Dialog */}
      <FormDialog
        open={openCreate}
        onOpenChange={(open) => {
          if (!open) {
            setOpenCreate(false);
            setEditId(null);
            setForm({ target_url: "", custom_alias: "" });
          }
        }}
        title={editId ? t("common.edit", "Edit") : t("shortlinks.createTitle", "Create Shortlink")}
        onSubmit={async () => {
          if (editId) {
            await updateMut.mutateAsync({ id: editId, target_url: form.target_url, short_code: form.custom_alias });
          } else {
            await createMut.mutateAsync({ url: form.target_url, customAlias: form.custom_alias });
          }
        }}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-ink block">{t("shortlinks.targetUrl", "Target URL")} <span className="text-red-500">*</span></label>
            <input
              type="url"
              required
              value={form.target_url}
              onChange={(e) => setForm({ ...form, target_url: e.target.value })}
              placeholder="https://example.com/very/long/url"
              className="w-full h-9 px-3 border border-hairline rounded-md bg-surface text-sm text-ink focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-ink block">{t("shortlinks.customAlias", "Custom Alias (Optional)")}</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-ink-muted bg-surface-muted px-2 py-1.5 border border-hairline rounded-md shrink-0 select-none">
                {typeof window !== 'undefined' ? window.location.host : ''}/s/
              </span>
              <input
                type="text"
                value={form.custom_alias}
                onChange={(e) => setForm({ ...form, custom_alias: e.target.value.replace(/[^a-zA-Z0-9_-]/g, "") })}
                placeholder="e.g. MyLink"
                maxLength={100}
                className="flex-1 h-9 px-3 border border-hairline rounded-md bg-surface text-sm text-ink focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <p className="text-xs text-ink-faint">{t("shortlinks.customAliasHint", "Leave blank to generate a random 6-character code.")}</p>
          </div>
        </div>
      </FormDialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={confirmId !== null}
        onOpenChange={(o) => !o && setConfirmId(null)}
        title={t("shortlinks.deleteTitle", "Delete Shortlink")}
        description={t("shortlinks.deleteDesc", "Are you sure you want to delete this shortlink? It will no longer redirect to the target URL.")}
        confirmLabel={t("common.delete", "Delete")}
        destructive={true}
        onConfirm={async () => {
          if (confirmId) await deleteMut.mutateAsync(confirmId);
        }}
        loading={deleteMut.isPending}
      />
    </AppShell>
  );
}
