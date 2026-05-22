// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  css: ["~/assets/css/laabslab.css"],

  alias: {
    "~/server": resolve(__dirname, "server"),
  },

  components: {
    dirs: [{ path: "~/components", pathPrefix: false }],
  },

  modules: ["@nuxt/image", "@nuxt/test-utils", "@nuxt/ui"],
});
