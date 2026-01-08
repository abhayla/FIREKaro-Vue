import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";

// ProjectionLab-inspired theme for FIREKaro
export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: "light",
    themes: {
      light: {
        dark: false,
        colors: {
          // Primary palette
          primary: "#1867c0", // ProjectionLab blue
          "primary-darken-1": "#104d8a",
          "primary-lighten-1": "#4a90d9",

          // Secondary palette
          secondary: "#26a69a", // Teal accent
          "secondary-darken-1": "#00867d",

          // Semantic colors
          success: "#10b981", // Emerald
          "success-darken-1": "#059669",
          warning: "#f59e0b", // Amber
          "warning-darken-1": "#d97706",
          error: "#ef4444", // Red
          "error-darken-1": "#dc2626",
          info: "#3b82f6", // Blue
          "info-darken-1": "#2563eb",

          // Surface colors
          background: "#fafbfc",
          surface: "#ffffff",
          "surface-variant": "#f5f7fa",
          "surface-light": "#f8f9fb",

          // Text colors
          "on-surface": "#1e293b", // Slate-800
          "on-background": "#1e293b",

          // Custom FIREKaro colors
          "fire-orange": "#f97316", // Orange-500
          "fire-green": "#10b981", // Emerald-500
          "fire-blue": "#1867c0", // Primary
          "fire-gold": "#eab308", // Yellow-500

          // Sidebar adaptive colors
          "sidebar-bg": "#ffffff",
          "sidebar-text": "#1e293b",
          "sidebar-hover": "#f1f5f9",
          "sidebar-active": "#e0f2fe",
        },
      },
      dark: {
        dark: true,
        colors: {
          // Primary palette
          primary: "#3b82f6", // Brighter blue for dark mode
          "primary-darken-1": "#2563eb",
          "primary-lighten-1": "#60a5fa",

          // Secondary palette
          secondary: "#2dd4bf", // Teal-400
          "secondary-darken-1": "#14b8a6",

          // Semantic colors
          success: "#34d399", // Emerald-400
          "success-darken-1": "#10b981",
          warning: "#fbbf24", // Amber-400
          "warning-darken-1": "#f59e0b",
          error: "#f87171", // Red-400
          "error-darken-1": "#ef4444",
          info: "#60a5fa", // Blue-400
          "info-darken-1": "#3b82f6",

          // Surface colors
          background: "#0f172a", // Slate-900
          surface: "#1e293b", // Slate-800
          "surface-variant": "#334155", // Slate-700
          "surface-light": "#1e293b",

          // Text colors
          "on-surface": "#f1f5f9", // Slate-100
          "on-background": "#f1f5f9",

          // Custom FIREKaro colors
          "fire-orange": "#fb923c", // Orange-400
          "fire-green": "#34d399", // Emerald-400
          "fire-blue": "#3b82f6",
          "fire-gold": "#facc15", // Yellow-400

          // Sidebar adaptive colors (dark mode)
          "sidebar-bg": "#1e293b",
          "sidebar-text": "#f1f5f9",
          "sidebar-hover": "#334155",
          "sidebar-active": "#1e3a5f",
        },
      },
    },
  },
  icons: {
    defaultSet: "mdi",
  },
  defaults: {
    VCard: {
      elevation: 0,
      rounded: "xl",
    },
    VBtn: {
      rounded: "lg",
      elevation: 0,
    },
    VTextField: {
      variant: "outlined",
      density: "comfortable",
      rounded: "lg",
    },
    VSelect: {
      variant: "outlined",
      density: "comfortable",
      rounded: "lg",
    },
    VAutocomplete: {
      variant: "outlined",
      density: "comfortable",
      rounded: "lg",
    },
    VTextarea: {
      variant: "outlined",
      density: "comfortable",
      rounded: "lg",
    },
    VDataTable: {
      hover: true,
    },
    VChip: {
      rounded: "lg",
    },
    VAlert: {
      rounded: "lg",
      variant: "tonal",
    },
    VDialog: {
      rounded: "xl",
    },
    VMenu: {
      rounded: "lg",
    },
    VNavigationDrawer: {
      elevation: 0,
    },
    VAppBar: {
      elevation: 0,
    },
    VTabs: {
      rounded: "lg",
    },
    VTab: {
      rounded: "lg",
    },
  },
});
