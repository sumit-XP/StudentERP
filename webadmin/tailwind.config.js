/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      "colors": {
        "outline-variant": "#c3c6d7",
        "inverse-primary": "#b4c5ff",
        "on-primary": "#ffffff",
        "inverse-surface": "#2d3133",
        "tertiary-fixed-dim": "#bec6e0",
        "secondary-fixed": "#d3e4fe",
        "on-tertiary-container": "#eef0ff",
        "on-surface": "#191c1e",
        "on-tertiary-fixed-variant": "#3f465c",
        "primary-fixed": "#dbe1ff",
        "surface": "#f7f9fb",
        "on-surface-variant": "#434655",
        "surface-tint": "#0053db",
        "on-secondary-fixed": "#0b1c30",
        "outline": "#737686",
        "surface-container-low": "#f2f4f6",
        "primary": "#004ac6",
        "on-error": "#ffffff",
        "surface-container": "#eceef0",
        "on-primary-container": "#eeefff",
        "background": "#f7f9fb",
        "on-secondary-container": "#54647a",
        "on-tertiary-fixed": "#131b2e",
        "tertiary-fixed": "#dae2fd",
        "on-background": "#191c1e",
        "primary-container": "#2563eb",
        "surface-variant": "#e0e3e5",
        "on-primary-fixed-variant": "#003ea8",
        "secondary": "#505f76",
        "error": "#ba1a1a",
        "tertiary": "#4d556b",
        "surface-dim": "#d8dadc",
        "primary-fixed-dim": "#b4c5ff",
        "tertiary-container": "#656d84",
        "surface-container-lowest": "#ffffff",
        "on-secondary-fixed-variant": "#38485d",
        "on-tertiary": "#ffffff",
        "surface-container-highest": "#e0e3e5",
        "secondary-container": "#d0e1fb",
        "on-secondary": "#ffffff",
        "surface-container-high": "#e6e8ea",
        "on-error-container": "#93000a",
        "surface-bright": "#f7f9fb",
        "on-primary-fixed": "#00174b",
        "error-container": "#ffdad6",
        "secondary-fixed-dim": "#b7c8e1",
        "inverse-on-surface": "#eff1f3"
      },
      "borderRadius": {
        "DEFAULT": "0.25rem",
        "lg": "0.8rem",
        "xl": "1.2rem",
        "full": "9999px"
      },
      "spacing": {
        "xl": "32px",
        "lg": "24px",
        "md": "16px",
        "base": "4px",
        "xs": "4px",
        "margin-mobile": "16px",
        "gutter": "24px",
        "sm": "8px",
        "margin-desktop": "40px"
      },
      "fontFamily": {
        "body-sm": ["Hanken Grotesk"],
        "headline-sm": ["Hanken Grotesk"],
        "body-lg": ["Hanken Grotesk"],
        "label-sm": ["Inter"],
        "headline-md": ["Hanken Grotesk"],
        "body-md": ["Hanken Grotesk"],
        "headline-lg": ["Hanken Grotesk"],
        "label-md": ["Inter"]
      },
      "fontSize": {
        "body-sm": ["14px", {"lineHeight": "20px", "fontWeight": "400"}],
        "headline-sm": ["20px", {"lineHeight": "28px", "fontWeight": "600"}],
        "body-lg": ["18px", {"lineHeight": "28px", "fontWeight": "400"}],
        "label-sm": ["12px", {"lineHeight": "16px", "fontWeight": "600"}],
        "headline-md": ["24px", {"lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "600"}],
        "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
        "headline-lg": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
        "label-md": ["14px", {"lineHeight": "20px", "letterSpacing": "0.01em", "fontWeight": "500"}]
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

