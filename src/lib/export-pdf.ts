import type { Template } from "@/lib/search";

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 15;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_Y = PAGE_HEIGHT - 10;
const BOTTOM = FOOTER_Y - 6;
const LINE_HEIGHT = 5.5;

/** Same ordering as the search screen: manual references first, added answers ("+") last. */
const refKey = (ref: string) => (ref === "+" ? "999" : ref);

/**
 * Builds and downloads a PDF with every topic (question) and its standard
 * reply. Runs only in the browser; jsPDF is loaded on demand so it never
 * reaches the server bundle.
 */
export async function downloadAnswersPdf(
  answers: readonly Template[],
  filename = "respostas-suporte-ral.pdf",
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  const ensureSpace = (height = LINE_HEIGHT) => {
    if (y + height > BOTTOM) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const write = (
    text: string,
    options: {
      size?: number;
      style?: "normal" | "bold" | "italic";
      color?: [number, number, number];
      gap?: number;
      lineHeight?: number;
    } = {},
  ) => {
    const {
      size = 10.5,
      style = "normal",
      color = [0, 0, 0],
      gap = 0,
      lineHeight = LINE_HEIGHT,
    } = options;
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    for (const line of doc.splitTextToSize(text, CONTENT_WIDTH) as string[]) {
      ensureSpace(lineHeight);
      doc.text(line, MARGIN, y);
      y += lineHeight;
    }
    y += gap;
  };

  const sorted = [...answers].sort((a, b) =>
    refKey(a.id).localeCompare(refKey(b.id), undefined, { numeric: true }),
  );

  write("Respostas Suporte RAL+", { size: 18, style: "bold", gap: 1 });
  write(`Perguntas e respostas · ${new Date().toLocaleDateString("pt-PT")}`, {
    size: 9,
    color: [110, 110, 110],
    gap: 6,
  });

  const groups = new Map<string, Template[]>();
  for (const answer of sorted) {
    groups.set(answer.category, [...(groups.get(answer.category) ?? []), answer]);
  }

  for (const [category, items] of groups) {
    ensureSpace(LINE_HEIGHT * 2);
    write(category, { size: 14, style: "bold", gap: 1 });
    doc.setDrawColor(200, 200, 200);
    doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
    y += 4;

    for (const answer of items) {
      write(`${answer.id} — ${answer.title}`, { size: 11.5, style: "bold", gap: 0.5 });
      if (answer.note) {
        write(`Quando usar: ${answer.note}`, {
          size: 9.5,
          style: "italic",
          color: [90, 90, 90],
          gap: 1,
        });
      }
      write(answer.text, { size: 10.5, gap: 4.5 });
    }
    y += 2;
  }

  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page++) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(130, 130, 130);
    doc.text(`Página ${page} de ${total}`, PAGE_WIDTH / 2, FOOTER_Y, { align: "center" });
  }

  doc.save(filename);
}
