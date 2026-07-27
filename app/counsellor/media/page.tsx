"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "../../lib/i18n";

interface MediaFile {
  name: string;
  path: string;
  url: string;
  createdAt: string;
  size: number;
  studentId?: string;
}

export default function MediaViewerPage() {
  const { t } = useTranslation();
  const [audioFiles, setAudioFiles] = useState<MediaFile[]>([]);
  const [videoFiles, setVideoFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"audio" | "video">("audio");
  const [recentNotifs, setRecentNotifs] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/media?type=audio").then((r) => r.ok ? r.json() : { files: [] }),
      fetch("/api/media?type=video").then((r) => r.ok ? r.json() : { files: [] }),
      fetch("/api/notifications?userId=counsellor-system").then((r) => r.ok ? r.json() : { notifications: [] }),
    ]).then(([audio, video, notifs]) => {
      const enrich = (files: any[]) => files.map(f => {
        const parts = f.path?.split("/");
        return { ...f, studentId: parts?.[1] || "" };
      });
      setAudioFiles(enrich(audio.files || []));
      setVideoFiles(enrich(video.files || []));
      const mediaNotifs = (notifs.notifications || []).filter((n: any) =>
        n.title?.includes("Voice") || n.title?.includes("Video") || n.title?.includes("🎤") || n.title?.includes("🎥")
      );
      setRecentNotifs(mediaNotifs.slice(0, 10));
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
        <p className="text-on-surface-variant mt-1">Audio and video files shared by students from their portal.</p>
      </div>

      {recentNotifs.length > 0 && (
        <div className="bg-secondary-container/10 border border-secondary/20 rounded-xl p-4">
          <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[18px]">new_releases</span>
            Recently Shared ({recentNotifs.length})
          </h3>
          <div className="space-y-2">
            {recentNotifs.map((n: any) => (
              <div key={n.id} className="flex items-start gap-3 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px] text-secondary mt-0.5 shrink-0">
                  {n.title?.includes("Voice") || n.title?.includes("🎤") ? "mic" : "videocam"}
                </span>
                <div>
                  <p className="font-medium text-on-surface">{n.title}</p>
                  <p className="text-[10px] mt-0.5">{new Date(n.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {(["audio", "video"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`}>
            <span className="material-symbols-outlined text-[16px] mr-1 align-middle">{tab === "audio" ? "mic" : "videocam"}</span>
            {tab === "audio" ? t("counsellor.media.audio") : t("counsellor.media.video")} ({tab === "audio" ? audioFiles.length : videoFiles.length})
          </button>
        ))}
      </div>

      {files.length === 0 ? (
        <div className="text-center py-16 text-on-surface-variant">
          <span className="material-symbols-outlined text-[48px] opacity-30 block mb-3">{activeTab === "audio" ? "mic_off" : "videocam_off"}</span>
          <p className="text-sm">No {activeTab} files uploaded yet.</p>
          <p className="text-xs mt-1 opacity-70">Students can record audio or upload video from their dashboard.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {files.map((file) => (
            <div key={file.path} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-primary-container text-[20px]">{activeTab === "audio" ? "graphic_eq" : "play_circle"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-on-surface truncate">{file.name}</p>
                  <p className="text-xs text-on-surface-variant">{file.createdAt ? new Date(file.createdAt).toLocaleString() : "Unknown date"}</p>
                  {file.studentId && <p className="text-[10px] text-primary font-medium">Student: {file.studentId.slice(0,8)}...</p>}
                </div>
              </div>
              {activeTab === "audio" ? (
                <audio controls className="w-full h-10" preload="metadata"><source src={file.url} /></audio>
              ) : (
                <video controls className="w-full rounded-lg bg-black max-h-48" preload="metadata"><source src={file.url} /></video>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
