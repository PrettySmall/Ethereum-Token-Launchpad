/* eslint-disable react/prop-types */
import { useState } from "react";
import Modal from "./Modal";

export default function AntiDrainerDialog({ isOpen, onOK, onCancel, isAntiDrainer }) {
    const [address, setAddress] = useState("");

    const handleOK = () => {
        onOK(address);
    };

    const handleCancel = () => {
        setAddress("");
        onCancel();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleCancel}>
            <div className="flex flex-col pt-5 w-[440px] font-sans">
                <div className="flex items-center justify-start w-full h-auto px-5 py-3 rounded-t-md bg-gray-highlight">
                    <div className="text-sm font-medium gradient-text uppercase">
                        {isAntiDrainer ? "Set Anti-Drainer" : "Enable Anti-Drainer"}
                    </div>
                </div>
                <div className="items-center w-full h-auto px-5 py-5 md:py-0 bg-gray-dark rounded-b-md">
                    <div className="mt-5">
                        <div className="text-xs uppercase text-gray-normal">
                            {isAntiDrainer ? "Anti-Drainer Address" : "Token Address"}<span className="pl-1 text-dark-pink">*</span>
                        </div>
                        <input
                            className="outline-none border border-gray-border text-white placeholder:text-gray-border text-sm px-2.5 bg-transparent w-full h-button mt-1"
                            placeholder={isAntiDrainer ? "Enter anti-drainer address" : "Enter token address"}
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center justify-center gap-5 my-5">
                        <button
                            className="pl-3 pr-4 h-button grow rounded-lg justify-center items-center gap-1 inline-flex bg-gradient-to-br from-[#4B65F1] to-[#A135F8] active:scale-95 transition duration-100 ease-in-out transform focus:outline-none text-xs font-medium text-center text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            onClick={handleOK}>
                            OK
                        </button>
                        <button
                            className="pl-3 pr-4 h-button grow rounded-lg justify-center items-center gap-1 inline-flex bg-[#1A1A37] active:scale-95 transition duration-100 ease-in-out transform focus:outline-none text-xs font-medium text-center text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            onClick={handleCancel}>
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
