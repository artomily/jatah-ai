import type { Creator } from "@/lib/types";

export const CREATORS: Creator[] = [
  {
    id: "nova-works",
    name: "Nova Works",
    handle: "@novaworks",
    bio: "Small studio building agents that respect your attention — and your wallet. Research, writing, and meetings.",
    initials: "NW",
    joined: "2025-03",
  },
  {
    id: "atlas-labs",
    name: "Atlas Labs",
    handle: "@atlaslabs",
    bio: "Developer tooling agents. We ship the code reviewers we always wanted on our own teams.",
    initials: "AL",
    joined: "2025-01",
  },
  {
    id: "fieldnote-ai",
    name: "Fieldnote AI",
    handle: "@fieldnote",
    bio: "Research agents with citations you can actually check. Built by two former reference librarians.",
    initials: "FA",
    joined: "2025-05",
  },
  {
    id: "parcel-labs",
    name: "Parcel Labs",
    handle: "@parcellabs",
    bio: "Data agents for people who live in spreadsheets but would rather not.",
    initials: "PL",
    joined: "2025-02",
  },
  {
    id: "halide-systems",
    name: "Halide Systems",
    handle: "@halide",
    bio: "Computer-vision agents for design and QA teams. Pixels are our whole personality.",
    initials: "HS",
    joined: "2025-06",
  },
  {
    id: "quiet-systems",
    name: "Quiet Systems",
    handle: "@quietsystems",
    bio: "Automation agents that clear the busywork without asking for your whole inbox forever.",
    initials: "QS",
    joined: "2025-04",
  },
  {
    id: "northbeam-tools",
    name: "Northbeam Tools",
    handle: "@northbeam",
    bio: "Infrastructure-minded agents: logs, metrics, and the parsers nobody wants to write by hand.",
    initials: "NT",
    joined: "2025-07",
  },
  {
    id: "mono-studio",
    name: "Mono Studio",
    handle: "@monostudio",
    bio: "Copy and localization agents tuned by working editors. Words, carefully.",
    initials: "MS",
    joined: "2025-08",
  },
];

export function getCreator(id: string): Creator | undefined {
  return CREATORS.find((c) => c.id === id);
}
