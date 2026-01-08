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
          primary: "#1867c0", // ProjectionLab blue
          "primary-darken-1": "#1558a3",
          secondary: "#26a69a", // Teal accent
          "secondary-darken-1": "#1f8f85",
          success: "#4caf50",
          "success-darken-1": "#3d8b40",
          warning: "#fb8c00",
          "warning-darken-1": "#e57c00",
          error: "#ff5252",
          "error-darken-1": "#ff3b3b",
          info: "#2196f3",
          "info-darken-1": "#1e88e5",
          background: "#f5f5f5",
          surface: "#ffffff",
          "surface-variant": "#fafafa",
          "on-surface": "#1a1a1a",
          "on-background": "#1a1a1a",
          // Custom FIREKaro colors
          "fire-orange": "#ff6b35", // FIRE accent
          "fire-green": "#4caf50", // Financial health
          "fire-blue": "#1867c0", // Primary actions
          "fire-gold": "#ffc107", // Achievements
        },
      },
      dark: {
        dark: true,
        colors: {
          primary: "#2196f3",
          "primary-darken-1": "#1976d2",
          secondary: "#26a69a",
          "secondary-darken-1": "#1f8f85",
          success: "#4caf50",
          "success-darken-1": "#3d8b40",
          warning: "#fb8c00",
          "warning-darken-1": "#e57c00",
          error: "#ff5252",
          "error-darken-1": "#ff3b3b",
          info: "#2196f3",
          "info-darken-1": "#1e88e5",
          background: "#121212",
          surface: "#1e1e1e",
          "surface-variant": "#2d2d2d",
          "on-surface": "#e0e0e0",
          "on-background": "#e0e0e0",
          // Custom FIREKaro colors
          "fire-orange": "#ff8c5a",
          "fire-green": "#66bb6a",
          "fire-blue": "#42a5f5",
          "fire-gold": "#ffca28",
        },
      },
    },
  },
  icons: {
    defaultSet: "mdi",
  },
  defaults: {
    VCard: {
      elevation: 2,
      rounded: "lg",
    },
    VBtn: {
      rounded: "lg",
    },
    VTextField: {
      variant: "outlined",
      density: "comfortable",
    },
    VSelect: {
      variant: "outlined",
      density: "comfortable",
    },
    VDataTable: {
      hover: true,
    },
  },
});
