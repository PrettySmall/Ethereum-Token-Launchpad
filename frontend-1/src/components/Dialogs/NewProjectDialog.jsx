/* eslint-disable no-unused-vars */
/* eslint-disable react/jsx-key */
/* eslint-disable react/prop-types */
import { useContext, useEffect, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import { FaCheck, FaExclamationTriangle, FaRegCopy } from "react-icons/fa";
import { Listbox } from "@headlessui/react";
import { IoIosArrowDown } from "react-icons/io";

import { AppContext } from "../../App";

import Modal from "./Modal";
import * as ENV from "../../config/env"
import dashMark from '../../assets/imgs/mark.png';
import { ellipsisAddress, isValidAddress, sleep } from "../../utils/methods"
import { useEthersSigner } from "../../utils/provider";
import { TEMPLATES } from "../../utils/constants";
import axios from "axios";
import "../../styles/font.css";
import InstructionPopupDialog from "./InstructionPopupDialog";

export default function NewProjectDialog({ isOpen, createProject, checkProject, onDone, onCancel, initialData }) {

    const {
        SERVER_URL,
        projects,
        setLoadingPrompt,
        setOpenLoading,
        sigData,
        signingData
    } = useContext(AppContext);

    const chainId = useChainId();
    const { isConnected } = useAccount();
    const signer = useEthersSigner(chainId);

    const [step, setStep] = useState(-1);
    const [projectName, setProjectName] = useState("");
    const [creating, setCreating] = useState(false);
    const [deploying, setDeploying] = useState(false);
    const [depositWallet, setDepositWallet] = useState("");
    const [expireTime, setExpireTime] = useState(-1);
    const [intervalId, setIntervalId] = useState(null);
    const [createByOwner, setCreateByOwner] = useState(false);

    // for package selection dropdown
    const [toggle, setToggle] = useState(false);
    const [selfToken, setSelfToken] = useState(false);
    const [payPackage, setPayPackage] = useState(0)
    const [tokenAddress, setTokenAddress] = useState("")

    const steps = payPackage > 0 ?
        [
            "Token Creation",
            "Create",
            "Activate",
            "Completed",
        ] :
        [
            "Create",
            "Activate",
            "Completed",
        ];
    // qrcode
    // const [qrcode, setQrcode] = useState ("")
    const [ptAmount, setPtAmount] = useState(0)
    const [copied, setCopied] = useState(false);

    const [template, setTemplate] = useState(TEMPLATES[0]);
    const [name, setName] = useState("");
    const [symbol, setSymbol] = useState("");
    const [decimals, setDecimals] = useState("");
    const [totalSupply, setTotalSupply] = useState("");
    const [maxTokensPerTxn, setMaxTokensPerTxn] = useState("");
    const [maxTokensPerWallet, setMaxTokensPerWallet] = useState("");
    const [maxSwapbackThreshold, setMaxSwapbackThreshold] = useState("");
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

    const [notifyAddressDialog, setNotifyAddressDialog] = useState(false);
    const [showInstructionDialog, setShowInstructionDialog] = useState(false);
    const [contractAddress, setContractAddress] = useState("");

    const isTemplate56 = template === TEMPLATES[4] || template === TEMPLATES[5];

    const expireTimeMin = Math.floor(expireTime / 60000);
    const expireTimeSec = Math.floor(expireTime / 1000) % 60;

    useEffect(() => {
        const checkMode = async () => {
            const { data } = await axios.post(`${ENV.SERVER_URL}/api/v1/project/check-create-mode`,
                {
                    sigData,
                    signingData
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            setCreateByOwner(data.createByOwner);
        }
        checkMode();
        console.log("init call")
    }, [])

    useEffect(() => {
        if (!isOpen) {
            setStep(-1);
            setProjectName("");

            setTemplate(TEMPLATES[0]);
            
            setName("");
            setSymbol("");
            setDecimals("");
            setTotalSupply("");
            setMaxTokensPerTxn("");
            setMaxTokensPerWallet("");
            setMaxSwapbackThreshold("");

            setMarketingOption(true);
            setMarketingBuyTax("");
            setMarketingSellTax("");
            setMarketingWallet("");
            setDevelopmentOption(true);
            setDevelopmentBuyTax("");
            setDevelopmentSellTax("");
            setDevelopmentWallet("");

            setTaxWallet("");
            setInitialBuyTax("");
            setInitialSellTax("");
            setBuyTax("");
            setSellTax("");
            setReduceBuyTaxAt("");
            setReduceSellTaxAt("");

            setContractName("");
            setContractContent("");
            setContractAddress("");
        }
    }, [isOpen])

    useEffect(() => {
        if (payPackage == 3) {
            setSelfToken(true);
        } else {
            setSelfToken(false);
        }
    }, [payPackage])

    const handleDone = () => {
        if (intervalId) {
            clearInterval(intervalId);
            setIntervalId(null);
        }
        onDone();
        // reset();
    };

    const handleCancel = () => {
        if (intervalId) {
            clearInterval(intervalId);
            setIntervalId(null);
        }
        onCancel();
        // reset();
    };

    const handleRetry = () => {
        if (intervalId) {
            clearInterval(intervalId);
            setIntervalId(null);
        }
        // reset();
    };

    const handleCheck = (projectId) => {
        const id = setInterval(async () => {
            console.log("Checking...", projectId);
            const data = await checkProject(projectId);
            if (data.activated) {
                clearInterval(id);
                setIntervalId(null);
                setStep(3);
            }
            else if (data.expired || data.error) {
                clearInterval(id);
                setIntervalId(null);
                setStep(4);
            }
            else
                setExpireTime(data.expireTime);
        }, 1000);
        setIntervalId(id);
    };

    const handleCreate = async () => {
        if (Number(payPackage) > 0 && !isValidAddress(tokenAddress)) {
            toast.warn("Please enter a token address!")
            return
        }
        setCreating(true);
        try {
            const data = await createProject(projectName, tokenAddress, payPackage, selfToken);
            if (!data.error) {
                setStep(2);
                setDepositWallet(data.depositWallet);
                setExpireTime(data.expireTime);
                // setQrcode(data.qrcode)
                setPtAmount(data.projectTokenAmount)
                handleCheck(data.projectId);
            }
            else {
                console.log(data.error);
                toast.warn("Failed to create new project");
            }
        }
        catch (err) {
            console.log(err);
        }
        setCreating(false);
    };

    const copyToClipboard = async (key, text) => {
        if ('clipboard' in navigator) {
            await navigator.clipboard.writeText(text);
            toast.success("Copied");
            setCopied({
                ...copied,
                [key]: true,
            });
            setTimeout(() => setCopied({
                ...copied,
                [key]: false,
            }), 2000);
        }
        else
            console.error('Clipboard not supported');
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
            setLoadingPrompt("Deploying Contract and Verifying, Please Wait...")
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
            setContractAddress(contract.target);
            setTokenAddress(contract.target)
            setNotifyAddressDialog(true);
            setShowInstructionDialog(true);
            // setStep(1)

            toast.success("Succeed to deploy token");
            setOpenLoading(false)
        }
        catch (err) {
            console.log(err);
            toast.warn("Failed to deploy token");
        }
        // setOpenLoading(false);
        setDeploying(false)
        setOpenLoading(false);
    };

    return (
        <Modal isOpen={isOpen}>
            <div className="flex flex-col pt-5 font-sans rounded-lg bg-gradient-to-b from-gray-light to-gray-highlight">
                <div className="items-center w-full h-auto px-5 py-5 md:py-0 ">
                    {
                        step === -1 ?
                            <div className="flex flex-col items-start gap-1">
                                <div className="text-base">New Project</div>
                                <div className="text-xs">Choose Your Package</div>
                            </div> :
                            <div className={`flex ${step !== 0 && 'flex-col'} justify-between items-center gap-4`}>
                                <div className="text-base text-[#4B65F1]">New Project</div>
                                <ul className="relative flex flex-row px-3 gap-x-2">
                                    {
                                        steps.map((item, index) => {
                                            return (
                                                <li key={index} className={`flex ${index < 3 ? "flex-1" : ""} items-start shrink basis-0`}>
                                                    <span className="flex flex-col items-center text-xs align-middle min-w-7 min-h-7">
                                                        <span className={`flex items-center text-sm justify-center flex-shrink-0 font-bold rounded-full size-7 ${index <= step ? (step === 3 && index === 2 ? "text-white bg-gradient-blue-to-purple" : "text-gray-dark bg-gradient-blue-to-purple") : "text-gray-normal bg-gray-highlight"}`}>
                                                            {
                                                                step === steps.length - 1 && index === steps.length - 1 ?
                                                                    (
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                    ) :
                                                                    step === 4 && index === steps.length - 1 ?
                                                                        (
                                                                            <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                                                <path d="M18 6 6 18"></path>
                                                                                <path d="m6 6 12 12"></path>
                                                                            </svg>
                                                                        ) :
                                                                        (
                                                                            <span className="">
                                                                                {index + 1}
                                                                            </span>
                                                                        )
                                                            }

                                                            <svg className="flex-shrink-0 hidden size-3"
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                width="24"
                                                                height="24"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="3"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round">
                                                                <polyline points="20 6 9 17 4 12" />
                                                            </svg>
                                                        </span>
                                                        <span className={`text-xxs text-nowrap font-medium ${index <= step ? index === step ? "text-white" : "text-[#02FCFF]" : "text-gray-500"}`}>
                                                            {step === 4 && index === steps.length - 1 ? "Failed" : item}
                                                        </span>
                                                    </span>
                                                    {index < steps.length - 1 && <div className={`"flex-1 mt-3.5 w-8 h-px ${index + 1 <= step ? "bg-gradient-blue-to-purple" : "bg-gray-border"}`} />}
                                                </li>
                                            );
                                        })
                                    }
                                </ul>
                            </div>
                    }
                    {
                        step === -1 &&
                        <div className="my-6">
                            <div className="flex gap-3">
                                {
                                    ENV.PAYMENT_OPTIONS.map((option, idx) => {
                                        if (projects.length === 0) {
                                            if (idx > 0)
                                                return;
                                        }
                                        return (
                                            <div
                                                className={`w-[196px] h-[210px] text-gray-300 ${payPackage !== idx ? "bg-gradient-black-to-white border border-solid border-gray-border" : "bg-gradient-blue-to-purple border border-solid border-transparent"} flex px-4 py-6 items-center justify-between rounded-lg text-sm cursor-pointer gap-2`}
                                                key={idx} role="menuitem"
                                                onClick={() => { setPayPackage(idx); setToggle(false) }}
                                            >
                                                {idx === 0 ?
                                                    <div className="w-full h-full">
                                                        <input
                                                            className="hidden"
                                                            type="radio"
                                                            id={`option${idx}`}
                                                            value={`option${idx}`}
                                                            checked={payPackage === idx}
                                                            onChange={() => console.log("d")}
                                                        />
                                                        <div className="flex flex-col gap-6 justify-between">
                                                            <img
                                                                className=""
                                                                src={dashMark}
                                                                width={60}
                                                                height={40}
                                                                alt="dashmark"
                                                            />
                                                            <span className="text-left ml-5 font-bold tracking-tight scale-x-125 text-base text-nowrap">Meme Tools Account</span>
                                                            <span className="text-nowrap text-xxs">Meme Tools New Account<br />{"( $100 / $MemeTools Tokens )"}</span>
                                                        </div>
                                                    </div> :
                                                    <div className="w-full h-full">
                                                        <input
                                                            className="hidden"
                                                            type="radio"
                                                            id={`option${idx}`}
                                                            value={`option${idx}`}
                                                            checked={payPackage === idx}
                                                            onChange={() => console.log("d")}
                                                        />
                                                        <div className="flex flex-col gap-6 justify-between">
                                                            <div className="flex gap-4 text-3xl package-title">
                                                                <img
                                                                    className=""
                                                                    src={dashMark}
                                                                    width={60}
                                                                    height={40}
                                                                    alt="dashmark"
                                                                />
                                                                {idx}
                                                            </div>
                                                            <div className="font-bold text-xs">
                                                                <div>
                                                                    Bundler Package {idx}
                                                                </div>
                                                                <div>
                                                                    {`${option.cash}/ETH${option.token > 0 ? ` + ${option.token}% Supply` : ''}`}
                                                                </div>
                                                            </div>
                                                            <span className="text-xxs">{option.desc}</span>
                                                        </div>
                                                    </div>
                                                }
                                            </div>
                                        )
                                    })
                                }
                            </div>
                            {/* {payPackage != 0 && <label className="flex text-blue-primary gap-2 text-sm pl-8 pr-4 py-2 mb-2 items-center cursor-pointer">
                                <input type="checkbox" checked={selfToken} onChange={(e) => setSelfToken(e.target.checked)}/>
                                I already have deployed my own token.
                            </label>} */}
                            <div className="flex items-center justify-center gap-3 my-5">
                                <button
                                    className="w-[50%] h-button grow rounded-lg justify-center items-center gap-1 inline-flex active:scale-95 transition duration-100 ease-in-out transform border border-solid border-gray-border focus:outline-none text-xs font-medium text-center text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                    onClick={handleCancel}>
                                    Cancel
                                </button>
                                <button
                                    className="w-[50%] h-button grow rounded-lg justify-center items-center gap-1 inline-flex bg-gradient-blue-to-purple active:scale-95 transition duration-100 ease-in-out transform focus:outline-none text-xs font-medium text-center text-white uppercase disabled:text-white disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                    onClick={() => { console.log(payPackage); payPackage > 0 && !selfToken ? setStep(0) : setStep(1) }}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    }
                    <div className="my-6">
                        {
                            step === 0 &&
                            <div className={`flex justify-center text-white w-[600px]`}>
                                {/* <NotifyAddressDialog isOpen={notifyAddressDialog} title="Token Contract" label="Contract Address" address={contractAddress} onClose={() => { setNotifyAddressDialog(false); setStep(1) }} /> */}
                                <InstructionPopupDialog isOpen={showInstructionDialog} onClose={() => { setShowInstructionDialog(false); setStep(1) }} />
                                <div className="flex flex-col w-full">
                                    <div className="flex flex-col gap-4 w-full rounded-b-[10px]">
                                        <div className="relative grid grid-cols-12 items-center">
                                            <div className="col-span-2 text-xxxs uppercase text-gray-normal text-right pr-2">
                                                Template;
                                            </div>
                                            <Listbox value={template} onChange={setTemplate}>
                                                <Listbox.Button
                                                    className="col-span-10 outline-none border border-gray-border text-white placeholder:text-gray-border text-xs rounded-xl px-2.5 bg-transparent w-full h-button mt-1 disabled:border-gray-highlight disabled:text-gray-border relative pr-7"
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
                                                        [...TEMPLATES, "Custom"].map((item, index) => {
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
                                        {template != "Custom" ? (
                                            <>
                                                <div className="flex justify-between gap-4">
                                                    <div className="w-[50%] grid grid-cols-6 items-center">
                                                        <div className="col-span-2 text-xxxs uppercase text-gray-normal text-right pr-2">
                                                            Name
                                                        </div>
                                                        <input
                                                            className="col-span-4 rounded-xl outline-none border border-gray-border text-white placeholder:text-gray-border text-sm px-2.5 bg-transparent w-full h-button mt-1"
                                                            placeholder="Enter token name"
                                                            value={name}
                                                            onChange={(e) => setName(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="w-[50%] grid grid-cols-6 items-center">
                                                        <div className="col-span-2 text-xxxs uppercase text-gray-normal text-right pr-2">
                                                            Symbol
                                                        </div>
                                                        <input
                                                            className="col-span-4 rounded-xl outline-none border border-gray-border text-white placeholder:text-gray-border text-sm px-2.5 bg-transparent w-full h-button mt-1"
                                                            placeholder="Enter token symbol"
                                                            value={symbol}
                                                            onChange={(e) => setSymbol(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex justify-between gap-4">
                                                    <div className="w-[50%] grid grid-cols-6 items-center">
                                                        <div className="col-span-2 text-xxxs uppercase text-gray-normal text-right pr-2">
                                                            Decimals
                                                        </div>
                                                        <input
                                                            className="col-span-4 rounded-xl outline-none border border-gray-border text-white placeholder:text-gray-border text-sm px-2.5 bg-transparent w-full h-button mt-1"
                                                            placeholder="Enter decimals"
                                                            value={decimals}
                                                            onChange={(e) => setDecimals(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="w-[50%] grid grid-cols-6 items-center">
                                                        <div className="col-span-2 text-xxxs uppercase text-gray-normal text-right pr-2">
                                                            Total Supply
                                                        </div>
                                                        <input
                                                            className="col-span-4 rounded-xl outline-none border border-gray-border text-white placeholder:text-gray-border text-sm px-2.5 bg-transparent w-full h-button mt-1"
                                                            placeholder="Enter total supply"
                                                            value={totalSupply}
                                                            onChange={(e) => setTotalSupply(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex justify-between gap-4">
                                                    <div className="w-[50%] grid grid-cols-6 items-center">
                                                        <div className="col-span-2 text-xxxs uppercase text-gray-normal text-right pr-2">
                                                            Max Tokens Per Transaction
                                                        </div>
                                                        <input
                                                            className="col-span-4 rounded-xl outline-none border border-gray-border text-white placeholder:text-gray-border text-sm px-2.5 bg-transparent w-full h-button mt-1"
                                                            placeholder="Enter max tokens per transaction"
                                                            value={maxTokensPerTxn}
                                                            onChange={(e) => setMaxTokensPerTxn(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="w-[50%] grid grid-cols-6 items-center">
                                                        <div className="col-span-2 text-xxxs uppercase text-gray-normal text-right pr-2">
                                                            Max Tokens Per Wallet
                                                        </div>
                                                        <input
                                                            className="col-span-4 rounded-xl outline-none border border-gray-border text-white placeholder:text-gray-border text-sm px-2.5 bg-transparent w-full h-button mt-1"
                                                            placeholder="Enter max tokens per wallet"
                                                            value={maxTokensPerWallet}
                                                            onChange={(e) => setMaxTokensPerWallet(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-12 items-center">
                                                    <div className="col-span-2 text-xxxs uppercase text-gray-normal text-right pr-2">
                                                        Max Swapback Thereshold
                                                    </div>
                                                    <input
                                                        className="col-span-10 rounded-xl outline-none border border-gray-border text-white placeholder:text-gray-border text-sm px-2.5 bg-transparent w-full h-button mt-1"
                                                        placeholder="Enter max tokens per transaction"
                                                        value={maxSwapbackThreshold}
                                                        onChange={(e) => setMaxSwapbackThreshold(e.target.value)}
                                                    />
                                                </div>
                                                {
                                                    !isTemplate56 &&
                                                    (<div className="">
                                                        <label className="flex items-center cursor-pointer">
                                                            <input type="checkbox" className="w-4 h-4 outline-none bg-gray-highlight opacity-20 accent-green-normal ring-0"
                                                                checked={marketingOption}
                                                                onChange={(e) => setMarketingOption(e.target.checked)}
                                                            />
                                                            <span className="ml-3 text-xxxs text-gray-normal uppercase">Marketing</span>
                                                        </label>
                                                    </div>)
                                                }
                                                {
                                                    marketingOption && !isTemplate56 &&
                                                    (
                                                        <div className="grid grid-cols-12 items-center">
                                                            <div className="col-span-2 text-xxxs uppercase text-gray-normal text-right pr-2">
                                                                Marketing Wallet
                                                            </div>
                                                            <input
                                                                className="col-span-10 rounded-xl outline-none border border-gray-border text-white placeholder:text-gray-border text-sm px-2.5 bg-transparent w-full h-button mt-1"
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
                                                            <div className="w-[50%] grid grid-cols-6 items-center">
                                                                <div className="col-span-2 text-xxxs uppercase text-gray-normal text-right pr-2">
                                                                    Buy Tax(%)
                                                                </div>
                                                                <input
                                                                    className="col-span-4 rounded-xl outline-none border border-gray-border text-white placeholder:text-gray-border text-sm px-2.5 bg-transparent w-full h-button mt-1"
                                                                    placeholder="Enter marketing buy tax"
                                                                    value={marketingBuyTax}
                                                                    onChange={(e) => setMarketingBuyTax(e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="w-[50%] grid grid-cols-6 items-center">
                                                                <div className="col-span-2 text-xxxs uppercase text-gray-normal text-right pr-2">
                                                                    Sell Tax(%)
                                                                </div>
                                                                <input
                                                                    className="col-span-4 rounded-xl outline-none border border-gray-border text-white placeholder:text-gray-border text-sm px-2.5 bg-transparent w-full h-button mt-1"
                                                                    placeholder="Enter marketing sell tax"
                                                                    value={marketingSellTax}
                                                                    onChange={(e) => setMarketingSellTax(e.target.value)}
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
                                                                <input type="checkbox" className="w-4 h-4 outline-none bg-gray-highlight opacity-20 accent-green-normal ring-0"
                                                                    checked={developmentOption}
                                                                    onChange={(e) => setDevelopmentOption(e.target.checked)}
                                                                />
                                                                <span className="ml-3 text-xxxs text-gray-normal uppercase">Development</span>
                                                            </label>
                                                        </div>
                                                    )
                                                }
                                                {
                                                    developmentOption && !isTemplate56 &&
                                                    (
                                                        <div className="grid grid-cols-12 items-center">
                                                            <div className="col-span-2 text-xxxs uppercase text-gray-normal text-right pr-2">
                                                                Development Wallet
                                                            </div>
                                                            <input
                                                                className="col-span-10 rounded-xl outline-none border border-gray-border text-white placeholder:text-gray-border text-sm px-2.5 bg-transparent w-full h-button mt-1"
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
                                                            <div className="w-[50%] grid grid-cols-6 items-center">
                                                                <div className="col-span-2 text-xxxs uppercase text-gray-normal text-right pr-2">
                                                                    Buy Tax(%)
                                                                </div>
                                                                <input
                                                                    className="col-span-4 rounded-xl outline-none border border-gray-border text-white placeholder:text-gray-border text-sm px-2.5 bg-transparent w-full h-button mt-1"
                                                                    placeholder="Enter development buy tax"
                                                                    value={developmentBuyTax}
                                                                    onChange={(e) => setDevelopmentBuyTax(e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="w-[50%] grid grid-cols-6 items-center">
                                                                <div className="col-span-2 text-xxxs uppercase text-gray-normal text-right pr-2">
                                                                    Sell Tax(%)
                                                                </div>
                                                                <input
                                                                    className="col-span-4 rounded-xl outline-none border border-gray-border text-white placeholder:text-gray-border text-sm px-2.5 bg-transparent w-full h-button mt-1"
                                                                    placeholder="Enter development sell tax"
                                                                    value={developmentSellTax}
                                                                    onChange={(e) => setDevelopmentSellTax(e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                    )
                                                }
                                                {
                                                    isTemplate56 &&
                                                    (<div className="grid grid-cols-12 items-center">
                                                        <div className="col-span-2 text-xxxs uppercase text-gray-normal text-right pr-2">
                                                            Tax Wallet
                                                        </div>
                                                        <input
                                                            className="col-span-10 rounded-xl outline-none border border-gray-border text-white placeholder:text-gray-border text-sm px-2.5 bg-transparent w-full h-button mt-1"
                                                            placeholder="Enter tax wallet"
                                                            value={taxWallet}
                                                            onChange={(e) => setTaxWallet(e.target.value)}
                                                        />
                                                    </div>)
                                                }
                                                {
                                                    isTemplate56 &&
                                                    (<div className="flex justify-between gap-4">
                                                        <div className="w-[50%] grid grid-cols-6 items-center">
                                                            <div className="col-span-2 text-xxxs uppercase text-gray-normal text-right pr-2">
                                                                Initial Buy Tax(%)
                                                            </div>
                                                            <input
                                                                className="col-span-4 rounded-xl outline-none border border-gray-border text-white placeholder:text-gray-border text-sm px-2.5 bg-transparent w-full h-button mt-1"
                                                                placeholder="Enter initial buy tax"
                                                                value={initialBuyTax}
                                                                onChange={(e) => setInitialBuyTax(e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="w-[50%] grid grid-cols-6 items-center">
                                                            <div className="col-span-2 text-xxxs uppercase text-gray-normal text-right pr-2">
                                                                Initial Sell Tax(%)
                                                            </div>
                                                            <input
                                                                className="col-span-4 rounded-xl outline-none border border-gray-border text-white placeholder:text-gray-border text-sm px-2.5 bg-transparent w-full h-button mt-1"
                                                                placeholder="Enter initial sell tax"
                                                                value={initialSellTax}
                                                                onChange={(e) => setInitialSellTax(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>)
                                                }
                                                {
                                                    isTemplate56 &&
                                                    (<div className="flex justify-between gap-4">
                                                        <div className="w-[50%] grid grid-cols-6 items-center">
                                                            <div className="col-span-2 text-xxxs uppercase text-gray-normal text-right pr-2">
                                                                Buy Tax(%)
                                                            </div>
                                                            <input
                                                                className="col-span-4 rounded-xl outline-none border border-gray-border text-white placeholder:text-gray-border text-sm px-2.5 bg-transparent w-full h-button mt-1"
                                                                placeholder="Enter buy tax"
                                                                value={buyTax}
                                                                onChange={(e) => setBuyTax(e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="w-[50%] grid grid-cols-6 items-center">
                                                            <div className="col-span-2 text-xxxs uppercase text-gray-normal text-right pr-2">
                                                                Sell Tax(%)
                                                            </div>
                                                            <input
                                                                className="col-span-4 rounded-xl outline-none border border-gray-border text-white placeholder:text-gray-border text-sm px-2.5 bg-transparent w-full h-button mt-1"
                                                                placeholder="Enter sell tax"
                                                                value={sellTax}
                                                                onChange={(e) => setSellTax(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>)
                                                }
                                                {
                                                    isTemplate56 &&
                                                    (<div className="flex justify-between gap-4">
                                                        <div className="w-[50%] grid grid-cols-6 items-center">
                                                            <div className="col-span-2 text-xxxs uppercase text-gray-normal text-right pr-2">
                                                                Reduce Buy Tax At
                                                            </div>
                                                            <input
                                                                className="col-span-4 rounded-xl outline-none border border-gray-border text-white placeholder:text-gray-border text-sm px-2.5 bg-transparent w-full h-button mt-1"
                                                                placeholder="Enter reduce buy tax at"
                                                                value={reduceBuyTaxAt}
                                                                onChange={(e) => setReduceBuyTaxAt(e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="w-[50%] grid grid-cols-6 items-center">
                                                            <div className="col-span-2 text-xxxs uppercase text-gray-normal text-right pr-2">
                                                                Reduce Sell Tax At
                                                            </div>
                                                            <input
                                                                className="col-span-4 rounded-xl outline-none border border-gray-border text-white placeholder:text-gray-border text-sm px-2.5 bg-transparent w-full h-button mt-1"
                                                                placeholder="Enter reduce sell tax at"
                                                                value={reduceSellTaxAt}
                                                                onChange={(e) => setReduceSellTaxAt(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>)
                                                }
                                            </>
                                        ) : (
                                            <div className="h-full flex flex-col">
                                                <div className="grid grid-cols-12 items-center">
                                                    <div className="col-span-2 font-sans text-xxxs uppercase text-gray-normal text-right pr-2">
                                                        Deploy Contract Name
                                                    </div>
                                                    <input
                                                        className="col-span-10 rounded-xl outline-none border border-gray-border font-sans text-white placeholder:text-gray-border text-sm px-2.5 bg-transparent w-full h-button mt-1"
                                                        placeholder="Enter the deploy contract name"
                                                        value={contractName}
                                                        onChange={(e) => setContractName(e.target.value)}
                                                        disabled={step}
                                                    />
                                                </div>
                                                <div className="mt-3 h-full grid grid-cols-12">
                                                    <div className="mt-3 col-span-2 font-sans text-xxxs uppercase text-gray-normal text-right pr-2">
                                                        Contract Content
                                                    </div>
                                                    <textarea
                                                        className="col-span-10 rounded-xl outline-none border border-gray-border font-sans text-white placeholder:text-gray-border text-sm px-2.5 bg-transparent w-full h-24 mt-1"
                                                        value={contractContent}
                                                        onChange={(e) => setContractContent(e.target.value)}
                                                        placeholder="Please type in your own token smart contract"
                                                    ></textarea>
                                                </div>
                                            </div>
                                        )}
                                        <div className="relative flex flex-row items-center justify-between gap-3 h-full my-5 text-white bg-transparent g-clip-border">
                                            <button
                                                className="w-full text-xs font-medium text-center text-white uppercase px-6 h-10 rounded-lg justify-center items-center gap-2.5 inline-flex border border-solid border-gray-border active:scale-95 transition duration-100 ease-in-out transform focus:outline-none"
                                                onClick={handleCancel} disabled={deploying}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                className="w-full text-xs font-medium text-center text-white uppercase px-6 h-10 rounded-lg justify-center items-center gap-2.5 inline-flex bg-gradient-blue-to-purple active:scale-95 transition duration-100 ease-in-out transform focus:outline-none"
                                                onClick={handleDeployToken} disabled={deploying}
                                            >
                                                {deploying ?
                                                    <img src="/assets/spinner-white.svg" className="w-10 h-10" alt="spinner" /> :
                                                    "Deploy"
                                                }
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        }
                        {
                            step === 1 &&
                            (
                                <div className="flex flex-col">
                                    <div className="grid grid-cols-12 mt-4">
                                        {
                                            payPackage > 0 &&
                                            <>
                                                <div className="col-span-4 flex flex-row items-center justify-end text-xs uppercase text-gray-normal">
                                                    Token Address<span className="pl-1 text-dark-pink">:&nbsp;&nbsp;</span>
                                                </div>
                                                <input
                                                    className="col-span-8 rounded-xl outline-none border border-gray-border text-white placeholder:text-gray-border text-sm px-2.5 bg-transparent w-full h-button mt-1"
                                                    placeholder="Enter Address"
                                                    value={selfToken ? tokenAddress : contractAddress}
                                                    onChange={(e) => setTokenAddress(e.target.value)}
                                                    disabled={!selfToken}
                                                />
                                            </>
                                        }
                                    </div>
                                    <div className="grid grid-cols-12 mt-4">
                                        <div className="col-span-4 flex flex-row items-center justify-end text-xs uppercase text-gray-normal">
                                            Project Name<span className="pl-1 text-dark-pink">:&nbsp;&nbsp;</span>
                                        </div>
                                        <input
                                            className="col-span-8 rounded-xl outline-none border border-gray-border text-white placeholder:text-gray-border text-sm px-2.5 bg-transparent w-full h-button mt-1"
                                            placeholder="Enter Name"
                                            onChange={(e) => setProjectName(e.target.value)}
                                        />
                                    </div>

                                    <div className="flex items-center justify-center gap-3 my-5">
                                        <button
                                            className="w-full h-button grow rounded-lg justify-center items-center gap-1 inline-flex border border-solid border-gray-border active:scale-95 transition duration-100 ease-in-out transform focus:outline-none text-xs font-medium text-center text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                            disabled={creating}
                                            onClick={handleCancel}>
                                            Cancel
                                        </button>
                                        <button
                                            className="w-full h-button grow rounded-lg justify-center items-center gap-1 inline-flex bg-gradient-blue-to-purple active:scale-95 transition duration-100 ease-in-out transform focus:outline-none text-xs font-medium text-center text-white uppercase disabled:text-white disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                            onClick={handleCreate} disabled={creating || projectName === "" || (selfToken && !isValidAddress(tokenAddress))}
                                        >
                                            {creating ?
                                                <img src="/assets/spinner-white.svg" className="w-10 h-10" alt="spinner" /> :
                                                "Create"
                                            }
                                        </button>
                                    </div>
                                </div>
                            )
                        }
                        {
                            step === 2 &&
                            (
                                <div className="!w-[400px] mx-auto">
                                    <div className="flex items-center justify-center">
                                        <img src="/assets/spinner-white.svg" className="w-7 h-7" alt="spinner" />
                                        <label className="block text-sm text-gray-normal">
                                            Pending activation by administrator...
                                        </label>
                                    </div>
                                    {!createByOwner && <div className="mt-4">
                                        <div className="text-white text-xl">Payment</div>
                                        <div className="text-gray-500 text-md">Please Connect Wallet and Deposit</div>
                                        <div className="text-blue-primary text-xl">{`${ptAmount ? parseFloat(ptAmount.toFixed(3)) : 0} ${payPackage === 0 ? "$MT" : "ETH"}`}</div>
                                    </div>}
                                    {/* <div className="mt-4">
                                        <img src={qrcode} className="mx-auto w-[100px] h-[100px]" />
                                    </div> */}
                                    {!createByOwner && <div className="flex items-center justify-center gap-2 mt-3">
                                        <div className="text-sm text-gray-normal">
                                            Address:&nbsp;
                                            <span className="pl-1 text-white">
                                                {
                                                    depositWallet !== "" ?
                                                        ellipsisAddress(depositWallet) :
                                                        "0x1234...5678"
                                                }
                                            </span>
                                        </div>
                                        {
                                            (copied["address"] ?
                                                (<svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>) :
                                                (<FaRegCopy className="w-3.5 h-3.5 transition ease-in-out transform cursor-pointer active:scale-95 duration-100 text-gray-normal" onClick={() => copyToClipboard("address", depositWallet)} />))
                                        }
                                    </div>}
                                    {!createByOwner && <div className="mt-7">
                                        <div className="text-gray-200 text-sm px-4 mx-auto mt-2">
                                            Bundler Package Supply Payment Will be Automatically Deducted From Your Bundle and Transferred to the Meme Tools Team.
                                        </div>
                                    </div>}
                                    {
                                        expireTime > 0 &&
                                        <p className="m-auto text-sm font-normal text-center text-gray-normal mt-4">
                                            Expires in <span className="pl-1 text-lg text-white">{expireTimeMin}</span> minutes <span className="pl-1 text-lg text-white">{expireTimeSec}</span> seconds
                                        </p>
                                    }
                                    {/* <div className="flex items-center justify-center gap-2">
                                        <div className="text-sm text-gray-normal">
                                            Service Fee:&nbsp;
                                            <span className="pl-1 text-yellow-normal">1 ETH</span>
                                        </div>
                                        {
                                            (copied["fee"] ?
                                                (<svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>) :
                                                (<FaRegCopy className="w-3.5 h-3.5 transition ease-in-out transform cursor-pointer active:scale-95 duration-100 text-gray-normal" onClick={() => copyToClipboard("fee", "1")} />))
                                        }
                                    </div> */}
                                    <div className="flex justify-center mt-7">
                                        <button
                                            className="w-full h-button grow rounded-lg justify-center items-center gap-1 inline-flex border border-solid border-gray-border active:scale-95 transition duration-100 ease-in-out transform focus:outline-none text-xs font-medium text-center text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                            onClick={handleCancel}>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )
                        }
                        {
                            (step === 3 || step === 4) &&
                            (
                                <div className="">
                                    <div className="">
                                        {
                                            step === 3 ?
                                                (<p className="flex items-center justify-center gap-2 my-5 text-lg font-bold text-center uppercase text-green-normal">
                                                    <FaCheck />
                                                    Success!
                                                </p>) :
                                                (<p className="flex items-center justify-center gap-2 my-5 text-lg font-bold text-center uppercase text-dark-pink">
                                                    <FaExclamationTriangle />
                                                    Failed!
                                                </p>)
                                        }
                                    </div>
                                    {
                                        step === 3 ?
                                            (
                                                <div className="flex justify-center">
                                                    <button
                                                        className="w-full h-button grow rounded-lg justify-center items-center gap-1 inline-flex bg-gradient-blue-to-purple active:scale-95 transition duration-100 ease-in-out transform focus:outline-none text-xs font-medium text-center text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                                        onClick={handleDone}>
                                                        Done
                                                    </button>
                                                </div>
                                            ) :
                                            (
                                                <div className="flex justify-center gap-5">
                                                    <button
                                                        className="pl-3 pr-4 h-button grow rounded-lg justify-center items-center gap-1 inline-flex border border-solid border-gray-border active:scale-95 transition duration-100 ease-in-out transform focus:outline-none text-xs font-medium text-center text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                                        onClick={handleCancel}>
                                                        Cancel
                                                    </button>
                                                    <button
                                                        className="pl-3 pr-4 h-button grow rounded-lg justify-center items-center gap-1 inline-flex bg-gradient-blue-to-purple active:scale-95 transition duration-100 ease-in-out transform focus:outline-none text-xs font-medium text-center text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                                        onClick={handleRetry}>
                                                        Retry
                                                    </button>
                                                </div>
                                            )
                                    }

                                </div>
                            )
                        }
                    </div>
                </div>
            </div>
        </Modal>
    );
}
