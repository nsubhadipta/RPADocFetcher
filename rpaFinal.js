const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');

const addresses = [
    "경기도 고양시 일산동구 강석로 152 강촌마을아파트 제701동 제2층 제202호 [마두동 796]",
    "서울특별시 강남구 언주로 332 역삼푸르지오 제101동 제1층 제101호 [역삼동 754-1]",
    "서울특별시 강남구 언주로 332 역삼푸르지오 제101동 제1층 제102호 [역삼동 754-1]",
    "경기도 부천시 부일로 440-13 숲속애가 주건축물제1동 [심곡동 396-9 외 1필지]",
    "인천광역시 부평구 부영로 196 대림아파트 제11동 제1층 제102호 [부평동 64-20 외 2필지]",
    "경기도 부천시 부일로 440-13 숲속애가 주건축물제1동 [심곡동 396-9 외 1필지]"
];

const loginDetails = { id: 'hhs0609', pw: 'ch2730053**' };

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    page.on('dialog', async dialog => {
        await dialog.accept();
    });
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
        await page.goto('https://www.eais.go.kr/moct/awp/abb01/AWPABB01F01?returnUrl=%2F', { waitUntil: 'networkidle2' });
        console.log("Navigated to login page");

        const redirectedURL = page.url();
        console.log("url->",redirectedURL);
        
        await page.waitForSelector('#membId', { visible: true });
        await page.type('#membId', loginDetails.id);
        await page.type('#pwd', loginDetails.pw);
        await page.waitForSelector('#container > div.content.pb80 > div > div > div.fl > div.loginForm > button', { visible: true });
        
        await page.evaluate(() => {
            return new Promise((resolve) => {
              setTimeout(() => {
                document.querySelector('#container > div.content.pb80 > div > div > div.fl > div.loginForm > button').click();
                resolve();
              }, 10000); // Wait for 10 seconds before clicking
            });
          });
          console.log("Clicked login button");
        console.log("Logged in--------------cc");
        // await page.waitForNavigation({ waitUntil: 'networkidle2' });
        console.log("Logged in");
        // await page.goto('https://www.eais.go.kr', { waitUntil: 'networkidle2' });





        console.log("hello Coder --");


        // Click -> "Issuance of building ledger"
        await page.waitForSelector('#section1 > div > div.mainInner > div.registerUi > div.bldreDiv.bldre1 > a', { visible: true });
        await page.click('#section1 > div > div.mainInner > div.registerUi > div.bldreDiv.bldre1 > a'); 
        console.log(`Clicked issuance button for address:`);

        await page.goto('https://www.eais.go.kr/moct/bci/aaa02/BCIAAA02L01');
        console.log("Navigated search page");

        await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
        // Input the address
        await page.waitForSelector('#container > div.content.clearFix > div > div.floatWarp.mt30.clearFix > div.contLeft > div.srchArchitecture > div.searchBuildingWarp > div.AddrSearch > button.btnLotNum', { visible: true });
        // await page.type('#eleasticSearch > div > div > div.multiselect__tags > span', address); 
        await page.click('#container > div.content.clearFix > div > div.floatWarp.mt30.clearFix > div.contLeft > div.srchArchitecture > div.searchBuildingWarp > div.AddrSearch > button.btnLotNum'); 
        // await page.waitForNavigation({ waitUntil: 'networkidle2' });
        console.log("search btn popup");
        await page.waitForSelector('#container > div.content.clearFix > div > div.floatWarp.mt30.clearFix > div.contLeft > div.srchArchitecture > div.popArchitecture', { visible: true });
        
        console.log("selector button click");


        // use page.select
        await page.select('#container > div.content.clearFix > div > div.floatWarp.mt30.clearFix > div.contLeft > div.srchArchitecture > div.popArchitecture > div > div.formIn > select.wd19', '1083');

        // use elementHandle.type
        // const selectElem = await page.$('select[name="choose1"]');
        // await selectElem.type('Value 2');

          console.log("hello Coder..");

        





        let pdfPaths = [];

        // for (let address of addresses) {
        //     try {
        //         // Click -> "Issuance of building ledger"
        //         await page.waitForSelector('#section1 > div > div.mainInner > div.registerUi > div.bldreDiv.bldre1 > a', { visible: true });
        //         await page.click('#section1 > div > div.mainInner > div.registerUi > div.bldreDiv.bldre1 > a'); 
        //         console.log(`Clicked issuance button for address: ${address}`);

        //         await page.goto('https://www.eais.go.kr/moct/bci/aaa02/BCIAAA02L01', { waitUntil: 'networkidle2' });
        //         console.log("Navigated search page");

        //         // Input the address
        //         await page.waitForSelector('#eleasticSearch > div > div > div.multiselect__tags > span', { visible: true });
        //         // await page.type('#eleasticSearch > div > div > div.multiselect__tags > span', address); 
        //         await page.click('#container > div.content.clearFix > div > div.floatWarp.mt30.clearFix > div.contLeft > div.srchArchitecture > div.searchBuildingWarp > div.AddrSearch > button.btnLotNum'); 
        //         // await page.waitForNavigation({ waitUntil: 'networkidle2' });
        //         console.log("haeee Ram");
        //         await page.waitForSelector('#container > div.content.clearFix > div > div.floatWarp.mt30.clearFix > div.contLeft > div.srchArchitecture > div.popArchitecture', { visible: true });


        //         console.log(`Searched for address: ${address}`);



        //             // // use page.select
        //             // await page.select('select[name="choose1"]', 'val2');

        //             // // use elementHandle.type
        //             // const selectElem = await page.$('select[name="choose1"]');
        //             // await selectElem.type('Value 2');





        //         // Print PDF
        //         const pdfPath = path.resolve(__dirname, `${address.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
        //         pdfPaths.push(pdfPath);
        //         await page.pdf({ path: pdfPath, format: 'A4' });
        //         console.log(`Saved PDF for address: ${address}`);

        //         // Go back to the main page
        //         await page.waitForSelector('#homeButton');
        //         await page.click('#homeButton'); 
        //         await page.waitForSelector('#issuanceButton'); // Wait until the main page is loaded
        //         console.log(`Returned to main page for address: ${address}`);
        //     } catch (error) {
        //         console.error(`Error processing address ${address}: ${error.message}`);
        //     }
        // }

        // Print PDF
        const pdfPath = path.resolve(__dirname, `${addresses[0].replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
        pdfPaths.push(pdfPath);
        await page.pdf({ path: pdfPath, format: 'A4' });
        console.log(`Saved PDF for address: ${addresses[0]}`);

        // Merge PDFs
        const mergedPdfPath = path.resolve(__dirname, 'merged.pdf');
        await mergePDFs(pdfPaths, mergedPdfPath);
        console.log("Merged PDFs");

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
