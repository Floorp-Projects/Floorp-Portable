// Optimize for portable version
pref("floorp.portable.enabled", true);
pref("floorp.portable.update.enabled", true);

pref("app.update.auto", false, locked);
pref("app.update.background.enabled", false, locked);
pref("browser.shell.checkDefaultBrowser", false, locked);
pref("default-browser-agent.enabled", false, locked);
pref("browser.privacySegmentation.createdShortcut", true, locked); // see: https://searchfox.org/mozilla-esr128/source/browser/components/BrowserGlue.sys.mjs#2797
pref("security.sandbox.warn_unprivileged_namespaces", false, locked); // see: https://searchfox.org/mozilla-central/source/security/sandbox/common/SandboxUtils.sys.mjs#20
pref("toolkit.policies.perUserDir", false, locked);
