const { withAndroidManifest } = require("expo/config-plugins");

module.exports = ({ config }) => {
  const preview = process.env.RAVOQ_ANDROID_PREVIEW === "1";
  const result = {
    ...config,
    android: {
      ...config.android,
      ...(preview ? { package: "com.rawshanbek.blockchat.preview" } : {}),
    },
    ...(preview ? { name: "Ravoq Preview", scheme: "ravoq-preview" } : {}),
  };
  return withAndroidManifest(result, mod => {
    const app = mod.modResults.manifest.application?.[0];
    if (app) {
      // LAN development servers are allowed only in the isolated preview app.
      app.$["android:usesCleartextTraffic"] = preview ? "true" : "false";
    }
    return mod;
  });
};
