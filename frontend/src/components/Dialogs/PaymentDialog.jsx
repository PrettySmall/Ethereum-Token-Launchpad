/* eslint-disable react/jsx-key */
/* eslint-disable react/prop-types */
import { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FaRegCopy } from "react-icons/fa";

import Modal from "./Modal";
import * as ENV from "../../config/env"
import { ellipsisAddress } from "../../utils/methods"
import axios from "axios";
import { AppContext } from "../../App";
import AdvancedModal from "./AdvancedModal";

export default function PaymentDialog({ isOpen, ethAmount, expireTime, depositWallet, onCancel }) {
    const {sigData, signingData} = useContext(AppContext);
    const [createByOwner, setCreateByOwner] = useState(false);

    const [copied, setCopied] = useState(false);

    const expireTimeMin = Math.floor(expireTime / 60000);
    const expireTimeSec = Math.floor(expireTime / 1000) % 60;

    useEffect(() => {
        const checkMode = async () => {
            const { data } = await axios.get(`${ENV.SERVER_URL}/api/v1/project/check-create-mode`,
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

    const handleCancel = () => {
        onCancel();
    };

    return (
        <AdvancedModal isOpen={isOpen}>
            <div className="flex flex-col pt-5 w-[440px] font-sans">
                <div className="flex items-center justify-start w-full h-auto px-5 py-3 rounded-t-md">
                    <div className="text-sm font-medium text-white uppercase">
                        Payment for Creating Token
                    </div>
                </div>
                <div className="items-center w-full h-auto px-5 py-5 md:py-0 rounded-b-md">
                    <div className="my-6">
                        <div className="">
                            <div className="flex items-center justify-center">
                                <img src="/assets/spinner-white.svg" className="w-7 h-7" alt="spinner" />
                                <label className="block text-sm text-gray-normal">
                                    Pending activation by payment...
                                </label>
                            </div>
                            {!createByOwner && <div className="mt-4">
                                <div className="text-white text-xl">Payment</div>
                                <div className="text-gray-500 text-md">Please Connect Wallet and Deposit</div>
                                <div className="text-blue-primary text-xl">{`${parseFloat(ethAmount.toFixed(3))} ETH`}</div>
                            </div>}
                            {!createByOwner && <div className="flex items-center justify-center gap-2 mt-2">
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
                            {
                                expireTime > 0 &&
                                <p className="m-auto text-sm font-normal text-center text-gray-normal mt-7">
                                    Expires in <span className="pl-1 text-lg text-white">{expireTimeMin}</span> minutes <span className="pl-1 text-lg text-white">{expireTimeSec}</span> seconds
                                </p>
                            }
                            <div className="flex justify-center mt-7">
                                <button
                                    className="pl-3 pr-4 h-button grow rounded-lg justify-center items-center gap-1 inline-flex bg-[#1A1A37] active:scale-95 transition duration-100 ease-in-out transform focus:outline-none text-xs font-medium text-center text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                    onClick={handleCancel}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdvancedModal>
    );
}
