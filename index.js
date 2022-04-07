import fs from "fs";
import fetch from "node-fetch";
import path from "path";

import * as config from "./config.js";

/**
 * This tool downloads all PDFs in your ePost account to the `/downloads`
 * directory (within this dir).
 */

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
            cookie: config.canadapostPostescanadaCookie,
            "x-ibx-lang": "en",
            csrf: config.canadapostPostescanadaCsrfToken,
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

const fetchItem = async (num, mailItemInfo) => {
    // convert all remotely unsafe chars to "_"
    let filename =
        mailItemInfo.shortDescription.replace(/[^a-z0-9]/gi, "_") + ".pdf";

    const outputPath = path.join(downloadDir, filename).trim();

    const url =
        "https://www.epost.ca/service/displayMailStream.a" +
        buildQueryParams({
            importSummaryId: mailItemInfo.mailItemID,
            lang: "en",
            OWASP_CSRFTOKEN: config.epostCaOWASP_CSRFTOKEN,
        });

    const res = await fetch(url, {
        compress: true,
        redirect: "error",
        referrer:
            "https://www.epost.ca/service/displayEpostInboxMail.a?documentId=" +
            mailItemInfo.mailItemID +
            `&language=en&source=myinbox&OWASP_CSRF=${config.epostCaOWASP_CSRFTOKEN}`,
        headers: {
            ...BaseHeaders,
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-CA,en-US;q=0.7,en;q=0.3",
            "Accept-Encoding": "gzip, deflate, br",
            DNT: "1",
            Cookie: config.epostCaCookie,
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
        const fileStream = fs.createWriteStream(outputPath);
        await new Promise((resolve, reject) => {
            res.body.pipe(fileStream);
            res.body.on("error", reject);
            fileStream.on("finish", resolve);
        });
        console.log(
            `⤵️  [${num}] Fetched: ${mailItemInfo.mailItemID} - ${
                mailItemInfo.shortDescription
            } ==> ${path.relative(process.cwd(), outputPath)}`
        );
    } else {
        console.error(
            `!! Error fetching ${mailitemInfo.shortDescription} - ${res.status} ${res.statusText}`
        );
    }
};

const main = async () => {
    ensureDownloadsDirectory();

    const { mailitemInfos } = await listItems(0, 200);
    console.log(`Found ${mailitemInfos.length} items to download...`);

    let i = 0;
    mailitemInfos.forEach(async (mailItem) => {
        i++;
        await fetchItem(i, mailItem);
    });
};

main();
