import type { DocumentType } from "../documents/db.js";

/**
 * Guided-pipeline state machine (model-driven). The backend owns the stage
 * transitions; the AI only produces content for the current stage.
 *
 *   intake → choosing_deliverable → clarifying → generating → awaiting_next
 *                                                      ↓ (feedback on existing doc)
 *                                                   refining → generating (refine)
 */
export type PipelineStage =
  | "intake"
  | "choosing_deliverable"
  | "clarifying"
  | "generating"
  | "refining"
  | "awaiting_next";

export const INITIAL_STAGE: PipelineStage = "intake";

/** Best-effort detection of which deliverable the user asked for. */
export function detectDeliverableType(message: string): DocumentType | null {
  const m = message.toLowerCase();
  if (
    /\bprd\b|\bproduct requirements?\b|\bdokumen kebutuhan\b|\brequirements? doc(?:ument)?\b|\bspesifikasi produk\b|\bbrief produk\b/.test(
      m,
    )
  )
    return "prd";
  if (
    /\bquot(?:e|ation)?\b|\bpenawaran\b|\bharga\b|\bpricing\b|\binvoice\b|\bestimasi\b|\brab\b|\bbudget\b|\bproposal harga\b|\brincian biaya\b/.test(
      m,
    )
  )
    return "quotation";
  if (
    /\bprototype\b|\bprototip\b|\bpurwarupa\b|\bmock-?up\b|\bwireframe\b|\bfigma\b|\bui\b|\bdesign\b|\blanding\b|\b(?:buat|bikin)(?:kan)? (?:aplikasi|website|web app|webapp)\b/.test(
      m,
    )
  )
    return "prototype";
  if (
    /\bspecs?\b|\btasks?\b|\bbreakdown\b|\bfeatures?\b|\bdaftar fitur\b|\bfeature list\b|\broadmap\b|\buser stor(?:y|ies)\b|\bmodul\b|\bspesifikasi teknis\b|\btechnical spec\b/.test(
      m,
    )
  )
    return "specs";
  return null;
}

/** "Show/give me the preview link" follow-up on an existing prototype. */
export function detectPreviewIntent(message: string): boolean {
  return /\b(preview|previewnya|link|linknya|url)\b|\btampilkan\b|\blihat hasil\b|\bliat hasil\b|\bcek hasil\b|\bshow (?:me|preview)\b/i.test(
    message,
  );
}

/** "Change/add/fix" follow-up that should revise the existing deliverable. */
export function detectRefineIntent(message: string): boolean {
  return /\b(ubah|ganti|edit|revisi|refine|update|perbaiki|fix|tambah|tambahkan|add|hilangkan|hapus|remove|change|modif|perbarui|sesuaikan|rapihin|rapikan|benerin|betulin|revise|adjust|tweak|improve|poles|feedback|masukan|saran|kurang|lebih|geser|pindah|pindahkan|taruh|letakkan|depan|belakang|atas|bawah|kiri|kanan|tengah|samping|posisi|layout|tata letak|marquee|navbar|hero|footer|section|bagian|tombol|button|warna|color|font|ukuran|besar|kecil|spacing|jarak)\b/i.test(
    message,
  );
}

/**
 * Explicit "never mind" — cancels a pending refine (or any follow-up) and
 * returns the conversation to awaiting_next. Keep this set narrow: the
 * refine-by-default design intentionally treats everything else as feedback.
 */
export function detectCancelIntent(message: string): boolean {
  return /\b(nggak (?:jadi|usah)|ga (?:jadi|usah)|tidak (?:jadi|usah)|batal|skip|cancel|gausah|nggausah|ga usah|lupakan|forget it|never mind|udah ga usah|udah nggak usah|jangan dulu|ntar aja|nanti aja)\b/i.test(
    message,
  );
}

/**
 * Hard gate for the prototype flow: has the client mentioned BOTH logo and
 * color/palette anywhere in the conversation yet? Backend-enforced so
 * generation can't proceed on a prompt instruction alone — if the model
 * forgets to ask (or the client skips answering), the stage stays in
 * `clarifying` instead of advancing to `generating`.
 */
