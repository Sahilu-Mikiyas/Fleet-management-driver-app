const fs = require('fs');
const pdfModule = require('pdf-parse');
const pdf = pdfModule.default || pdfModule;

const dataBuffer = fs.readFileSync('C:\\Users\\VICTUS\\Downloads\\Telegram Desktop\\Fleetdocs.pdf');

pdf(dataBuffer).then(function(data) {
    console.log(data.text);
}).catch(function(error) {
    console.error("Error reading PDF:", error);
});
