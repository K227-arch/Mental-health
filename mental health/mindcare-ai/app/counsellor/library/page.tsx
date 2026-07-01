"use client";

import { useState, useEffect } from "react";
import clsx from "clsx";

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  content_url: string | null;
  read_time: string;
  assigned_to: string | null;
  created_at: string;
}

interface StudentOption {
  id: string;
  name: string;
}

const categories = ["All", "CBT", "Mindfulness", "Sleep", "Anxiety", "Depression", "Self-Care", "General"];
const typeOptions = ["article", "video", "exercise", "worksheet", "guide"];

const categoryColors: Record<string, string> = {
  CBT: "bg-primary-container text-on-primary-container",
  Mindfulness: "bg-secondary-container text-on-secondary-container",
  Sleep: "bg-surface-container-highest text-on-surface",
  Anxiety: "bg-error-container text-on-error-container",
  Depression: "bg-primary-fixed text-on-primary-fixed",
  "Self-Care": "bg-secondary-fixed text-on-secondary-fixed",
  General: "bg-surface-container-high text-on-surface",
};

const typeIcons: Record<string, string> = {
  article: "article",
  video: "play_circle",
  exercise: "self_improvement",
  worksheet: "assignment",
  guide: "menu_book",
};

export default function CounsellorLibrary() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState<Resource | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // New resource form
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("General");
  const [newType, setNewType] = useState("article");
  const [newUrl, setNewUrl] = useState("");
  const [newReadTime, setNewReadTime] = useState("5 min");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Share form
  const [shareStudent, setShareStudent] = useState("");

  useEffect(() => {
    fetchResources();
    // Fetch students for sharing
    fetch("/api/counsellor/students")
      .then((r) => r.ok ? r.json() : { students: [] })
      .then((data) => {
        setStudents((data.students || []).map((s: any) => ({ id: s.id, name: s.name })));
      });
  }, []);

  const fetchResources = () => {
    fetch(`/api/resources${category !== "All" ? `?category=${category}` : ""}`)
      .then((r) => r.ok ? r.json() : { resources: [] })
      .then((data) => { setResources(data.resources || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchResources(); }, [category]);

  const filtered = resources.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    setSaving(true);

    let contentUrl = newUrl || null;

    // Upload file if selected
    if (newFile) {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", newFile);
      formData.append("userId", "library");
      formData.append("type", newType);

      try {
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          contentUrl = uploadData.url || uploadData.key;
        }
      } catch {
        // If upload fails, continue without file
      }
      setUploading(false);
    }

    const res = await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle,
        description: newDescription,
        category: newCategory,
        type: newType,
        contentUrl,
        readTime: newReadTime,
      }),
    });

    if (res.ok) {
      setShowAddModal(false);
      setNewTitle(""); setNewDescription(""); setNewUrl(""); setNewFile(null);
      setFeedback("Resource added successfully.");
      fetchResources();
      setTimeout(() => setFeedback(null), 3000);
    }
    setSaving(false);
  };

  const handleShare = async () => {
    if (!shareStudent || !showShareModal) return;
    setSaving(true);

    // Update the existing resource to assign it to the student (no duplication)
    const res = await fetch("/api/resources", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: showShareModal.id,
        assignedTo: shareStudent,
      }),
    });

    if (res.ok) {
      // Update local state
      setResources((prev) =>
        prev.map((r) => r.id === showShareModal.id ? { ...r, assigned_to: shareStudent } : r)
      );
      setShowShareModal(null);
      setShareStudent("");
      setFeedback("Resource shared with student. They'll be notified.");
      setTimeout(() => setFeedback(null), 3000);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/resources?id=${id}`, { method: "DELETE" });
    setResources((prev) => prev.filter((r) => r.id !== id));
    setFeedback("Resource removed.");
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="p-4 md:p-8 max-w-[1100px] mx-auto space-y-6">
      {/* Feedback Toast */}
      {feedback && (
        <div className="fixed top-20 right-6 z-50 bg-secondary-container text-on-secondary-container px-5 py-3 rounded-xl shadow-lg animate-fade-in flex items-center gap-2 text-sm font-medium">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          {feedback}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Wellness Library</h1>
          <p className="text-on-surface-variant mt-1">Manage and share resources with students.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Resource
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources..."
            className="w-full pl-11 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm text-on-surface focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={clsx(
                "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border",
                category === cat
                  ? "bg-primary text-on-primary border-primary"
                  : "bg-surface-container border-outline-variant text-on-surface-variant hover:bg-surface-container-high"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Resource Grid */}
      {loading ? (
        <div className="text-center py-16 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-[24px]">progress_activity</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-on-surface-variant">
          <span className="material-symbols-outlined text-[48px] opacity-30 block mb-2">library_books</span>
          <p className="text-sm">No resources found. Add one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((resource) => (
            <div
              key={resource.id}
              className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <span className={clsx("text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-semibold", categoryColors[resource.category] || categoryColors["General"])}>
                  {resource.category}
                </span>
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant/60">{typeIcons[resource.type] || "article"}</span>
              </div>
              <h3 className="text-sm font-bold text-on-surface mb-2 leading-snug">{resource.title}</h3>
              <p className="text-xs text-on-surface-variant mb-4 flex-1 leading-relaxed">{resource.description}</p>
              {resource.assigned_to && (
                <div className="text-[10px] text-secondary font-medium mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">person</span>
                    Shared with student
                  </span>
                  {resource.content_url && (
                    <a
                      href={resource.content_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-0.5 text-primary hover:underline"
                    >
                      Open
                      <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                    </a>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between pt-3 border-t border-outline-variant">
                <span className="text-[10px] text-outline flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">schedule</span>
                  {resource.read_time}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowShareModal(resource)}
                    className="text-xs font-semibold text-secondary hover:underline flex items-center gap-0.5"
                    title="Share with student"
                  >
                    <span className="material-symbols-outlined text-[14px]">share</span>
                    Share
                  </button>
                  {!resource.assigned_to && resource.content_url && (
                    <a
                      href={resource.content_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5"
                    >
                      Open
                      <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(resource.id)}
                    className="text-xs text-error hover:underline"
                    title="Delete"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Resource Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 w-full max-w-md shadow-xl animate-fade-in">
            <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">add_circle</span>
              Add Resource
            </h2>

            <div className="space-y-3">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Resource title"
                className="w-full px-4 py-2.5 bg-surface border border-outline-variant/50 rounded-xl text-sm text-on-surface focus:ring-2 focus:ring-primary/30 outline-none"
              />
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Description"
                rows={3}
                className="w-full px-4 py-2.5 bg-surface border border-outline-variant/50 rounded-xl text-sm text-on-surface focus:ring-2 focus:ring-primary/30 outline-none resize-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="px-3 py-2.5 bg-surface border border-outline-variant/50 rounded-xl text-sm text-on-surface focus:ring-2 focus:ring-primary/30 outline-none"
                >
                  {categories.filter((c) => c !== "All").map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="px-3 py-2.5 bg-surface border border-outline-variant/50 rounded-xl text-sm text-on-surface focus:ring-2 focus:ring-primary/30 outline-none"
                >
                  {typeOptions.map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="Content URL (optional — or upload a file below)"
                className="w-full px-4 py-2.5 bg-surface border border-outline-variant/50 rounded-xl text-sm text-on-surface focus:ring-2 focus:ring-primary/30 outline-none"
              />

              {/* File Upload */}
              <div className="border-2 border-dashed border-outline-variant/50 rounded-xl p-4 text-center hover:border-primary/30 transition-colors">
                {newFile ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-on-surface">
                      <span className="material-symbols-outlined text-primary text-[20px]">attach_file</span>
                      <span className="truncate max-w-[200px]">{newFile.name}</span>
                      <span className="text-xs text-on-surface-variant">({(newFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                    </div>
                    <button
                      onClick={() => setNewFile(null)}
                      className="text-error text-xs hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-on-surface-variant/50 text-[32px]">cloud_upload</span>
                    <span className="text-xs text-on-surface-variant">
                      Upload a file (PDF, video, audio, image)
                    </span>
                    <span className="text-[10px] text-on-surface-variant/60">
                      Max 50MB · Supports all formats
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.mp4,.webm,.mp3,.wav,.ogg,.png,.jpg,.jpeg,.gif"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setNewFile(file);
                      }}
                    />
                  </label>
                )}
              </div>

              <input
                type="text"
                value={newReadTime}
                onChange={(e) => setNewReadTime(e.target.value)}
                placeholder="Read time (e.g. 5 min)"
                className="w-full px-4 py-2.5 bg-surface border border-outline-variant/50 rounded-xl text-sm text-on-surface focus:ring-2 focus:ring-primary/30 outline-none"
              />
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 border border-outline-variant rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!newTitle.trim() || saving || uploading}
                className="flex-1 px-4 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {uploading ? "Uploading file..." : saving ? "Saving..." : "Add Resource"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 w-full max-w-sm shadow-xl animate-fade-in">
            <h2 className="text-lg font-bold text-on-surface mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[22px]">share</span>
              Share Resource
            </h2>
            <p className="text-xs text-on-surface-variant mb-4">
              Share &quot;{showShareModal.title}&quot; with a student. They&apos;ll receive a notification.
            </p>

            <select
              value={shareStudent}
              onChange={(e) => setShareStudent(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface border border-outline-variant/50 rounded-xl text-sm text-on-surface focus:ring-2 focus:ring-primary/30 outline-none mb-4"
            >
              <option value="">Select a student...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowShareModal(null); setShareStudent(""); }}
                className="flex-1 px-4 py-2.5 border border-outline-variant rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                disabled={!shareStudent || saving}
                className="flex-1 px-4 py-2.5 bg-secondary text-on-secondary rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {saving ? "Sharing..." : "Share"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
