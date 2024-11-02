// Optimize for portable version

pref("floorp.portable.enabled", true);
pref("floorp.portable.update.enabled", true);

// see: https://searchfox.org/mozilla-central/source/security/sandbox/common/SandboxUtils.sys.mjs#20
pref("security.sandbox.warn_unprivileged_namespaces", false);
