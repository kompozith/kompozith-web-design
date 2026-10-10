import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";
import type { Block, BlockType } from "../lib/api";
import ImageField from "./MediaPicker";
import { Button, Card, Field, inputClass, labelClass } from "./ui";

/* Mirrors the block set the case-study page knows how to render. */
const BLOCK_LIBRARY: {
  type: BlockType;
  name: string;
  description: string;
}[] = [
  {
    type: "feature",
    name: "Feature",
    description: "Label, heading, body, bullet list and a side image",
  },
  {
    type: "process",
    name: "Process",
    description: "Numbered steps with tag chips, on a dark panel",
  },
  {
    type: "text",
    name: "Text",
    description: "Heading on the left, long-form prose on the right",
  },
  { type: "image", name: "Image", description: "Full-width or contained image" },
  { type: "gallery", name: "Gallery", description: "Two or three column grid" },
  { type: "stats", name: "Stats", description: "Three headline numbers" },
  { type: "quote", name: "Quote", description: "Pull quote with attribution" },
];

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `b-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function emptyBlock(type: BlockType): Block {
  const id = uid();
  switch (type) {
    case "feature":
      return {
        id,
        type,
        label: "",
        title: "",
        body: "",
        bullets: [],
        image: "",
        imageAlt: "",
        layout: "image-right",
      };
    case "process":
      return { id, type, label: "", title: "", body: "", steps: [] };
    case "text":
      return { id, type, label: "", title: "", body: "" };
    case "image":
      return { id, type, url: "", alt: "", caption: "", width: "full" };
    case "gallery":
      return { id, type, images: [], columns: 2 };
    case "stats":
      return { id, type, label: "", title: "", items: [] };
    case "quote":
      return { id, type, quote: "", author: "", role: "", avatar: "" };
  }
}

const textarea = `${inputClass} min-h-[96px] resize-y leading-relaxed`;

/* --------------------------------------------------------------- per-type */

function FeatureFields({
  block,
  patch,
}: {
  block: Extract<Block, { type: "feature" }>;
  patch: (changes: Partial<Block>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Eyebrow">
          <input
            value={block.label}
            onChange={(e) => patch({ label: e.target.value })}
            placeholder="Problem"
            className={inputClass}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Heading">
            <input
              value={block.title}
              onChange={(e) => patch({ title: e.target.value })}
              className={inputClass}
            />
          </Field>
        </div>
      </div>

      <Field label="Body">
        <textarea
          value={block.body}
          onChange={(e) => patch({ body: e.target.value })}
          className={textarea}
        />
      </Field>

      <div>
        <span className={labelClass}>Bullets</span>
        <div className="mt-2 space-y-2">
          {block.bullets.map((bullet, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={bullet.lead}
                onChange={(e) => {
                  const bullets = [...block.bullets];
                  bullets[i] = { ...bullet, lead: e.target.value };
                  patch({ bullets });
                }}
                placeholder="Bold lead-in"
                className={`${inputClass} w-1/3`}
              />
              <input
                value={bullet.text}
                onChange={(e) => {
                  const bullets = [...block.bullets];
                  bullets[i] = { ...bullet, text: e.target.value };
                  patch({ bullets });
                }}
                placeholder="Supporting sentence"
                className={inputClass}
              />
              <button
                onClick={() =>
                  patch({ bullets: block.bullets.filter((_, j) => j !== i) })
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
              patch({ bullets: [...block.bullets, { lead: "", text: "" }] })
            }
          >
            <Plus className="h-3 w-3" />
            Add bullet
          </Button>
        </div>
      </div>

      <ImageField
        label="Image"
        value={block.image}
        onChange={(image) => patch({ image })}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Image alt text">
          <input
            value={block.imageAlt}
            onChange={(e) => patch({ imageAlt: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Layout">
          <select
            value={block.layout}
            onChange={(e) =>
              patch({ layout: e.target.value as typeof block.layout })
            }
            className={inputClass}
          >
            <option value="image-right">Image right</option>
            <option value="image-left">Image left</option>
            <option value="image-below">Image below</option>
            <option value="none">No image</option>
          </select>
        </Field>
      </div>
    </div>
  );
}

function ProcessFields({
  block,
  patch,
}: {
  block: Extract<Block, { type: "process" }>;
  patch: (changes: Partial<Block>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Eyebrow">
          <input
            value={block.label}
            onChange={(e) => patch({ label: e.target.value })}
            placeholder="Process"
            className={inputClass}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Heading">
            <input
              value={block.title}
              onChange={(e) => patch({ title: e.target.value })}
              className={inputClass}
            />
          </Field>
        </div>
      </div>

      <Field label="Intro">
        <textarea
          value={block.body}
          onChange={(e) => patch({ body: e.target.value })}
          className={textarea}
        />
      </Field>

      <div className="space-y-3">
        <span className={labelClass}>Steps</span>
        {block.steps.map((step, i) => (
          <Card key={i} className="space-y-3 bg-[#0E1729] p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[#FF6230]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <button
                onClick={() =>
                  patch({ steps: block.steps.filter((_, j) => j !== i) })
                }
                className="text-[#5B6980] transition-colors hover:text-rose-300"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <input
              value={step.title}
              onChange={(e) => {
                const steps = [...block.steps];
                steps[i] = { ...step, title: e.target.value };
                patch({ steps });
              }}
              placeholder="Step title"
              className={inputClass}
            />
            <textarea
              value={step.body}
              onChange={(e) => {
                const steps = [...block.steps];
                steps[i] = { ...step, body: e.target.value };
                patch({ steps });
              }}
              placeholder="What happens in this step"
              className={`${inputClass} min-h-[64px] resize-y`}
            />
            <input
              value={step.tags.join(", ")}
              onChange={(e) => {
                const steps = [...block.steps];
                steps[i] = {
                  ...step,
                  tags: e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                };
                patch({ steps });
              }}
              placeholder="Tags, comma separated"
              className={inputClass}
            />
          </Card>
        ))}
        <Button
          variant="ghost"
          className="!px-3 !py-1.5 !text-xs"
          onClick={() =>
            patch({
              steps: [...block.steps, { title: "", body: "", tags: [] }],
            })
          }
        >
          <Plus className="h-3 w-3" />
          Add step
        </Button>
      </div>
    </div>
  );
}

function TextFields({
  block,
  patch,
}: {
  block: Extract<Block, { type: "text" }>;
  patch: (changes: Partial<Block>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Eyebrow">
          <input
            value={block.label}
            onChange={(e) => patch({ label: e.target.value })}
            className={inputClass}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Heading">
            <input
              value={block.title}
              onChange={(e) => patch({ title: e.target.value })}
              className={inputClass}
            />
          </Field>
        </div>
      </div>
      <Field label="Body" hint="Leave a blank line between paragraphs.">
        <textarea
          value={block.body}
          onChange={(e) => patch({ body: e.target.value })}
          className={`${textarea} min-h-[140px]`}
        />
      </Field>
    </div>
  );
}

function ImageFields({
  block,
  patch,
}: {
  block: Extract<Block, { type: "image" }>;
  patch: (changes: Partial<Block>) => void;
}) {
  return (
    <div className="space-y-4">
      <ImageField
        label="Image"
        value={block.url}
        onChange={(url) => patch({ url })}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Alt text">
          <input
            value={block.alt}
            onChange={(e) => patch({ alt: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Caption">
          <input
            value={block.caption}
            onChange={(e) => patch({ caption: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Width">
          <select
            value={block.width}
            onChange={(e) =>
              patch({ width: e.target.value as typeof block.width })
            }
            className={inputClass}
          >
            <option value="full">Full width</option>
            <option value="contained">Contained</option>
          </select>
        </Field>
      </div>
    </div>
  );
}

function GalleryFields({
  block,
  patch,
}: {
  block: Extract<Block, { type: "gallery" }>;
  patch: (changes: Partial<Block>) => void;
}) {
  return (
    <div className="space-y-4">
      <Field label="Columns">
        <select
          value={block.columns}
          onChange={(e) =>
            patch({ columns: Number(e.target.value) === 3 ? 3 : 2 })
          }
          className={`${inputClass} max-w-[160px]`}
        >
          <option value={2}>Two</option>
          <option value={3}>Three</option>
        </select>
      </Field>

      <div className="space-y-3">
        {block.images.map((image, i) => (
          <div key={i} className="flex items-end gap-2">
            <div className="flex-1">
              <ImageField
                label={`Image ${i + 1}`}
                value={image.url}
                onChange={(url) => {
                  const images = [...block.images];
                  images[i] = { ...image, url };
                  patch({ images });
                }}
              />
            </div>
            <button
              onClick={() =>
                patch({ images: block.images.filter((_, j) => j !== i) })
              }
              className="mb-2 rounded-lg px-2 py-2 text-[#5B6980] transition-colors hover:text-rose-300"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <Button
          variant="ghost"
          className="!px-3 !py-1.5 !text-xs"
          onClick={() =>
            patch({ images: [...block.images, { url: "", alt: "" }] })
          }
        >
          <Plus className="h-3 w-3" />
          Add image
        </Button>
      </div>
    </div>
  );
}

function StatsFields({
  block,
  patch,
}: {
  block: Extract<Block, { type: "stats" }>;
  patch: (changes: Partial<Block>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Eyebrow">
          <input
            value={block.label}
            onChange={(e) => patch({ label: e.target.value })}
            className={inputClass}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Heading">
            <input
              value={block.title}
              onChange={(e) => patch({ title: e.target.value })}
              className={inputClass}
            />
          </Field>
        </div>
      </div>

      <div className="space-y-2">
        <span className={labelClass}>Figures</span>
        {block.items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={item.value}
              onChange={(e) => {
                const items = [...block.items];
                items[i] = { ...item, value: e.target.value };
                patch({ items });
              }}
              placeholder="+46%"
              className={`${inputClass} w-1/3`}
            />
            <input
              value={item.label}
              onChange={(e) => {
                const items = [...block.items];
                items[i] = { ...item, label: e.target.value };
                patch({ items });
              }}
              placeholder="Demo requests"
              className={inputClass}
            />
            <button
              onClick={() =>
                patch({ items: block.items.filter((_, j) => j !== i) })
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
            patch({ items: [...block.items, { value: "", label: "" }] })
          }
        >
          <Plus className="h-3 w-3" />
          Add figure
        </Button>
      </div>
    </div>
  );
}

function QuoteFields({
  block,
  patch,
}: {
  block: Extract<Block, { type: "quote" }>;
  patch: (changes: Partial<Block>) => void;
}) {
  return (
    <div className="space-y-4">
      <Field label="Quote">
        <textarea
          value={block.quote}
          onChange={(e) => patch({ quote: e.target.value })}
          className={textarea}
        />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Author">
          <input
            value={block.author}
            onChange={(e) => patch({ author: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Role / company">
          <input
            value={block.role}
            onChange={(e) => patch({ role: e.target.value })}
            className={inputClass}
          />
        </Field>
      </div>
      <ImageField
        label="Avatar (optional)"
        value={block.avatar}
        onChange={(avatar) => patch({ avatar })}
      />
    </div>
  );
}

/* ------------------------------------------------------------------- shell */

function BlockFields({
  block,
  patch,
}: {
  block: Block;
  patch: (changes: Partial<Block>) => void;
}) {
  switch (block.type) {
    case "feature":
      return <FeatureFields block={block} patch={patch} />;
    case "process":
      return <ProcessFields block={block} patch={patch} />;
    case "text":
      return <TextFields block={block} patch={patch} />;
    case "image":
      return <ImageFields block={block} patch={patch} />;
    case "gallery":
      return <GalleryFields block={block} patch={patch} />;
    case "stats":
      return <StatsFields block={block} patch={patch} />;
    case "quote":
      return <QuoteFields block={block} patch={patch} />;
    default:
      return null;
  }
}

function blockSummary(block: Block): string {
  switch (block.type) {
    case "feature":
    case "process":
    case "text":
    case "stats":
      return block.title || "Untitled";
    case "image":
      return block.caption || block.alt || "Image";
    case "gallery":
      return `${block.images.length} images`;
    case "quote":
      return block.author || "Quote";
    default:
      return "";
  }
}

export default function BlockEditor({
  blocks,
  onChange,
}: {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const patchBlock = (id: string, changes: Partial<Block>) => {
    onChange(
      blocks.map((b) => (b.id === id ? ({ ...b, ...changes } as Block) : b)),
    );
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {blocks.map((block, index) => {
        const isOpen = openId === block.id;
        return (
          <Card key={block.id} className="overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              <GripVertical className="h-4 w-4 shrink-0 text-[#3D4A61]" />

              <button
                onClick={() => setOpenId(isOpen ? null : block.id)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <span className="rounded-md bg-white/6 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-[#8A97AC]">
                  {block.type}
                </span>
                <span className="truncate font-sans text-[13px] text-[#D9DFEA]">
                  {blockSummary(block)}
                </span>
              </button>

              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="rounded-lg p-1.5 text-[#5B6980] transition-colors hover:text-[#F1F5FA] disabled:opacity-25"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => move(index, 1)}
                  disabled={index === blocks.length - 1}
                  className="rounded-lg p-1.5 text-[#5B6980] transition-colors hover:text-[#F1F5FA] disabled:opacity-25"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button
                  onClick={() =>
                    onChange(blocks.filter((b) => b.id !== block.id))
                  }
                  className="rounded-lg p-1.5 text-[#5B6980] transition-colors hover:text-rose-300"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {isOpen && (
              <div className="border-t border-white/6 px-4 py-5">
                <BlockFields
                  block={block}
                  patch={(changes) => patchBlock(block.id, changes)}
                />
              </div>
            )}
          </Card>
        );
      })}

      {adding ? (
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className={labelClass}>Choose a section type</span>
            <button
              onClick={() => setAdding(false)}
              className="font-sans text-xs text-[#8A97AC] hover:text-[#F1F5FA]"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {BLOCK_LIBRARY.map((entry) => (
              <button
                key={entry.type}
                onClick={() => {
                  const block = emptyBlock(entry.type);
                  onChange([...blocks, block]);
                  setOpenId(block.id);
                  setAdding(false);
                }}
                className="rounded-xl border border-white/8 bg-[#0E1729] px-4 py-3 text-left transition-colors hover:border-[#FF6230]/50"
              >
                <span className="block font-sans text-[13px] font-semibold text-[#F1F5FA]">
                  {entry.name}
                </span>
                <span className="mt-0.5 block font-sans text-[11px] leading-relaxed text-[#6B7A93]">
                  {entry.description}
                </span>
              </button>
            ))}
          </div>
        </Card>
      ) : (
        <Button variant="ghost" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" />
          Add section
        </Button>
      )}
    </div>
  );
}
