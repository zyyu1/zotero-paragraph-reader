import { writeFile } from "node:fs/promises";

// A self-contained synthetic fixture: no user's paper or remote source.
const content = [
  "BT /F1 19 Tf 50 740 Td (Paragraph Reader Test) Tj ET",
  "BT /F1 13 Tf 50 690 Td (1 Introduction) Tj ET",
  "BT /F1 11 Tf 50 655 Td (Soil samples provide evidence for this study.) Tj ET",
  "BT /F1 11 Tf 50 639 Td (We compare methods and preserve annotations.) Tj ET",
  "BT /F1 11 Tf 50 590 Td (A second paragraph remains independently readable.) Tj ET",
  "BT /F1 11 Tf 50 574 Td (Translation can be requested one paragraph at a time.) Tj ET",
].join("\n");
const objects = [
  "<< /Type /Catalog /Pages 2 0 R >>",
  "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
  "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
  "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
];
let pdf = "%PDF-1.4\n";
const offsets = [0];
objects.forEach((object, i) => {
  offsets.push(Buffer.byteLength(pdf));
  pdf += `${i + 1} 0 obj\n${object}\nendobj\n`;
});
const xref = Buffer.byteLength(pdf);
pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
pdf += offsets
  .slice(1)
  .map((n) => String(n).padStart(10, "0") + " 00000 n \n")
  .join("");
pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
await writeFile("test/fixtures/personal-reader.pdf", pdf);
