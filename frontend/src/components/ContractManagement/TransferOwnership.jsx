import { useAccount, useChainId } from "wagmi";
import { useEthersSigner } from "../../utils/provider";
import { enableTrading, isValidAddress, transferOwnership, updateMaxWalletAmount } from "../../utils/methods";
import { useContext, useState } from "react";
import { toast } from "react-toastify";
import { TEMPLATES } from "../../utils/constants";
import { AppContext } from "../../App";
import { ContractTemplateSelect, InputWithLabel } from "../Inputs/Inputs";

export default function TransferOwnership() {
    const { setLoadingPrompt, setOpenLoading } = useContext(AppContext);
    const [tokenAddress, setTokenAddress] = useState("");
    const [newOwnerAddress, setNewOwnerAddress] = useState("");
    const [template, setTemplate] = useState(TEMPLATES[0]);
    const chainId = useChainId();
    const { isConnected, address } = useAccount();
    const signer = useEthersSigner(chainId);

    const handleUpdateMaxWalletAmount = async () => {
        if (!isConnected) {
            toast.warn("Please connect wallet!");
            return;
        }

        if (!isValidAddress(tokenAddress)) {
            toast.warn("Invalid token address!");
            return;
        }

        if (!isValidAddress(newOwnerAddress)) {
            toast.warn("Invalid new owner address!");
            return;
        }

        setLoadingPrompt("Transferring ownership...");
        setOpenLoading(true);

        const ret = await transferOwnership(signer, template, tokenAddress, newOwnerAddress)
        if (ret) {
            toast.success("Ownership Updated!");
        } else {
            toast.warn("Failed to transfer ownership!");
        }
        setOpenLoading(false);
    }

    return (
        <div className="w-full flex flex-col gap-3">
            <div className="flex items-center justify-between w-full h-auto">
                <div className="font-conthrax text-sm font-medium text-white">
                    Transfer Ownership
                </div>
            </div>
            <div className="flex gap-3 w-full">
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
            <InputWithLabel
                required={true}
                label="New Owner Address"
                placeholder="Enter address"
                value={newOwnerAddress}
                onChange={(v) => setNewOwnerAddress(v)}
            />
            <div className="relative flex h-full text-white bg-transparent justify-evenly bg-clip-border">
                <button
                    className="w-full font-conthrax font-medium text-center text-white uppercase px-6 h-10 rounded-lg justify-center items-center gap-2.5 inline-flex bg-gradient-blue-to-purple active:scale-95 transition duration-100 ease-in-out transform focus:outline-none"
                    onClick={handleUpdateMaxWalletAmount}
                >
                    Transfer Ownership
                    <img src="/assets/icon/ic_launch.svg" className="w-4 h-4" alt="launch" />
                </button>
            </div>
        </div>
    )
}