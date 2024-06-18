const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');
const Tesseract = require('tesseract.js');
const translate = require('@vitalets/google-translate-api');

const addresses = [
    "경기도 고양시 일산동구 강석로 152 강촌마을아파트 제701동 제2층 제202호 [마두동 796]",
    "서울특별시 강남구 언주로 332 역삼푸르지오 제101동 제1층 제101호 [역삼동 754-1]",
    "서울특별시 강남구 언주로 332 역삼푸르지오 제101동 제1층 제102호 [역삼동 754-1]",
    "경기도 부천시 부일로 440-13 숲속애가 주건축물제1동 [심곡동 396-9 외 1필지]",
    "인천광역시 부평구 부영로 196 대림아파트 제11동 제1층 제102호 [부평동 64-20 외 2필지]",
    "경기도 부천시 부일로 440-13 숲속애가 주건축물제1동 [심곡동 396-9 외 1필지]"
];

const loginDetails = { id: 'ohk5004', pw: 'MufinNumber1' };

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    const startTime = Date.now();

    try {
        
        // await page.setDefaultNavigationTimeout(60000);

        // Navigate to the target website
        await page.goto('https://cloud.eais.go.kr/', { waitUntil: 'networkidle2' });

        // Perform login
        await page.type('#userid', loginDetails.id);
        await page.type('#password', loginDetails.pw);
        await page.click('#loginButton');
        await page.waitForNavigation();

        let pdfPaths = [];

        for (let address of addresses) {
            try {
                // Click -> "Issuance of building ledger"
                await page.waitForSelector('#issuanceButton');
                await page.click('#issuanceButton'); 

                // Input the address
                await page.waitForSelector('#addressInput');
                await page.type('#addressInput', address); 
                await page.click('#searchButton'); 
                await page.waitForNavigation({ waitUntil: 'networkidle2' });

                // Print PDF
                const pdfPath = path.resolve(__dirname, `${address.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
                pdfPaths.push(pdfPath);
                await page.pdf({ path: pdfPath, format: 'A4' });

                // Go back to the main page
                await page.waitForSelector('#homeButton');
                await page.click('#homeButton'); 
                await page.waitForSelector('#issuanceButton'); // Wait until the main page is loaded
            } catch (error) {
                console.error(`Error processing address ${address}: ${error.message}`);
            }
        }

        // Merge PDFs
        const mergedPdfPath = path.resolve(__dirname, 'merged.pdf');
        await mergePDFs(pdfPaths, mergedPdfPath);

        // Extract and translate text from merged PDF
        const extractedText = await extractTextFromPDF(mergedPdfPath);
        const translatedText = await translateText(extractedText);

        // Overlay translated text onto the merged PDF
        await overlayTranslatedText(mergedPdfPath, translatedText);

    } catch (error) {
        console.error(`Error in script execution: ${error.message}`);
    } finally {
        await browser.close();
        const endTime = Date.now();
        console.log(`Execution time: ${(endTime - startTime) / 1000} seconds`);
    }
})();

async function mergePDFs(pdfPaths, outputPath) {
    const mergedPdf = await PDFDocument.create();

    for (const pdfPath of pdfPaths) {
        const pdfBytes = fs.readFileSync(pdfPath);
        const pdf = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedPdfBytes = await mergedPdf.save();
    fs.writeFileSync(outputPath, mergedPdfBytes);
}

async function extractTextFromPDF(pdfPath) {
    const text = await Tesseract.recognize(pdfPath, 'kor', {
        logger: (m) => console.log(m),
    });
    return text.data.text;
}

async function translateText(text) {
    const result = await translate(text, { from: 'ko', to: 'en' });
    return result.text;
}

async function overlayTranslatedText(pdfPath, translatedText) {
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    const { width, height } = firstPage.getSize();
    firstPage.drawText(translatedText, {
        x: 50,
        y: height / 2,
        size: 12,
        color: rgb(0, 0, 0),
    });

    const pdfBytesUpdated = await pdfDoc.save();
    fs.writeFileSync(pdfPath, pdfBytesUpdated);
}
