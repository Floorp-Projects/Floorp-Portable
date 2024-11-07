/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

(async () => {
  const result = await fetch("resource:///modules/portable/CREDITS.md");
  if (!result.ok) {
    throw new Error(`${result.status} ${result.statusText}`);
  }

  const body = await result.text();

  document.querySelector(".licenses-body").innerHTML = marked.parse(body);
})();
