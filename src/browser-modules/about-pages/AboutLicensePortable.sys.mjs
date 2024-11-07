/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { nsIAboutModule } = Ci;

export default function AboutLicensePortable() {}

AboutLicensePortable.prototype = {
  uri: Services.io.newURI("resource:///modules/portable/about-pages/license-portable.html"),
  classDescription: "about:license-portable",
  contractID: "@mozilla.org/network/protocol/about;1?what=license-portable",
  classID: Components.ID("{47e74de9-d25e-4eff-8256-0e9ec42c56ae}"),

  QueryInterface: ChromeUtils.generateQI(["nsIAboutModule"]),

  getURIFlags() {
    return (
      Ci.nsIAboutModule.IS_SECURE_CHROME_UI |
      Ci.nsIAboutModule.ALLOW_SCRIPT
    );
  },

  newChannel(uri, loadInfo) {
    let channel = Services.io.newChannelFromURIWithLoadInfo(this.uri, loadInfo);
    channel.owner = Services.scriptSecurityManager.getSystemPrincipal();
    return channel;
  },

  getChromeURI(_uri) {
    return this.uri;
  },
}
