import { useAccount, useChainId } from "wagmi";
import { useEthersSigner } from "../../utils/provider";
import { isValidAddress, updateMaxTransactionAmount } from "../../utils/methods";
import { useContext, useState } from "react";
import { toast } from "react-toastify";
import { TEMPLATES } from "../../utils/constants";
import { AppContext } from "../../App";
import { ContractTemplateSelect, InputWithLabel } from "../Inputs/Inputs";

export default function MaxTransactionAmount() {
    const { setLoadingPrompt, setOpenLoading } = useContext(AppContext);
    const [tokenAddress, setTokenAddress] = useState("");
    const [maxAmount, setMaxAmount] = useState("");
    const [template, setTemplate] = useState(TEMPLATES[0]);
    const chainId = useChainId();
    const { isConnected, address } = useAccount();
    const signer = useEthersSigner(chainId);

    const handleUpdateMaxTransactionAmount = async () => {
        if (!isConnected) {
            toast.warn("Please connect wallet!");
            return;
        }

        if (!isValidAddress(tokenAddress)) {
            toast.warn("Invalid token address!");
            return;
        }

        if (maxAmount == "" || isNaN(Number(maxAmount))) {
            toast.warn("Invalid max transaction amount!");
            return;
        }

        setLoadingPrompt("Updating Max Transaction Amount...");
        setOpenLoading(true);

        const ret = await updateMaxTransactionAmount(signer, template, tokenAddress, maxAmount)
        if (ret) {
            toast.success("Max Transaction Amount Updated!");
        } else {
            toast.warn("Failed to update max Transaction amount!");
        }
        setOpenLoading(false);
    }

    return (
        <div className="w-full flex flex-col gap-3">
            <div className="flex items-center justify-between w-full h-auto">
                <div className="font-conthrax text-sm font-medium text-white">
                    Max Transaction Amount
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
                label="New Max Transaction Amount"
                placeholder="Set Max Transaction Amount"
                value={maxAmount}
                onChange={(v) => setMaxAmount(v)}
            />
            <div className="relative flex h-full text-white bg-transparent justify-evenly bg-clip-border">
                <button
                    className="w-full font-conthrax font-medium text-center text-white uppercase px-6 h-10 rounded-lg justify-center items-center gap-2.5 inline-flex bg-gradient-blue-to-purple active:scale-95 transition duration-100 ease-in-out transform focus:outline-none"
                    onClick={handleUpdateMaxTransactionAmount}
                >
                    Update Max TXN
                    <img src="/assets/icon/ic_launch.svg" className="w-4 h-4" alt="launch" />
                </button>
            </div>
        </div>
    )
}