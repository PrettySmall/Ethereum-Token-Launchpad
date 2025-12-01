import { Card } from "../components/Card/Card";
import TopBar from "../components/TopBar/TopBar";
import { useContext, useEffect, useRef, useState } from "react";
import Collapsible from "react-collapsible";
import { FaAngleDown, FaAngleUp, FaRegCopy } from "react-icons/fa";
import { AppContext } from "../App";
import _2CreateSmartContract from "../components/StandardTokenLaunch/_2CreateSmartContract";
import _3AddLiquidity from "../components/StandardTokenLaunch/_3AddLiquidity";
import _EnableTrading from "../components/QuickTokenLaunch/_EnableTrading";
import { ellipsisAddress } from "../utils/methods";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const QuickTokenLaunchPage = () => {
    const [selectedProject, setSelectedProject] = useState({});
    const [step, setStep] = useState(0);
    const [copied, setCopied] = useState(false);
    const navigate = useNavigate();
    const dialogRef = useRef()

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

    return (
        <div className="w-screen h-screen flex flex-col max-[1800px]:items-start items-center overflow-auto">
            <div className="flex flex-col gap-6 items-center mx-6 my-3">
                <TopBar />
                <Card className="mx-auto !w-[1200px] !p-6 flex flex-col gap-6 rounded-3xl border-4 border-card-border">
                    <div className="font-conthrax text-lg mx-auto font-medium">Quick Token Deployment</div>
                    <div className="mx-40">
                        MemeTools's Quick Deployment feature enables you to launch a standard template contract effortlessly, all for a minimal fee! 0.2 ETH + GAS<br /><br />
                        Gas fee is required to perform any transaction such as deploying a contract, and its value depends on the congestion of the chain. Since it is a variable component, it will be paid as separate transaction.
                    </div>
                    <div className="flex justify-center items-center font-conthrax">
                        <div className="w-36 flex flex-col items-center">
                            <img className="px-4" src="/assets/img/progress-confirmed.svg" width={100} alt="process" />
                            <div className="mt-2.5 text-gradient-blue-to-purple">Create Token</div>
                        </div>
                        <img className="mb-6" src="/assets/img/dash-confirmed.png" width={70.5} alt="dash" />
                        <div className="w-36 flex flex-col items-center">
                            <img className="px-4" src={step > 0 ? "/assets/img/progress-confirmed.svg" : "/assets/img/progress-unconfirmed.svg"} width={100} alt="process" />
                            <div className={`mt-2.5 ${step > 0 ? "text-gradient-blue-to-purple" : "text-gray-label"}`}>Add Liquidity</div>
                        </div>
                        <img className="mb-6" src={step > 0 ? "/assets/img/dash-confirmed.png" : "/assets/img/dash-unconfirmed.png"} width={70.5} alt="dash" />
                        <div className="w-36 flex flex-col items-center">
                            <img className="px-4" src={step > 1 ? "/assets/img/progress-confirmed.svg" : "/assets/img/progress-unconfirmed.svg"} width={100} alt="process" />
                            <div className={`mt-2.5 ${step > 1 ? "text-gradient-blue-to-purple" : "text-gray-label"}`}>Enable Trading</div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="wizard-div p-6 flex flex-col">
                            <Collapsible
                                triggerDisabled
                                open={step == 0}
                                trigger={
                                    <div className="flex font-conthrax justify-between items-center">
                                        <div className="flex gap-2 items-center">
                                            {step > 0 && <img className="" src="/assets/icon/ic_step_check.svg" width={24} height={24} alt="checked" />}
                                            <div className={`text-xxs ${step > 0 ? "text-step-gradient" : "text-gray-label"}`}>
                                                Create Token
                                            </div>
                                        </div>
                                        <div className="flex gap-6 items-center">
                                            {step > 0 && <div className="flex gap-3 items-center text-xxs text-green-light">
                                                {selectedProject.token.address !== "" &&
                                                    <>
                                                        {ellipsisAddress(selectedProject.token.address)}
                                                        {
                                                            (copied["address"] ?
                                                                (<svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                </svg>) :
                                                                (<FaRegCopy className="w-3.5 h-3.5 transition ease-in-out transform cursor-pointer active:scale-95 duration-100 text-gray-normal" onClick={() => copyToClipboard("address", selectedProject.token.address)} />))
                                                        }
                                                    </>
                                                }
                                            </div>}
                                            <FaAngleDown className="text-xxs" />
                                        </div>
                                    </div>
                                }
                                triggerWhenOpen={
                                    <div className="flex font-conthrax justify-between items-center">
                                        <div className="text-sm text-white">
                                            Create Token
                                        </div>
                                        <FaAngleUp className="text-xxs" />
                                    </div>
                                }
                            >
                                <div className="flex flex-col gap-6">
                                    <div className="mt-1 w-full text-left">
                                        Gas fee is required to perform any transaction such as deploying a contract, and its value depends on the congestion of the chain. Since it is a variable component, it will be paid as separate transaction.
                                    </div>
                                    <div className="">
                                        <_2CreateSmartContract
                                            selectedProject={selectedProject}
                                            setSelectedProject={setSelectedProject}
                                            setStep={setStep}
                                            type="custom"
                                        />
                                    </div>
                                </div>
                            </Collapsible>
                        </div>
                        <div className="wizard-div p-6 flex flex-col">
                            <Collapsible
                                triggerDisabled
                                open={step == 1}
                                trigger={
                                    <div className="flex font-conthrax justify-between items-center">
                                        <div className="flex gap-2 items-center">
                                            {step > 1 && <img className="" src="/assets/icon/ic_step_check.svg" width={24} height={24} alt="checked" />}
                                            <div className={`text-xxs ${step > 1 ? "text-step-gradient" : "text-gray-label"}`}>
                                                Add Liquidity
                                            </div>
                                        </div>
                                        <FaAngleDown className="text-xxs" />
                                    </div>
                                }
                                triggerWhenOpen={
                                    <div className="flex font-conthrax justify-between items-center">
                                        <div className="text-sm text-white">
                                            Add Liquidity
                                        </div>
                                        <FaAngleUp className="text-xxs" />
                                    </div>
                                }
                            >
                                {/* Content to be collapsed or expanded */}
                                <div className="flex flex-col gap-6">
                                    <div className="w-full text-left">
                                        Enter the token address for the token you are sending, or select from the tokens listed below from your wallet.
                                    </div>
                                    <div className="">
                                        <_3AddLiquidity
                                            selectedProject={selectedProject}
                                            setStep={setStep}
                                        />
                                    </div>
                                </div>
                            </Collapsible>
                        </div>
                        <div className="wizard-div p-6 flex flex-col">
                            <Collapsible
                                triggerDisabled
                                open={step == 2}
                                trigger={
                                    <div className="flex font-conthrax justify-between items-center">
                                        <div className="flex gap-2 items-center">
                                            {step > 2 && <img className="" src="/assets/icon/ic_step_check.svg" width={24} height={24} alt="checked" />}
                                            <div className={`text-xxs ${step > 2 ? "text-step-gradient" : "text-gray-label"}`}>
                                                Enable Trading
                                            </div>
                                        </div>
                                        <FaAngleDown className="text-xxs" />
                                    </div>
                                }
                                triggerWhenOpen={
                                    <div className="flex font-conthrax justify-between items-center">
                                        <div className="text-sm text-white">
                                            Enable Trading
                                        </div>
                                        <FaAngleUp className="text-xxs" />
                                    </div>
                                }
                            >
                                {/* Content to be collapsed or expanded */}
                                <div className="flex flex-col gap-6">
                                    <div className="w-full text-left">
                                        When you add liquidity, you will receive pool tokens representing your position. These tokens can then be locked using our Liquidity Management Tool to build trust amongst investors and your community.
                                    </div>
                                    <div className="">
                                        <_EnableTrading
                                            selectedProject={selectedProject}
                                            setStep={setStep}
                                        />
                                    </div>
                                </div>
                            </Collapsible>
                        </div>
                    </div>
                </Card>
            </div>
            <div id="dialog-root" ref={dialogRef}></div>
        </div>
    );
};

export default QuickTokenLaunchPage;