export function hasLogoAndColorDetails(allUserText: string): boolean {
  const m = allUserText.toLowerCase();
  // Prefix-match (no trailing \b) so Indonesian suffixes still count:
  // "logonya", "warnanya", etc.
  const mentionsLogo = /\blogo/.test(m);
  const mentionsColor = /\bwarna|\bcolou?r|\bpalet|\bbrand colou?r/.test(m);
  return mentionsLogo && mentionsColor;
}

const DELIVERABLE_LABEL: Record<DocumentType, string> = {
  prd: "PRD",
  quotation: "Quotation",
  prototype: "Prototype",
  specs: "Specs",
  mom: "MOM",
};

/**
 * Derive a short, professional document title from the conversation title + type.
 * Strips filler phrases (e.g. "buatkan", "tolong", "buat saya"), keeps the core topic,
 * prefixes with the type label, and caps at ~60 chars.
 */
export function deriveDocumentTitle(conversationTitle: string, type: DocumentType): string {
  const label = DELIVERABLE_LABEL[type] ?? type.toUpperCase();

  // Strip common Indonesian/English filler words at the start
  const stripped = conversationTitle
    .trim()
    .replace(/^(buatkan|buat|tolong|tolong buatkan|please|create|generate|make|write|bikinin|bikini|bikin)\s+/i, "")
    .replace(/^(saya|gue|gw|aku|i want|i need|i want you to|i need you to)\s+/i, "")
    .replace(/^(a |an |the )/i, "")
    // Remove leading type labels if already there (e.g. "PRD untuk ..." → "untuk ...")
    .replace(new RegExp(`^${label}\\s+(untuk|for|:|-)?\\s*`, "i"), "")
    .replace(/^(prd|quotation|prototype|specs|mom)\s+(untuk|for|:|-)?\\s*/i, "")
    .trim();

  const core = stripped || conversationTitle.trim();

  // Title case first letter, lowercase rest
  const formatted = core.charAt(0).toUpperCase() + core.slice(1);

  // Cap at 55 chars for the topic part
  const topic = formatted.length > 55 ? formatted.slice(0, 52).trimEnd() + "…" : formatted;

  return topic ? `${label} - ${topic}` : label;
}

/** The instruction injected into the system prompt for the current stage. */
export function stageInstruction(stage: PipelineStage, pendingType: DocumentType | null): string {
  switch (stage) {
    case "intake":
    case "choosing_deliverable":
      return "You are in intake. Read the brief carefully. If it's clear what the user wants to build, recommend the most logical deliverable to start with (PRD, Quotation, Prototype, or Specs) and briefly explain why — then ask if they want to proceed or prefer a different one. If the brief is genuinely ambiguous, ask a single focused question to clarify direction. Do NOT generate anything yet.";
    case "clarifying":
      if (pendingType === "prototype") {
        return "You are clarifying requirements for the Prototype. Make smart assumptions about target users and scope based on the brief — only ask what you truly cannot infer. You MUST ask (in a single message, max 2 questions): (a) logo — do they have one to share, or use a text placeholder? (b) brand colors — specific palette, or should you pick a professional default? Keep it conversational, not a form. Do NOT generate yet.";
      }
      return `You are clarifying requirements for the ${DELIVERABLE_LABEL[pendingType ?? "prd"]}. Read BRIEF.md first — make reasonable assumptions for anything that's inferable. Ask at most ONE question about the single most important missing detail that would materially change the output. If the brief already has enough to work with, just say "Oke, gue mulai generate sekarang" (or English equivalent) and let the user confirm. Do NOT generate yet.`;
    case "generating":
      return `Generate the full ${DELIVERABLE_LABEL[pendingType ?? "prd"]} document now. Output ONLY the document content — no preamble, no meta-commentary.`;
    case "refining":
      return "You are refining an existing deliverable. Acknowledge the feedback in one sentence — no need to restate everything back. If the feedback is clear, just confirm you got it and ask if there's anything else before regenerating. If something is ambiguous, ask one quick question. Don't push for more revisions if the user seems satisfied. If they ask a question or say thanks, just answer naturally.";
    case "awaiting_next":
      return "A deliverable was just generated. Ask the user what they want next: generate another deliverable (PRD, Quotation, Prototype, Specs) or refine the one just created.";
  }
}
