import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, ArrowUpRight, ExternalLink } from "lucide-react";

import Header from "../components/Header";
import FooterNew from "../components/FooterNew";
import LinesBackground from "../components/LinesBackground";
import ContactDrawer from "../components/ContactDrawer";
import MagneticButton from "../components/MagneticButton";
import BlockRenderer, { Prose, body, eyebrow, heading } from "../components/case-study/Blocks";
import { useSmoothScroll } from "../hooks/useSmoothScroll";
import { api, ApiError, type Project, type ProjectCard } from "../lib/api";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string; notFound: boolean }
  | { status: "ready"; project: Project; next: ProjectCard | null };

export default function CaseStudy() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  useSmoothScroll();

  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    window.scrollTo(0, 0);

    api
      .getPublished(slug)
      .then(({ project, next }) => {
        if (cancelled) return;
        setState({ status: "ready", project, next });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const notFound = err instanceof ApiError && err.status === 404;
        setState({
          status: "error",
          notFound,
          message:
            err instanceof Error ? err.message : "Unable to load this project.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  /* Case-study pages always render on the light palette. */
  useEffect(() => {
    document.documentElement.classList.remove("theme-dark");
  }, []);

  useEffect(() => {
    if (state.status !== "ready") return;
    const previous = document.title;
    document.title =
      state.project.seoTitle ||
      `${state.project.title} — Kompozith case study`;
    return () => {
      document.title = previous;
    };
  }, [state]);

  const goHomeSection = (id: string) => {
    if (id === "contact") {
      setDrawerOpen(true);
      return;
    }
    navigate(`/#${id}`);
  };

  if (state.status === "loading") {
    return (
      <div className="min-h-screen w-full bg-[var(--theme-bg)]">
        <Header onNavClick={goHomeSection} />
        <div className="flex min-h-screen items-center justify-center">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-slate-400">
            Loading project…
          </span>
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="min-h-screen w-full bg-[var(--theme-bg)]">
        <Header onNavClick={goHomeSection} />
        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <span className={eyebrow}>
            {state.notFound ? "404" : "Error"}
          </span>
          <h1 className={`${heading} mt-4`}>
            {state.notFound ? "This project isn't published" : "Something went wrong"}
          </h1>
          <p className={`${body} mt-4 max-w-md`}>{state.message}</p>
          <Link
            to="/"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#1A2540] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#243357]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Kompozith
          </Link>
        </div>
      </div>
    );
  }

  const { project, next } = state;
  const metaRows = [
    { label: "Industry", value: project.meta.industry },
    { label: "Services", value: project.meta.services.join(", ") },
    { label: "Duration", value: project.meta.duration },
    { label: "Timeline", value: project.meta.timeline },
  ].filter((row) => row.value);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[var(--theme-bg)] font-sans">
      <LinesBackground />
      <Header onNavClick={goHomeSection} />

      {/* ------------------------------------------------------------ hero */}
      <header className="relative z-10 w-full px-4 pt-[130px] pb-8 sm:px-8 md:px-12 md:pt-[150px] lg:px-20">
        <div className="mx-auto max-w-7xl">
          <Link
            to="/#case-studies"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--theme-line)] bg-[var(--theme-card)] px-4 py-2 font-sans text-xs font-semibold text-[var(--theme-strong)] transition-colors hover:border-[#FF6230]/40 hover:text-[#FF6230]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All work
          </Link>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-[#FF6230] px-3 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-white">
              {project.category}
            </span>
            {project.client && (
              <span className="font-mono text-xs text-[var(--theme-muted)]">
                {project.client}
              </span>
            )}
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 max-w-4xl font-sans text-4xl font-black leading-[1.03] tracking-tight text-[var(--theme-ink)] sm:text-5xl lg:text-6xl"
          >
            {project.title}
          </motion.h1>

          {project.tagline && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.7 }}
              className="mt-6 max-w-2xl font-serif text-xl italic leading-relaxed text-[var(--theme-strong)] md:text-2xl"
            >
              {project.tagline}
            </motion.p>
          )}

          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex items-center gap-2 font-sans text-sm font-semibold text-[#FF6230] hover:underline"
            >
              Visit the live site
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </header>

      {/* ------------------------------------------------------- cover image */}
      {project.coverImage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full px-4 sm:px-8 md:px-12 lg:px-20"
        >
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[32px] border border-[var(--theme-line)] bg-[var(--theme-chip)]">
            <img
              src={project.coverImage}
              alt={project.title}
              className="h-[280px] w-full object-cover sm:h-[420px] md:h-[560px]"
            />
          </div>
        </motion.div>
      )}

      {/* ---------------------------------------------------------- overview */}
      <section className="relative z-10 w-full px-4 py-16 sm:px-8 md:px-12 md:py-24 lg:px-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 md:grid-cols-12 md:gap-14">
          <div className="md:col-span-7">
            <span className={eyebrow}>Project overview</span>
            <Prose text={project.overview} className="mt-6" />
            {project.objective && (
              <div className="mt-8 border-l-2 border-[#FF6230] pl-5">
                <Prose text={project.objective} />
              </div>
            )}
          </div>

          <aside className="md:col-span-5">
            <dl className="divide-y divide-[var(--theme-line)] overflow-hidden rounded-[28px] border border-[var(--theme-line)] bg-[var(--theme-card)]">
              {metaRows.map((row) => (
                <div key={row.label} className="px-6 py-5">
                  <dt className="font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--theme-muted)]">
                    {row.label}
                  </dt>
                  <dd className="mt-1.5 font-sans text-[15px] font-medium leading-relaxed text-[var(--theme-ink)]">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>

            {project.stats.length > 0 && (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
                {project.stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-[var(--theme-line)] bg-[var(--theme-chip)] px-4 py-4 text-center"
                  >
                    <span className="block font-sans text-xl font-black tracking-tight text-[var(--theme-ink)]">
                      {stat.value}
                    </span>
                    <span className="mt-1 block font-sans text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--theme-muted)]">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      </section>

      {/* ------------------------------------------------------------ blocks */}
      <div className="relative z-10">
        {project.sections.map((block) => (
          <BlockRenderer key={block.id} block={block} />
        ))}
      </div>

      {/* --------------------------------------------------------- next + CTA */}
      <section className="relative z-10 w-full px-4 pb-24 pt-8 sm:px-8 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          {next && (
            <Link
              to={`/work/${next.slug}`}
              className="group relative block overflow-hidden rounded-[32px] border border-[var(--theme-line)]"
            >
              <img
                src={next.coverImage}
                alt=""
                loading="lazy"
                className="h-[240px] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 md:h-[320px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              <div className="absolute inset-x-6 bottom-6 flex items-end justify-between gap-6 md:inset-x-10 md:bottom-10">
                <div className="text-left">
                  <span className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                    Next project
                  </span>
                  <h3 className="mt-2 font-sans text-2xl font-black tracking-tight text-white md:text-3xl">
                    {next.title}
                  </h3>
                </div>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-[#111827] transition-colors duration-300 group-hover:bg-[#FF6230] group-hover:text-white">
                  <ArrowUpRight className="h-6 w-6 stroke-[2.5]" />
                </span>
              </div>
            </Link>
          )}

          <div className="mt-14 flex flex-col items-start gap-6 rounded-[32px] border border-[var(--theme-line)] bg-[var(--theme-card)] px-7 py-12 text-left sm:px-12 md:flex-row md:items-center md:justify-between">
            <div>
              <span className={eyebrow}>Ready to build</span>
              <h2 className="mt-4 max-w-lg font-sans text-2xl font-black leading-tight tracking-tight text-[var(--theme-ink)] md:text-[2.1rem]">
                Your next project starts with a conversation.
              </h2>
            </div>
            <MagneticButton onClick={() => setDrawerOpen(true)}>
              Get in Touch
            </MagneticButton>
          </div>
        </div>
      </section>

      <FooterNew />
      <ContactDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
