/**
 * Shared CMS domain types. Imported by both the Express API and the React
 * admin/front-end, so it must stay free of any Node-only imports.
 */

export type ProjectStatus = "draft" | "published";

export interface StatItem {
  label: string;
  value: string;
}

export interface BulletItem {
  /** Bold lead-in, e.g. "Crowded Interface". Optional. */
  lead: string;
  text: string;
}

export interface ProcessStep {
  title: string;
  body: string;
  tags: string[];
}

export interface GalleryImage {
  url: string;
  alt: string;
}

export type BlockLayout = "image-right" | "image-left" | "image-below" | "none";

interface BlockBase {
  id: string;
}

/** Eyebrow + heading + body + bold-lead bullets, optional side image. */
export interface FeatureBlock extends BlockBase {
  type: "feature";
  label: string;
  title: string;
  body: string;
  bullets: BulletItem[];
  image: string;
  imageAlt: string;
  layout: BlockLayout;
}

/** Numbered step cards with tag chips. */
export interface ProcessBlock extends BlockBase {
  type: "process";
  label: string;
  title: string;
  body: string;
  steps: ProcessStep[];
}

/** Long-form prose. Blank lines separate paragraphs. */
export interface TextBlock extends BlockBase {
  type: "text";
  label: string;
  title: string;
  body: string;
}

export interface ImageBlock extends BlockBase {
  type: "image";
  url: string;
  alt: string;
  caption: string;
  width: "full" | "contained";
}

export interface GalleryBlock extends BlockBase {
  type: "gallery";
  images: GalleryImage[];
  columns: 2 | 3;
}

export interface StatsBlock extends BlockBase {
  type: "stats";
  label: string;
  title: string;
  items: StatItem[];
}

export interface QuoteBlock extends BlockBase {
  type: "quote";
  quote: string;
  author: string;
  role: string;
  avatar: string;
}

export type Block =
  | FeatureBlock
  | ProcessBlock
  | TextBlock
  | ImageBlock
  | GalleryBlock
  | StatsBlock
  | QuoteBlock;

export type BlockType = Block["type"];

export interface ProjectMeta {
  industry: string;
  services: string[];
  duration: string;
  timeline: string;
}

export interface Project {
  id: string;
  slug: string;
  status: ProjectStatus;

  /* Card + hero identity */
  title: string;
  client: string;
  category: string;
  excerpt: string;
  tagline: string;
  coverImage: string;
  accentColor: string;
  cardBg: string;

  /* Ordering on the home page — ascending. */
  order: number;
  featured: boolean;

  /* Case-study overview block */
  overview: string;
  objective: string;
  meta: ProjectMeta;
  stats: StatItem[];
  liveUrl: string;

  sections: Block[];

  seoTitle: string;
  seoDescription: string;

  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

/** Trimmed shape returned by the public list endpoint. */
export interface ProjectCard {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  coverImage: string;
  accentColor: string;
  cardBg: string;
  order: number;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: "owner" | "editor";
  createdAt: string;
  lastLoginAt: string | null;
}
