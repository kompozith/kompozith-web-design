import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, Plus, Save, Trash2 } from "lucide-react";
import { api, type Project, type StatItem } from "../lib/api";
import BlockEditor from "./BlockEditor";
import ImageField from "./MediaPicker";
import {
  Banner,
  Button,
  Card,
  Field,
  StatusPill,
  inputClass,
  labelClass,
} from "./ui";

const slugify = (input: string): string =>
  input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

type Tab = "content" | "details" | "seo";

export default function ProjectEditor({
  notify,
}: {
  notify: (message: string) => void;
}) {
  const { id = "" } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [tab, setTab] = useState<Tab>("content");

  useEffect(() => {
    api
      .getProject(id)
      .then(({ project: p }) => setProject(p))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load project"),
      );
  }, [id]);

  const patch = useCallback((changes: Partial<Project>) => {
    setProject((prev) => (prev ? { ...prev, ...changes } : prev));
    setDirty(true);
  }, []);

  const save = async (nextStatus?: Project["status"]) => {
    if (!project) return;
    setSaving(true);
    setError(null);
    try {
      const payload = nextStatus ? { ...project, status: nextStatus } : project;
      const { project: saved } = await api.saveProject(project.id, payload);
      setProject(saved);
      setDirty(false);
      notify(
        nextStatus === "published"
          ? "Published"
          : nextStatus === "draft"
            ? "Moved to draft"
            : "Saved",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  // Warn before losing unsaved edits to a browser navigation.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  if (error && !project) {
    return (
      <div className="space-y-5">
        <Banner kind="error" message={error} />
        <Link
          to="/kz-console"
          className="inline-flex items-center gap-2 font-sans text-sm text-[#8A97AC] hover:text-[#F1F5FA]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to projects
        </Link>
      </div>
    );
  }

  if (!project) {
    return (
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#5B6980]">
        Loading…
      </p>
    );
  }

  const setStat = (index: number, changes: Partial<StatItem>) => {
    const stats = [...project.stats];
    stats[index] = { ...stats[index], ...changes };
    patch({ stats });
  };

  return (
    <div className="space-y-6">
      {/* --------------------------------------------------------- toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            to="/kz-console"
            className="rounded-xl border border-white/10 p-2 text-[#8A97AC] transition-colors hover:border-white/25 hover:text-[#F1F5FA]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="truncate font-sans text-xl font-black tracking-tight text-[#F1F5FA]">
                {project.title || "Untitled"}
              </h1>
              <StatusPill status={project.status} />
              {dirty && (
                <span className="font-mono text-[10px] uppercase tracking-wider text-amber-300">
                  unsaved
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate font-mono text-[11px] text-[#5B6980]">
              /work/{project.slug}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {project.status === "published" && (
            <a
              href={`/work/${project.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-white/10 p-2.5 text-[#8A97AC] transition-colors hover:border-white/25 hover:text-[#F1F5FA]"
              title="View live page"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          <Button variant="ghost" onClick={() => save()} loading={saving}>
            <Save className="h-4 w-4" />
            Save
          </Button>
          {project.status === "published" ? (
            <Button variant="subtle" onClick={() => save("draft")}>
              Unpublish
            </Button>
          ) : (
            <Button onClick={() => save("published")}>Publish</Button>
          )}
        </div>
      </div>

      {error && (
        <Banner kind="error" message={error} onDismiss={() => setError(null)} />
      )}

      {/* ------------------------------------------------------------ tabs */}
      <div className="flex gap-1 border-b border-white/8">
        {(
          [
            ["content", "Case study"],
            ["details", "Card & overview"],
            ["seo", "SEO"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`-mb-px border-b-2 px-4 py-2.5 font-sans text-[13px] font-medium transition-colors ${
              tab === key
                ? "border-[#FF6230] text-[#F1F5FA]"
                : "border-transparent text-[#8A97AC] hover:text-[#D9DFEA]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* --------------------------------------------------------- content */}
      {tab === "content" && (
        <div className="space-y-6">
          <Card className="space-y-5 p-5">
            <Field label="Overview" hint="Blank line between paragraphs.">
              <textarea
                value={project.overview}
                onChange={(e) => patch({ overview: e.target.value })}
                className={`${inputClass} min-h-[120px] resize-y leading-relaxed`}
              />
            </Field>
            <Field
              label="Objective"
              hint="Shown as the accented pull-out under the overview."
            >
              <textarea
                value={project.objective}
                onChange={(e) => patch({ objective: e.target.value })}
                className={`${inputClass} min-h-[80px] resize-y leading-relaxed`}
              />
            </Field>
          </Card>

          <div>
            <h2 className="mb-3 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A97AC]">
              Sections
            </h2>
            <BlockEditor
              blocks={project.sections}
              onChange={(sections) => patch({ sections })}
            />
          </div>
        </div>
      )}

      {/* --------------------------------------------------------- details */}
      {tab === "details" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card className="space-y-4 p-5">
            <h2 className={labelClass}>Identity</h2>
            <Field label="Title">
              <input
                value={project.title}
                onChange={(e) => {
                  const title = e.target.value;
                  // Keep the slug in step until the project goes live.
                  patch(
                    project.status === "draft" && !project.publishedAt
                      ? { title, slug: slugify(title) }
                      : { title },
                  );
                }}
                className={inputClass}
              />
            </Field>
            <Field
              label="Slug"
              hint={`Public URL: /work/${project.slug || "…"}`}
            >
              <input
                value={project.slug}
                onChange={(e) => patch({ slug: slugify(e.target.value) })}
                className={inputClass}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Client">
                <input
                  value={project.client}
                  onChange={(e) => patch({ client: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Category">
                <input
                  value={project.category}
                  onChange={(e) => patch({ category: e.target.value })}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label="Card excerpt" hint="Two lines on the Work carousel.">
              <textarea
                value={project.excerpt}
                onChange={(e) => patch({ excerpt: e.target.value })}
                className={`${inputClass} min-h-[70px] resize-y`}
              />
            </Field>
            <Field label="Tagline" hint="Serif italic line under the hero title.">
              <textarea
                value={project.tagline}
                onChange={(e) => patch({ tagline: e.target.value })}
                className={`${inputClass} min-h-[70px] resize-y`}
              />
            </Field>
            <Field label="Live site URL (optional)">
              <input
                value={project.liveUrl}
                onChange={(e) => patch({ liveUrl: e.target.value })}
                placeholder="https://…"
                className={inputClass}
              />
            </Field>
          </Card>

          <div className="space-y-5">
            <Card className="space-y-4 p-5">
              <h2 className={labelClass}>Presentation</h2>
              <ImageField
                label="Cover image"
                value={project.coverImage}
                onChange={(coverImage) => patch({ coverImage })}
                hint="Used on the Work carousel and as the case-study hero."
              />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Accent colour">
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={project.accentColor}
                      onChange={(e) => patch({ accentColor: e.target.value })}
                      className="h-[42px] w-12 shrink-0 cursor-pointer rounded-xl border border-white/10 bg-[#0E1729]"
                    />
                    <input
                      value={project.accentColor}
                      onChange={(e) => patch({ accentColor: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </Field>
                <Field label="Card background">
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={project.cardBg}
                      onChange={(e) => patch({ cardBg: e.target.value })}
                      className="h-[42px] w-12 shrink-0 cursor-pointer rounded-xl border border-white/10 bg-[#0E1729]"
                    />
                    <input
                      value={project.cardBg}
                      onChange={(e) => patch({ cardBg: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </Field>
              </div>
              <label className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={project.featured}
                  onChange={(e) => patch({ featured: e.target.checked })}
                  className="h-4 w-4 accent-[#FF6230]"
                />
                <span className="font-sans text-[13px] text-[#D9DFEA]">
                  Featured project
                </span>
              </label>
            </Card>

            <Card className="space-y-4 p-5">
              <h2 className={labelClass}>Fact sheet</h2>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Industry">
                  <input
                    value={project.meta.industry}
                    onChange={(e) =>
                      patch({
                        meta: { ...project.meta, industry: e.target.value },
                      })
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label="Duration">
                  <input
                    value={project.meta.duration}
                    onChange={(e) =>
                      patch({
                        meta: { ...project.meta, duration: e.target.value },
                      })
                    }
                    className={inputClass}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Timeline">
                  <input
                    value={project.meta.timeline}
                    onChange={(e) =>
                      patch({
                        meta: { ...project.meta, timeline: e.target.value },
                      })
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label="Services" hint="Comma separated.">
                  <input
                    value={project.meta.services.join(", ")}
                    onChange={(e) =>
                      patch({
                        meta: {
                          ...project.meta,
                          services: e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        },
                      })
                    }
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="space-y-2">
                <span className={labelClass}>Headline figures</span>
                {project.stats.map((stat, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={stat.value}
                      onChange={(e) => setStat(i, { value: e.target.value })}
                      placeholder="85,000+"
                      className={`${inputClass} w-1/3`}
                    />
                    <input
                      value={stat.label}
                      onChange={(e) => setStat(i, { label: e.target.value })}
                      placeholder="Active connections"
                      className={inputClass}
                    />
                    <button
                      onClick={() =>
                        patch({
                          stats: project.stats.filter((_, j) => j !== i),
                        })
                      }
                      className="shrink-0 rounded-lg px-2 text-[#5B6980] transition-colors hover:text-rose-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  className="!px-3 !py-1.5 !text-xs"
                  onClick={() =>
                    patch({
                      stats: [...project.stats, { value: "", label: "" }],
                    })
                  }
                >
                  <Plus className="h-3 w-3" />
                  Add figure
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- seo */}
      {tab === "seo" && (
        <Card className="max-w-2xl space-y-4 p-5">
          <Field
            label="Meta title"
            hint="Falls back to the project title when empty."
          >
            <input
              value={project.seoTitle}
              onChange={(e) => patch({ seoTitle: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Meta description">
            <textarea
              value={project.seoDescription}
              onChange={(e) => patch({ seoDescription: e.target.value })}
              className={`${inputClass} min-h-[80px] resize-y`}
            />
          </Field>
          <p className="font-sans text-[11px] leading-relaxed text-[#6B7A93]">
            Created {new Date(project.createdAt).toLocaleString()} · last edited{" "}
            {new Date(project.updatedAt).toLocaleString()}
            {project.publishedAt &&
              ` · first published ${new Date(project.publishedAt).toLocaleDateString()}`}
          </p>
        </Card>
      )}
    </div>
  );
}
