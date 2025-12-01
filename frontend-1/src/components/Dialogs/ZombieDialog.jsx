import { useState } from "react";
import Modal from "./Modal";

export default function ZombieDialog({ isOpen, index, onOK, onCancel }) {
    const [privateKey, setPrivateKey] = useState("");

    const handleOK = () => {
        if (privateKey !== "") {
            setPrivateKey("");
            onOK(index, privateKey);
        }
    };

    const handleCancel = () => {
        setPrivateKey("");
        onCancel();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleCancel}>
            <div className="flex flex-col pt-5 w-[440px] font-sans">
                <div className="flex items-center justify-start w-full h-auto px-5 py-3 rounded-t-md bg-gray-highlight">
                    <div className="text-sm font-medium gradient-text uppercase">
                        {index === 0 ? "Set Zombie Wallet #1" : "Set Zombie Wallet #2"}
                    </div>
                </div>
                <div className="items-center w-full h-auto px-5 py-5 md:py-0 bg-container rounded-b-md">
                    <div className="mt-5">
                        <div className="text-xs uppercase text-gray-normal">
                            Private Key<span className="pl-1 text-purple-700">*</span>
                        </div>
                        <input type="password"
                            className="outline-none border border-gray-border text-white placeholder:text-gray-border text-sm px-2.5 bg-transparent w-full h-button mt-1"
                            placeholder="Enter Private Key"
                            value={privateKey}
                            onChange={(e) => setPrivateKey(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center justify-center gap-5 my-5">
                        <button
                            className="w-full pl-3 pr-4 h-button grow rounded-lg justify-center items-center gap-1 inline-flex bg-main active:scale-95 transition duration-100 ease-in-out transform focus:outline-none text-xs font-medium text-center text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            onClick={handleOK}>
                            OK
                        </button>
                        <button
                            className="w-full pl-3 pr-4 h-button grow rounded-lg justify-center items-center gap-1 inline-flex bg-[#1A1A37] active:scale-95 transition duration-100 ease-in-out transform focus:outline-none text-xs font-medium text-center text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            onClick={handleCancel}>
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
