import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, Trash2, Upload } from "lucide-react";
import { api, type MediaFile } from "../lib/api";
import { useMediaUpload } from "./MediaPicker";
import { Banner, Button, Card, SectionTitle } from "./ui";

const humanSize = (bytes: number): string =>
  bytes > 1_048_576
    ? `${(bytes / 1_048_576).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export default function MediaLibrary({
  notify,
}: {
  notify: (message: string) => void;
}) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const { upload, busy, error: uploadError } = useMediaUpload();
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const { files: list } = await api.listMedia();
      setFiles(list);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load media");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    for (const file of Array.from(fileList)) {
      const saved = await upload(file);
      if (saved) setFiles((prev) => [saved, ...prev]);
    }
    notify("Upload complete");
  };

  const copy = async (url: string) => {
    await navigator.clipboard.writeText(url).catch(() => undefined);
    setCopied(url);
    setTimeout(() => setCopied(null), 1600);
  };

  const remove = async (name: string) => {
    try {
      await api.deleteMedia(name);
      setFiles((prev) => prev.filter((f) => f.name !== name));
      setConfirmDelete(null);
      notify("File deleted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete file");
    }
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        eyebrow="Assets"
        title="Media"
        action={
          <>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/gif,image/webp,image/avif"
              className="hidden"
              onChange={(e) => {
                void handleUpload(e.target.files);
                e.target.value = "";
              }}
            />
            <Button loading={busy} onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" />
              Upload images
            </Button>
          </>
        }
      />

      {(error || uploadError) && (
        <Banner
          kind="error"
          message={error ?? uploadError ?? ""}
          onDismiss={() => setError(null)}
        />
      )}

      <p className="font-sans text-[13px] text-[#6B7A93]">
        PNG, JPEG, GIF, WebP and AVIF up to 8 MB. Files are renamed on upload
        and served from <code className="font-mono text-[#8A97AC]">/uploads</code>.
      </p>

      {loading ? (
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#5B6980]">
          Loading…
        </p>
      ) : files.length === 0 ? (
        <Card className="px-6 py-16 text-center">
          <p className="font-sans text-sm text-[#8A97AC]">
            No uploads yet. Images referenced by URL still work everywhere.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {files.map((file) => (
            <Card key={file.name} className="overflow-hidden">
              <div className="aspect-4/3 bg-[#0E1729]">
                <img
                  src={file.url}
                  alt={file.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="space-y-2 px-3 py-2.5">
                <p className="truncate font-mono text-[10px] text-[#5B6980]">
                  {humanSize(file.size)} ·{" "}
                  {new Date(file.uploadedAt).toLocaleDateString()}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => copy(file.url)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/6 py-1.5 font-sans text-[11px] text-[#D9DFEA] transition-colors hover:bg-white/12"
                  >
                    {copied === file.url ? (
                      <>
                        <Check className="h-3 w-3" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" /> Copy URL
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(file.name)}
                    className="rounded-lg p-1.5 text-[#5B6980] transition-colors hover:text-rose-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {confirmDelete === file.name && (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="flex-1 rounded-lg bg-white/6 py-1.5 font-sans text-[11px] text-[#D9DFEA]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => remove(file.name)}
                      className="flex-1 rounded-lg bg-rose-500/15 py-1.5 font-sans text-[11px] text-rose-300"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
