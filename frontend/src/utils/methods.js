/* eslint-disable no-useless-escape */
// import { formatGwei } from "viem";

import axios from 'axios';
import { FACTORY_V2, TEMPLATES, WETH } from './constants';
import { ethers } from 'ethers';
import tokenABI from "../abi/ITradingToken.json";
import factoryABI from "../abi/IUniswapV2Factory.json";
import pairABI from "../abi/IUniswapV2Pair.json";

export const getTokenPriceByAddress = async (contractAddress, platform = 'eth') => {
    if (!isValidAddress(contractAddress)) return null
    try {
        const response = await axios.get(
            `https://deep-index.moralis.io/api/v2.2/erc20/${contractAddress}/price?chain=${platform}`,
            {
                headers: {
                    Accept: 'application/json',
                    'X-API-Key': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjdhZDI1MmZlLTc3MDctNGZjMi05MmQ5LTYxYzAzMzljOTI3ZCIsIm9yZ0lkIjoiMzkyNTczIiwidXNlcklkIjoiNDAzMzgzIiwidHlwZUlkIjoiMWZjZWNjMTYtZTVkNi00ZDkwLTlmODItNDUwNzc0Nzc0YjdlIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3MTU4OTUyNjgsImV4cCI6NDg3MTY1NTI2OH0.0JPgty4nRLXZ9q5JAEh9-38N-ZI30YrA5rDRGrq6bj0'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error fetching token price:', error);
        return null;
    }
};

export const numberWithCommas = (x, digits = 3) => {
    return parseFloat(x).toLocaleString(undefined, { maximumFractionDigits: digits });
};

// Send data between components
export const EventBus = {
    on(event, callback) {
        document.addEventListener(event, (e) => callback(e.detail));
    },
    dispatch(event, data) {
        document.dispatchEvent(new CustomEvent(event, { detail: data }));
    },
    remove(event, callback) {
        document.removeEventListener(event, callback);
    },
};

export const ellipsisAddress = (address, isLong) => {
    if (!isLong)
        return address?.toString()?.slice(0, 4) + "..." + address?.toString()?.slice(-4);
    return address?.toString()?.slice(0, 14) + "..." + address?.toString()?.slice(-12);
}

export const isValidAddress = (addr) => {
    const regex = /^(0x)?[0-9a-fA-F]{40}$/;
    return regex.test(addr);
};

export const formatNumber = (number, decimal = 2) => {
    let suffix = '';
    let formattedNumber = number;

    if (number >= 1e12) {
        suffix = 'T';
        formattedNumber = number / 1e12;
    } else if (number >= 1e9) {
        suffix = 'B';
        formattedNumber = number / 1e9;
    } else if (number >= 1e6) {
        suffix = 'M';
        formattedNumber = number / 1e6;
    } else if (number >= 1e3) {
        suffix = 'k';
        formattedNumber = number / 1e3;
    } else if (number >= 1) {
        decimal = 3
    } else if (number >= 1e-3) {
        decimal = 4
    } else if (number >= 1e-7) {
        decimal = 8
    } else if (number >= 1e-8) {
        decimal = 9
    }
    return (formattedNumber && formattedNumber > 0) ? `${parseFloat(parseFloat(formattedNumber)?.toFixed(decimal))}${suffix}` : 0;
}

export const getUTCTime = (timestamp) => {
    const date = new Date(parseInt(timestamp) * 1000);

    // Get UTC components
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');

    // Format as UTC string
    const utcDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    return utcDate;
}

export const getCurrentDate = () => {
    const date = new Date();

    // Extract the year, month, and day
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based, so add 1
    const day = String(date.getDate()).padStart(2, '0');

    // Format the date as yyyy-mm-dd
    return `${year}-${month}-${day}`;
};

export const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export const validateEmail = (email) => {
    return email.match(
        /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

export const enableTrading = async (signer, template, tokenAddress, deadBlock) => {
    if (!isValidAddress(tokenAddress)) {
        console.log("Invalid token address!");
        return false;
    }

    if (template == TEMPLATES[6] && isNaN(Number(deadBlock))) {
        console.log("Invalid block number!");
        return false;
    }

    try {
        const tokenContract = new ethers.Contract(
            tokenAddress,
            tokenABI,
            signer
        );

        let tx;
        if (template == TEMPLATES[0]) {
            tx = await tokenContract.enableTrading();
        } else if (template == TEMPLATES[1]) {
            tx = await tokenContract.openTrading();
        } else if (template == TEMPLATES[2]) {
            tx = await tokenContract.startTrading();
        } else if (template == TEMPLATES[3]) {
            tx = await tokenContract.activateTrading();
        } else if (template == TEMPLATES[4]) {
            tx = await tokenContract.trade();
        } else if (template == TEMPLATES[5]) {
            tx = await tokenContract.launch();
        } else if (template == TEMPLATES[6]) {
            tx = await tokenContract.start(deadBlock);
        }

        if (tx) {
            await tx.wait();
            return true;
        }

    } catch (err) {
        console.log(err);
    }

    return false;
}

export const removeLimits = async (signer, template, tokenAddress) => {
    if (!isValidAddress(tokenAddress)) {
        console.log("Invalid token address!");
        return false;
    }

    try {
        const tokenContract = new ethers.Contract(
            tokenAddress,
            tokenABI,
            signer
        );

        const tx = await tokenContract.removeLimits();

        if (tx) {
            await tx.wait();
            return true;
        }

    } catch (err) {
        console.log(err);
    }

    return false;
}

export const updateMaxWalletAmount = async (signer, template, tokenAddress, amount) => {
    if (!isValidAddress(tokenAddress)) {
        console.log("Invalid token address!");
        return false;
    }

    try {
        const tokenContract = new ethers.Contract(
            tokenAddress,
            tokenABI,
            signer
        );

        let tx;
        if (template == TEMPLATES[0] || template == TEMPLATES[4] || template == TEMPLATES[5] || template == TEMPLATES[6]) {
            tx = await tokenContract.updateMaxWalletAmount(amount);
        } else if (template == TEMPLATES[1] || template == TEMPLATES[2]) {
            tx = await tokenContract.updateMaxWalletSize(amount);
        } else if (template == TEMPLATES[3]) {
            tx = await tokenContract.updateMaxTokensPerWallet(amount);
        }

        if (tx) {
            await tx.wait();
            return true;
        }

    } catch (err) {
        console.log(err);
    }

    return false;
}

export const updateMaxTransactionAmount = async (signer, template, tokenAddress, amount) => {
    if (!isValidAddress(tokenAddress)) {
        console.log("Invalid token address!");
        return false;
    }

    try {
        const tokenContract = new ethers.Contract(
            tokenAddress,
            tokenABI,
            signer
        );

        let tx;
        if (template == TEMPLATES[0] || template == TEMPLATES[4] || template == TEMPLATES[5] || template == TEMPLATES[6]) {
            tx = await tokenContract.updateMaxTxnAmount(amount);
        } else if (template == TEMPLATES[1]) {
            tx = await tokenContract.updateMaxTransaction(amount);
        } else if (template == TEMPLATES[2]) {
            tx = await tokenContract.updateMaxTransactionSize(amount)
        } else if (template == TEMPLATES[3]) {
            tx = await tokenContract.updateMaxTokenAmountPerTxn(amount);
        }

        if (tx) {
            await tx.wait();
            return true;
        }

    } catch (err) {
        console.log(err);
    }

    return false;
}

export const updateMaxTxnExemption = async (signer, template, tokenAddress, walletAddress, isExcluded) => {
    if (!isValidAddress(tokenAddress)) {
        console.log("Invalid token address!");
        return false;
    }

    if (!isValidAddress(walletAddress)) {
        console.log("Invalid wallet address!");
        return false;
    }

    try {
        const tokenContract = new ethers.Contract(
            tokenAddress,
            tokenABI,
            signer
        );

        let tx;
        if (template == TEMPLATES[0] || template == TEMPLATES[1] || template == TEMPLATES[4] || template == TEMPLATES[5] || template == TEMPLATES[6]) {
            tx = await tokenContract.excludeFromMaxTransaction(walletAddress, isExcluded);
        } else if (template == TEMPLATES[2]) {
            tx = await tokenContract.excludeFromMaxTransactionSize(walletAddress, isExcluded);
        } else if (template == TEMPLATES[3]) {
            tx = await tokenContract.excludeFromMaxTokenAmountPerTxn(walletAddress, isExcluded)
        }

        if (tx) {
            await tx.wait();
            return true;
        }

    } catch (err) {
        console.log(err);
    }

    return false;
}

export const updateTaxExemption = async (signer, template, tokenAddress, walletAddress, isExcluded) => {
    if (!isValidAddress(tokenAddress)) {
        console.log("Invalid token address!");
        return false;
    }

    if (!isValidAddress(walletAddress)) {
        console.log("Invalid wallet address!");
        return false;
    }

    try {
        const tokenContract = new ethers.Contract(
            tokenAddress,
            tokenABI,
            signer
        );

        let tx;
        if (template == TEMPLATES[0] || template == TEMPLATES[1] || template == TEMPLATES[4] || template == TEMPLATES[5] || template == TEMPLATES[6]) {
            tx = await tokenContract.excludeFromFees(walletAddress, isExcluded);
        } else if (template == TEMPLATES[2] || template == TEMPLATES[3]) {
            tx = await tokenContract.excludeFromTax(walletAddress, isExcluded);
        }

        if (tx) {
            await tx.wait();
            return true;
        }

    } catch (err) {
        console.log(err);
    }

    return false;
}

export const updateBlackList = async (signer, template, tokenAddress, walletAddress, isExcluded) => {
    if (!isValidAddress(tokenAddress)) {
        console.log("Invalid token address!");
        return false;
    }

    if (!isValidAddress(walletAddress)) {
        console.log("Invalid wallet address!");
        return false;
    }

    try {
        const tokenContract = new ethers.Contract(
            tokenAddress,
            tokenABI,
            signer
        );

        const tx = await tokenContract.setBlackList([walletAddress], isExcluded);

        if (tx) {
            await tx.wait();
            return true;
        }

    } catch (err) {
        console.log(err);
    }

    return false;
}

export const transferOwnership = async (signer, template, tokenAddress, newOwnerAddress) => {
    if (!isValidAddress(tokenAddress)) {
        console.log("Invalid token address!");
        return false;
    }

    if (!isValidAddress(newOwnerAddress)) {
        console.log("Invalid new owner address!");
        return false;
    }

    try {
        const tokenContract = new ethers.Contract(
            tokenAddress,
            tokenABI,
            signer
        );

        const tx = await tokenContract.transferOwnership(newOwnerAddress);

        if (tx) {
            await tx.wait();
            return true;
        }

    } catch (err) {
        console.log(err);
    }

    return false;
}

export const renounceOwnership = async (signer, template, tokenAddress) => {
    if (!isValidAddress(tokenAddress)) {
        console.log("Invalid token address!");
        return false;
    }

    try {
        const tokenContract = new ethers.Contract(
            tokenAddress,
            tokenABI,
            signer
        );

        const tx = await tokenContract.renounceOwnership();

        if (tx) {
            await tx.wait();
            return true;
        }

    } catch (err) {
        console.log(err);
    }

    return false;
}

export const getPairAddress = async (provider, chainId, tokenAddress) => {
    console.log(`Getting pair address on network...`, tokenAddress, chainId);

    const chainName = chainId == 1 ? "eth" : "sepolia";

    if (!tokenAddress || tokenAddress === "") {
        console.log("No project token address!")
        return
    }
    try {
        const tokenContract = new ethers.Contract(
            tokenAddress,
            tokenABI,
            provider
        )

        const factoryContract = new ethers.Contract(
            FACTORY_V2[chainName],
            factoryABI,
            provider
        );
        const pairAddress = await factoryContract.getPair(WETH[chainName], tokenAddress)

        return pairAddress;
    } catch (err) {
        console.log(`While getting project token price on ${chainName} network, error occurs.`, err)
    }
}

export const checkActivePool = async (provider, pairAddress) => {
    console.log(`Checking pool on network...`, pairAddress,);

    if (!pairAddress || pairAddress === "") {
        console.log("No pair address!")
        return false;
    }
    try {
        const pairContract = new ethers.Contract(
            pairAddress,
            pairABI,
            provider
        )

        const reserves = await pairContract.getReserves();
        console.log(reserves)
        if (reserves[0].toString() != '0' && reserves[1].toString() != '0')
            return true;
    } catch (err) {
        console.log(`While checking pool on network, error occurs.`, err)
    }
    return false;
}