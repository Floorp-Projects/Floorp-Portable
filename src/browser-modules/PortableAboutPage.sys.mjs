/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ComponentUtils } from "resource://gre/modules/ComponentUtils.sys.mjs";

const Cm = Components.manager.QueryInterface(Ci.nsIComponentRegistrar);

const aboutPageModules = [
  ChromeUtils.importESModule("resource:///modules/portable/about-pages/AboutLicensePortable.sys.mjs")
];

for (const { default: AboutPage } of aboutPageModules) {
  if (Cm.isCIDRegistered(AboutPage.prototype.classID)) {
    continue;
  }

  const factory = ComponentUtils.generateSingletonFactory(function() {
    return new AboutPage();
  });

  Cm.registerFactory(
    AboutPage.prototype.classID,
    AboutPage.prototype.classDescription,
    AboutPage.prototype.contractID,
    factory
  );
}
