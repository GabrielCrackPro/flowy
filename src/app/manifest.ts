import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Flowy",
    short_name: "Flowy",
    description: "Una app simple para controlar tus finanzas y tus metas.",
    id: "/",
    start_url: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    // Explicitly allow rotation — some Android launchers pin installed PWAs
    // to portrait when the manifest doesn't declare an orientation.
    orientation: "any",
    // Match the app's real first paint (light --background in globals.css) so
    // the Android splash / task switcher / system nav bar blend into the UI
    // instead of flashing dark. iOS uses the generated apple-touch-startup-image
    // files (scripts/generate-splash.mjs) which are light too.
    background_color: "#f4f7fa",
    theme_color: "#f4f7fa",
    screenshots: [
      {
        src: "/screenshots/screenshot-desktop.png",
        sizes: "1280x640",
        type: "image/png",
        form_factor: "wide",
        label: "Panel de control de Flowy en escritorio",
      },
      {
        src: "/screenshots/screenshot-mobile.png",
        sizes: "750x1334",
        type: "image/png",
        form_factor: "narrow",
        label: "Flowy en el teléfono",
      },
    ],
    shortcuts: [
      {
        name: "Nueva transacción",
        short_name: "Nueva",
        url: "/dashboard/transactions/add",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
      {
        name: "Presupuestos",
        short_name: "Presupuestos",
        url: "/dashboard/budgets",
      },
      {
        name: "Metas",
        short_name: "Metas",
        url: "/dashboard/goals",
      },
    ],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
