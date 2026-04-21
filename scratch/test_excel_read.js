const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

try {
    const filePath = path.join(process.cwd(), "Torneo_Abril_SanMiguel.xlsx");
    console.log("Checking path:", filePath);
    console.log("Exists:", fs.existsSync(filePath));
    
    if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log("File stats:", stats);
        
        const workbook = XLSX.readFile(filePath);
        console.log("Workbook sheets:", workbook.SheetNames);
    } else {
        console.log("File NOT found at path.");
    }
} catch (error) {
    console.error("Test failed:", error.message);
}
