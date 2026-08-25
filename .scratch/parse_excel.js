const xlsx = require('xlsx');

try {
  const filePath = 'd:\\Programas\\Medic\\kardex_cem del valle..xlsx';
  const workbook = xlsx.readFile(filePath);
  const sheetNames = workbook.SheetNames;
  
  // Print structure of some product sheets
  for (let i = 5; i < Math.min(8, sheetNames.length); i++) {
    const sheetName = sheetNames[i];
    console.log(`\n--- Sheet: ${sheetName} ---`);
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    const sample = data.slice(0, 15);
    sample.forEach((row, index) => {
      console.log(`Row ${index + 1}:`, JSON.stringify(row));
    });
  }
} catch (err) {
  console.error('Error reading Excel file:', err);
}
