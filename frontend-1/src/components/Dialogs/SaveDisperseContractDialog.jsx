/* eslint-disable react/prop-types */
import { useState } from "react";
import Modal from "./Modal";
import { Listbox } from "@headlessui/react";
import { IoIosArrowDown } from "react-icons/io";

export default function SaveDisperseContractDialog({ isOpen, onOK, onClose }) {
    const chains = [
        "Ethereum",
        "Base",
        "Goerli",
        "Sepolia",
    ];

    // const [openChainPopup, setOpenChainPopup] = useState(false);
    const [selectedChain, setSelectedChain] = useState(chains[0]);
    const [contractAddress, setContractAddress] = useState("");

    const handleOK = () => {
        if (selectedChain !== "" && contractAddress !== "")
            onOK(selectedChain, contractAddress);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col pt-5 w-[440px] font-sans">
                <div className="flex items-center justify-start w-full h-auto px-5 py-3 rounded-t-md bg-gray-highlight">
                    <div className="text-sm font-medium text-white uppercase">
                        Save Disperse Contract
                    </div>
                </div>
                <div className="items-center w-full h-auto px-5 py-5 md:py-0 bg-gray-dark rounded-b-md">
                    <div className="relative mt-5">
                        <div className="text-xs uppercase text-gray-normal">
                            Chain<span className="pl-1 text-dark-pink">*</span>
                        </div>
                        <Listbox value={selectedChain} onChange={setSelectedChain}>
                            <Listbox.Button
                                className="outline-none border border-gray-border text-white placeholder:text-gray-border text-sm px-2.5 bg-transparent w-full h-button mt-1 disabled:border-gray-highlight disabled:text-gray-border relative pr-7"
                            >
                                <span className="flex items-center">
                                    <span className="block truncate">
                                        {selectedChain}
                                    </span>
                                </span>
                                <IoIosArrowDown className="absolute inset-y-0 -right-1 flex items-center w-8 pr-2 mt-2.5 pointer-events-none opacity-50" />
                            </Listbox.Button>
                            <Listbox.Options className="absolute z-20 w-full overflow-auto text-xs border border-t-0 text-gray-normal mt bg-gray-dark border-gray-border">
                                {
                                    chains?.map((item, index) => {
                                        return (
                                            <Listbox.Option key={index}
                                                className={`relative px-2 py-1 cursor-default hover:bg-gray-border ${item === selectedChain && "text-white"}`}
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
                    <div className="mt-4">
                        <div className="text-xs uppercase text-gray-normal">
                            Address<span className="pl-1 text-dark-pink">*</span>
                        </div>
                        <input
                            className="outline-none border border-gray-border text-white placeholder:text-gray-border text-sm px-2.5 bg-transparent w-full h-button mt-1"
                            placeholder="Enter Contract Address"
                            onChange={(e) => setContractAddress(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center justify-center gap-5 my-5">
                        <button
                            className="pl-3 pr-4 h-button grow rounded-lg justify-center items-center gap-1 inline-flex bg-main active:scale-95 transition duration-100 ease-in-out transform focus:outline-none text-xs font-medium text-center text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            onClick={handleOK}>
                            OK
                        </button>
                        <button
                            className="pl-3 pr-4 h-button grow rounded-lg justify-center items-center gap-1 inline-flex bg-[#1A1A37] active:scale-95 transition duration-100 ease-in-out transform focus:outline-none text-xs font-medium text-center text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            onClick={onClose}>
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
