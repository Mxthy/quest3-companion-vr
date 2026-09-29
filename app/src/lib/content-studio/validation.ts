import type { ContentStudioData } from "./types";

export type ValidationIssue = {
  severity: "error" | "warning";
  nodeId?: string;
  message: string;
};

export function validateContent(data: ContentStudioData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const nodes = data.nodes;

  for (const [id, node] of Object.entries(nodes)) {
    if (node.id !== id) {
      issues.push({
        severity: "error",
        nodeId: id,
        message: `Node key "${id}" does not match node.id "${node.id}".`,
      });
    }

    if (!node.speaker.trim()) {
      issues.push({ severity: "error", nodeId: id, message: "Speaker is empty." });
    }

    if (!node.text.replace(/<[^>]+>/g, "").trim()) {
      issues.push({ severity: "error", nodeId: id, message: "Dialogue text is empty." });
    }

    if (node.next && !nodes[node.next]) {
      issues.push({
        severity: "error",
        nodeId: id,
        message: `next points to missing node "${node.next}".`,
      });
    }

    for (const choice of node.choices ?? []) {
      if (choice.next && !nodes[choice.next]) {
        issues.push({
          severity: "error",
          nodeId: id,
          message: `Choice "${choice.id}" points to missing node "${choice.next}".`,
        });
      }
    }
  }

  for (const [startName, nodeId] of Object.entries(data.starts)) {
    if (!nodes[nodeId]) {
      issues.push({
        severity: "error",
        message: `Start "${startName}" points to missing node "${nodeId}".`,
      });
    }
  }

  return issues;
}
