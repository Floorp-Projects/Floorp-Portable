/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ExtensionParent } from "resource://gre/modules/ExtensionParent.sys.mjs";
import { AppConstants } from "resource://gre/modules/AppConstants.sys.mjs";
import ArchiveExtractUtils from "resource:///modules/portable/ArchiveExtractUtils.sys.mjs";
import PortableEnvironment from "resource:///modules/portable/PortableEnvironment.sys.mjs";
import { PortableI18nL10nLoader, PortableI18nLocalizer } from "resource:///modules/portable/PortableI18nUtils.sys.mjs";

const AlertsService = Cc["@mozilla.org/alerts-service;1"].getService(
  Ci.nsIAlertsService,
);

const API_BASE_URL = "https://floorp-update.ablaze.one";

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
const portableRuntimeUpdateReadyFilePath = PathUtils.join(
  updateTmpDirPath,
  "PORTABLE_RUNTIME_UPDATE_READY",
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
  static async #fetchLatestInfo() {
    const url = `${API_BASE_URL}/browser-portable/latest.json`;

    const result = await fetch(url);
    if (!result.ok) {
      throw new Error(`${result.status} ${result.statusText}`);
    }

    const data = await result.json();

    return data[`${platformInfo.os}-${platformInfo.arch}`];
  }
  static async checkUpdate() {
    const result = await this.#fetchLatestInfo();
    if (!result || !result.version || !result.url) {
      throw new TypeError("invalid response data");
    }

    const current_floorp_version = AppConstants.MOZ_APP_VERSION_DISPLAY;
    const current_portable_version = await PortableEnvironment.getPortableVersion();
    const current_version = `${current_floorp_version}-${current_portable_version}`;

    const isUpdateFound = result.version !== current_version;

    return {
      isUpdateFound: isUpdateFound,
      url: isUpdateFound ? result.url : null,
    };
  }
  static async applyRuntimeUpdate() {
    if (!await IOUtils.exists(portableRuntimeUpdateReadyFilePath)) {
      if (!await IOUtils.exists(PathUtils.join(updateTmpDirPath, "REDIRECTOR_UPDATE_READY"))) { // Old version of Floorp Portable
        return false;
      }
    }

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

    await IOUtils.remove(portableRuntimeUpdateReadyFilePath);

    return true;
  }
  static async #downloadUpdate(url) {
    const result = await fetch(url);
    if (!result.ok) {
      throw new Error(`${result.status} ${result.statusText}`);
    }

    const data = await result.arrayBuffer();

    await IOUtils.write(
      isWin
        ? updateZipFilePath
        : updateTarZstFilePath,
      new Uint8Array(data),
    );
  }
  static async doUpdate(url) {
    await this.#downloadUpdate(url);

    if (isWin) {
      await ArchiveExtractUtils.extractZip(updateZipFilePath, updateTmpDirPath);
    } else {
      await ArchiveExtractUtils.extractTarZst(updateTarZstFilePath, updateTmpDirPath);
      await IOUtils.setPermissions(
        PathUtils.join(updateTmpDirPath, "floorp"),
        0o755
      );
      await IOUtils.setPermissions(
        PathUtils.join(updateTmpDirPath, "core", "floorp"),
        0o755
      );
      await IOUtils.setPermissions(
        PathUtils.join(updateTmpDirPath, "core", "floorp-bin"),
        0o755
      );
      await IOUtils.setPermissions(
        PathUtils.join(updateTmpDirPath, "core", "glxtest"),
        0o755
      );
      await IOUtils.setPermissions(
        PathUtils.join(updateTmpDirPath, "core", "vaapitest"),
        0o755
      );
    }

    await IOUtils.writeUTF8(coreUpdateReadyFilePath, "");
  }
}

let isRunning = false;
Services.obs.addObserver(async function() {
  if (isRunning) {
    return;
  }
  isRunning = true;

  try {
    if (!Services.prefs.getBoolPref("floorp.portable.update.enabled", false)) {
      return;
    }

    if (await IOUtils.exists(coreUpdateReadyFilePath)) {
      AlertsService.showAlertNotification(
        "chrome://floorp/skin/updater/link-48.png",
        (await localizer).mustLocalize("bm-updater-ready-notify-title"),
        (await localizer).mustLocalize("bm-updater-ready-notify-message"),
        true,
        null,
        null,
      );
      return;
    }

    let result;
    try {
      result = await PortableUpdateUtils.applyRuntimeUpdate();
    } catch (e) {
      console.error(e);
      AlertsService.showAlertNotification(
        "chrome://floorp/skin/updater/failed.png",
        (await localizer).mustLocalize("bm-updater-failed-notify-title"),
        (await localizer).mustLocalize("bm-updater-failed-runtime-message"),
        true,
        null,
        null,
      );
      return;
    }
    if (result) {
      AlertsService.showAlertNotification(
        "chrome://floorp/skin/updater/link-48-last.png", // Image URL
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
        "chrome://floorp/skin/updater/link-48.png",
        (await localizer).mustLocalize("bm-updater-found-notify-title"),
        (await localizer).mustLocalize("bm-updater-found-notify-message"),
        true,
        null,
        null,
      );

      try {
        await PortableUpdateUtils.doUpdate(updateInfo.url);
      } catch (e) {
        console.error(e);
        AlertsService.showAlertNotification(
          "chrome://floorp/skin/updater/failed.png",
          (await localizer).mustLocalize("bm-updater-failed-notify-title"),
          (await localizer).mustLocalize("bm-updater-failed-prepare-message"),
          true,
          null,
          null,
        );
        return;
      }

      AlertsService.showAlertNotification(
        "chrome://floorp/skin/updater/link-48.png",
        (await localizer).mustLocalize("bm-updater-ready-notify-title"),
        (await localizer).mustLocalize("bm-updater-ready-notify-message"),
        true,
        null,
        null,
      );
    }
  } finally {
    isRunning = false;
  }
}, "do-portable-update");

Services.obs.notifyObservers(null, "do-portable-update");
