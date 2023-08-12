import got from "got";
import fs from "fs";

let headers = {};
if (process.env.GITHUB_TOKEN) {
    console.log("Using `GITHUB_TOKEN`");
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
}

const resultObj = await got({
    url: "https://api.github.com/repos/Floorp-Projects/Floorp/releases/latest",
    headers
}).json();

let validAsset;
const [os, arch] = process.argv.slice(2);
for (const asset of resultObj.assets) {
    const { name } = asset;
    if (os === "windows" && arch === "x86_64" && name.includes("win64") && !name.includes("stub")) {
        validAsset = asset;
        break;
    } else if (os === "linux" && arch === "x86_64" && name.includes("linux") && name.includes("x86_64")) {
        validAsset = asset;
        break;
    } else if (os === "linux" && arch === "aarch64" && name.includes("linux") && name.includes("aarch64")) {
        validAsset = asset;
        break;
    }
}

if (!validAsset) {
    throw new Error("Asset not found");
}

const binary = await got({
    url: validAsset.browser_download_url
}).buffer();

let outputFilename;
const { name } = validAsset;
if (name.endsWith(".tar.bz2")) {
    outputFilename = "floorp-package.tar.bz2";
} else if (name.endsWith(".zip")) {
    outputFilename = "floorp-package.zip";
} else if (name.endsWith(".exe")) {
    outputFilename = "floorp-package.exe";
} else {
    outputFilename = "floorp-package";
}

fs.writeFileSync(outputFilename, binary);