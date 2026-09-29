import { createFileRoute } from "@tanstack/react-router";
import { ContentStudio } from "@/components/content-studio/ContentStudio";

export const Route = createFileRoute("/editor")({
  component: ContentStudio,
});
