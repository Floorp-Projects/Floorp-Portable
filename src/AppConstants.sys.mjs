/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const appConstantsCode = `
<!-- insert AppConstants.sys.mjs code -->
`

const AppConstantsOriginal = eval(
  "(function () {" +
  appConstantsCode.replaceAll("export ", "") +
  ";return AppConstants;" +
  "})();"
);

export const AppConstants = Object.freeze(Object.assign({}, AppConstantsOriginal, {
  MOZ_UPDATER: false,
  MOZ_SYSTEM_POLICIES: false,
}));
