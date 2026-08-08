import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Flowy",
    short_name: "Flowy",
    description: "Una app simple para controlar tus finanzas y tus metas.",
    id: "/",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#3b82f6",
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
