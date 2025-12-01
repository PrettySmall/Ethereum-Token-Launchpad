import { useContext, useState } from "react";
import { toast } from "react-toastify";
import { FaRegCopy, FaCheck } from "react-icons/fa";
import { useAccount, useChainId } from "wagmi";
import { ethers } from "ethers";
import axios from "axios";

import { AppContext } from "../App";
import AntiDrainerDialog from "../components/Dialogs/AntiDrainerDialog";
import { useEthersSigner } from "../utils/provider";
import { ellipsisAddress, isValidAddress } from "../utils/methods";
import antiDrainerABI from "../abi/IAntiDrainer.json";

export default function AdminAntiDrainersPage({ className }) {
    const {
        SERVER_URL,
        setLoadingPrompt,
        setOpenLoading,
        user,
        antiDrainers,
        setAntiDrainers,
        sigData,
        signingData
    } = useContext(AppContext);
    const chainId = useChainId();
    const { isConnected } = useAccount();
    const signer = useEthersSigner(chainId);
    const [antiDrainerDialog, setAntiDrainerDialog] = useState(false);
    const [copied, setCopied] = useState({});

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

    const handleEnableAntiDrainer = async (item) => {
        if (!isConnected) {
            toast.warn("Please connect wallet!");
            return;
        }

        setLoadingPrompt("Enabling anti-drainer...");
        setOpenLoading(true);
        try {
            const enable = item.status === "ENABLED" ? false : true;
            const antiContract = new ethers.Contract(item.address, antiDrainerABI, signer);
            const tx = enable ? await antiContract.enable(item.token) : await antiContract.disable(item.token);
            if (tx)
                await tx.wait();

            const { data } = await axios.post(`${SERVER_URL}/api/v1/project/set-anti-drainer`,
                {
                    projectId: item.projectId,
                    chainId: chainId,
                    token: item.token,
                    address: item.address,
                    sigData,
                    signingData
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            setAntiDrainers(data.adrainers);
            toast.success("Succeed to enable anti-drainer");
        }
        catch (err) {
            console.log(err);
            toast.warn("Failed to enable anti-drainer");
        }
        setOpenLoading(false);
    };

    const handleOKAntiDrainer = async (tokenAddress) => {
        if (!isConnected) {
            toast.warn("Please connect wallet!");
            return;
        }

        if (!isValidAddress(tokenAddress)) {
            toast.warn("Please input token address");
            return;
        }

        setLoadingPrompt("Enabling anti-drainer...");
        setOpenLoading(true);
        try {
            const antiDrainerAddress = (chainId === 1) ? "0x8F3dDE175f89723a8F6EBB06Ac4074D66B324d52" : (chainId === 5) ? "0x3370De4C00032c73c048239644e5a9E28F6b7920" : (chainId === 11155111) ? "0x779d644ef71A936c0950b6EA36996Bb07Beda214" : "";
            const antiContract = new ethers.Contract(antiDrainerAddress, antiDrainerABI, signer);
            const tx = await antiContract.enable(tokenAddress);
            if (tx)
                await tx.wait();

            toast.success("Succeed to enable anti-drainer");
        }
        catch (err) {
            console.log(err);
            toast.warn("Failed to enable anti-drainer");
        }
        setOpenLoading(false);
        setAntiDrainerDialog(false);
    };

    return (
        <div className={`${className} w-[1000px] flex flex-col mx-6 my-3 text-white pr-3`}>
            <AntiDrainerDialog isOpen={antiDrainerDialog} onOK={handleOKAntiDrainer} onCancel={() => setAntiDrainerDialog(false)} isAntiDrainer={false} />
            {
                user.privilege && user && user.role === "admin" &&
                (
                    <div className="mt-6">
                        <div className="flex items-center justify-between w-full h-auto mb-2 text-base font-medium text-white uppercase">
                            <div className="">
                                All Anti-Drainers
                            </div>
                            <button
                                className="pl-3 pr-4 h-button rounded-lg justify-center items-center gap-1 inline-flex bg-[#1A1A37] active:scale-95 transition duration-100 ease-in-out transform focus:outline-none text-xs font-medium text-center text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                onClick={() => setAntiDrainerDialog(true)}
                            >
                                <FaCheck className="text-sm text-green-normal" />
                                Enable New Token
                            </button>
                        </div>
                        <div className="relative flex flex-col w-full overflow-x-hidden text-white bg-transparent border border-gray-highlight rounded-lg">
                            <table className="w-full text-xs">
                                <thead className=" text-gray-normal">
                                    <tr className="uppercase h-7 bg-[#1A1A37] sticky top-0 z-10">
                                        <th className="w-8">
                                            #
                                        </th>
                                        <th className="">
                                            User Name
                                        </th>
                                        <th className="">
                                            Project Name
                                        </th>
                                        <th className="">
                                            Token Address
                                        </th>
                                        <th className="">
                                            Anti-Drainer Address
                                        </th>
                                        <th className="">
                                            Status
                                        </th>
                                        <th className="w-[20%]">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-normal">
                                    {
                                        antiDrainers && antiDrainers.length > 0 && antiDrainers.map((item, index) => {
                                            return (
                                                <tr key={index} className={`${index % 2 === 1 && "bg-[#ffffff02]"} hover:bg-[#ffffff08] h-7`}>
                                                    <td className="text-center">
                                                        {index + 1}
                                                    </td>
                                                    <td className="text-center">
                                                        {item.userName}
                                                    </td>
                                                    <td className="text-center">
                                                        {item.projectName}
                                                    </td>
                                                    <td className="text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <p className="bg-transparent border-none outline-none">
                                                                {ellipsisAddress(item.token)}
                                                            </p>
                                                            {
                                                                copied["antiDrainer_token_" + index] ?
                                                                    (<svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                    </svg>) :
                                                                    (<FaRegCopy className="w-3.5 h-3.5 transition ease-in-out transform cursor-pointer active:scale-95 duration-100" onClick={() => copyToClipboard("antiDrainer_token_" + index, item.token)} />)
                                                            }
                                                        </div>
                                                    </td>
                                                    <td className="text-center text-white">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <p className="bg-transparent border-none outline-none">
                                                                {ellipsisAddress(item.address)}
                                                            </p>
                                                            {
                                                                copied["antiDrainer_address_" + index] ?
                                                                    (<svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                    </svg>) :
                                                                    (<FaRegCopy className="text-gray-normal w-3.5 h-3.5 transition ease-in-out transform cursor-pointer active:scale-95 duration-100" onClick={() => copyToClipboard("antiDrainer_address_" + index, item.address)} />)
                                                            }
                                                        </div>
                                                    </td>
                                                    <td className="text-center">
                                                        {item.status}
                                                    </td>
                                                    <td className="text-center">
                                                        <div className="flex justify-center gap-1 ">
                                                            <button
                                                                className="relative flex items-center justify-center px-2 h-6 text-xxs transition ease-in-out transform font-medium rounded-[2px] cursor-pointer active:scale-95 duration-100 bg-gray-highlight text-gray-normal hover:bg-gray-border hover:text-white uppercase"
                                                                onClick={() => handleEnableAntiDrainer(item)}
                                                            >
                                                                <FaCheck className="mr-2 text-green-normal" />
                                                                {item.status === "ENABLED" ? "Disable" : "Enable"}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    }
                                </tbody>
                            </table>
                            {
                                (antiDrainers && antiDrainers.length === 0) &&
                                (
                                    <div className="my-3 text-sm font-bold text-center text-gray-700 uppercase">
                                        No Anti-Drainer
                                    </div>
                                )
                            }
                        </div>
                    </div>
                )
            }
        </div >
    );
}
