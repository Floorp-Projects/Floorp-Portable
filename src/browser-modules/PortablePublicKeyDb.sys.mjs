/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import PortableEnvironment from "resource:///modules/portable/PortableEnvironment.sys.mjs";

function removePemHeaderAndFooter(pem) {
  const pem_header = "-----BEGIN PUBLIC KEY-----";
  const pem_footer = "-----END PUBLIC KEY-----";
  const pem_contents = pem.trim().substring(
    pem_header.length,
    pem.trim().length - pem_footer.length,
  ).trim();
  return pem_contents.replaceAll("\n", "").replaceAll("\r", "");
}

async function getPublicKeys() {
  return await (await fetch("resource:///modules/portable/public-keys/config.json")).json();
}

function convertToWebCryptoAlgorism(algorism) {
  const values = algorism.split("-");
  if (values.length == 0 || values.length > 2) {
    throw new Error("Invalid algorism");
  }

  switch (values[0].toLowerCase()) {
    case "ecdsa":
      if (values.length != 2) {
        throw new Error("Invalid algorism");
      }
      switch (values[1].toLowerCase()) {
        case "sha256":
          return { name: "ECDSA", hash: "SHA-256" };
        case "sha384":
          return { name: "ECDSA", hash: "SHA-384" };
        case "sha512":
          return { name: "ECDSA", hash: "SHA-512" };
        default:
          throw new Error(`Unsupported algorism: ${algorism}`);
      }
    case "ed25519":
      return { name: "Ed25519" };
    default:
      throw new Error(`Unsupported algorism: ${algorism}`);
  }
}

export async function verifyData(data, signature_algorism, signature, category) {
  const publickey_configs = await getPublicKeys();

  for (const publickey_config of publickey_configs) {
    if (publickey_config.categories.includes(category)) {
      const publickey_uri = `resource:///modules/portable/public-keys/${publickey_config.name}`;
      const pem = await (await fetch(publickey_uri)).text();
      const pem_contents = removePemHeaderAndFooter(pem);

      const pem_contents_buf = await PortableEnvironment.base64ToArrayBuffer(pem_contents);

      const publickey = await crypto.subtle.importKey(
        "spki",
        pem_contents_buf,
        publickey_config.algorism,
        true,
        ["verify"],
      );

      const result = await crypto.subtle.verify(
        convertToWebCryptoAlgorism(signature_algorism),
        publickey,
        signature,
        data,
      );

      if (result) {
        return true;
      }
    }
  }
  return false;
}
