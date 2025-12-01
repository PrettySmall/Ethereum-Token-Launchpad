/* eslint-disable react/prop-types */
import { createPortal } from "react-dom";
import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../App";
import { useAccount, useChainId } from "wagmi";
import { useEthersSigner } from "../../utils/provider";
import { TEMPLATES } from "../../utils/constants";
import { Listbox } from "@headlessui/react";
import { IoIosArrowDown } from "react-icons/io";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import axios from "axios";
import { sleep } from "../../utils/methods";
import AdvancedModal from "../Dialogs/AdvancedModal";
import { isValidAddress } from "../../utils/methods";
import PaymentDialog from "../Dialogs/PaymentDialog";
import { FaLink } from "react-icons/fa";

export default function _2CreateSmartContract(props) {
    const {
        SERVER_URL,
        setCurrentProject,
        setLoadingPrompt,
        setLoadingDesc,
        setOpenLoading,
        sigData,
        signingData
    } = useContext(AppContext);

    const { selectedProject, setSelectedProject, setStep: setMainStep, type = "standard" } = props;

    const chainId = useChainId();
    const { isConnected } = useAccount();
    const signer = useEthersSigner(chainId);

    const [template, setTemplate] = useState(TEMPLATES[0]);
    const [name, setName] = useState("");
    const [symbol, setSymbol] = useState("");
    const [decimals, setDecimals] = useState("18");
    const [totalSupply, setTotalSupply] = useState("");
    const [maxTokensPerTxn, setMaxTokensPerTxn] = useState("");
    const [maxTokensPerWallet, setMaxTokensPerWallet] = useState("");
    const [maxSwapbackThreshold, setMaxSwapbackThreshold] = useState("");
    const [websiteUrl, setWebsiteUrl] = useState("");
    const [twitterUrl, setTwitterUrl] = useState("");
    const [telegramUrl, setTelegramUrl] = useState("");
    const [discordUrl, setDiscordUrl] = useState("");
    const [description, setDescription] = useState("");
    const [marketingOption, setMarketingOption] = useState(true);
    const [marketingBuyTax, setMarketingBuyTax] = useState("");
    const [marketingSellTax, setMarketingSellTax] = useState("");
    const [marketingWallet, setMarketingWallet] = useState("");
    const [developmentOption, setDevelopmentOption] = useState(true);
    const [developmentBuyTax, setDevelopmentBuyTax] = useState("");
    const [developmentSellTax, setDevelopmentSellTax] = useState("");
    const [developmentWallet, setDevelopmentWallet] = useState("");

    const [taxWallet, setTaxWallet] = useState("");
    const [initialBuyTax, setInitialBuyTax] = useState("");
    const [initialSellTax, setInitialSellTax] = useState("");
    const [buyTax, setBuyTax] = useState("");
    const [sellTax, setSellTax] = useState("");
    const [reduceBuyTaxAt, setReduceBuyTaxAt] = useState("");
    const [reduceSellTaxAt, setReduceSellTaxAt] = useState("");

    const [contractName, setContractName] = useState("");
    const [contractContent, setContractContent] = useState("");
    const [payPackage, setPayPackage] = useState(selectedProject.paymentId)

    const [deploying, setDeploying] = useState(false);
    const [usageAgreement, setUsageAgreement] = useState(false);

    const [showUsageAgreement, setShowUsageAgreement] = useState(false);
    const [showTemplateInfo, setShowTemplateInfo] = useState(false);
    const [showMaxTxnInfo, setShowMaxTxnInfo] = useState(false);
    const [showMaxWalletInfo, setShowMaxWalletInfo] = useState(false);
    const [showMaxSwapBackInfo, setShowMaxSwapBackInfo] = useState(false);

    const [contractAddress, setContractAddress] = useState("");
    const steps = ["Create Smart Contract", "Pay", "Deploy"];
    const buttonTxts = [
        "Deploy Smart Contract",
        "Click Here to Make Payment",
        "Deploy",
    ];
    const [step, setStep] = useState(0);
    const [paymentDialog, setPaymentDialog] = useState(false);
    const [checksum, setChecksum] = useState("");
    const [depositWallet, setDepositWallet] = useState();
    const [expireTime, setExpireTime] = useState();

    const isTemplate56 = template === TEMPLATES[4] || template === TEMPLATES[5];

    const inputCSSString = "token-deploy-input rounded-xl outline-none text-orange placeholder:text-gray-border px-2.5 w-full h-8 mt-1";

    useEffect(() => {
        setPayPackage(selectedProject.paymentId);
    }, [selectedProject.paymentId])

    const handleCheck = (checksum) => {
        const id = setInterval(async () => {
            console.log("Checking...", checksum);
            const { data } = await axios.post(
                `${SERVER_URL}/api/v1/misc/check-pay-confirmed`,
                {
                    checksum,
                    sigData,
                    signingData
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            if (data.success && data.checked) {
                setPaymentDialog(false);

                clearInterval(id);
                setStep(2);
            } else if (data.success && !data.checked) {
                clearInterval(id);
            } else {
                setExpireTime(data.expireTime);
            }
        }, 1000);
    };

    const handleActions = async () => {
        if (step === 0) {
            if (!isConnected) {
                toast.warn("Please connect wallet!");
                return;
            }

            if (template != 'Custom') {

                if (name === "") {
                    toast.warn("Please input token name");
                    return;
                }

                if (symbol === "") {
                    toast.warn("Please input token symbol");
                    return;
                }

                const numDecimals = parseInt(decimals);
                if (isNaN(numDecimals) || numDecimals <= 0) {
                    toast.warn("Invalid decimals");
                    return;
                }

                const numTotalSupply = parseInt(totalSupply.replaceAll(",", ""));
                if (isNaN(numTotalSupply) || numTotalSupply <= 0) {
                    toast.warn("Invalid total supply");
                    return;
                }

                const numMaxTokensPerTxn = parseInt(maxTokensPerTxn.replaceAll(",", ""));
                if (
                    isNaN(numMaxTokensPerTxn) ||
                    numMaxTokensPerTxn <= 0 ||
                    numMaxTokensPerTxn > numTotalSupply
                ) {
                    toast.warn("Invalid max tokens per transaction");
                    return;
                }

                const numMaxTokensPerWallet = parseInt(
                    maxTokensPerWallet.replaceAll(",", "")
                );
                if (
                    isNaN(numMaxTokensPerWallet) ||
                    numMaxTokensPerWallet <= 0 ||
                    numMaxTokensPerWallet > numTotalSupply
                ) {
                    toast.warn("Invalid max tokens per wallet");
                    return;
                }

                const numMaxSwapbackThreshold = parseInt(
                    maxSwapbackThreshold.replaceAll(",", "")
                );
                if (
                    isNaN(numMaxSwapbackThreshold) ||
                    numMaxSwapbackThreshold <= 0 ||
                    numMaxSwapbackThreshold > numTotalSupply
                ) {
                    toast.warn("Invalid max swapback threshold");
                    return;
                }

                if (!isTemplate56) {
                    if (marketingOption) {
                        if (!isValidAddress(marketingWallet)) {
                            toast.warn("Invalid marketing wallet");
                            return;
                        }

                        const numBuyTax = parseInt(marketingBuyTax);
                        if (isNaN(numBuyTax) || numBuyTax < 0) {
                            toast.warn("Invalid marketing buy tax");
                            return;
                        }

                        const numSellTax = parseInt(marketingSellTax);
                        if (isNaN(numSellTax) || numSellTax < 0) {
                            toast.warn("Invalid marketing sell tax");
                            return;
                        }
                    }

                    if (developmentOption) {
                        if (!isValidAddress(developmentWallet)) {
                            toast.warn("Invalid development wallet");
                            return;
                        }

                        const numBuyTax = parseInt(developmentBuyTax);
                        if (isNaN(numBuyTax) || numBuyTax < 0) {
                            toast.warn("Invalid development buy tax");
                            return;
                        }

                        const numSellTax = parseInt(developmentSellTax);
                        if (isNaN(numSellTax) || numSellTax < 0) {
                            toast.warn("Invalid development sell tax");
                            return;
                        }
                    }
                } else {
                    if (!isValidAddress(taxWallet)) {
                        toast.warn("Invalid tax wallet");
                        return;
                    }

                    const numInitialBuyTax = parseInt(initialBuyTax);
                    if (isNaN(numInitialBuyTax) || numInitialBuyTax < 0) {
                        toast.warn("Invalid initial buy tax");
                        return;
                    }

                    const numInitialSellTax = parseInt(initialSellTax);
                    if (isNaN(numInitialSellTax) || numInitialSellTax < 0) {
                        toast.warn("Invalid initial sell tax");
                        return;
                    }

                    const numBuyTax = parseInt(buyTax);
                    if (isNaN(numBuyTax) || numBuyTax < 0) {
                        toast.warn("Invalid buy tax");
                        return;
                    }

                    const numSellTax = parseInt(sellTax);
                    if (isNaN(numSellTax) || numSellTax < 0) {
                        toast.warn("Invalid sell tax");
                        return;
                    }

                    const numReduceBuyTaxAt = parseInt(reduceBuyTaxAt);
                    if (isNaN(numReduceBuyTaxAt) || numReduceBuyTaxAt < 0) {
                        toast.warn("Invalid reduce buy tax at");
                        return;
                    }

                    const numReduceSellTaxAt = parseInt(reduceSellTaxAt);
                    if (isNaN(numReduceSellTaxAt) || numReduceSellTaxAt < 0) {
                        toast.warn("Invalid reduce sell tax at");
                        return;
                    }
                }
            } else {
                if (contractName.trim() == "") {
                    toast.warn("Please input contract name");
                    return;
                }

                if (contractContent == "") {
                    toast.warn("Empty contract content");
                    return;
                }
            }
            setLoadingPrompt("Compiling token...");
            setOpenLoading(true);
            try {
                const { data } = await axios.post(
                    `${SERVER_URL}/api/v1/misc/compile-token`,
                    {
                        template,
                        name: name.replaceAll(" ", "").replaceAll(",", "").replaceAll("-", ""),
                        symbol,
                        decimals,
                        totalSupply: totalSupply.replaceAll(",", ""),
                        maxTokensPerTxn: maxTokensPerTxn.replaceAll(",", ""),
                        maxTokensPerWallet: maxTokensPerWallet.replaceAll(",", ""),
                        maxSwapbackThreshold: maxSwapbackThreshold.replaceAll(",", ""),
                        websiteUrl,
                        twitterUrl,
                        telegramUrl,
                        discordUrl,
                        description,
                        marketingOption,
                        marketingWallet,
                        marketingBuyTax: parseInt(marketingBuyTax),
                        marketingSellTax: parseInt(marketingSellTax),
                        developmentOption,
                        developmentWallet,
                        developmentBuyTax: parseInt(developmentBuyTax),
                        developmentSellTax: parseInt(developmentSellTax),
                        taxWallet,
                        initialBuyTax: parseInt(initialBuyTax),
                        initialSellTax: parseInt(initialSellTax),
                        buyTax: parseInt(buyTax),
                        sellTax: parseInt(sellTax),
                        reduceBuyTaxAt: parseInt(reduceBuyTaxAt),
                        reduceSellTaxAt: parseInt(reduceSellTaxAt),
                        contractContent: contractContent,
                        contractName: contractName.replaceAll(" ", "").replaceAll(",", "").replaceAll("-", ""),
                        sigData,
                        signingData
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                );
                if (data.success) {
                    toast.success("Compiled successfully.");
                    setChecksum(data.checksum);
                    handleCheck(data.checksum);
                    setStep(1);
                }
                setOpenLoading(false);
            } catch (err) {
                setOpenLoading(false);
                toast.warn("Failed in compiling token");
            }
        } else if (step === 1) {
            setLoadingPrompt("Processing...");
            setOpenLoading(true);
            try {
                const { data } = await axios.post(
                    `${SERVER_URL}/api/v1/misc/pay-create-token`,
                    {
                        checksum,
                        chainId,
                        sigData,
                        signingData
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                );
                if (data.success) {
                    setDepositWallet(data.payload.depositWallet);
                    setExpireTime(data.payload.expireTime);

                    setPaymentDialog(true);
                }
                setOpenLoading(false);
            } catch (err) {
                setOpenLoading(false);
                toast.warn("Failed in creating deposit wallet!");
            }
        } else if (step === 2) {
            setLoadingPrompt("Deploying...");
            setOpenLoading(true);
            const { data } = await axios.post(
                `${SERVER_URL}/api/v1/misc/get-contract-object`,
                {
                    checksum,
                    sigData,
                    signingData
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            if (data.success) {
                const factory = new ethers.ContractFactory(
                    data.abi,
                    data.bytecode,
                    signer
                );
                const contract = await factory.deploy();
                await contract.waitForDeployment()
                if (contract.target) {
                    setLoadingPrompt("Verifying token...");

                    try {
                        const form = new FormData();
                        form.append("apikey", import.meta.env.VITE_ETHERSCAN_API_KEY);
                        form.append("module", "contract");
                        form.append("action", "verifysourcecode");
                        form.append("chainId", chainId);
                        form.append("codeformat", data.codeFormat);
                        form.append("compilerversion", data.compilerVersion);
                        form.append("contractaddress", contract.target);
                        form.append("contractname", data.name);
                        form.append("runs", 200);
                        form.append("sourceCode", JSON.stringify(data.sourceCode));

                        const sentTime = Date.now();
                        while (Date.now() - sentTime <= 120000) {
                            try {
                                console.log("Sending verify request...");
                                const { data: verifyResponse } = await axios.post(
                                    chainId === 1
                                        ? "https://api.etherscan.io/api"
                                        : "https://api-sepolia.etherscan.io/api",
                                    form,
                                    {
                                        headers: {
                                            "Content-Type": "multipart/form-data",
                                        },
                                    }
                                );
                                await sleep(5000);

                                if (verifyResponse.message === "OK") {
                                    console.log("Checking verify status...");
                                    const { data: checkResponse } = await axios.get(
                                        `${chainId === 1 ? "https://api.etherscan.io/api" : "https://api-sepolia.etherscan.io/api"}?module=contract&action=checkverifystatus&guid=${verifyResponse.result
                                        }&apikey=${import.meta.env.VITE_ETHERSCAN_API_KEY}`
                                    );

                                    console.log("Check Status:", checkResponse);
                                    if (
                                        checkResponse.message === "OK" ||
                                        checkResponse.result === "Already Verified"
                                    ) {
                                        console.log("Succeed to verify contract");
                                        break;
                                    }
                                } else {
                                    console.log("Failed to verify contract");
                                    // break;
                                }
                                await sleep(5000);
                            } catch (err) {
                                console.log(err);
                                break;
                            }
                        }
                    } catch (err) {
                        console.log(err);
                    }
                }
                setOpenLoading(false);
                setContractAddress(contract.target);

                let updatedProject = { ...selectedProject };
                updatedProject.token = { address: contract.target };
                setSelectedProject(updatedProject);
                setMainStep(p => p + 1);

                toast.success("Succeed to deploy token");
                setStep(0);
            } else {
                toast.warn(data.error);
                setOpenLoading(false);
                setStep(0);
            }
        }
    };

    const handleDeployToken = async () => {
        if (!isConnected) {
            toast.warn("Please connect wallet!");
            return;
        }

        if (template != "Custom") {
            if (name === "") {
                toast.warn("Please input token name");
                return;
            }

            if (symbol === "") {
                toast.warn("Please input token symbol");
                return;
            }

            const numDecimals = parseInt(decimals);
            if (isNaN(numDecimals) || numDecimals <= 0) {
                toast.warn("Invalid decimals");
                return;
            }

            const numTotalSupply = parseInt(totalSupply.replaceAll(",", ""));
            if (isNaN(numTotalSupply) || numTotalSupply <= 0) {
                toast.warn("Invalid total supply");
                return;
            }

            const numMaxTokensPerTxn = parseInt(maxTokensPerTxn.replaceAll(",", ""));
            if (isNaN(numMaxTokensPerTxn) || numMaxTokensPerTxn <= 0 || numMaxTokensPerTxn > numTotalSupply) {
                toast.warn("Invalid max tokens per transaction");
                return;
            }

            const numMaxTokensPerWallet = parseInt(maxTokensPerWallet.replaceAll(",", ""));
            if (isNaN(numMaxTokensPerWallet) || numMaxTokensPerWallet <= 0 || numMaxTokensPerWallet > numTotalSupply) {
                toast.warn("Invalid max tokens per wallet");
                return;
            }

            const numMaxSwapbackThreshold = parseInt(maxSwapbackThreshold.replaceAll(",", ""));
            if (isNaN(numMaxSwapbackThreshold) || numMaxSwapbackThreshold <= 0 || numMaxSwapbackThreshold > numTotalSupply) {
                toast.warn("Invalid max swapback threshold");
                return;
            }

            if (!isTemplate56) {
                if (marketingOption) {
                    if (!isValidAddress(marketingWallet)) {
                        toast.warn("Invalid marketing wallet");
                        return;
                    }

                    const numBuyTax = parseInt(marketingBuyTax);
                    if (isNaN(numBuyTax) || numBuyTax < 0) {
                        toast.warn("Invalid marketing buy tax");
                        return;
                    }

                    const numSellTax = parseInt(marketingSellTax);
                    if (isNaN(numSellTax) || numSellTax < 0) {
                        toast.warn("Invalid marketing sell tax");
                        return;
                    }
                }

                if (developmentOption) {
                    if (!isValidAddress(developmentWallet)) {
                        toast.warn("Invalid development wallet");
                        return;
                    }

                    const numBuyTax = parseInt(developmentBuyTax);
                    if (isNaN(numBuyTax) || numBuyTax < 0) {
                        toast.warn("Invalid development buy tax");
                        return;
                    }

                    const numSellTax = parseInt(developmentSellTax);
                    if (isNaN(numSellTax) || numSellTax < 0) {
                        toast.warn("Invalid development sell tax");
                        return;
                    }
                }
            }
            else {
                if (!isValidAddress(taxWallet)) {
                    toast.warn("Invalid tax wallet");
                    return;
                }

                const numInitialBuyTax = parseInt(initialBuyTax);
                if (isNaN(numInitialBuyTax) || numInitialBuyTax < 0) {
                    toast.warn("Invalid initial buy tax");
                    return;
                }

                const numInitialSellTax = parseInt(initialSellTax);
                if (isNaN(numInitialSellTax) || numInitialSellTax < 0) {
                    toast.warn("Invalid initial sell tax");
                    return;
                }

                const numBuyTax = parseInt(buyTax);
                if (isNaN(numBuyTax) || numBuyTax < 0) {
                    toast.warn("Invalid buy tax");
                    return;
                }

                const numSellTax = parseInt(sellTax);
                if (isNaN(numSellTax) || numSellTax < 0) {
                    toast.warn("Invalid sell tax");
                    return;
                }

                const numReduceBuyTaxAt = parseInt(reduceBuyTaxAt);
                if (isNaN(numReduceBuyTaxAt) || numReduceBuyTaxAt < 0) {
                    toast.warn("Invalid reduce buy tax at");
                    return;
                }

                const numReduceSellTaxAt = parseInt(reduceSellTaxAt);
                if (isNaN(numReduceSellTaxAt) || numReduceSellTaxAt < 0) {
                    toast.warn("Invalid reduce sell tax at");
                    return;
                }
            }
        } else {
            if (contractName.trim() == "") {
                toast.warn("Please input contract name");
                return;
            }

            if (contractContent == "") {
                toast.warn("Empty contract content");
                return;
            }
        }

        // setLoadingPrompt("Deploying token...");
        // setOpenLoading(true);
        setDeploying(true)
        setOpenLoading(true)
        setLoadingPrompt("Compiling token...")
        try {
            const { data } = await axios.post(`${SERVER_URL}/api/v1/misc/compile-token`,
                {
                    template,
                    name: name.replaceAll(" ", "").replaceAll(",", "").replaceAll("-", ""),
                    symbol,
                    decimals,
                    totalSupply: totalSupply.replaceAll(",", ""),
                    maxTokensPerTxn: maxTokensPerTxn.replaceAll(",", ""),
                    maxTokensPerWallet: maxTokensPerWallet.replaceAll(",", ""),
                    maxSwapbackThreshold: maxSwapbackThreshold.replaceAll(",", ""),
                    websiteUrl,
                    twitterUrl,
                    telegramUrl,
                    discordUrl,
                    description,
                    marketingOption,
                    marketingWallet,
                    marketingBuyTax,
                    marketingSellTax,
                    developmentOption,
                    developmentWallet,
                    developmentBuyTax,
                    developmentSellTax,
                    taxWallet,
                    initialBuyTax,
                    initialSellTax,
                    buyTax,
                    sellTax,
                    reduceBuyTaxAt,
                    reduceSellTaxAt,
                    contractContent,
                    contractName: contractName.replaceAll(" ", "").replaceAll(",", "").replaceAll("-", ""),
                    payPackage,
                    sigData,
                    signingData
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            setLoadingPrompt("Contract Deployment and Verification in Progress")
            setLoadingDesc("We’re deploying your Ethereum contract and verifying it on the network. This may take a few moments. Please ensure you sign the necessary transactions through your browser extension. Avoid refreshing or closing the browser until the deployment and verification are completed.");
            // console.log("Contract:", data.contract);
            const factory = new ethers.ContractFactory(data.contract.abi, data.contract.bytecode, signer);
            const contract = await factory.deploy();
            await contract.waitForDeployment()
            if (contract.target) {
                // setLoadingPrompt("Verifying token...");

                const form = new FormData();
                form.append("apikey", import.meta.env.VITE_ETHERSCAN_API_KEY);
                form.append("module", "contract");
                form.append("action", "verifysourcecode");
                form.append("chainId", chainId);
                form.append("codeformat", data.contract.codeFormat);
                form.append("compilerversion", data.contract.compilerVersion);
                form.append("contractaddress", contract.target);
                form.append("contractname", data.contract.name);
                form.append("runs", 200);
                form.append("sourceCode", JSON.stringify(data.contract.sourceCode));

                const sentTime = Date.now();
                while (Date.now() - sentTime <= 120000) {
                    try {
                        console.log("Sending verify request...");
                        const { data: verifyResponse } = await axios.post(
                            chainId === 1
                                ? "https://api.etherscan.io/api"
                                : "https://api-sepolia.etherscan.io/api",
                            form, {
                            headers: {
                                "Content-Type": "multipart/form-data",
                            },
                        });
                        await sleep(5000);

                        if (verifyResponse.message === "OK") {
                            console.log("Checking verify status...");
                            const { data: checkResponse } = await axios.get(
                                `${chainId === 1 ? "https://api.etherscan.io/api" : "https://api-sepolia.etherscan.io/api"}?module=contract&action=checkverifystatus&guid=${verifyResponse.result}&apikey=${import.meta.env.VITE_ETHERSCAN_API_KEY}`
                            );

                            console.log("Check Status:", checkResponse);
                            if (checkResponse.message === "OK" || checkResponse.result === "Already Verified") {
                                console.log("Succeed to verify contract");
                                break;
                            }
                        }
                        else {
                            console.log("Failed to verify contract");
                            // break;
                        }
                        await sleep(5000);
                    }
                    catch (err) {
                        console.log(err);
                    }
                }
            }
            // setMainStep(1)

            toast.success("Succeed to deploy token");

            if (selectedProject._id) {
                await handleSetTokenAddress(selectedProject._id, contract.target)
            } else {
                let updatedProject = { ...selectedProject };
                updatedProject.token = { address: contract.target };
                setSelectedProject(updatedProject);
                setMainStep(p => p + 1);
            }
        }
        catch (err) {
            console.log(err);
            toast.warn("Failed to deploy token");
        }
        setDeploying(false);
        setOpenLoading(false);
        setLoadingDesc("");
    };

    const handleSetTokenAddress = async (projectId, tokenAddress) => {
        console.log("Setting token address to selected project...", projectId, tokenAddress);
        setLoadingPrompt("Setting Token Address...")
        try {
            const { data } = await axios.post(`${SERVER_URL}/api/v1/project/set-token-address`,
                {
                    projectId,
                    address: tokenAddress,
                    sigData,
                    signingData
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            if (data.success) {
                let updatedProject = { ...selectedProject };
                updatedProject.token = { address: tokenAddress };
                setSelectedProject(updatedProject);
                setCurrentProject(updatedProject);
                toast.success("Project Updated Successfully");
                setMainStep(2);
            } else {
                console.log(data.error);
                toast.warn("Failed to set token address");
            }
        }
        catch (err) {
            console.log(err)
            toast.error("Failed to set token address");
        }
    };

    return (
        <div className="flex flex-col gap-4 w-full rounded-b-[10px]">
            <div className="">
                <div className="flex gap-2 items-center justify-start text-white text-right pr-2">
                    Enable Trading Function
                    <img className="w-4 h-4 hover:brightness-125 cursor-pointer" src="/assets/icon/ic_info.svg" onClick={() => setShowTemplateInfo(true)} />
                </div>
                <div className="relative mt-1 w-full">
                    <Listbox value={template} onChange={setTemplate}>
                        <Listbox.Button
                            className={inputCSSString}
                        >
                            <span className="flex items-center">
                                <span className="block truncate">
                                    {template}
                                </span>
                            </span>
                            <IoIosArrowDown className="absolute inset-y-0 -right-1 flex items-center w-8 pr-2 mt-2.5 pointer-events-none opacity-50" />
                        </Listbox.Button>
                        <Listbox.Options className="absolute z-20 w-full overflow-auto text-xs border border-t-0 text-gray-normal mt bg-gray-dark border-gray-border">
                            {
                                // [...TEMPLATES, "Custom"].map((item, index) => {
                                [...TEMPLATES].map((item, index) => {
                                    return (
                                        <Listbox.Option key={index}
                                            className={`relative px-2 py-1 cursor-default hover:bg-gray-border ${item === template && "text-white"}`}
                                            value={item}
                                        >
                                            <div className="flex items-center">
                                                <span className="block font-normal truncate">
                                                    {item}
                                                </span>
                                            </div>
                                        </Listbox.Option>
                                    );
                                })
                            }
                        </Listbox.Options>
                    </Listbox>
                </div>
            </div>
            {template != "Custom" ? (
                <>
                    <div className="flex justify-between gap-4">
                        <div className="w-[50%] items-center">
                            <div className="text-white text-left pr-2">
                                {"Name (Do not use the following characters:  \\ / : * ? \" < > | . )"}
                            </div>
                            <input
                                className={inputCSSString}
                                placeholder="Enter token name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="w-[50%] items-center">
                            <div className="text-white text-left pr-2">
                                {"Symbol (Do not use the following characters:  \\ / : * ? \" < > | . )"}
                            </div>
                            <input
                                className={inputCSSString}
                                placeholder="Enter token symbol"
                                value={symbol}
                                onChange={(e) => setSymbol(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex justify-between gap-4">
                        <div className="w-[50%] items-center">
                            <div className="text-white text-left pr-2">
                                Decimals
                            </div>
                            <input
                                className={inputCSSString}
                                placeholder="Enter decimals"
                                value={decimals}
                                onChange={(e) => {
                                    const rawValue = e.target.value.replace(/\D/g, "");
                                    setDecimals(rawValue)
                                }}
                            />
                        </div>
                        <div className="w-[50%] items-center">
                            <div className="text-white text-left pr-2">
                                Total Supply
                            </div>
                            <input
                                className={inputCSSString}
                                placeholder="Enter total supply"
                                value={totalSupply != "" ? Number(totalSupply).toLocaleString() : ""}
                                onChange={(e) => {
                                    const rawValue = e.target.value.replace(/\D/g, "");
                                    setTotalSupply(rawValue);
                                }}
                            />
                        </div>
                    </div>
                    <div className="flex justify-between gap-4">
                        <div className="w-[50%] items-center">
                            <div className="flex gap-2 items-center text-white text-left pr-2">
                                {"Max Tokens Per Transaction (Whole numbers only, no decimal or percentage values)"}
                                <img className="w-4 h-4 hover:brightness-125 cursor-pointer" src="/assets/icon/ic_info.svg" onClick={() => setShowMaxTxnInfo(true)} />
                            </div>
                            <input
                                className={inputCSSString}
                                placeholder="Enter max tokens per transaction"
                                value={maxTokensPerTxn != "" ? Number(maxTokensPerTxn).toLocaleString() : ""}
                                onChange={(e) => {
                                    const rawValue = e.target.value.replace(/\D/g, "");
                                    setMaxTokensPerTxn(rawValue)
                                }}
                            />
                        </div>
                        <div className="w-[50%] items-center">
                            <div className="flex gap-2 items-center text-white text-left pr-2">
                                {"Max Tokens Per Wallet (Whole numbers only, no decimal or percentage values)"}
                                <img className="w-4 h-4 hover:brightness-125 cursor-pointer" src="/assets/icon/ic_info.svg" onClick={() => setShowMaxWalletInfo(true)} />
                            </div>
                            <input
                                className={inputCSSString}
                                placeholder="Enter max tokens per wallet"
                                value={maxTokensPerWallet != "" ? Number(maxTokensPerWallet).toLocaleString() : ""}
                                onChange={(e) => {
                                    const rawValue = e.target.value.replace(/\D/g, "");
                                    setMaxTokensPerWallet(rawValue)
                                }}
                            />
                        </div>
                    </div>
                    <div className="">
                        <div className="flex gap-2 items-center text-white text-left pr-2">
                            {"Max Swapback Thereshold (Whole numbers only, no decimal or percentage values)"}
                            <img className="w-4 h-4 hover:brightness-125 cursor-pointer" src="/assets/icon/ic_info.svg" onClick={() => setShowMaxSwapBackInfo(true)} />
                        </div>
                        <input
                            className={inputCSSString}
                            placeholder="Enter max tokens per transaction"
                            value={maxSwapbackThreshold != "" ? Number(maxSwapbackThreshold).toLocaleString() : ""}
                            onChange={(e) => {
                                const rawValue = e.target.value.replace(/\D/g, "");
                                setMaxSwapbackThreshold(rawValue)
                            }}
                        />
                    </div>
                    <div className="flex justify-between gap-4">
                        <div className="w-[25%] items-center">
                            <div className="flex gap-2 items-center text-white text-left pr-2">
                                <FaLink />
                                Website URL (Optional)
                            </div>
                            <input
                                className={inputCSSString}
                                placeholder="Enter Website"
                                value={websiteUrl}
                                onChange={(e) => setWebsiteUrl(e.target.value)}
                            />
                        </div>
                        <div className="w-[25%] items-center">
                            <div className="flex gap-2 items-center text-white text-left pr-2">
                                <FaLink />
                                Twitter URL (Optional)
                            </div>
                            <input
                                className={inputCSSString}
                                placeholder="Enter Twitter Link"
                                value={twitterUrl}
                                onChange={(e) => setTwitterUrl(e.target.value)}
                            />
                        </div>
                        <div className="w-[25%] items-center">
                            <div className="flex gap-2 items-center text-white text-left pr-2">
                                <FaLink />
                                Telegram URL (Optional)
                            </div>
                            <input
                                className={inputCSSString}
                                placeholder="Enter Telegram Channel Link"
                                value={telegramUrl}
                                onChange={(e) => setTelegramUrl(e.target.value)}
                            />
                        </div>
                        <div className="w-[25%] items-center">
                            <div className="flex gap-2 items-center text-white text-left pr-2">
                                <FaLink />
                                Discord URL (Optional)
                            </div>
                            <input
                                className={inputCSSString}
                                placeholder="Enter Discord Link"
                                value={discordUrl}
                                onChange={(e) => setDiscordUrl(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="">
                        <div className="flex gap-2 items-center text-white text-left pr-2">
                            Description (Optional)
                        </div>
                        <input
                            className={inputCSSString}
                            placeholder="Enter a Description For Project"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    {
                        !isTemplate56 &&
                        (<div className="">
                            <label className="flex items-center cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 outline-none bg-gray-highlight accent-dark-purple ring-0"
                                    checked={marketingOption}
                                    onChange={(e) => setMarketingOption(e.target.checked)}
                                />
                                <span className="ml-3 text-gradient-blue-to-purple font-bold">Marketing</span>
                            </label>
                        </div>)
                    }
                    {
                        marketingOption && !isTemplate56 &&
                        (
                            <div className="">
                                <div className="text-white text-left pr-2">
                                    Marketing Wallet
                                </div>
                                <input
                                    className={inputCSSString}
                                    placeholder="Enter marketing wallet"
                                    value={marketingWallet}
                                    onChange={(e) => setMarketingWallet(e.target.value)}
                                />
                            </div>
                        )
                    }
                    {
                        marketingOption && !isTemplate56 &&
                        (
                            <div className="flex justify-between gap-4">
                                <div className="w-[50%]">
                                    <div className="text-white text-left pr-2">
                                        Buy Tax(%)
                                    </div>
                                    <input
                                        className={inputCSSString}
                                        placeholder="Enter marketing buy tax"
                                        value={marketingBuyTax}
                                        onChange={(e) => {
                                            const rawValue = e.target.value.replace(/\D/g, "");
                                            setMarketingBuyTax(rawValue)
                                        }}
                                    />
                                </div>
                                <div className="w-[50%]">
                                    <div className="text-white text-left pr-2">
                                        Sell Tax(%)
                                    </div>
                                    <input
                                        className={inputCSSString}
                                        placeholder="Enter marketing sell tax"
                                        value={marketingSellTax}
                                        onChange={(e) => {
                                            const rawValue = e.target.value.replace(/\D/g, "");
                                            setMarketingSellTax(rawValue)
                                        }}
                                    />
                                </div>
                            </div>
                        )
                    }
                    {
                        !isTemplate56 &&
                        (
                            <div className="">
                                <label className="flex items-center cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 outline-none bg-gray-highlight accent-dark-purple ring-0"
                                        checked={developmentOption}
                                        onChange={(e) => setDevelopmentOption(e.target.checked)}
                                    />
                                    <span className="ml-3 text-gradient-blue-to-purple font-bold">Development</span>
                                </label>
                            </div>
                        )
                    }
                    {
                        developmentOption && !isTemplate56 &&
                        (
                            <div className="">
                                <div className="text-white text-left pr-2">
                                    Development Wallet
                                </div>
                                <input
                                    className={inputCSSString}
                                    placeholder="Enter development wallet"
                                    value={developmentWallet}
                                    onChange={(e) => setDevelopmentWallet(e.target.value)}
                                />
                            </div>
                        )
                    }
                    {
                        developmentOption && !isTemplate56 &&
                        (
                            <div className="flex justify-between gap-4">
                                <div className="w-[50%]">
                                    <div className="text-white text-left pr-2">
                                        Buy Tax(%)
                                    </div>
                                    <input
                                        className={inputCSSString}
                                        placeholder="Enter development buy tax"
                                        value={developmentBuyTax}
                                        onChange={(e) => {
                                            const rawValue = e.target.value.replace(/\D/g, "");
                                            setDevelopmentBuyTax(rawValue)
                                        }}
                                    />
                                </div>
                                <div className="w-[50%]">
                                    <div className="text-white text-left pr-2">
                                        Sell Tax(%)
                                    </div>
                                    <input
                                        className={inputCSSString}
                                        placeholder="Enter development sell tax"
                                        value={developmentSellTax}
                                        onChange={(e) => {
                                            const rawValue = e.target.value.replace(/\D/g, "");
                                            setDevelopmentSellTax(rawValue)
                                        }}
                                    />
                                </div>
                            </div>
                        )
                    }
                    {
                        isTemplate56 &&
                        (<div className="">
                            <div className="text-white text-left pr-2">
                                Tax Wallet
                            </div>
                            <input
                                className={inputCSSString}
                                placeholder="Enter tax wallet"
                                value={taxWallet}
                                onChange={(e) => setTaxWallet(e.target.value)}
                            />
                        </div>)
                    }
                    {
                        isTemplate56 &&
                        (<div className="flex justify-between gap-4">
                            <div className="w-[50%]">
                                <div className="text-white text-left pr-2">
                                    Initial Buy Tax(%)
                                </div>
                                <input
                                    className={inputCSSString}
                                    placeholder="Enter initial buy tax"
                                    value={initialBuyTax}
                                    onChange={(e) => {
                                        const rawValue = e.target.value.replace(/\D/g, "");
                                        setInitialBuyTax(rawValue)
                                    }}
                                />
                            </div>
                            <div className="w-[50%]">
                                <div className="text-white text-left pr-2">
                                    Initial Sell Tax(%)
                                </div>
                                <input
                                    className={inputCSSString}
                                    placeholder="Enter initial sell tax"
                                    value={initialSellTax}
                                    onChange={(e) => {
                                        const rawValue = e.target.value.replace(/\D/g, "");
                                        setInitialSellTax(rawValue)
                                    }}
                                />
                            </div>
                        </div>)
                    }
                    {
                        isTemplate56 &&
                        (<div className="flex justify-between gap-4">
                            <div className="w-[50%]">
                                <div className="text-white text-left pr-2">
                                    Buy Tax(%)
                                </div>
                                <input
                                    className={inputCSSString}
                                    placeholder="Enter buy tax"
                                    value={buyTax}
                                    onChange={(e) => {
                                        const rawValue = e.target.value.replace(/\D/g, "");
                                        setBuyTax(rawValue)
                                    }}
                                />
                            </div>
                            <div className="w-[50%]">
                                <div className="text-white text-left pr-2">
                                    Sell Tax(%)
                                </div>
                                <input
                                    className={inputCSSString}
                                    placeholder="Enter sell tax"
                                    value={sellTax}
                                    onChange={(e) => {
                                        const rawValue = e.target.value.replace(/\D/g, "");
                                        setSellTax(rawValue)
                                    }}
                                />
                            </div>
                        </div>)
                    }
                    {
                        isTemplate56 &&
                        (<div className="flex justify-between gap-4">
                            <div className="w-[50%]">
                                <div className="text-white text-left pr-2">
                                    Reduce Buy Tax At
                                </div>
                                <input
                                    className={inputCSSString}
                                    placeholder="Enter reduce buy tax at"
                                    value={reduceBuyTaxAt != "" ? Number(reduceBuyTaxAt).toLocaleString() : ""}
                                    onChange={(e) => {
                                        const rawValue = e.target.value.replace(/\D/g, "");
                                        setReduceBuyTaxAt(rawValue)
                                    }}
                                />
                            </div>
                            <div className="w-[50%]">
                                <div className="text-white text-left pr-2">
                                    Reduce Sell Tax At
                                </div>
                                <input
                                    className={inputCSSString}
                                    placeholder="Enter reduce sell tax at"
                                    value={reduceSellTaxAt != "" ? Number(reduceSellTaxAt).toLocaleString() : ""}
                                    onChange={(e) => {
                                        const rawValue = e.target.value.replace(/\D/g, "");
                                        setReduceSellTaxAt(rawValue)
                                    }}
                                />
                            </div>
                        </div>)
                    }
                </>
            ) : (
                <div className="h-full flex flex-col">
                    <div className="">
                        <div className="text-white text-left pr-2">
                            Deploy Contract Name
                        </div>
                        <input
                            className={inputCSSString}
                            placeholder="Enter the deploy contract name"
                            value={contractName}
                            onChange={(e) => setContractName(e.target.value)}
                        />
                    </div>
                    <div className="mt-3 h-full">
                        <div className="text-white text-left pr-2">
                            Contract Content
                        </div>
                        <textarea
                            className={inputCSSString}
                            value={contractContent}
                            onChange={(e) => setContractContent(e.target.value)}
                            placeholder="Please type in your own token smart contract"
                        ></textarea>
                    </div>
                </div>
            )}
            <div className="flex items-center gap-2">
                <label className="flex items-center cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 outline-none bg-gray-highlight accent-dark-purple ring-0"
                        checked={usageAgreement}
                        onChange={(e) => setUsageAgreement(e.target.checked)}
                    />
                    <span className="ml-3 text-gradient-blue-to-purple font-bold">I Agree To Usage Agreement</span>
                </label>
                <img className="w-4 h-4 hover:brightness-125 cursor-pointer" src="/assets/icon/ic_info.svg" onClick={() => setShowUsageAgreement(true)} />
            </div>
            <div className="flex flex-row items-center justify-between gap-3 h-full text-white bg-transparent g-clip-border">
                <button
                    className="w-full text-xs font-conthrax font-medium text-center text-white uppercase px-6 h-10 rounded-lg justify-center items-center gap-2.5 inline-flex bg-gradient-blue-to-purple disabled:bg-none disabled:bg-black active:scale-95 disabled:active:scale-100 transition duration-100 ease-in-out transform focus:outline-none"
                    onClick={type == "standard" ? handleDeployToken : handleActions} disabled={deploying || !usageAgreement}
                >
                    {
                        type == "standard" ?
                            deploying ?
                                <img src="/assets/spinner-white.svg" className="w-10 h-10" alt="spinner" /> :
                                "Deploy Smart Contract" :
                            buttonTxts[step]
                    }
                </button>
            </div>
            {
                createPortal(
                    <PaymentDialog isOpen={paymentDialog} ethAmount={0.2} expireTime={expireTime} depositWallet={depositWallet} onCancel={() => setPaymentDialog(false)} />,
                    document.getElementById("root")
                )
            }
            {
                createPortal(
                    <AdvancedModal isOpen={showUsageAgreement} onClose={() => setShowUsageAgreement(false)}>
                        <div className="w-[515px] h-[568px] p-8 flex flex-col items-center gap-5">
                            <div className="text-lg font-conthrax">Usage Agreement</div>
                            <div className="text-left text-white/70">
                                By using the Smart-Contract you are going to deploy and generated by MemeTools Development Tools, you acknowledge and agree that MemeTools Development Tools shall not be liable for any damages arising from its use, including but not limited to any damages resulting from any malicious or illegal use of the Smart-Contract by any third party or by the owner.<br />
                                The owner of the Smart-Contract generated by MemeTools Development Tools agrees not to misuse the Smart-Contract, including but not limited to:<br />
                                <br />
                                <ul className="list-decimal">
                                    <li className="ml-5">{"Using the Smart-Contract to engage in any illegal or fraudulent activity, including but not limited to scams, theft, or money laundering."}</li>
                                    <li className="ml-5">{"Using the Smart-Contract in any manner that could cause harm to others, including but not limited to disrupting financial markets or causing financial loss to others."}</li>
                                    <li className="ml-5">{"Using the Smart-Contract to infringe upon the intellectual property rights of others, including but not limited to copyright, trademark, or patent infringement."}</li>
                                </ul>
                                <br />
                                {"The owner of the Smart-Contract generated by MemeTools Development Tools acknowledges that any misuse of the Smart-Contract may result in legal action, and agrees to indemnify and hold harmless MemeTools Development Tools from any and all claims, damages, or expenses arising from any such misuse."}
                            </div>
                        </div>
                    </AdvancedModal>,
                    document.getElementById("root")
                )
            }
            {
                createPortal(
                    <AdvancedModal isOpen={showTemplateInfo} onClose={() => setShowTemplateInfo(false)}>
                        <div className="w-[515px] h-[568px] p-8 flex flex-col items-center gap-5">
                            <div className="text-lg font-conthrax">Smart Contract Templates Overview</div>
                            <div className="text-left text-white/70">
                                <ul className="list-decimal">
                                    <li className="ml-5">{"Templates 1-4: Trading Function Variations These templates share the same core functions, with only the trading-enabling function differing by name:Template 1: enableTradingWithPermit Template 2: openTradingWithPermit Template 3: startTradingWithPermit Template 4: activateTradingWithPermit"}</li>
                                    <li className="ml-5">{"Templates 5 & 6: Dead Blocks These templates introduce \"dead blocks,\" periods during which users cannot sell their tokens. This mechanism helps control trading in the initial stages after launch, making it harder for opportunistic traders to exploit the system."}</li>
                                    <li className="ml-5">{"Template 7: Dynamic Taxation in Dead Blocks This template implements a dynamic taxation system during the dead blocks after launch:50% tax on transactions during dead blocks to deter snipers and early profiteers. Once the dead blocks end, the tax reverts to the normal rate, which is set at the time of token deployment."}</li>
                                </ul>
                            </div>
                        </div>
                    </AdvancedModal>,
                    document.getElementById("root")
                )
            }
            {
                createPortal(
                    <AdvancedModal isOpen={showMaxSwapBackInfo} onClose={() => setShowMaxSwapBackInfo(false)}>
                        <div className="w-[515px] h-[568px] p-8 flex flex-col items-center gap-5">
                            <div className="text-lg font-conthrax">Max Swap Back Threshold</div>
                            <div className="text-center text-white/70">
                                The max swap back threshold is the amount of tokens a contract holds before it automatically swaps them for ETH after collecting token taxes from investors. Once the threshold is reached, the contract converts the tokens and deposits the ETH into the specified development or marketing wallets. This helps projects collect and distribute funds seamlessly.
                            </div>
                        </div>
                    </AdvancedModal>,
                    document.getElementById("root")
                )
            }
            {
                createPortal(
                    <AdvancedModal isOpen={showMaxWalletInfo} onClose={() => setShowMaxWalletInfo(false)}>
                        <div className="w-[515px] h-[568px] p-8 flex flex-col items-center gap-5">
                            <div className="text-lg font-conthrax">Max Wallet Amount</div>
                            <div className="text-center text-white/70">
                                The Max Wallet Amount limits the maximum number of tokens a single wallet can hold at any time. This feature is designed to prevent any one wallet from accumulating a disproportionate amount of tokens, reducing the risk of whale manipulation and promoting a more decentralized token distribution.<br />
                                <br />
                                {"If you plan to bundle more than 70% of the token supply, you'll need to increase the Max Wallet Amount to allow more than 1% of your total supply, as per the 70-wallet bundling limitation (refer to Bundler Instructions for details)."}<br />
                                <br />
                                Setting this limit requires careful consideration to ensure it doesn’t overly restrict legitimate users while still protecting the integrity of the token’s distribution.<br />
                                <br />
                                The Max Wallet Amount should be entered as a numeric value, representing the maximum number of tokens any single wallet can hold.
                            </div>
                        </div>
                    </AdvancedModal>,
                    document.getElementById("root")
                )
            }
            {
                createPortal(
                    <AdvancedModal isOpen={showMaxTxnInfo} onClose={() => setShowMaxTxnInfo(false)}>
                        <div className="w-[515px] h-[568px] p-8 flex flex-col items-center gap-5">
                            <div className="text-lg font-conthrax">Max Tokens Per Transaction</div>
                            <div className="text-center text-white/70">
                                The Max Tokens Per Transaction sets a limit on how many tokens a single wallet can buy in one transaction, helping to prevent whale manipulation and protect against large token buys that could destabilize the market.<br />
                                <br />
                                {"If you plan to bundle more than 70% of the token supply, you will need to increase the Max Transaction and Max Wallet Amount to allow more than 1% of your total token supply. This is due to the 70-wallet bundling limitation (more details can be found in the Bundler Instructions)."}<br />
                                <br />
                                {"While this feature helps safeguard the project from sudden price swings, it’s crucial to set the limit thoughtfully to avoid overly restricting legitimate users or complicating token distribution."}<br />
                                The Max Balance should be entered as a numeric value, representing the token cap for each transaction.
                            </div>
                        </div>
                    </AdvancedModal>,
                    document.getElementById("root")
                )
            }
        </div>
    )
}