"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus, Search, Trash2, Edit, X, Loader2, Upload, FileText, Video, Link2,
  CheckCircle2, AlertCircle, GraduationCap, Clock, ExternalLink
} from "lucide-react";
import { addTraining, updateTraining, deleteTraining } from "@/lib/supabase/actions";
import { supabase } from "@/lib/supabase/client";

type TrainingType = "document" | "video" | "link";

const TYPE_META: Record<TrainingType, { icon: any; label: string; classes: string }> = {
  document: { icon: FileText, label: "Document", classes: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
  video: { icon: Video, label: "Video", classes: "bg-purple-500/10 border-purple-500/20 text-purple-400" },
  link: { icon: Link2, label: "Link", classes: "bg-amber-500/10 border-amber-500/20 text-amber-400" },
};

// Per-file upload limit enforced by the app. Note that Supabase Storage ALSO
// enforces its own per-file cap depending on the plan tier (~50MB on the
// free tier, up to 5GB on Pro) — larger videos should use the 'link' type.
const MAX_UPLOAD_BYTES = 150 * 1024 * 1024;

function formatFileSize(bytes: number | null | undefined): string | null {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const emptyForm = {
  title: "",
  description: "",
  type: "document" as TrainingType,
  external_url: "",
  duration_minutes: "" as string | number,
  sort_order: 0,
};

export default function TrainingAdmin() {
  const [trainings, setTrainings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Upload state (direct browser -> Supabase Storage)
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [uploadedName, setUploadedName] = useState<string | null>(null);
  const [uploadedSize, setUploadedSize] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Playlist parts (video type) — many videos per training.
  const [parts, setParts] = useState<any[]>([]);
  const [activeUploads, setActiveUploads] = useState(0);
  const [dragOverParts, setDragOverParts] = useState(false);
  const partsInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState(emptyForm);

  // Self-fetching tab (same pattern as SupportChatAdmin). RLS allows admins.
  const fetchTrainings = useCallback(async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("trainings")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (fetchError) {
      console.error("Error fetching trainings:", fetchError);
      setError(fetchError.message);
    } else {
      setTrainings(data || []);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTrainings();
  }, [fetchTrainings]);

  const resetUpload = () => {
    setUploadedPath(null);
    setUploadedName(null);
    setUploadedSize(null);
    setUploadError(null);
    setIsDragOver(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleOpenForm = async (training: any = null) => {
    resetUpload();
    setError(null);
    if (training) {
      setEditingTraining(training);
      setFormData({
        title: training.title,
        description: training.description || "",
        type: training.type,
        external_url: training.external_url || "",
        duration_minutes: training.duration_minutes ?? "",
        sort_order: training.sort_order ?? 0,
      });
      // Keep the existing file unless the admin replaces it.
      setUploadedPath(training.file_path || null);
      setUploadedName(training.file_name || null);
      setUploadedSize(training.file_size ?? null);

      // Load the existing playlist parts (video type).
      setParts([]);
      const { data: partsData, error: partsError } = await supabase
        .from("training_parts")
        .select("*")
        .eq("training_id", training.id)
        .order("position", { ascending: true });
      if (partsError && partsError.code !== "PGRST202") {
        console.error("Error loading training parts:", partsError);
      }
      setParts(
        ((partsData || []) as any[]).map((p) => ({
          ...p,
          duration_minutes: p.duration_minutes ?? "",
        }))
      );
    } else {
      setEditingTraining(null);
      setFormData(emptyForm);
      setParts([]);
    }
    setIsFormOpen(true);
  };

  // Uploads go straight from the browser to the private 'trainings' bucket.
  // This bypasses the server-action body-size limit (~1MB) so large files
  // work; the RLS "Admins upload training files" policy authorizes it.
  const uploadFile = async (selected: File) => {
    if (selected.size > MAX_UPLOAD_BYTES) {
      setUploadError(
        `File is too large (${formatFileSize(selected.size)}). Max direct upload is 150 MB — for long videos use the Link type (YouTube/Vimeo).`
      );
      return;
    }
    setUploadError(null);
    setIsUploading(true);
    try {
      const ext = selected.name.split(".").pop() || "bin";
      const path = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
      const { error: upError } = await supabase.storage
        .from("trainings")
        .upload(path, selected, { upsert: false });
      if (upError) throw upError;
      setUploadedPath(path);
      setUploadedName(selected.name);
      setUploadedSize(selected.size);
    } catch (err: any) {
      console.error("Training file upload failed:", err);
      setUploadError(err.message || "Upload failed. Check your connection and try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) uploadFile(selected);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) uploadFile(dropped);
  };

  // ---- Playlist parts (video type): many videos per training ----

  const uploadPartFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    for (const file of files) {
      if (file.size > MAX_UPLOAD_BYTES) {
        setUploadError(
          `"${file.name}" is too large (${formatFileSize(file.size)}). Max is 150 MB per video — use the Link type for longer videos.`
        );
        continue;
      }
      setActiveUploads((n) => n + 1);
      try {
        const ext = file.name.split(".").pop() || "bin";
        const path = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
        const { error: upError } = await supabase.storage
          .from("trainings")
          .upload(path, file, { upsert: false });
        if (upError) throw upError;
        setParts((list) => [
          ...list,
          {
            file_path: path,
            file_name: file.name,
            file_size: file.size,
            title: file.name.replace(/\.[^.]+$/, ""),
            duration_minutes: "",
          },
        ]);
      } catch (err: any) {
        console.error("Playlist part upload failed:", err);
        setUploadError(`Upload failed for "${file.name}": ${err.message || "unknown error"}`);
      } finally {
        setActiveUploads((n) => n - 1);
      }
    }
  };

  const removePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const movePart = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= parts.length) return;
    const next = [...parts];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    setParts(next);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this training? Its file will also be removed from storage.")) return;
    setIsDeleting(id);
    const res = await deleteTraining(id);
    if (res.success) {
      setTrainings((list) => list.filter((t) => t.id !== id));
    } else {
      alert("Error: " + res.error);
    }
    setIsDeleting(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (formData.type === "link" && !formData.external_url.trim()) {
      setError("An external URL is required for the Link type.");
      return;
    }
    if (formData.type === "document" && !uploadedPath) {
      setError("Please upload the document file.");
      return;
    }
    if (formData.type === "video" && parts.length === 0) {
      setError("Please upload at least one video for the playlist.");
      return;
    }
    if (activeUploads > 0) {
      setError("Please wait for the current uploads to finish.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Parent row: for video playlists the content lives in training_parts,
    // so the parent's own file fields are cleared.
    const submission: any = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      type: formData.type,
      file_path: formData.type === "document" ? uploadedPath : null,
      file_name: formData.type === "document" ? uploadedName : null,
      file_size: formData.type === "document" ? uploadedSize : null,
      external_url: formData.type === "link" ? formData.external_url.trim() : null,
      duration_minutes: formData.duration_minutes === "" ? null : Number(formData.duration_minutes),
      sort_order: Number(formData.sort_order) || 0,
      parts:
        formData.type === "video"
          ? parts.map((p: any) => ({
              title: (p.title || "").trim() || null,
              file_path: p.file_path || null,
              external_url: p.external_url || null,
              file_name: p.file_name || null,
              file_size: p.file_size ?? null,
              duration_minutes:
                p.duration_minutes === "" || p.duration_minutes == null
                  ? null
                  : Number(p.duration_minutes),
            }))
          : [],
    };

    const res = editingTraining
      ? await updateTraining(editingTraining.id, submission)
      : await addTraining(submission);

    if (res.success) {
      setIsFormOpen(false);
      resetUpload();
      fetchTrainings();
    } else {
      setError(res.error || "Something went wrong.");
    }
    setIsSubmitting(false);
  };

  const filtered = trainings.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            Training Library
            <div className="p-2 bg-red-500/10 rounded-xl border border-red-500/20">
              <GraduationCap size={22} className="text-red-500" />
            </div>
          </h3>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Premium content exclusive to the Partner plan · {trainings.length} module{trainings.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search trainings..."
              className="bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition-colors w-56"
            />
          </div>
          <button
            onClick={() => handleOpenForm()}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-2xl text-sm font-bold shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_40px_rgba(239,68,68,0.7)] transition-all"
          >
            <Plus size={16} /> New Training
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-2 text-sm text-red-400">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 size={40} className="text-red-500 animate-spin mb-4" />
          <p className="text-sm text-gray-500">Loading training library...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-16 text-center">
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="text-red-500" size={28} />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">
            {trainings.length === 0 ? "No training modules yet" : "No results"}
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6">
            {trainings.length === 0
              ? "Create your first training module — documents, videos or external links for your Partner-plan users."
              : "No trainings match your search."}
          </p>
          {trainings.length === 0 && (
            <button
              onClick={() => handleOpenForm()}
              className="px-6 py-3 bg-red-500 text-white rounded-2xl text-sm font-bold shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_40px_rgba(239,68,68,0.7)] transition-all inline-flex items-center gap-2"
            >
              <Plus size={16} /> Create Training
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((training) => {
            const meta = TYPE_META[training.type as TrainingType] || TYPE_META.document;
            const TypeIcon = meta.icon;
            return (
              <div
                key={training.id}
                className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col hover:border-white/20 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-2xl border ${meta.classes}`}>
                    <TypeIcon size={22} />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenForm(training)}
                      className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(training.id)}
                      disabled={isDeleting === training.id}
                      className="p-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {isDeleting === training.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>

                <span className={`self-start text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${meta.classes} mb-3`}>
                  {meta.label}
                </span>

                <h4 className="text-base font-bold text-white mb-2 line-clamp-1">{training.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-4 min-h-[2.4em]">
                  {training.description || "No description."}
                </p>

                <div className="mt-auto pt-4 border-t border-white/5 space-y-1.5">
                  {training.file_name ? (
                    <p className="text-[11px] text-gray-500 truncate flex items-center gap-2">
                      <FileText size={12} className="shrink-0" /> {training.file_name}
                      {formatFileSize(training.file_size) && (
                        <span className="text-gray-600">({formatFileSize(training.file_size)})</span>
                      )}
                    </p>
                  ) : training.external_url ? (
                    <a
                      href={training.external_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-gray-500 hover:text-red-400 truncate flex items-center gap-2 transition-colors"
                    >
                      <ExternalLink size={12} className="shrink-0" /> {training.external_url}
                    </a>
                  ) : null}
                  <div className="flex items-center gap-4 text-[11px] text-gray-600">
                    {training.duration_minutes ? (
                      <span className="flex items-center gap-1.5">
                        <Clock size={12} /> {training.duration_minutes} min
                      </span>
                    ) : null}
                    <span>Order: {training.sort_order ?? 0}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsFormOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
          />

          <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-[0_40px_80px_rgba(0,0,0,0.8)]">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 sticky top-0 bg-[#0a0a0a] z-10">
              <h3 className="text-lg font-black text-white">
                {editingTraining ? "Edit Training" : "New Training"}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* TITLE */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Title *</label>
                <input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. How to negotiate with 1688 suppliers"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-colors"
                />
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What will your Partner users learn?"
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-colors resize-none"
                />
              </div>

              {/* TYPE SELECTOR */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Content Type *</label>
                <div className="grid grid-cols-3 gap-3">
                  {(Object.keys(TYPE_META) as TrainingType[]).map((key) => {
                    const meta = TYPE_META[key];
                    const TypeIcon = meta.icon;
                    const active = formData.type === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          resetUpload();
                          setFormData({ ...formData, type: key });
                        }}
                        className={`
                          flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all
                          ${active
                            ? "bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.15)]"
                            : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-white"}
                        `}
                      >
                        <TypeIcon size={22} />
                        <span className="text-xs font-bold">{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* FILE UPLOAD (document — single file) */}
              {formData.type === "document" && (
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                    File * <span className="normal-case font-medium text-gray-600">(up to 150 MB)</span>
                  </label>
                  <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileInput}
                  />

                  {uploadedPath ? (
                    <div className="flex items-center justify-between gap-4 p-4 bg-green-500/5 border border-green-500/20 rounded-2xl">
                      <div className="flex items-center gap-3 min-w-0">
                        <CheckCircle2 size={20} className="text-green-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">{uploadedName}</p>
                          {formatFileSize(uploadedSize) && (
                            <p className="text-[11px] text-gray-500">{formatFileSize(uploadedSize)} · uploaded to private storage</p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={resetUpload}
                        className="p-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                        title="Remove file"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => !isUploading && fileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                      }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={handleDrop}
                      className={`
                        border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
                        ${isDragOver
                          ? "border-red-500/60 bg-red-500/10"
                          : "border-white/10 bg-white/[0.02] hover:border-red-500/50 hover:bg-red-500/5"}
                        ${isUploading ? "pointer-events-none opacity-80" : ""}
                      `}
                    >
                      {isUploading ? (
                        <div className="flex flex-col items-center py-2">
                          <Loader2 className="text-red-500 animate-spin mb-3" size={28} />
                          <p className="text-sm font-medium text-white">Uploading to secure storage...</p>
                          <p className="text-[11px] text-gray-500 mt-1">Large files may take a moment</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-3">
                            <Upload className="text-red-500" size={22} />
                          </div>
                          <p className="text-sm font-bold text-white">
                            Drop your document here, or click to browse
                          </p>
                          <p className="text-[11px] text-gray-500 mt-1">PDF, DOCX, PPTX... up to 150 MB</p>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}

              {/* VIDEO PLAYLIST (many videos, up to 150 MB each) */}
              {formData.type === "video" && (
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                    Videos * <span className="normal-case font-medium text-gray-600">(playlist — up to 150 MB per video)</span>
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="video/*"
                    className="hidden"
                    ref={partsInputRef}
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files) uploadPartFiles(files);
                      e.target.value = "";
                    }}
                  />

                  <div
                    onClick={() => activeUploads === 0 && partsInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverParts(true);
                    }}
                    onDragLeave={() => setDragOverParts(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverParts(false);
                      if (e.dataTransfer.files?.length) uploadPartFiles(e.dataTransfer.files);
                    }}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                      dragOverParts
                        ? "border-red-500/60 bg-red-500/10"
                        : "border-white/10 bg-white/[0.02] hover:border-red-500/50 hover:bg-red-500/5"
                    } ${activeUploads > 0 ? "pointer-events-none opacity-80" : ""}`}
                  >
                    {activeUploads > 0 ? (
                      <div className="flex flex-col items-center py-2">
                        <Loader2 className="text-red-500 animate-spin mb-2" size={24} />
                        <p className="text-sm font-medium text-white">
                          Uploading {activeUploads} video{activeUploads > 1 ? "s" : ""}...
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="w-11 h-11 rounded-full bg-red-500/10 flex items-center justify-center mb-2">
                          <Upload className="text-red-500" size={20} />
                        </div>
                        <p className="text-sm font-bold text-white">Drop videos here, or click to browse</p>
                        <p className="text-[11px] text-gray-500 mt-1">
                          Add many videos — they play as a playlist · up to 150 MB each
                        </p>
                      </div>
                    )}
                  </div>

                  {parts.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {parts.map((part: any, i: number) => (
                        <div
                          key={part.file_path || part.id || i}
                          className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-2xl"
                        >
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              onClick={() => movePart(i, -1)}
                              disabled={i === 0}
                              className="p-1 text-gray-500 hover:text-white disabled:opacity-20 transition-colors leading-none"
                              title="Move up"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => movePart(i, 1)}
                              disabled={i === parts.length - 1}
                              className="p-1 text-gray-500 hover:text-white disabled:opacity-20 transition-colors leading-none"
                              title="Move down"
                            >
                              ↓
                            </button>
                          </div>
                          <span className="w-6 text-center text-[11px] font-black text-red-500 shrink-0">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <div className="flex-1 min-w-0">
                            <input
                              value={part.title || ""}
                              onChange={(e) =>
                                setParts(
                                  parts.map((p: any, pi: number) =>
                                    pi === i ? { ...p, title: e.target.value } : p
                                  )
                                )
                              }
                              placeholder={`Part ${i + 1} title`}
                              className="w-full bg-transparent text-sm font-bold text-white placeholder-gray-600 focus:outline-none border-b border-transparent focus:border-red-500/30 py-0.5"
                            />
                            <p className="text-[10px] text-gray-500 truncate">
                              {part.file_name}
                              {part.file_size ? ` · ${formatFileSize(part.file_size)}` : ""}
                              {part.id ? " · saved" : " · new"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removePart(i)}
                            className="p-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                            title="Remove"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      <p className="text-[10px] text-gray-600 text-center">
                        {parts.length} video{parts.length === 1 ? "" : "s"} in the playlist · reorder with ↑ ↓
                      </p>
                    </div>
                  )}
                </div>
              )}

              {(formData.type === "document" || formData.type === "video") && uploadError && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-xs text-red-400">
                  <AlertCircle size={14} className="shrink-0" /> {uploadError}
                </div>
              )}

              {/* EXTERNAL URL (link) */}
              {formData.type === "link" && (
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">External URL *</label>
                  <input
                    value={formData.external_url}
                    onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
                    placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-colors"
                  />
                  <p className="text-[11px] text-gray-600 mt-2">
                    Opens in a new tab. Unlisted YouTube/Vimeo videos are recommended for long courses.
                  </p>
                </div>
              )}

              {/* DURATION + SORT ORDER */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Duration (min)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                    placeholder="e.g. 25"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Sort Order</label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-colors"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-xs text-red-400">
                  <AlertCircle size={14} className="shrink-0" /> {error}
                </div>
              )}

              {/* ACTIONS */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-3 text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 rounded-2xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="px-6 py-3 bg-red-500 text-white rounded-2xl text-sm font-bold shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_40px_rgba(239,68,68,0.7)] transition-all disabled:opacity-50 disabled:shadow-none inline-flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {editingTraining ? "Save Changes" : "Publish Training"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

