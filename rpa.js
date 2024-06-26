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
        // Set higher timeout
        await page.setDefaultNavigationTimeout(120000);

        // Navigate to the target website
        await page.goto('https://www.eais.go.kr/', { waitUntil: 'networkidle2' });
        console.log("Navigated to website");

         // Close popup
        await page.waitForSelector('#noticeModal > div > div.noticeClose > ul > li:nth-child(1) > button', { visible: true });
        const closeButton = await page.$('#noticeModal > div > div.noticeClose > ul > li:nth-child(1) > button');
        await closeButton.click();
        console.log("Closed popup");


        await page.waitForSelector('#header > div.headerWrap > div.headerBtn > button.btnLogin.btnLine.btnNormal.btnLine_blue', { visible: true });
        const lButton = await page.$('#header > div.headerWrap > div.headerBtn > button.btnLogin.btnLine.btnNormal.btnLine_blue');
        await lButton.click();
        console.log("Redirected to login page");
        // await page.waitForNavigation({ waitUntil: 'networkidle2' });
        // Click on the login submit button and wait for navigation
        // await Promise.all([
        //     page.click('#header > div.headerWrap > div.headerBtn > button.btnLogin.btnLine.btnNormal.btnLine_blue'),
        //     page.waitForNavigation({ waitUntil: 'networkidle2' })
        // ]);

        // // Get the current URL after successful login
        // const redirectedURL = page.url();
        // console.log("Redirected URL after login:", redirectedURL);

        // const redirectedURL = page.url();

        // console.log("url->",redirectedURL);

        // const newPageURL = await page.evaluate(() => window.location.href);
        // console.log("New page URL after login:", newPageURL);
        //  Navigate to the login page
         await page.goto('https://www.eais.go.kr/moct/awp/abb01/AWPABB01F01?returnUrl=%2F', { waitUntil: 'networkidle2' });
         console.log("Navigated to login page");

        const redirectedURL = page.url();

        console.log("url->",redirectedURL);
        // Perform login
        await page.waitForSelector('#membId', { visible: true });
        console.log("helo");
        await page.type('#membId', loginDetails.id);
        console.log("helo1");
        await page.type('#pwd', loginDetails.pw);
        console.log("helo2");
        await page.click('#container > div.content.pb80 > div > div > div.fl > div.loginForm > button');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        console.log("Logged in");

        let pdfPaths = [];

        for (let address of addresses) {
            try {
                // Click -> "Issuance of building ledger"
                await page.waitForSelector('#issuanceButton');
                await page.click('#issuanceButton'); 
                console.log(`Clicked issuance button for address: ${address}`);

                // Input the address
                await page.waitForSelector('#addressInput');
                await page.type('#addressInput', address); 
                await page.click('#searchButton'); 
                await page.waitForNavigation({ waitUntil: 'networkidle2' });
                console.log(`Searched for address: ${address}`);

                // Print PDF
                const pdfPath = path.resolve(__dirname, `${address.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
                pdfPaths.push(pdfPath);
                await page.pdf({ path: pdfPath, format: 'A4' });
                console.log(`Saved PDF for address: ${address}`);

                // Go back to the main page
                await page.waitForSelector('#homeButton');
                await page.click('#homeButton'); 
                await page.waitForSelector('#issuanceButton'); // Wait until the main page is loaded
                console.log(`Returned to main page for address: ${address}`);
            } catch (error) {
                console.error(`Error processing address ${address}: ${error.message}`);
            }
        }

        // Merge PDFs
        const mergedPdfPath = path.resolve(__dirname, 'merged.pdf');
        await mergePDFs(pdfPaths, mergedPdfPath);
        console.log("Merged PDFs");

        // Extract and translate text from merged PDF
        const extractedText = await extractTextFromPDF(mergedPdfPath);
        const translatedText = await translateText(extractedText);
        console.log("Extracted and translated text");

        // Overlay translated text onto the merged PDF
        await overlayTranslatedText(mergedPdfPath, translatedText);
        console.log("Overlayed translated text");

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
