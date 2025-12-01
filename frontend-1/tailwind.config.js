/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "*.{html}",
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        xxxs: "8px",
        xxs: "12px",
        xs: "14px",
        sm: "16px",
        base: "18px",
        lg: "20px",
        xl: "22px",
        '2xl': "26px",
        '3xl': "32px"
      },
      width: {
        button: "40px",
      },
      height: {
        button: "40px",
      },
      backgroundImage: {
        "container": "linear-gradient(to bottom, #07080c, #2f3034)",
        "container-secondary": "linear-gradient(to bottom, #08080b, #1c1c1c)",
        "purple-gradient": "linear-gradient(98deg, #4b65f1 11.98%, #a334f866 100%)",
        "purple2-gradient": "linear-gradient(120deg, #4b65f1 11.98%, #9f2af8f1 100%)",
        "purple3-gradient": "linear-gradient(100deg, #02FCFF 0%, #4B65F1 50%, #FA03FF 100%)",
        "cube-image": "url('/assets/img/cubes.png')",
        "gray-gradient": "linear-gradient(135deg, #A8A8A6, #696969, #F9F8F6, #D4D4D4, #7F7F7F)",
      },
      spacing: {
        "1/2-300": "calc(50% - 300px)",
        "600": "600px",
        "300": "300px"
      },
      blur: {
        300: "300px"
      },
      boxShadow: {
        'card-xl': "-20px 20px 40px 0px rgba(0, 0, 0, 0.40), -4px -4px 4px 0px rgba(0, 0, 0, 0.43) inset, 4px 4px 4px 0px rgba(255, 255, 255, 0.21) inset",
        'field-xl': "20px 20px 100px 0px #030820 inset",
        'custom': '0 0 15px 0 rgba(6, 182, 212, .95)',
      }
    },
    colors: {
      "slate-tableHeader": "#020b1b",
      "slate-title": "#030F25",
      "slate-900": "#07142B",
      "slate-950": "#020B1A",
      "slate-500": "#3E75A7",
      "blue-950": "#142B69",
      "gray-dark": "#1F1F1F",
      "black-light": "#10102D",
      "black-dark": "#1A1D22",
      "black-bg-input": "#06090E",
      "gray-highlight": "#2D2D2D",
      "gray-normal": "#878787",
      "gray-blue": "#2D3350",
      "gray-border": "#87878760",
      "gray-light": "#151618",
      "gray-dead": "#AAABB6",
      "gray-weight": "#212528",
      "gray-label": "#9093A5",
      "red-normal": "#D81D3C",
      "red-semi": "#D81D3C15",
      "green-normal": "#1FE73F",
      "green-light": "#27C022",
      "green-dark": "#57C032",
      "yellow-normal": "#F19A27",
      "yellow-light": "#AFAA00",
      "white": "#FFF",
      "blue-primary": "#4B65F1",
      "dark-pink": "#A135F8",
      "dark-purple": "#4B65F1",
      "light-purple": "#1e1e6e",
      "light-black": "#111215",
      "gray-shadow": "rgba(54, 59, 83, 0.15)",
      "card-bg": "#040921",
      "card-border": "#22273F",
      "orange": "#DA7B1E",
    },
    borderRadius: {
      'large': '38px'
    },
  },
  plugins: [],
}

