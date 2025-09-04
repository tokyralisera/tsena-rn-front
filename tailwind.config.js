module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        mytheme: {
          "primary": "#1d4ed8", 
          "primary-focus": "#1e40af", 
          "primary-content": "#ffffff", 
          
          "secondary": "#f000b8",
          "accent": "#37cdbe",
          "neutral": "#3d4451",
          "base-100": "#ffffff",
          
          "info": "#3abff8",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87272",
        },
      },
    ],
  },
}