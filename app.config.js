// app.config.js
// This layers on top of app.json. Expo reads app.json first and passes it in
// as `config`, then this function's return value overrides it.
//
// Purpose: keep google-services.json OUT of git (it's a secret) while still
// providing it to EAS Build via a file environment variable.
//
// - On EAS Build: `GOOGLE_SERVICES_JSON` is set to the mounted path of the
//   uploaded file secret (see setup instructions).
// - Locally: falls back to ./google-services.json if you have it on disk.
export default ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON ?? config.android?.googleServicesFile,
  },
});
