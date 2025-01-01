/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ExtensionParent } from "resource://gre/modules/ExtensionParent.sys.mjs";
import { AppConstants } from "resource://gre/modules/AppConstants.sys.mjs";
import { FileUtils } from "resource://gre/modules/FileUtils.sys.mjs";
import { CommonUtils } from "resource://services-common/utils.sys.mjs";
import ArchiveExtractUtils from "resource:///modules/portable/ArchiveExtractUtils.sys.mjs";
import PortableEnvironment from "resource:///modules/portable/PortableEnvironment.sys.mjs";
import { PortableI18nL10nLoader, PortableI18nLocalizer } from "resource:///modules/portable/PortableI18nUtils.sys.mjs";
import { verifyData } from "resource:///modules/portable/PortablePublicKeyDb.sys.mjs";

const AlertsService = Cc["@mozilla.org/alerts-service;1"].getService(
  Ci.nsIAlertsService,
);

const API_BASE_URL =
  !Services.prefs.getBoolPref("floorp.portable.update.develop.enabled", false) ?
    "https://floorp-update.ablaze.one" :
    Services.prefs.getStringPref("floorp.portable.update.develop.url", "");

const platformInfo = ExtensionParent.PlatformInfo;
const isWin = platformInfo.os === "win";

const appDirPath = Services.dirsvc.get("XREExeF", Ci.nsIFile).parent.path;
const appDirParentDirPath = PathUtils.parent(appDirPath);
const updateTmpDirPath = PathUtils.join(appDirParentDirPath, "update_tmp");
const updateZipFilePath = PathUtils.join(updateTmpDirPath, "update.zip");
const updateTarZstFilePath = PathUtils.join(updateTmpDirPath, "update.tar.zst");
const coreUpdateReadyFilePath = PathUtils.join(
  updateTmpDirPath,
  "CORE_UPDATE_READY",
);

const localizer = (async() => {
  const locales = await PortableI18nL10nLoader.load();
  const availableLocales = Object.keys(locales);
  return new PortableI18nLocalizer(
    undefined,
    availableLocales,
    undefined,
    locales,
  );
})();

class PortableUpdateUtils {
  static #getPlatformKey() {
    const os = platformInfo.os;
    const arch = platformInfo.arch == "arm" ? "arm64" : platformInfo.arch;
    const major_version = AppConstants.MOZ_APP_VERSION_DISPLAY.split(".")[0];

    return data_json[`${os}-${arch}-v${major_version}`];
  }
  static async #fetchLatestInfo() {
    const url = `${API_BASE_URL}/browser-portable/latest.json`;
    const url_sig = `${API_BASE_URL}/browser-portable/latest.json.v1.sig`;

    const result = await fetch(url, { cache: "no-store" });
    if (!result.ok) {
      throw new Error(`${result.status} ${result.statusText}`);
    }

    const result_sig = await fetch(url_sig, { cache: "no-store" });
    if (!result_sig.ok) {
      console.warn("Signature file not found");
      return {};
    }

    const data = await result.arrayBuffer();
    const signature = await result_sig.arrayBuffer();
    if (!await verifyData(data, signature, "floorp-updates")) {
      console.warn("Verification failed");
      return {};
    }

    const data_json = JSON.parse((new TextDecoder()).decode(data));

    return data_json[this.#getPlatformKey()];
  }
  static async checkUpdate() {
    const result = await this.#fetchLatestInfo();
    if (!result || !result.version || !result.url) {
      console.warn("invalid response data or no updates found");
      return {
        isUpdateFound: false,
        url: null,
        sha256: null,
      };
    }
    if (!result.sha256) {
      console.error("hash not found");
      return {
        isUpdateFound: false,
        url: null,
        sha256: null,
      };
    }

    const current_floorp_version = AppConstants.MOZ_APP_VERSION_DISPLAY;
    const current_portable_version = await PortableEnvironment.getPortableVersion();
    const current_version = `${current_floorp_version}-${current_portable_version}`;

    const isUpdateFound = result.version !== current_version;

    return {
      isUpdateFound: isUpdateFound,
      url: isUpdateFound ? result.url : null,
      sha256: result.sha256,
    };
  }
  static async applyRuntimeUpdate() {
    // Update portable runtime
    await IOUtils.remove(
      isWin
        ? PathUtils.join(appDirParentDirPath, "floorp.exe")
        : PathUtils.join(appDirParentDirPath, "floorp"),
    );

    await IOUtils.move(
      isWin
        ? PathUtils.join(updateTmpDirPath, "floorp.exe")
        : PathUtils.join(updateTmpDirPath, "floorp"),
      isWin
        ? PathUtils.join(appDirParentDirPath, "floorp.exe")
        : PathUtils.join(appDirParentDirPath, "floorp"),
    );

    return true;
  }
  static async #downloadUpdate(url, hash) {
    const result = await fetch(url);
    if (!result.ok) {
      throw new Error(`${result.status} ${result.statusText}`);
    }

    const data = new Uint8Array(await result.arrayBuffer());

    let hasher = Cc["@mozilla.org/security/hash;1"].createInstance(
      Ci.nsICryptoHash
    );
    hasher.init(hasher.SHA256);
    hasher.update(data, data.length);
    const result_hash = CommonUtils.bytesAsHex(hasher.finish(false));

    if (result_hash !== hash) {
      throw new Error("Hash mismatch");
    }

    await IOUtils.write(
      isWin
        ? updateZipFilePath
        : updateTarZstFilePath,
      data,
    );
  }
  static async doUpdate(url, hash) {
    await this.#downloadUpdate(url, hash);

    if (isWin) {
      await ArchiveExtractUtils.extractZip(updateZipFilePath, updateTmpDirPath);
    } else {
      await ArchiveExtractUtils.extractTarZst(updateTarZstFilePath, updateTmpDirPath);
    }
  }
}

