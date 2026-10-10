import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ImageIcon, Upload, X } from "lucide-react";
import { api, type MediaFile } from "../lib/api";
import { Banner, Button, inputClass, labelClass } from "./ui";

/** Reads a File into a base64 data URL for the JSON upload endpoint. */
export function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the file"));
    reader.readAsDataURL(file);
  });
}

export function useMediaUpload() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File): Promise<MediaFile | null> => {
    setBusy(true);
    setError(null);
    try {
      const data = await readAsDataUrl(file);
      const { file: saved } = await api.uploadMedia(data);
      return saved;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      return null;
    } finally {
      setBusy(false);
    }
  };

  return { upload, busy, error, setError };
}

/* ------------------------------------------------------------------ browser */

export function MediaBrowser({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const { upload, busy, error, setError } = useMediaUpload();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api
      .listMedia()
      .then(({ files: list }) => setFiles(list))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed"))
      .finally(() => setLoading(false));
  }, [open, setError]);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const saved = await upload(file);
    if (saved) {
      setFiles((prev) => [saved, ...prev]);
      onSelect(saved.url);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 cursor-pointer bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed inset-x-4 top-[6%] z-50 mx-auto flex max-h-[80vh] max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#111C30] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
              <h3 className="font-sans text-sm font-bold text-[#F1F5FA]">
                Media library
              </h3>
              <div className="flex items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp,image/avif"
                  className="hidden"
                  onChange={(e) => {
                    void handleFile(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                <Button
                  variant="subtle"
                  loading={busy}
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload
                </Button>
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-[#8A97AC] transition-colors hover:text-[#F1F5FA]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {error && <Banner kind="error" message={error} />}
              {loading ? (
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#5B6980]">
                  Loading…
                </p>
              ) : files.length === 0 ? (
                <p className="py-10 text-center font-sans text-sm text-[#8A97AC]">
                  Nothing uploaded yet.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {files.map((file) => (
                    <button
                      key={file.name}
                      onClick={() => {
                        onSelect(file.url);
                        onClose();
                      }}
                      className="group overflow-hidden rounded-xl border border-white/8 bg-[#0E1729] transition-colors hover:border-[#FF6230]"
                    >
                      <img
                        src={file.url}
                        alt={file.name}
                        className="aspect-4/3 w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* -------------------------------------------------------------- image field */

export default function ImageField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
}) {
  const [browsing, setBrowsing] = useState(false);
  const { upload, busy, error } = useMediaUpload();
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-1.5">
      <span className={labelClass}>{label}</span>

      <div className="flex gap-3">
        <div className="flex h-[74px] w-[100px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/8 bg-[#0E1729]">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-5 w-5 text-[#3D4A61]" />
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="/uploads/… or https://…"
            className={inputClass}
          />
          <div className="flex gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp,image/avif"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                const saved = await upload(file);
                if (saved) onChange(saved.url);
              }}
            />
            <Button
              variant="subtle"
              loading={busy}
              onClick={() => fileRef.current?.click()}
              className="!px-3 !py-1.5 !text-xs"
            >
              <Upload className="h-3 w-3" />
              Upload
            </Button>
            <Button
              variant="ghost"
              onClick={() => setBrowsing(true)}
              className="!px-3 !py-1.5 !text-xs"
            >
              Library
            </Button>
            {value && (
              <Button
                variant="ghost"
                onClick={() => onChange("")}
                className="!px-3 !py-1.5 !text-xs"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {hint && (
        <span className="block font-sans text-[11px] text-[#6B7A93]">{hint}</span>
      )}
      {error && <Banner kind="error" message={error} />}

      <MediaBrowser
        open={browsing}
        onClose={() => setBrowsing(false)}
        onSelect={onChange}
      />
    </div>
  );
}
