// Optimize for portable version
pref("floorp.portable.enabled", true);
pref("floorp.portable.update.enabled", true);

pref("app.update.auto", false, locked);
pref("app.update.background.enabled", false, locked);
pref("browser.shell.checkDefaultBrowser", false, locked);
pref("default-browser-agent.enabled", false, locked);

// see: https://searchfox.org/mozilla-central/source/security/sandbox/common/SandboxUtils.sys.mjs#20
pref("security.sandbox.warn_unprivileged_namespaces", false, locked);
