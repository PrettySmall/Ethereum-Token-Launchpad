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

export default function _0EnterTokenInfo(props) {
    const { selectedProject, setSelectedProject, setStep } = props;

    const chainId = useChainId();
    const { isConnected } = useAccount();
    const signer = useEthersSigner(chainId);

    const [template, setTemplate] = useState(TEMPLATES[0]);
    const [projectName, setProjectName] = useState("");
    const [tokenAddress, setTokenAddress] = useState("");

    const [showTemplateInfo, setShowTemplateInfo] = useState("");

    const inputCSSString = "token-deploy-input rounded-xl outline-none text-orange placeholder:text-gray-border px-2.5 w-full h-8 mt-1";

    const handleSetProjectInfo = () => {
        if (projectName.trim() == "") {
            toast.warn("Please input project name!");
            return;
        }

        if (tokenAddress.trim() == "") {
            toast.warn("Please input token contract address!");
            return;
        }

        let newProject = { ...selectedProject };
        newProject.name = projectName;
        newProject.token = { address: tokenAddress };
        newProject.template = template;
        setSelectedProject(newProject);
        setStep(p => p + 1);
    }

    return (
        <div className="flex flex-col gap-4 w-full rounded-b-[10px]">
            <div className="">
                <div className="flex gap-2 items-center text-white text-left pr-2">
                    MemeTools Platform Project Name
                </div>
                <input
                    className={inputCSSString}
                    placeholder="Enter Project Name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                />
            </div>
            <div className="">
                <div className="flex gap-2 items-center justify-start text-white text-right pr-2">
                    Select Token Contract Type
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
                        <Listbox.Options className="absolute top-0 z-20 w-full overflow-auto text-xs border border-t-0 text-gray-normal mt bg-gray-dark border-gray-border">
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
            </div>
            <div className="">
                <div className="flex gap-2 items-center text-white text-left pr-2">
                    Token Contract Address Deployed On Remix IDE
                </div>
                <input
                    className={inputCSSString}
                    placeholder="Enter Token Contract Address"
                    value={tokenAddress}
                    onChange={(e) => setTokenAddress(e.target.value)}
                />
            </div>
            <div className="flex items-center gap-3">
                <img className="w-6 h-6" src="/assets/icon/ic_info.svg" />
                <span className="text-gray-label text-left">Ensure that you connect the Token Contract Address Deployer Wallet before proceeding.<br />This will enable you to sign all future transactions seamlessly.</span>
            </div>
            <div className="flex items-center justify-between gap-3 h-full text-white bg-transparent g-clip-border">
                <button
                    className="w-1/2 h-button grow rounded-lg justify-center items-center gap-1 inline-flex active:scale-95 transition duration-100 ease-in-out transform border border-solid border-gray-border focus:outline-none text-xs font-conthrax font-medium text-center text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    onClick={null}>
                    Cancel
                </button>
                <button
                    className="w-1/2 text-xs font-conthrax font-medium text-center text-white uppercase px-6 h-10 rounded-lg justify-center items-center gap-2.5 inline-flex bg-gradient-blue-to-purple disabled:bg-none disabled:bg-black active:scale-95 disabled:active:scale-100 transition duration-100 ease-in-out transform focus:outline-none"
                    onClick={handleSetProjectInfo}
                >
                    Create Project
                </button>
            </div>
            {
                createPortal(
                    <AdvancedModal isOpen={showTemplateInfo} onClose={() => setShowTemplateInfo(false)}>
                        <div className="w-[515px] h-[568px] p-8 flex flex-col items-center gap-5">
                            <div className="text-lg font-conthrax">Select Token Contract Type</div>
                            <div className="text-left text-white/70">
                                <span className="font-bold">Type 1:</span> This type of contract requires two separate transactions. 1st transactions is adding liquidity separately. 2nd transaction is Enable Trading And Bundle.<br />
                                <br />
                                <span className="font-bold">Type 2:</span> Contract: This type of contract requires only 1 transaction. It adds liquidity, Enables trading, and bundles all in the same transaction.
                            </div>
                        </div>
                    </AdvancedModal>,
                    document.getElementById("root")
                )
            }
        </div>
    )
}