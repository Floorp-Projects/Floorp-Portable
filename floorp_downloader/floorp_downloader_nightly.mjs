import got from "got";
import fs from "fs";

let headers = {};
if (process.env.GITHUB_TOKEN) {
    console.log("Using `GITHUB_TOKEN`");
    headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
} else if (process.env.PAT) {
    headers["Authorization"] = `Basic ${Buffer.from(`user:${process.env.PAT}`).toString("base64")}`;
}
let result_obj = await got(
    {
        url: "https://api.github.com/repos/Floorp-Projects/Floorp-Nightly/actions/runs",
        headers: headers
    }
).json();
let valid_workflow_run;
for (let workflow_run of result_obj["workflow_runs"]) {
    if (workflow_run["path"] == ".github/workflows/daily-build.yml" && workflow_run["conclusion"] == "success") {
        valid_workflow_run = workflow_run;
        break;
    }
}
if (!valid_workflow_run) throw "Not found";
result_obj = await got(
    {
        url: valid_workflow_run["artifacts_url"],
        headers: headers
    }
).json();
let valid_artifact;
for (let artifact of result_obj["artifacts"]) {
    if (process.argv[2] === "windows" && process.argv[3] === "x86_64") {
        if (artifact["name"] == "floorp-windows-x86_64-devel-package-build-with-profdata-and-jarlog") {
            valid_artifact = artifact;
            break;
        }
    } else if (process.argv[2] === "linux" && process.argv[3] === "x86_64") {
        if (artifact["name"] == "floorp-linux-x86_64-devel") {
            valid_artifact = artifact;
            break;
        }
    }
}
if (!valid_artifact) throw "Not found";
let binary = await got(
    {
        url: valid_artifact["archive_download_url"],
        headers: headers
    }
).buffer();
let output_filename = "floorp-package.zip";
fs.writeFileSync(output_filename, binary);