// When updating only the portable runtime, clearing the startup cache may be necessary.
// As a precaution, if update files are detected, the application will schedule clearing the startup cache upon exit.
Services.obs.addObserver(() => {
  // As a precaution to ensure synchronous processing, IOUtils is not used.
  const file = new FileUtils.File(coreUpdateReadyFilePath);
  if (file.exists()) {
    PortableEnvironment.clearStartupCache();
  }
}, "quit-application");

let isRunning = false;
Services.obs.addObserver(async function(optionsWrapped) {
  if (isRunning) {
    return;
  }
  isRunning = true;

  const options = Object.assign({}, optionsWrapped?.wrappedJSObject);

  try {
    if (!Services.prefs.getBoolPref("floorp.portable.update.enabled", false)) {
      return;
    }

    if (await IOUtils.exists(coreUpdateReadyFilePath)) {
      AlertsService.showAlertNotification(
        "resource:///modules/portable/icons/update-pending.png",
        (await localizer).mustLocalize("bm-updater-ready-notify-title"),
        (await localizer).mustLocalize("bm-updater-ready-notify-message"),
        true,
        null,
        null,
      );

      // When updating only the portable runtime, clearing the startup cache may be necessary.
      PortableEnvironment.clearStartupCache();

      return;
    }

    if (await IOUtils.exists(PathUtils.join(updateTmpDirPath, "REDIRECTOR_UPDATE_READY")) /* Old version of Floorp Portable */) {
      let result;
      try {
        result = await PortableUpdateUtils.applyRuntimeUpdate();
      } catch (e) {
        console.error(e);
        AlertsService.showAlertNotification(
          "resource:///modules/portable/icons/failed.png",
          (await localizer).mustLocalize("bm-updater-failed-notify-title"),
          (await localizer).mustLocalize("bm-updater-failed-runtime-message"),
          true,
          null,
          null,
        );
        return;
      } finally {
        await IOUtils.remove(PathUtils.join(updateTmpDirPath, "REDIRECTOR_UPDATE_READY"));
      }
    }

    if (await PortableEnvironment.isUpdated()) {
      AlertsService.showAlertNotification(
        "resource:///modules/portable/icons/update-with-check.png", // Image URL
        (await localizer).mustLocalize("bm-updater-success-notify-title"), // Title
        (await localizer).mustLocalize("bm-updater-success-notify-message"), // Body
        true, // textClickable
        null, // id
        null, // clickCallback
      );
    }

    if (await IOUtils.exists(updateTmpDirPath)) {
      await IOUtils.remove(updateTmpDirPath, { recursive: true });
    }

    const updateInfo = await PortableUpdateUtils.checkUpdate();
    if (updateInfo.isUpdateFound) {
      // do update
      AlertsService.showAlertNotification(
        "resource:///modules/portable/icons/download.png",
        (await localizer).mustLocalize("bm-updater-found-notify-title"),
        (await localizer).mustLocalize("bm-updater-found-notify-message"),
        true,
        null,
        null,
      );

      try {
        await PortableUpdateUtils.doUpdate(updateInfo.url, updateInfo.sha256);
        await PortableUpdateUtils.applyRuntimeUpdate();
        await IOUtils.writeUTF8(coreUpdateReadyFilePath, "");
      } catch (e) {
        console.error(e);
        AlertsService.showAlertNotification(
          "resource:///modules/portable/icons/failed.png",
          (await localizer).mustLocalize("bm-updater-failed-notify-title"),
          (await localizer).mustLocalize("bm-updater-failed-prepare-message"),
          true,
          null,
          null,
        );
        return;
      }

      AlertsService.showAlertNotification(
        "resource:///modules/portable/icons/update-pending.png",
        (await localizer).mustLocalize("bm-updater-ready-notify-title"),
        (await localizer).mustLocalize("bm-updater-ready-notify-message"),
        true,
        null,
        null,
      );

      // When updating only the portable runtime, clearing the startup cache may be necessary.
      PortableEnvironment.clearStartupCache();
    } else if (options.latestNotify) {
      AlertsService.showAlertNotification(
        "resource:///modules/portable/icons/update-with-check.png",
        (await localizer).mustLocalize("bm-updater-no-updates-found-notify-title"),
        (await localizer).mustLocalize("bm-updater-no-updates-found-notify-message"),
        true,
        null,
        null,
      );
    }
  } finally {
    isRunning = false;
  }
}, "do-portable-update");

Services.obs.notifyObservers({ latestNotify: false }, "do-portable-update");
