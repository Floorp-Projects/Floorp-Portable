/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { FileUtils } from "resource://gre/modules/FileUtils.sys.mjs";
import { NetUtil } from "resource://gre/modules/NetUtil.sys.mjs";
import { ExtensionParent } from "resource://gre/modules/ExtensionParent.sys.mjs";
import { TarReader } from "resource:///modules/portable/tarjs/index.mjs";
import { TarFileModeParser, TarFileModeCreater } from "resource:///modules/portable/TarFileModeUtils.sys.mjs";

const ZipReader = Components.Constructor(
  "@mozilla.org/libjar/zip-reader;1",
  "nsIZipReader",
  "open",
);

const ZstdReader = Components.Constructor(
  "@mozilla.org/streamconv;1?from=zstd&to=uncompressed",
  "nsIStreamConverter"
);

const BinaryStream = Components.Constructor(
  "@mozilla.org/binaryinputstream;1",
  "nsIBinaryInputStream",
  "setInputStream",
);

const platformInfo = ExtensionParent.PlatformInfo;
const isWin = platformInfo.os === "win";

export default class ArchiveExtractUtils {
  static async extractZip(path, target) {
    const reader = new ZipReader(FileUtils.File(path));
    const entries = [];
    for (const entry of reader.findEntries("*")) {
      entries.push(entry);
    }
    entries.sort((entry1, entry2) =>
      String(entry1).length - String(entry2).length,
    );
    for (const entry of entries) {
      const entryPath = isWin
        ? String(entry).replaceAll("/", "\\")
        : String(entry);
      try {
        // Example errors
        // PathUtils.splitRelative: PathUtils.splitRelative: Empty directory components ("") not allowed by options
        // PathUtils.splitRelative: PathUtils.splitRelative: Parent directory components ("..") not allowed by options
        // PathUtils.splitRelative: PathUtils.splitRelative requires a relative path
        PathUtils.splitRelative(entryPath, {
          allowEmpty: false,
          allowCurrentDir: false,
          allowParentDir: false,
        });
      } catch (e) {
        throw new Components.Exception(`Invalid path: ${e.message}`);
      }
      const path = PathUtils.joinRelative(target, entryPath);
      await reader.extract(entry, FileUtils.File(path));
    }
    reader.close();
  }
  static async extractTarZst(path, target) {
    const tarData = await new Promise((resolve) => {
      const converter = new ZstdReader();
      converter.asyncConvertData(
        "zstd",
        "uncompressed",
        {
          data: [],
          onStartRequest() {},
          onDataAvailable(aR, aStream, aO, aCount) {
            const arrayBuffer = new ArrayBuffer(aCount);
            const bi = new BinaryStream(aStream);
            bi.readArrayBuffer(aCount, arrayBuffer);
            this.data.push(arrayBuffer);
          },
          onStopRequest(aR, aC, aStatusCode) {
            if (!Components.isSuccessCode(aStatusCode)) {
              throw new Components.Exception(
                "Error while reading zstd file",
                aStatusCode
              );
            }
            resolve(new Blob(this.data));
          },
        },
        null
      );

      const file = FileUtils.File(path);
      const fileChan = NetUtil.newChannel({
        uri: Services.io.newFileURI(file),
        loadUsingSystemPrincipal: true,
      });
      fileChan.asyncOpen(converter);
    });
    if (tarData.size == 0) {
      throw new Components.Exception(`Invalid zstandard file: ${tarData.size}`);
    }

    const reader = await TarReader.load(tarData);
    const entries = [];
    for (const fileInfo of reader.fileInfos) {
      entries.push(fileInfo);
    }
    entries.sort((entry1, entry2) =>
      entry1.name.length - entry2.name.length,
    );
    for (const entry of entries) {
      const entryPath = isWin
        ? entry.name.replaceAll("/", "\\")
        : entry.name;
      try {
        // Example errors
        // PathUtils.splitRelative: PathUtils.splitRelative: Empty directory components ("") not allowed by options
        // PathUtils.splitRelative: PathUtils.splitRelative: Parent directory components ("..") not allowed by options
        // PathUtils.splitRelative: PathUtils.splitRelative requires a relative path
        PathUtils.splitRelative(entryPath, {
          allowEmpty: false,
          allowCurrentDir: false,
          allowParentDir: false,
        });
      } catch (e) {
        throw new Components.Exception(`Invalid path: ${e.message}`);
      }

      const path = PathUtils.joinRelative(target, entryPath);

      if (entry.type == "48" /* File */) {
        const data = reader.getFileBlob(entry.name);
        await IOUtils.write(path, new Uint8Array(await data.arrayBuffer()));
      } else if (entry.type == "53" /* Dir*/) {
        await IOUtils.makeDirectory(path);
      }

      // convert to unix permissions
      const mode_parsed = TarFileModeParser(entry.mode);
      delete mode_parsed.execution;
      const mode_raw = TarFileModeCreater(mode_parsed);
      try {
        await IOUtils.setPermissions(path, mode_raw);
      } catch (e) {
        console.warn(e);
      }
    }
  }
}
