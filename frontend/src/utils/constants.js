import { keyframes } from "@emotion/react";

export const fadeInUp = keyframes`
    0% {
        opacity: 0;
        -webkit-transform: translateY(40px);
        transform: translateY(40px);
    }
    100% {
        opacity: 1;
        -webkit-transform: translateY(0);
        transform: translateY(0);
    }
`;

export const multicallAddress = "0xcA11bde05977b3631167028862bE2a173976CA11"

export const fadeIn = keyframes`
    0% {
        opacity: 0;
    }
    100% {
        opacity: 1;
    }
`;

export const fadeInLeft = keyframes`
    0% {
        opacity: 0;
        -webkit-transform: translateX(50px);
        transform: translateX(50px);
    }
    100% {
        opacity: 1;
        -webkit-transform: translateX(0);
        transform: translateX(0);
    }
`;

export const fadeInRight = keyframes`
    0% {
        opacity: 0;
        -webkit-transform: translateX(-50px);
        transform: translateX(-50px);
    }
    100% {
        opacity: 1;
        -webkit-transform: translateX(0);
        transform: translateX(0);
    }
`;

export const TEMPLATES = [
    "ERC-20/Template-1 (enableTradingWithPermit)",
    "ERC-20/Template-2 (openTradingWithPermit)",
    "ERC-20/Template-3 (startTradingWithPermit)",
    "ERC-20/Template-4 (activateTradingWithPermit)",
    "ERC-20/Template-5 (tradeWithPermit)",
    "ERC-20/Template-6 (launchWithPermit)",
    "ERC-20/Template-7 (startWithPermit)",
    // "ERC-404/Template-1 (enableTradingWithPermit)",
    // "ERC-404/Template-2 (openTradingWithPermit)",
];

export const CONTACT_INFO = false

export const FULL_ADMIN = false

export const UNISWAP_V2_ROUTER = {
    1: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    8453: "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24",
    5: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    11155111: "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008",
};

export const contractAddress = {
    mainnet: "0x663A5C229c09b049E36dCc11a9B0d4a8Eb9db214",
    sepolia: "0x753c0D0bcfC983385dEdd9Eff49A3a82f12B4922",
};

export const ROUTER_V2 = {
    "eth": "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    "sepolia": '0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008'
}

export const FACTORY_V2 = {
    "eth": "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
    "sepolia": '0x7E0987E5b3a30e3f2828572Bb659A548460a3003'
}

export const WETH = {
    "eth": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    "sepolia": '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9'
}