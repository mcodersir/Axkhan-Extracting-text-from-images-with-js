import { Document, Packer, Paragraph, TextRun, AlignmentType } from "docx";
import saveAs from "file-saver";
import { TextDirection } from "../types";

export const exportToWord = async (text: string, direction: TextDirection) => {
  const lines = text.split('\n');

  // Create paragraphs from lines
  const paragraphs = lines.map(line => {
    return new Paragraph({
      alignment: direction === TextDirection.RTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
      bidirectional: direction === TextDirection.RTL,
      children: [
        new TextRun({
          text: line,
          font: "Vazirmatn", // Suggest Vazirmatn if installed, fallback to system
          size: 24, // 12pt
          rightToLeft: direction === TextDirection.RTL,
        }),
      ],
      spacing: {
        after: 200, // Spacing after paragraph
      }
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, "extracted-text.docx");
};