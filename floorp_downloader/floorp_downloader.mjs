import got from "got";
import fs from "fs";

let headers = {};
if (process.env.GITHUB_TOKEN) {
    console.log("Using `GITHUB_TOKEN`");
    headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
}
let result_obj = await got(
    {
        url: "https://api.github.com/repos/Floorp-Projects/Floorp/releases/latest",
        headers: headers
    }
).json();
let valid_asset;
for (let asset of result_obj["assets"]) {
    if (process.argv[2] === "windows" && process.argv[3] === "x86_64") {
        if (asset["name"].includes("win64") && !asset["name"].includes("stub")) {
            valid_asset = asset;
            break;
        }
    } else if (process.argv[2] === "linux" && process.argv[3] === "x86_64") {
        if (asset["name"].includes("linux") && asset["name"].includes("x86_64")) {
            valid_asset = asset;
            break;
        }
    } else if (process.argv[2] === "linux" && process.argv[3] === "aarch64") {
        if (asset["name"].includes("linux") && asset["name"].includes("aarch64")) {
            valid_asset = asset;
            break;
        }
    }
}
if (!valid_asset) throw "Not found";
let binary = await got(
    {
        url: valid_asset["browser_download_url"]
    }
).buffer();
let output_filename;
if (valid_asset["name"].endsWith(".tar.bz2")) {
    output_filename = "floorp-package.tar.bz2";
} else if (valid_asset["name"].endsWith(".zip")) {
    output_filename = "floorp-package.zip";
} else if (valid_asset["name"].endsWith(".exe")) {
    output_filename = "floorp-package.exe";
} else {
    output_filename = "floorp-package";
}
fs.writeFileSync(output_filename, binary);
