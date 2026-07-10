import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { Globe, MapPin, Plus, MoreVertical, Trash2, Edit } from "lucide-react";
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
import { listApplications, listCompanies, createCompany, deleteCompany, updateCompany } from "@/services";
import type { Company } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { ImageCropperDialog } from "@/components/common/ImageCropperDialog";

export function CompaniesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const companies = useQuery({ queryKey: ["companies"], queryFn: listCompanies });
  const apps = useQuery({ queryKey: ["applications"], queryFn: listApplications });

  const [openCreate, setOpenCreate] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", industry: "", location: "", website: "", logo_url: "" });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);

  // Cropper State
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [openCropper, setOpenCropper] = useState(false);

  const onLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropperImage(reader.result as string);
      setOpenCropper(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropSave = async (blob: Blob) => {
    setOpenCropper(false);
    setUploadingLogo(true);
    try {
      // 1. Delete old logo from storage if it exists
      if (form.logo_url) {
        try {
          const oldFilename = form.logo_url.split("/").pop();
          if (oldFilename) {
            await supabase.storage.from("company-logos").remove([oldFilename]);
          }
        } catch (e) {
          console.error("Failed to delete old logo", e);
        }
      }

      // 2. Upload new cropped blob
      const filename = `${Date.now()}_logo.jpg`;
      const { error } = await supabase.storage.from("company-logos").upload(filename, blob, {
        contentType: "image/jpeg",
      });
      if (error) throw error;

      const publicUrl = supabase.storage.from("company-logos").getPublicUrl(filename).data.publicUrl;
      setForm({ ...form, logo_url: publicUrl });
      toast.success("Logo uploaded successfully");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const onDeleteLogo = async () => {
    if (!form.logo_url) return;
    setUploadingLogo(true);
    try {
      const filename = form.logo_url.split("/").pop();
      if (filename) {
        await supabase.storage.from("company-logos").remove([filename]);
      }
      setForm({ ...form, logo_url: "" });
      toast.success("Logo removed");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleStartEdit = (c: Company) => {
    setEditingCompanyId(c.id);
    setForm({
      name: c.name,
      industry: c.industry || "",
      location: c.location || "",
      website: c.website || "",
      logo_url: c.logo_url || "",
    });
    setOpenCreate(true);
  };

  const createMut = useMutation({
    mutationFn: () => createCompany(form as Partial<Company>),
    onSuccess: () => {
      toast.success(t("companies.created"));
      setForm({ name: "", industry: "", location: "", website: "", logo_url: "" });
      setOpenCreate(false);
      void qc.invalidateQueries({ queryKey: ["companies"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: () => updateCompany(editingCompanyId!, form as Partial<Company>),
    onSuccess: () => {
      toast.success("Perusahaan berhasil diperbarui");
      setForm({ name: "", industry: "", location: "", website: "", logo_url: "" });
      setEditingCompanyId(null);
      setOpenCreate(false);
      void qc.invalidateQueries({ queryKey: ["companies"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteCompany(id),
    onSuccess: () => {
      toast.success(t("companies.deleted"));
      setConfirmId(null);
      void qc.invalidateQueries({ queryKey: ["companies"] });
      void qc.invalidateQueries({ queryKey: ["applications"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const counts = new Map<string, number>();
  for (const a of apps.data ?? []) {
    if (a.company_id) counts.set(a.company_id, (counts.get(a.company_id) ?? 0) + 1);
  }

  const list = companies.data ?? [];

  return (
    <AppShell>
      <PageHeader
        title={t("companies.title")}
        description={t("companies.description")}
        count={list.length}
        actions={
          <button
            onClick={() => setOpenCreate(true)}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-active transition-colors"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            <span className="hidden sm:inline">{t("companies.new")}</span>
          </button>
        }
      />

      {list.length === 0 ? (
        <EmptyState title={t("empty.title")} description={t("empty.description")} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {list.map((c) => (
            <div key={c.id} className="rounded-lg bg-surface border border-hairline p-4 sm:p-5 shadow-soft hover:shadow-elevated transition-shadow">
              <div className="flex items-start gap-3">
                <CompanyAvatar name={c.name} logoUrl={c.logo_url} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-ink truncate">{c.name}</div>
                  <div className="text-xs text-ink-muted truncate">{c.industry}</div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger className="h-7 w-7 grid place-items-center rounded-md text-ink-faint hover:text-ink hover:bg-surface-muted transition-colors shrink-0">
                    <MoreVertical className="h-4 w-4" strokeWidth={1.75} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleStartEdit(c)}>
                      <Edit className="h-3.5 w-3.5 mr-2" />
                      {t("common.edit")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setConfirmId(c.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      {t("common.delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="mt-3 space-y-1 text-xs text-ink-muted">
                {c.location && (
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{c.location}</span>
                  </div>
                )}
                {c.website && (
                  <div className="flex items-center gap-1.5 truncate">
                    <Globe className="h-3 w-3 shrink-0" />
                    <a href={c.website} target="_blank" rel="noreferrer" className="hover:text-primary truncate">
                      {c.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-hairline flex items-center justify-between">
                <span className="text-eyebrow text-ink-muted">{t("companies.applications")}</span>
                <span className="text-h3 text-ink tabular-nums">{counts.get(c.id) ?? 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <FormDialog
        open={openCreate}
        onOpenChange={(open) => {
          setOpenCreate(open);
          if (!open) {
            setEditingCompanyId(null);
            setForm({ name: "", industry: "", location: "", website: "", logo_url: "" });
          }
        }}
        title={editingCompanyId ? t("common.edit") : t("companies.new")}
        submitLabel={editingCompanyId ? t("common.save") : t("common.create")}
        onSubmit={async () => {
          if (!form.name.trim()) {
            toast.error(t("common.required"));
            return;
          }
          if (editingCompanyId) {
            await updateMut.mutateAsync();
          } else {
            await createMut.mutateAsync();
          }
        }}
      >
        <Field label={t("companies.form.name")}>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={t("companies.form.namePlaceholder")}
            className={inputCls}
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={t("companies.form.industry")}>
            <input
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
              placeholder={t("companies.form.industryPlaceholder")}
              className={inputCls}
            />
          </Field>
          <Field label={t("companies.form.location")}>
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder={t("companies.form.locationPlaceholder")}
              className={inputCls}
            />
          </Field>
        </div>
        <Field label={t("companies.form.website")}>
          <input
            type="url"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            placeholder={t("companies.form.websitePlaceholder")}
            className={inputCls}
          />
        </Field>
        <Field label="Logo (Optional)">
          <input
            type="file"
            accept="image/*"
            disabled={uploadingLogo}
            onChange={onLogoFileChange}
            className="w-full text-sm text-ink-secondary file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border file:border-hairline file:text-xs file:font-semibold file:bg-surface file:text-ink hover:file:bg-surface-muted cursor-pointer"
          />
          {form.logo_url && (
            <div className="mt-2 flex items-center gap-2">
              <CompanyAvatar name={form.name || "Preview"} logoUrl={form.logo_url} size={32} />
              <button
                type="button"
                onClick={onDeleteLogo}
                className="text-xs font-semibold text-destructive hover:underline cursor-pointer"
              >
                Hapus Logo
              </button>
            </div>
          )}
        </Field>
      </FormDialog>

      <ConfirmDialog
        open={!!confirmId}
        onOpenChange={(v) => !v && setConfirmId(null)}
        loading={deleteMut.isPending}
        onConfirm={() => { if (confirmId) deleteMut.mutate(confirmId); }}
      />

      <ImageCropperDialog
        open={openCropper}
        onOpenChange={setOpenCropper}
        imageSrc={cropperImage || ""}
        onCrop={handleCropSave}
      />
    </AppShell>
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
