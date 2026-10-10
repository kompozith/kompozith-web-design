import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { api, type ProjectSummary } from "../lib/api";
import { Banner, Button, Card, SectionTitle, StatusPill } from "./ui";

interface Overview {
  counts: { total: number; published: number; drafts: number };
  recentActivity: { id: string; at: string; event: string; detail: string }[];
}

const relative = (iso: string): string => {
  const diff = Date.now() - Date.parse(iso);
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
};

export default function Dashboard({
  notify,
}: {
  notify: (message: string) => void;
}) {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const [list, stats] = await Promise.all([
        api.listProjects(),
        api.overview(),
      ]);
      setProjects(list.projects);
      setOverview(stats);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const createProject = async () => {
    setPendingId("new");
    try {
      const { project } = await api.createProject({
        title: "Untitled project",
        category: "New work",
      });
      navigate(`/kz-console/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create project");
    } finally {
      setPendingId(null);
    }
  };

  const toggleStatus = async (project: ProjectSummary) => {
    setPendingId(project.id);
    try {
      const next = project.status === "published" ? "draft" : "published";
      await api.setProjectStatus(project.id, next);
      notify(next === "published" ? "Project published" : "Moved to draft");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update status");
    } finally {
      setPendingId(null);
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= projects.length) return;
    const reordered = [...projects];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setProjects(reordered);
    try {
      await api.reorderProjects(reordered.map((p) => p.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reorder");
      await load();
    }
  };

  const remove = async (project: ProjectSummary) => {
    setPendingId(project.id);
    try {
      await api.deleteProject(project.id);
      notify(`Deleted “${project.title}”`);
      setConfirmDelete(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete project");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <SectionTitle
        eyebrow="Content"
        title="Projects"
        action={
          <Button onClick={createProject} loading={pendingId === "new"}>
            <Plus className="h-4 w-4" />
            New project
          </Button>
        }
      />

      {error && (
        <Banner kind="error" message={error} onDismiss={() => setError(null)} />
      )}

      {overview && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total", value: overview.counts.total },
            { label: "Live", value: overview.counts.published },
            { label: "Drafts", value: overview.counts.drafts },
          ].map((stat) => (
            <Card key={stat.label} className="px-5 py-4">
              <span className="block font-sans text-2xl font-black tracking-tight text-[#F1F5FA]">
                {stat.value}
              </span>
              <span className="mt-1 block font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A97AC]">
                {stat.label}
              </span>
            </Card>
          ))}
        </div>
      )}

      {loading ? (
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#5B6980]">
          Loading…
        </p>
      ) : projects.length === 0 ? (
        <Card className="px-6 py-16 text-center">
          <p className="font-sans text-sm text-[#8A97AC]">
            No projects yet. Create the first one to populate the Work section.
          </p>
        </Card>
      ) : (
        <ul className="space-y-2.5">
          {projects.map((project, index) => (
            <li key={project.id}>
              <Card className="flex flex-wrap items-center gap-4 p-3.5 transition-colors hover:border-white/15">
                <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-[#0E1729]">
                  {project.coverImage && (
                    <img
                      src={project.coverImage}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="truncate font-sans text-[15px] font-bold tracking-tight text-[#F1F5FA]">
                      {project.title}
                    </h2>
                    <StatusPill status={project.status} />
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-[#5B6980]">
                    /work/{project.slug} · {project.sectionCount} sections ·
                    edited {relative(project.updatedAt)}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    title="Move up"
                    className="rounded-lg p-2 text-[#5B6980] transition-colors hover:bg-white/6 hover:text-[#F1F5FA] disabled:opacity-25 disabled:hover:bg-transparent"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => move(index, 1)}
                    disabled={index === projects.length - 1}
                    title="Move down"
                    className="rounded-lg p-2 text-[#5B6980] transition-colors hover:bg-white/6 hover:text-[#F1F5FA] disabled:opacity-25 disabled:hover:bg-transparent"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>

                  {project.status === "published" && (
                    <a
                      href={`/work/${project.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View live page"
                      className="rounded-lg p-2 text-[#5B6980] transition-colors hover:bg-white/6 hover:text-[#F1F5FA]"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}

                  <button
                    onClick={() => toggleStatus(project)}
                    disabled={pendingId === project.id}
                    title={
                      project.status === "published"
                        ? "Unpublish"
                        : "Publish"
                    }
                    className="rounded-lg p-2 text-[#5B6980] transition-colors hover:bg-white/6 hover:text-[#F1F5FA] disabled:opacity-40"
                  >
                    {project.status === "published" ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>

                  <Link
                    to={`/kz-console/projects/${project.id}`}
                    title="Edit"
                    className="rounded-lg p-2 text-[#8A97AC] transition-colors hover:bg-white/6 hover:text-[#FF6230]"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>

                  <button
                    onClick={() => setConfirmDelete(project.id)}
                    title="Delete"
                    className="rounded-lg p-2 text-[#5B6980] transition-colors hover:bg-rose-500/10 hover:text-rose-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {confirmDelete === project.id && (
                  <div className="flex w-full items-center justify-between gap-4 rounded-xl border border-rose-500/25 bg-rose-500/8 px-4 py-3">
                    <p className="font-sans text-[13px] text-rose-200">
                      Delete “{project.title}” permanently? This cannot be undone.
                    </p>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => setConfirmDelete(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="danger"
                        loading={pendingId === project.id}
                        onClick={() => remove(project)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}

      {overview && overview.recentActivity.length > 0 && (
        <div>
          <h2 className="mb-3 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A97AC]">
            Recent activity
          </h2>
          <Card className="divide-y divide-white/6">
            {overview.recentActivity.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-4 px-4 py-2.5"
              >
                <span className="font-mono text-[11px] text-[#8A97AC]">
                  {entry.event}
                  {entry.detail && (
                    <span className="text-[#5B6980]"> · {entry.detail}</span>
                  )}
                </span>
                <span className="shrink-0 font-mono text-[11px] text-[#5B6980]">
                  {relative(entry.at)}
                </span>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
