import type { Metadata } from "next";
import { ModelsView } from "@/components/models/models-view";

export const metadata: Metadata = {
  title: "Models",
  description:
    "Call any model directly with an API key — transparent per-request pricing with a hard cap, or a time pass.",
};

export default async function ModelsPage(props: PageProps<"/models">) {
  const searchParams = await props.searchParams;
  const provider =
    typeof searchParams.provider === "string" ? searchParams.provider : undefined;
  const q = typeof searchParams.q === "string" ? searchParams.q : undefined;
  const pass = typeof searchParams.pass === "string" ? searchParams.pass : undefined;

  return <ModelsView initialProvider={provider} initialQuery={q} initialPass={pass} />;
}
