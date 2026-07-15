import type { Metadata } from "next";
import { ApiKeysView } from "@/components/api-keys/api-keys-view";

export const metadata: Metadata = {
  title: "API Keys",
  description: "Generate and manage API keys to call models directly from your own code.",
};

export default function ApiKeysPage() {
  return <ApiKeysView />;
}
