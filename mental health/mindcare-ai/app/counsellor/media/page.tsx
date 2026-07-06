"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "../../lib/i18n";

interface MediaFile {
  name: string;
  path: string;
  url: string;
  createdAt: string;
  size: number;
}

export default function MediaViewerPage() {
  const { t } = useTranslation();
  const [audioFiles, setAudioFiles] = useState<MediaFile[]>([]);
  const [videoFiles, setVideoFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"audio" | "video">("audio");

  useEffect(() => {
    Promise.all([
      fetch("/api/media?type=audio").then((r) => r.ok ? r.json() : { files: [] }),
      fetch("/api/media?type=video").then((r) => r.ok ? r.json() : { files: [] }),
    ]).then(([audio, video]) => {
      setAudioFiles(audio.files || []);
      setVideoFiles(video.files || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin text-[24px] mr-2">progress_activity</span>
        {t("counsellor.media.loading")}
      </div>
    );
  }

  const files = activeTab === "audio" ? audioFiles : videoFiles;

  return (
    <div className="p-4 md:p-8 max-w-[1000px] mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-on-surface">{t("counsellor.media.title")}</h1>
        <p className="text-on-surface-variant mt-1">{t("counsellor.media.subtitle")}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("audio")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "audio"
              ? "bg-primary text-on-primary"
              : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          <span className="material-symbols-outlined text-[16px] mr-1 align-middle">mic</span>
          {t("counsellor.media.audio")} ({audioFiles.length})
        </button>
        <button
          onClick={() => setActiveTab("video")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "video"
              ? "bg-primary text-on-primary"
              : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          <span className="material-symbols-outlined text-[16px] mr-1 align-middle">videocam</span>
          {t("counsellor.media.video")} ({videoFiles.length})
        </button>
      </div>

      {/* File List */}
      {files.length === 0 ? (
        <div className="text-center py-16 text-on-surface-variant">
          <span className="material-symbols-outlined text-[48px] opacity-30 block mb-3">
            {activeTab === "audio" ? "mic_off" : "videocam_off"}
          </span>
          <p className="text-sm">No {activeTab} files uploaded yet.</p>
          <p className="text-xs mt-1 opacity-70">Students can record audio or upload video during PHQ-9 screening.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {files.map((file) => (
            <div key={file.path} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-primary-container text-[20px]">
                    {activeTab === "audio" ? "graphic_eq" : "play_circle"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-on-surface truncate">{file.name}</p>
                  <p className="text-xs text-on-surface-variant">
                    {file.createdAt ? new Date(file.createdAt).toLocaleString() : "Unknown date"}
                  </p>
                </div>
              </div>

              {activeTab === "audio" ? (
                <audio controls className="w-full h-10" preload="metadata">
                  <source src={file.url} />
                  Your browser does not support audio.
                </audio>
              ) : (
                <video controls className="w-full rounded-lg bg-black" preload="metadata">
                  <source src={file.url} />
                  Your browser does not support video.
                </video>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
