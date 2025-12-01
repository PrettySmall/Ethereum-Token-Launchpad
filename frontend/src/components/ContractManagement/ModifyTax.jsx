import { useContext, useState } from "react";
import { AppContext } from "../../App";
import { TEMPLATES } from "../../utils/constants";
import { Listbox } from "@headlessui/react";
import { IoIosArrowDown } from "react-icons/io";
import { isValidAddress } from "../../utils/methods";
import { toast } from "react-toastify";
import { useAccount, useChainId } from "wagmi";
import { useEthersSigner } from "../../utils/provider";
import { ethers } from "ethers";
import { ContractTemplateSelect, InputWithLabel } from "../Inputs/Inputs";

const ModifyTax = () => {
  const { setLoadingPrompt, setOpenLoading } = useContext(AppContext);
  const { isConnected } = useAccount();

  const chainId = useChainId();
  const signer = useEthersSigner(chainId);

  const [tokenAddress, setTokenAddress] = useState("");

  const [template, setTemplate] = useState(TEMPLATES[0]);
  const isTemplate56 = template === TEMPLATES[4] || template === TEMPLATES[5];
  const [changeMarketingBuyTax, setChangeMarketingBuyTax] = useState(false);
  const [marketingBuyTax, setMarketingBuyTax] = useState("");
  const [changeMarketingSellTax, setChangeMarketingSellTax] = useState(false);
  const [marketingSellTax, setMarketingSellTax] = useState("");
  const [changeMarketingWallet, setChangeMarketingWallet] = useState(false);
  const [marketingWallet, setMarketingWallet] = useState("");
  const [changeDevelopmentBuyTax, setChangeDevelopmentBuyTax] = useState(false);
  const [developmentBuyTax, setDevelopmentBuyTax] = useState("");
  const [changeDevelopmentSellTax, setChangeDevelopmentSellTax] =
    useState(false);
  const [developmentSellTax, setDevelopmentSellTax] = useState("");
  const [changeDevelopmentWallet, setChangeDevelopmentWallet] = useState(false);
  const [developmentWallet, setDevelopmentWallet] = useState("");

  const [changeTaxWallet, setChangeTaxWallet] = useState(false);
  const [taxWallet, setTaxWallet] = useState("");
  const [changeBuyTax, setChangeBuyTax] = useState(false);
  const [buyTax, setBuyTax] = useState("");
  const [changeSellTax, setChangeSellTax] = useState(false);
  const [sellTax, setSellTax] = useState("");

  const handleActions = async () => {
    if (!isConnected) {
      toast.warn("Please connect wallet!");
      return;
    }

    if (!isValidAddress(tokenAddress)) {
      toast.warn("Invalid token address!");
      return;
    }

    if (!isTemplate56) {
      if (changeMarketingWallet) {
        if (!isValidAddress(marketingWallet)) {
          toast.warn("Invalid marketing wallet");
          return;
        }

        const numMarketingBuyTax = parseInt(marketingBuyTax);
        if (
          (isNaN(numMarketingBuyTax) || numMarketingBuyTax < 0)
        ) {
          toast.warn("Invalid marketing buy tax");
          return;
        }

        const numMarketingSellTax = parseInt(marketingSellTax);
        if (
          (isNaN(numMarketingSellTax) || numMarketingSellTax < 0)
        ) {
          toast.warn("Invalid marketing sell tax");
          return;
        }
      }

      if (changeDevelopmentWallet) {
        if (!isValidAddress(developmentWallet)) {
          toast.warn("Invalid development wallet");
          return;
        }

        const numDevelopmentBuyTax = parseInt(developmentBuyTax);
        if (
          (isNaN(numDevelopmentBuyTax) || numDevelopmentBuyTax < 0)
        ) {
          toast.warn("Invalid development buy tax");
          return;
        }

        const numDevelopmentSellTax = parseInt(developmentSellTax);
        if (
          (isNaN(numDevelopmentSellTax) || numDevelopmentSellTax < 0)
        ) {
          toast.warn("Invalid development sell tax");
          return;
        }
      }
      try {
        setLoadingPrompt("Updating Token Tax...");
        setOpenLoading(true);
        const contract = new ethers.Contract(
          tokenAddress,
          [
            {
              inputs: [
                {
                  components: [
                    {
                      internalType: "bool",
                      name: "isChanged",
                      type: "bool",
                    },
                    {
                      internalType: "address",
                      name: "value",
                      type: "address",
                    },
                  ],
                  internalType: "struct TaxAddressChange",
                  name: "_newMarketingWallet",
                  type: "tuple",
                },
                {
                  components: [
                    {
                      internalType: "bool",
                      name: "isChanged",
                      type: "bool",
                    },
                    {
                      internalType: "uint256",
                      name: "value",
                      type: "uint256",
                    },
                  ],
                  internalType: "struct TaxChange",
                  name: "_newBuyMarketingFee",
                  type: "tuple",
                },
                {
                  components: [
                    {
                      internalType: "bool",
                      name: "isChanged",
                      type: "bool",
                    },
                    {
                      internalType: "uint256",
                      name: "value",
                      type: "uint256",
                    },
                  ],
                  internalType: "struct TaxChange",
                  name: "_newSellMarketingFee",
                  type: "tuple",
                },
                {
                  components: [
                    {
                      internalType: "bool",
                      name: "isChanged",
                      type: "bool",
                    },
                    {
                      internalType: "address",
                      name: "value",
                      type: "address",
                    },
                  ],
                  internalType: "struct TaxAddressChange",
                  name: "_newDevelopmentWallet",
                  type: "tuple",
                },
                {
                  components: [
                    {
                      internalType: "bool",
                      name: "isChanged",
                      type: "bool",
                    },
                    {
                      internalType: "uint256",
                      name: "value",
                      type: "uint256",
                    },
                  ],
                  internalType: "struct TaxChange",
                  name: "_newBuyDevFee",
                  type: "tuple",
                },
                {
                  components: [
                    {
                      internalType: "bool",
                      name: "isChanged",
                      type: "bool",
                    },
                    {
                      internalType: "uint256",
                      name: "value",
                      type: "uint256",
                    },
                  ],
                  internalType: "struct TaxChange",
                  name: "_newSellDevFee",
                  type: "tuple",
                },
              ],
              name: "updateTaxConfig",
              outputs: [],
              stateMutability: "nonpayable",
              type: "function",
            },
          ],
          signer
        );
        const tx = await contract.updateTaxConfig(
          {
            isChanged: changeMarketingWallet,
            value:
              marketingWallet == ""
                ? "0x0000000000000000000000000000000000000000"
                : marketingWallet,
          },
          {
            isChanged: changeMarketingWallet,
            value: marketingBuyTax == "" ? "0" : marketingBuyTax,
          },
          {
            isChanged: changeMarketingWallet,
            value: marketingSellTax == "" ? "0" : marketingSellTax,
          },
          {
            isChanged: changeDevelopmentWallet,
            value:
              developmentWallet == ""
                ? "0x0000000000000000000000000000000000000000"
                : developmentWallet,
          },
          {
            isChanged: changeDevelopmentWallet,
            value: developmentBuyTax == "" ? "0" : developmentBuyTax,
          },
          {
            isChanged: changeDevelopmentWallet,
            value: developmentSellTax == "" ? "0" : developmentSellTax,
          }
        );
        await tx.wait();
      } catch (error) {
        console.log(error);
        toast.warn("Failed");
        setLoadingPrompt("Failed to update token tax");
        setOpenLoading(false);
        return;
      }
    } else {
      if (changeTaxWallet && !isValidAddress(taxWallet)) {
        toast.warn("Invalid tax wallet");
        return;
      }

      const numBuyTax = parseInt(buyTax);
      if (changeBuyTax && (isNaN(numBuyTax) || numBuyTax < 0)) {
        toast.warn("Invalid buy tax");
        return;
      }

      const numSellTax = parseInt(sellTax);
      if (changeSellTax && (isNaN(numSellTax) || numSellTax < 0)) {
        toast.warn("Invalid sell tax");
        return;
      }

      try {
        setLoadingPrompt("Updating Token Tax...");
        setOpenLoading(true);

        const contract = new ethers.Contract(
          tokenAddress,
          [
            {
              inputs: [
                {
                  components: [
                    {
                      internalType: "bool",
                      name: "isChanged",
                      type: "bool",
                    },
                    {
                      internalType: "address",
                      name: "value",
                      type: "address",
                    },
                  ],
                  internalType: "struct TaxAddressChange",
                  name: "_newTaxWallet",
                  type: "tuple",
                },
                {
                  components: [
                    {
                      internalType: "bool",
                      name: "isChanged",
                      type: "bool",
                    },
                    {
                      internalType: "uint256",
                      name: "value",
                      type: "uint256",
                    },
                  ],
                  internalType: "struct TaxChange",
                  name: "_newBuyTax",
                  type: "tuple",
                },
                {
                  components: [
                    {
                      internalType: "bool",
                      name: "isChanged",
                      type: "bool",
                    },
                    {
                      internalType: "uint256",
                      name: "value",
                      type: "uint256",
                    },
                  ],
                  internalType: "struct TaxChange",
                  name: "_newSellTax",
                  type: "tuple",
                },
              ],
              name: "updateTaxConfig",
              outputs: [],
              stateMutability: "nonpayable",
              type: "function",
            },
          ],
          signer
        );
        const tx = await contract.updateTaxConfig(
          {
            isChanged: changeTaxWallet,
            value:
              taxWallet == ""
                ? "0x0000000000000000000000000000000000000000"
                : taxWallet,
          },
          { isChanged: changeBuyTax, value: buyTax == "" ? "0" : buyTax },
          { isChanged: changeSellTax, value: sellTax == "" ? "0" : sellTax }
        );
        await tx.wait();
      } catch (error) {
        console.log(error);
        setLoadingPrompt("Failed to update token tax");
        setOpenLoading(false);
        toast.warn("Failed");
        return;
      }
    }
    toast.success("Success");
    setOpenLoading(false);
  };

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex items-center justify-between w-full h-auto">
        <div className="text-sm font-conthrax font-medium text-white">ModifyTax</div>
      </div>
      <div className="relative">
        <ContractTemplateSelect onChange={(v) => setTemplate(v)} />
      </div>
      <div className="">
        <InputWithLabel
          label="Token Contract Address"
          required={true}
          placeholder="Enter address"
          value={tokenAddress}
          onChange={(v) => setTokenAddress(v)}
        />
      </div>
      {!isTemplate56 && (
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-1 text-gradient-blue-to-purple text-left cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 outline-none bg-transparent opacity-100 accent-[#4f0a7c70] ring-0"
              checked={changeMarketingWallet}
              onChange={(e) => setChangeMarketingWallet(e.target.checked)}
            />
            Marketing
          </label>
          <div className="flex flex-row items-center justify-between gap-2">
            <InputWithLabel
              label="Marketing Wallet"
              placeholder="Enter Marketing wallet address"
              disabled={!changeMarketingWallet}
              value={marketingWallet}
              onChange={(v) => setMarketingWallet(v)}
            />
            <InputWithLabel
              label="Buy Tax(%)"
              placeholder="Enter Marketing buy tax"
              disabled={!changeMarketingWallet}
              value={marketingBuyTax}
              onChange={(v) => setMarketingBuyTax(v)}
            />
            <InputWithLabel
              label="Sell Tax(%)"
              placeholder="Enter Marketing sell tax"
              disabled={!changeMarketingWallet}
              value={marketingSellTax}
              onChange={(v) => setMarketingSellTax(v)}
            />
          </div>
        </div>
      )}
      {!isTemplate56 && (
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-1 text-gradient-blue-to-purple text-left cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 outline-none bg-gray-highlight opacity-100 accent-[#4f0a7c70] ring-0"
              checked={changeDevelopmentWallet}
              onChange={(e) => setChangeDevelopmentWallet(e.target.checked)}
            />
            Development
          </label>
          <div className="flex flex-row items-center justify-between gap-2">
            <InputWithLabel
              label="Development Wallet"
              placeholder="Enter development wallet"
              disabled={!changeDevelopmentWallet}
              value={developmentWallet}
              onChange={(v) => setDevelopmentWallet(v)}
            />
            <InputWithLabel
              label="Buy Tax(%)"
              placeholder="Enter development buy tax"
              disabled={!changeDevelopmentWallet}
              value={developmentBuyTax}
              onChange={(v) => setDevelopmentBuyTax(v)}
            />
            <InputWithLabel
              label="Sell Tax(%)"
              placeholder="Enter development sell tax"
              disabled={!changeDevelopmentWallet}
              value={developmentSellTax}
              onChange={(v) => setDevelopmentSellTax(v)}
            />
          </div>
        </div>
      )}
      {isTemplate56 && (
        <div className="">
          <label className="flex items-center gap-1 text-gray-normal text-left cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 outline-none bg-gray-highlight opacity-100 accent-[#4f0a7c70] ring-0"
              checked={changeTaxWallet}
              onChange={(e) => setChangeTaxWallet(e.target.checked)}
            />
            Tax Wallet
            <span className="pl-1 text-white">*</span>
          </label>
          <input
            className="outline-none rounded-lg text-orange border border-gray-blue disabled:border-gray-border disabled:text-gray-normal placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
            placeholder="Enter tax wallet"
            disabled={!changeTaxWallet}
            value={taxWallet}
            onChange={(e) => setTaxWallet(e.target.value)}
          />
        </div>
      )}
      {isTemplate56 && (
        <div className="flex justify-between gap-4">
          <div className="w-[50%]">
            <label className="flex items-center gap-1 text-gray-normal text-left cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 outline-none bg-gray-highlight opacity-100 accent-[#4f0a7c70] ring-0"
                checked={changeBuyTax}
                onChange={(e) => setChangeBuyTax(e.target.checked)}
              />
              Buy Tax(%)
              <span className="pl-1 text-white">*</span>
            </label>
            <input
              className="outline-none rounded-lg text-orange border border-gray-blue disabled:border-gray-border disabled:text-gray-normal placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
              placeholder="Enter buy tax"
              disabled={!changeBuyTax}
              value={buyTax}
              onChange={(e) => setBuyTax(e.target.value)}
            />
          </div>
          <div className="w-[50%]">
            <label className="flex items-center gap-1 text-gray-normal text-left cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 outline-none bg-gray-highlight opacity-100 accent-[#4f0a7c70] ring-0"
                checked={changeSellTax}
                onChange={(e) => setChangeSellTax(e.target.checked)}
              />
              Sell Tax(%)
              <span className="pl-1 text-white">*</span>
            </label>
            <input
              className="outline-none rounded-lg text-orange border border-gray-blue disabled:border-gray-border disabled:text-gray-normal placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
              placeholder="Enter sell tax"
              disabled={!changeSellTax}
              value={sellTax}
              onChange={(e) => setSellTax(e.target.value)}
            />
          </div>
        </div>
      )}
      <div className="relative flex h-full text-white bg-transparent justify-evenly bg-clip-border">
        <button
          className="w-full font-conthrax font-medium text-center text-white uppercase px-6 h-10 rounded-lg justify-center items-center gap-2.5 inline-flex bg-gradient-blue-to-purple active:scale-95 transition duration-100 ease-in-out transform focus:outline-none"
          onClick={handleActions}
        >
          Update Tax
          <img src="/assets/icon/ic_launch.svg" className="w-4 h-4" alt="launch" />
        </button>
      </div>
    </div>
  );
};

export default ModifyTax;
