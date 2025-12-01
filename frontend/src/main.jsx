import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "react-toastify/dist/ReactToastify.css";
import "@rainbow-me/rainbowkit/styles.css";
import {
  darkTheme,
  RainbowKitProvider,
  getDefaultConfig,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains"
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";

import App from "./App.jsx";
import "./index.css";

import logoIcon from "./assets/imgs/mark.png";

const wagmiConfig = getDefaultConfig({
  appName: "Ethereum Launchpad",
  projectId: "74f641acfc221b7a40e35aede04b60fb",
  chains: [mainnet, sepolia],
  ssr: false,
});

const customTheme = {
  ...darkTheme({
    borderRadius: "medium",
    overlayBlur: "large",
  }),
  fonts: {
    body: "VT323",
  },
  colors: {
    modalBackground:
      // "linear-gradient(137.58deg, #4B65F1 11.98%, rgba(250, 3, 255, 0.2) 185.22%)",
      "#111111",
    accentColor: "#333333",
    modalBorder: "#292929",
    modalText: "#eee",
  },
};

const queryClient = new QueryClient();

// eslint-disable-next-line react/prop-types, react-refresh/only-export-components
const WalletAvatar = ({ size }) => {
  return (
    <img
      src={logoIcon}
      height={size}
      width={size}
      alt="eth-launchpad"
      style={{ borderRadius: 999 }}
    />
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <WagmiProvider config={wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider
        appInfo={{
          appName: "eth-launchpad",
        }}
        modalSize="compact"
        avatar={WalletAvatar}
        theme={customTheme}
      >
          <BrowserRouter>
            <App />
            <ToastContainer
              theme="dark"
              position="top-right"
              pauseOnFocusLoss={false}
              autoClose={2500}
              toastClassName="bg-main text-white"
              pauseOnHover={false}
              stacked
            />
          </BrowserRouter>
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);
