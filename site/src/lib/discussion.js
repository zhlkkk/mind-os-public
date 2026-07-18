export function formatDiscussionLabel(issue) {
  return typeof issue === "number" ? `参与讨论 #${issue}` : "参与讨论";
}
