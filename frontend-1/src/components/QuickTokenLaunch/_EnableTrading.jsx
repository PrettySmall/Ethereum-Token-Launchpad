import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../App";
import { useAccount, useChainId } from "wagmi";
import { useEthersSigner } from "../../utils/provider";
import { TEMPLATES } from "../../utils/constants";
import { Listbox } from "@headlessui/react";
import { IoIosArrowDown } from "react-icons/io";
import { toast } from "react-toastify";
import { enableTrading, isValidAddress } from "../../utils/methods";

export default function _EnableTrading(props) {
    const { selectedProject, setStep } = props;
    const { setLoadingPrompt, setOpenLoading } = useContext(AppContext);
    const [tokenAddress, setTokenAddress] = useState("");
    const [deadBlock, setDeadBlock] = useState("");
    const [template, setTemplate] = useState(TEMPLATES[0]);
    const chainId = useChainId();
    const { isConnected } = useAccount();
    const signer = useEthersSigner(chainId);

    const inputCSSString = "token-deploy-input rounded-xl outline-none text-orange placeholder:text-gray-border px-2.5 w-full h-8 mt-1";

    useEffect(() => {
        if (selectedProject.token?.address) {
            setTokenAddress(selectedProject.token?.address)
        }
    }, [selectedProject.token?.address])

    const handleEnableTrading = async () => {
        if (!isConnected) {
            toast.warn("Please connect wallet!");
            return;
        }

        if (!isValidAddress(tokenAddress)) {
            toast.warn("Invalid token address!");
            return;
        }

        if (template == TEMPLATES[6] && isNaN(Number(deadBlock))) {
            toast.warn("Invalid block number!");
            return;
        }

        setLoadingPrompt("Trading Enabling...");
        setOpenLoading(true);

        const ret = await enableTrading(signer, template, tokenAddress, deadBlock)
        setStep(p => p + 1)
        if (ret) {
            toast.success("Trading Enabled!");
        } else {
            toast.warn("Failed to enable trading!");
        }
        setOpenLoading(false);
    }

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
                        <Listbox.Options className="absolute top-0 z-20 w-full overflow-auto text-xs border border-t-0 text-gray-normal mt bg-gray-dark border-gray-border">
                            {
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
            <div className="">
                <div className="flex gap-2 items-center text-white text-left pr-2">
                    Token Contract Address*
                </div>
                <input
                    className={inputCSSString}
                    placeholder="Enter address"
                    value={tokenAddress}
                // onChange={(e) => setTokenAddress(e.target.value)}
                />
            </div>
            {template == TEMPLATES[6] && <div className="">
                <div className="flex gap-2 items-center text-white text-left pr-2">
                    Dead Block Numbers*
                </div>
                <input
                    className={inputCSSString}
                    placeholder="Enter Dead Block"
                    value={deadBlock}
                    onChange={(e) => setDeadBlock(e.target.value)}
                />
            </div>}
            <div className="flex items-center gap-3">
                <img className="w-6 h-6" src="/assets/icon/ic_info.svg" />
                <span className="text-gray-label text-left">Ensure that you connect the Token Contract Address Deployer Wallet before proceeding.<br />This will enable you to sign all future transactions seamlessly.</span>
            </div>
            <div className="flex items-center justify-between gap-3 h-full text-white bg-transparent g-clip-border">
                <button
                    className="w-full text-xs font-conthrax font-medium text-center text-white uppercase px-6 h-10 rounded-lg justify-center items-center gap-2.5 inline-flex bg-gradient-blue-to-purple disabled:bg-none disabled:bg-black active:scale-95 disabled:active:scale-100 transition duration-100 ease-in-out transform focus:outline-none"
                    onClick={handleEnableTrading}
                >
                    Enable Trading
                </button>
            </div>
        </div>
    )
}