/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ActorManagerParent } from "resource://gre/modules/ActorManagerParent.sys.mjs";

const JSWINDOWACTORS = {
  NoraPortableSettings: {
    parent: {
      esModuleURI: "resource:///modules/portable/actors/NoraPortableSettingsParent.sys.mjs",
    },
    child: {
      esModuleURI: "resource:///modules/portable/actors/NoraPortableSettingsChild.sys.mjs",
      events: {
        DOMDocElementInserted: {},
        DOMContentLoaded: { capture: true },
        load: { capture: true },
        unload: { capture: true },
        pageshow: {},
        visibilitychange: {},
      },
    },
    matches: ["resource:///modules/portable/portable-settings/*"],
    allFrames: true,
  },
}

ActorManagerParent.addJSWindowActors(JSWINDOWACTORS);
