import path from "path";
import fs from "fs";
import * as XLSX from "xlsx";

const sourcePath = path.join(
  process.cwd(),
  "Ref",
  "BIEU THUE XNK 2026 UPDATE 07.01.26.xlsx"
);

const outputPath = path.join(
  process.cwd(),
  "Ref",
  "BIEU THUE XNK 2026 UPDATE 07.01.26.xlsx - BT2026.csv"
);

const main = () => {
  if (!fs.existsSync(sourcePath)) {
    console.error(`Missing XLSX file at: ${sourcePath}`);
    process.exit(1);
  }

  const workbook = XLSX.readFile(sourcePath, {
    cellDates: false,
    raw: true
  });

  const sheetName =
    workbook.SheetNames.find((name) => name === "BT2026") ??
    workbook.SheetNames[0];
  if (!sheetName) {
    console.error("No sheets found in the XLSX file.");
    process.exit(1);
  }

  const sheet = workbook.Sheets[sheetName];
  const csv = XLSX.utils.sheet_to_csv(sheet, {
    blankrows: false
  });

  fs.writeFileSync(outputPath, csv, "utf-8");
  console.log(`CSV saved to: ${outputPath}`);
};

main();
