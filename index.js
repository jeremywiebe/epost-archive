import fs from "fs";
import fetch from "node-fetch";
import path from "path";

/** This tool downloads all PDFs in your ePost account to the `/downloads`
 * directory (within this dir).
 */

/***
 * ATTENTION. You'll need to up update these constants with values you get
 * using your dev tools.
 */

// These next two values come from the main page listing all your pay stubs.
// https://www.canadapost-postescanada.ca/inbox/en#!/inbox

// This is the _REQUEST_ Cookie sent after logging in.
// Just login and refresh the page to see it in it's full value.
const canadapostPostescanadaCookie = "--fill in--";

// Get with: document.querySelectorAll("meta[name=sso-token]")[0].content
canadapostPostescanadaCsrfToken = "--fill in--";

// These last two values are from the epost.ca page that displays the actual
// PDF: https://www.epost.ca/service/displayMailStream.a
// Click on one of your pay stubs and open the dev tools in the new window that
// displays the PDF.
const epostCaCookie = "--fill in--";
// This is one of the query params sent to https://www.epost.ca/service/displayMailStream.a
epostCaOWASP_CSRFTOKEN = "--fill in--";

/** END OF EDITING **/

const BaseHeaders = {
    "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:98.0) Gecko/20100101 Firefox/98.0",
};
const downloadDir = path.join(process.cwd(), "downloads");

const buildQueryParams = (params) => {
    const p = new URLSearchParams();
    for (const key of Object.getOwnPropertyNames(params)) {
        p.append(key, params[key]);
    }

    const result = p.toString();
    if (result.length == 0) {
        return "";
    }

    return `?${result}`;
};

const ensureDownloadsDirectory = () => {
    if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(path.join(downloadDir));
    }
};

const listItems = async (offset = 0, limit = 15) => {
    console.log("Listing items...");

    const url =
        "https://www.canadapost-postescanada.ca/inbox/rs/mailitem" +
        buildQueryParams({
            folderId: 0,
            sortField: 1,
            order: "D",
            offset,
            limit,
        });

    const res = await fetch(url, {
        referrer: "https://www.canadapost-postescanada.ca/inbox/en",
        compress: true,
        redirect: "error",
        headers: {
            ...BaseHeaders,
            Accept: "application/json, text/plain, */*",
            "Accept-Language": "en",
            "Accept-Encoding": "gzip, deflate, br",
            cookie: canadapostPostescanadaCookie,
            "x-ibx-lang": "en",
            csrf: canadapostPostescanadaCsrfToken,
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "Sec-GPC": "1",
        },
    });
    // console.log(url);
    // console.log(`${res.status} ${res.statusText}`);

    return await res.json();
};

const fetchItem = async (mailItemInfo) => {
    const url =
        "https://www.epost.ca/service/displayMailStream.a" +
        buildQueryParams({
            importSummaryId: mailItemInfo.mailItemID,
            lang: "en",
            OWASP_CSRFTOKEN: epostCaOWASP_CSRFTOKEN,
        });

    const res = await fetch(url, {
        compress: true,
        redirect: "error",
        referrer:
            "https://www.epost.ca/service/displayEpostInboxMail.a?documentId=" +
            mailItemInfo.mailItemID +
            `&language=en&source=myinbox&OWASP_CSRF=${epostCaOWASP_CSRFTOKEN}`,
        headers: {
            ...BaseHeaders,
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-CA,en-US;q=0.7,en;q=0.3",
            "Accept-Encoding": "gzip, deflate, br",
            DNT: "1",
            Cookie: epostCaCookie,
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "iframe",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "same-origin",
            "Sec-GPC": "1",
        },
    });

    // console.log(url);
    // console.log(`${res.status} ${res.statusText}`);

    if (res.status === 200) {
        // convert all remotely unsafe chars to "_"
        const filename =
            mailItemInfo.shortDescription.replace(/[^a-z0-9]/gi, "_") + ".pdf";

        const outputPath = path.join(downloadDir, filename).trim();

        const fileStream = fs.createWriteStream(outputPath);
        await new Promise((resolve, reject) => {
            res.body.pipe(fileStream);
            res.body.on("error", reject);
            fileStream.on("finish", resolve);
        });
        console.log(
            `Fetched: ${mailItemInfo.mailItemID} - ${
                mailItemInfo.shortDescription
            } ==> ${path.relative(process.cwd(), outputPath)}`
        );
    } else {
        console.error("!! Error fetching", mailitemInfo.shortDescription);
    }
};

const main = async () => {
    process.stdout.setDefaultEncoding("utf8");
    ensureDownloadsDirectory();

    const { mailitemInfos } = await listItems(0, 150);
    console.log(`Found ${mailitemInfos.length} items to download...`);

    mailitemInfos.forEach(async (mailItem) => {
        await fetchItem(mailItem);
    });
};

main();
