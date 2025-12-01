import { useAccount, useChainId } from "wagmi";
import { useEthersSigner } from "../../utils/provider";
import { isValidAddress, updateMaxTxnExemption } from "../../utils/methods";
import { useContext, useState } from "react";
import { toast } from "react-toastify";
import { TEMPLATES } from "../../utils/constants";
import { AppContext } from "../../App";
import { ContractTemplateSelect, InputWithLabel, TrueFalseSelect } from "../Inputs/Inputs";

export default function ExcludeFromMaxTransaction() {
    const { setLoadingPrompt, setOpenLoading } = useContext(AppContext);
    const [tokenAddress, setTokenAddress] = useState("");
    const [walletAddress, setWalletAddress] = useState("");
    const [isExcluded, setIsExcluded] = useState(true);
    const [template, setTemplate] = useState(TEMPLATES[0]);
    const chainId = useChainId();
    const { isConnected, address } = useAccount();
    const signer = useEthersSigner(chainId);

    const handleUpdateMaxTxnExemption = async () => {
        if (!isConnected) {
            toast.warn("Please connect wallet!");
            return;
        }

        if (!isValidAddress(tokenAddress)) {
            toast.warn("Invalid token address!");
            return;
        }

        if (!isValidAddress(walletAddress)) {
            toast.warn("Invalid wallet address!");
            return;
        }

        setLoadingPrompt("Updating Max Txn Exemption...");
        setOpenLoading(true);

        const ret = await updateMaxTxnExemption(signer, template, tokenAddress, walletAddress, isExcluded)
        if (ret) {
            toast.success("Max Txn Exemption Updated!");
        } else {
            toast.warn("Failed to update max txn exemption!");
        }
        setOpenLoading(false);
    }

    return (
        <div className="w-full flex flex-col gap-3">
            <div className="flex items-center justify-between w-full h-auto">
                <div className="font-conthrax text-sm font-medium text-white">
                    Exclude From Max Transaction
                </div>
            </div>
            <div className={`flex gap-3 w-full`}>
                <div className="max-w-1/2 w-1/2">
                    <ContractTemplateSelect onChange={(v) => setTemplate(v)} />
                </div>
                <div className="max-w-1/2 w-1/2">
                    <InputWithLabel
                        required={true}
                        label="Token Contract Address"
                        placeholder="Enter address"
                        value={tokenAddress}
                        onChange={(v) => setTokenAddress(v)}
                    />
                </div>
            </div>
            <div className={`flex gap-3 w-full`}>
                <div className="w-1/2">
                    <TrueFalseSelect onChange={(v) => setIsExcluded(v)} />
                </div>
                <div className="w-1/2">
                    <InputWithLabel
                        required={true}
                        label="Wallet Address"
                        placeholder="Enter address"
                        value={walletAddress}
                        onChange={(v) => setWalletAddress(v)}
                    />
                </div>
            </div>
            <div className="relative flex h-full text-white bg-transparent justify-evenly bg-clip-border">
                <button
                    className="w-full font-conthrax font-medium text-center text-white uppercase px-6 h-10 rounded-lg justify-center items-center gap-2.5 inline-flex bg-gradient-blue-to-purple active:scale-95 transition duration-100 ease-in-out transform focus:outline-none"
                    onClick={handleUpdateMaxTxnExemption}
                >
                    Update Max Txn Exemption
                    <img src="/assets/icon/ic_launch.svg" className="w-4 h-4" alt="launch" />
                </button>
            </div>
        </div>
    )
}