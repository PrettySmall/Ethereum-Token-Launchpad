import { createPortal } from "react-dom";
import { useContext, useState } from "react";
import { PAYMENT_OPTIONS } from "../../config/env";
import dashMark from '../../assets/imgs/new_dash_logo.png';
import { Listbox } from "@headlessui/react";
import { AppContext } from "../../App";
import { IoIosArrowDown } from "react-icons/io";
import { toast } from "react-toastify";
import { useChainId } from "wagmi";
import { FaRegCopy } from "react-icons/fa";
import AdvancedModal from "../Dialogs/AdvancedModal";
import axios from "axios";
import { checkActivePool, ellipsisAddress, getPairAddress } from "../../utils/methods";
import { MdWarning } from "react-icons/md";
import { useEthersProvider } from "../../utils/provider";

export default function _1ChooseYourPackage(props) {
    const { selectedProject, setSelectedProject, step, setStep, onCancel } = props;
    const {
        SERVER_URL,
        currentProject,
        loadAllProjects, setCurrentProject,
        projects,
        sigData,
        signingData,
        setLoadingPrompt,
        setOpenLoading,
    } = useContext(AppContext);
    const [payPackage, setPayPackage] = useState(props.type == "standard" ? 1 : PAYMENT_OPTIONS.length - 1);
    const [projectName, setProjcectName] = useState("");

    const [isActivated, setIsActivated] = useState(false);
    const chainId = useChainId();
    const provider = useEthersProvider(chainId);

    const [isOpenPaymentCheck, setIsOpenPaymentCheck] = useState(false);
    const [depositWallet, setDepositWallet] = useState("");
    const [expireTime, setExpireTime] = useState(-1);
    const [intervalId, setIntervalId] = useState(null);
    const [ptAmount, setPtAmount] = useState(0)
    const [copied, setCopied] = useState(false);
    const expireTimeMin = Math.floor(expireTime / 60000);
    const expireTimeSec = Math.floor(expireTime / 1000) % 60;

    const [isConfirmed, setIsConfirmed] = useState(false);

    const handleCreateNewProject = async (name, paymentId, address) => {
        console.log("Creating new project...", name, paymentId, address);
        setOpenLoading(true);
        setLoadingPrompt("Creating new project...");
        try {
            const { data } = await axios.post(`${SERVER_URL}/api/v1/project/create`,
                {
                    name,
                    paymentId,
                    selfToken: props.type == "standard" ? false : true,
                    address,
                    chainId: chainId,
                    sigData,
                    signingData
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            setOpenLoading(false);
            return {
                projectId: data.project._id,
                depositWallet: data.project.depositWallet.address,
                projectTokenAmount: data.project.projectTokenAmount,
                expireTime: data.expireTime,
                qrcode: data.project.qrcode
            };
        }
        catch (err) {
            setOpenLoading(false);
            return { error: err };
        }
    };

    const handleCheckNewProject = async (projectId) => {
        console.log("Checking new project...", projectId);
        try {
            const { data } = await axios.post(`${SERVER_URL}/api/v1/project/check-status`,
                {
                    projectId,
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
                return {
                    activated: true,
                };
            }
            else {
                return {
                    expired: data.expired,
                    expireTime: data.expireTime,
                }
            }
        }
        catch (err) {
            return { error: err };
        }
    };

    const handleCheck = (projectId) => {
        const id = setInterval(async () => {
            console.log("Checking...", projectId);
            const data = await handleCheckNewProject(projectId);
            if (data.activated) {
                clearInterval(id);
                setIntervalId(null);
                setIsActivated(true);
                setIsOpenPaymentCheck(false);
                setIsConfirmed(true);
                await loadAllProjects(projectId);
            } else if (data.expired || data.error) {
                clearInterval(id);
                setIntervalId(null);
                setIsActivated(false);
                setIsOpenPaymentCheck(false);
                setIsConfirmed(true);
            } else
                setExpireTime(data.expireTime);
        }, 1000);
        setIntervalId(id);
    };

    const handleContinue = async () => {
        if (!selectedProject.paymentId) {
            if (props.type == "standard" && payPackage > 0 && projectName.trim() == "") {
                toast.warn("Please input project name!");
                return;
            }

            const data = await handleCreateNewProject(props.type == "standard" ? projectName.trim() : selectedProject.name, payPackage, selectedProject.token?.address);
            if (!data.error) {
                setDepositWallet(data.depositWallet);
                setExpireTime(data.expireTime);
                // setQrcode(data.qrcode);
                setPtAmount(data.projectTokenAmount);
                handleCheck(data.projectId);
                setIsOpenPaymentCheck(true);
            } else {
                console.log(data.error);
                toast.warn("Failed to create new project");
            }
        } else {
            if (!selectedProject.token.address || selectedProject.token.address === "") {
                setStep(1)
            } else {
                const pairAddress = await getPairAddress(provider, chainId, selectedProject.token.address);
                const checkPool = await checkActivePool(provider, pairAddress);
                console.log(checkPool);
                if (checkPool) {
                    setStep(3);
                } else {
                    setStep(2);
                }
            }
        }
    }

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

    const handleBack = () => {
        if (intervalId) {
            clearInterval(intervalId);
            setIntervalId(null);
        }
        onCancel && onCancel();
        // reset();
    };

    const handleDone = () => {
        setIsConfirmed(false);
        if (intervalId) {
            clearInterval(intervalId);
            setIntervalId(null);
        }
        if (selectedProject.template == "Custom") {
            setStep(p => p + 2)
        } else {
            setStep(p => p + 1);
        }
    };

    const handleCancel = () => {
        setIsConfirmed(false);
        if (intervalId) {
            clearInterval(intervalId);
            setIntervalId(null);
        }
        // onCancel();
        // reset();
    };

    const handleRetry = () => {
        setIsConfirmed(false);
        if (intervalId) {
            clearInterval(intervalId);
            setIntervalId(null);
        }
        // reset();
    };

    return (
        <div className="w-[600px] flex flex-col gap-6">
            <div className="font-conthrax text-sm font-medium">
                Choose Your Package
            </div>
            <div className="flex gap-4 justify-center font-conthrax">
                {PAYMENT_OPTIONS.map((option, idx) => {
                    if (props.type == "standard") {
                        if (idx == 0 || idx == PAYMENT_OPTIONS.length - 1) {
                            return;
                        }
                    } else {
                        if (idx !== PAYMENT_OPTIONS.length - 1) return;
                    }
                    return (
                        <div
                            className={`w-[196px] h-[210px] text-gray-300 ${payPackage !== idx ? "unselected-package" : "selected-package"} flex px-4 py-6 items-center justify-between rounded-lg text-sm cursor-pointer gap-2`}
                            key={idx} role="menuitem"
                            onClick={() => { setPayPackage(idx); }}
                        >
                            <input
                                className="hidden"
                                type="radio"
                                id={`option${idx}`}
                                value={`option${idx}`}
                                checked={payPackage === idx}
                                onChange={() => console.log("d")}
                            />
                            <div className="flex flex-col gap-6 justify-between">
                                <div className="flex gap-4 justify-center text-3xl">
                                    <img
                                        className=""
                                        src={dashMark}
                                        width={60}
                                        height={40}
                                        alt="dashmark"
                                    />
                                    {idx}
                                </div>
                                <div className="font-bold text-sm">
                                    <div>
                                        {`${option.cash} ETH${option.token > 0 ? ` & ${option.token}% Supply` : ''}`}
                                    </div>
                                </div>
                                <span className="text-xxs">{option.desc}</span>
                            </div>
                        </div>
                    )
                })}
            </div>
            <div className="w-full flex flex-col items-start">
                <span className="w-full font-conthrax text-left">Continue with Saved Project</span>
                <div className="w-full relative">
                    <Listbox value={selectedProject} onChange={setSelectedProject}>
                        <Listbox.Button
                            className="col-span-10 outline-none border border-gray-border text-white placeholder:text-gray-border text-xs rounded-xl px-2.5 bg-transparent w-full h-button mt-1 disabled:border-gray-highlight disabled:text-gray-border relative pr-7"
                        >
                            <span className="flex items-center">
                                <span className="block truncate">
                                    {selectedProject.name}
                                </span>
                            </span>
                            <IoIosArrowDown className="absolute inset-y-0 -right-1 flex items-center w-8 pr-2 mt-2.5 pointer-events-none opacity-50" />
                        </Listbox.Button>
                        <Listbox.Options className="absolute z-20 w-full overflow-auto text-xs border border-t-0 text-gray-normal mt bg-gray-dark border-gray-border">
                            {
                                (props.type == "standard" ?
                                    currentProject.paymentId != 0 ? [{ ...currentProject }, { name: "New Project" }] : [{ name: "New Project" }] :
                                    [selectedProject]
                                ).map((item, index) => {
                                    console.log(item)
                                    return (
                                        <Listbox.Option key={index}
                                            className={`relative px-2 py-1 cursor-default hover:bg-gray-border ${item.name === selectedProject.name && "text-white"}`}
                                            value={item}
                                        >
                                            <div className="flex items-center">
                                                <span className="block font-normal truncate">
                                                    {item.name}
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
            {(selectedProject.paymentId == null && props.type == 'standard') && <div className="w-full flex flex-col items-start">
                <span className="w-full font-conthrax text-left">Project Name</span>
                <input
                    className="token-deploy-input rounded-xl outline-none text-white placeholder:text-gray-border px-2.5 w-full h-8 mt-1"
                    placeholder="Project name"
                    value={projectName}
                    onChange={(e) => setProjcectName(e.target.value)}
                />
            </div>}
            <div className="w-full flex gap-3">
                <button
                    className="w-[50%] h-button grow rounded-lg justify-center items-center gap-1 inline-flex active:scale-95 transition duration-100 ease-in-out transform border border-solid border-gray-border focus:outline-none text-xs font-conthrax font-medium text-center text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    onClick={() => setStep(p => p > 1 && p - 1)}>
                    Cancel
                </button>
                <button
                    className="w-[50%] h-button grow rounded-lg justify-center items-center gap-1 inline-flex bg-gradient-blue-to-purple active:scale-95 transition duration-100 ease-in-out transform focus:outline-none text-xs font-conthrax font-medium text-center text-white uppercase disabled:text-white disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    onClick={handleContinue}
                >
                    Continue
                </button>
            </div>
            {
                createPortal(
                    <AdvancedModal isOpen={isOpenPaymentCheck} onClose={() => setIsOpenPaymentCheck(false)}>
                        <div className="w-[400px] p-8 mx-auto">
                            <div className="flex items-center justify-center">
                                <img src="/assets/spinner-white.svg" className="w-7 h-7" alt="spinner" />
                                <label className="block text-sm text-gray-normal">
                                    Pending activation by administrator...
                                </label>
                            </div>
                            <div className="mt-4">
                                <div className="text-white text-xl">Payment</div>
                                <div className="text-gray-500 text-md">Please Connect Wallet and Deposit</div>
                                <div className="text-blue-primary text-xl">{`${ptAmount ? parseFloat(ptAmount.toFixed(3)) : 0} ${payPackage === 0 ? "$MT" : "ETH"}`}</div>
                            </div>
                            <div className="flex items-center justify-center gap-2 mt-3">
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
                            </div>
                            <div className="mt-7">
                                <div className="text-gray-200 text-sm px-4 mx-auto mt-2">
                                    Bundler Package Supply Payment Will be Automatically Deducted From Your Bundle and Transferred to the Meme Tools Team.
                                </div>
                            </div>
                            {
                                expireTime > 0 &&
                                <p className="m-auto text-sm font-normal text-center text-gray-normal mt-4">
                                    Expires in <span className="pl-1 text-lg text-white">{expireTimeMin}</span> minutes <span className="pl-1 text-lg text-white">{expireTimeSec}</span> seconds
                                </p>
                            }
                            <div className="flex justify-center mt-7">
                                <button
                                    className="w-full h-button grow rounded-lg justify-center items-center gap-1 inline-flex border border-solid border-gray-border active:scale-95 transition duration-100 ease-in-out transform focus:outline-none text-xs font-conthrax font-medium text-center text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                    onClick={handleBack}>
                                    Back
                                </button>
                            </div>
                        </div>
                    </AdvancedModal>,
                    document.getElementById("root")
                )
            }
            {
                createPortal(
                    <AdvancedModal isOpen={isConfirmed}>
                        <div className="p-4">
                            <div className="">
                                {
                                    isActivated ?
                                        (<div
                                            className="relative flex flex-col items-center gap-4"
                                        >
                                            <div className="absolute mx-auto -top-16 w-[200px] h-[200px] rounded-[200px] bg-[rgba(31,222,0,0.2)] blur-[100px]" />
                                            <img className="" src="/assets/img/payment-success.svg" width={200} alt="" />
                                            <p className="flex items-center justify-center gap-2 my-5 text-lg font-conthrax font-bold text-center uppercase text-white">
                                                Payment Successful
                                            </p>
                                        </div>) :
                                        (<div
                                            className="relative flex flex-col items-center gap-4"
                                        >
                                            <div className="absolute mx-auto -top-16 w-[200px] h-[200px] rounded-[200px] bg-[rgba(222,31,0,0.2)] blur-[100px]" />
                                            <MdWarning color="red" size={100} />
                                            <p className="flex items-center justify-center gap-2 my-5 text-lg font-conthrax font-bold text-center uppercase text-white">
                                                Payment Failed
                                            </p>
                                        </div>)
                                }
                            </div>
                            {
                                isActivated ?
                                    (
                                        <div className="flex justify-center">
                                            <button
                                                className="w-full h-button grow rounded-lg justify-center items-center gap-1 inline-flex bg-gradient-blue-to-purple active:scale-95 transition duration-100 ease-in-out transform focus:outline-none text-xs font-conthrax font-medium text-center text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                                onClick={handleDone}>
                                                Continue
                                            </button>
                                        </div>
                                    ) :
                                    (
                                        <div className="flex justify-center gap-5">
                                            <button
                                                className="pl-3 pr-4 h-button grow rounded-lg justify-center items-center gap-1 inline-flex border border-solid border-gray-border active:scale-95 transition duration-100 ease-in-out transform focus:outline-none text-xs font-conthrax font-medium text-center text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                                onClick={handleCancel}>
                                                Cancel
                                            </button>
                                            <button
                                                className="pl-3 pr-4 h-button grow rounded-lg justify-center items-center gap-1 inline-flex bg-gradient-blue-to-purple active:scale-95 transition duration-100 ease-in-out transform focus:outline-none text-xs font-conthrax font-medium text-center text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                                onClick={handleRetry}>
                                                Retry
                                            </button>
                                        </div>
                                    )
                            }

                        </div>
                    </AdvancedModal>,
                    document.getElementById("root")
                )
            }
        </div>
    )
}