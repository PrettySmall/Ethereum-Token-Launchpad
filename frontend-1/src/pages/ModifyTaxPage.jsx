import TopBar from "../components/TopBar/TopBar";
import { useContext, useState } from "react";
import { AppContext } from "../App";
import { TEMPLATES } from "../utils/constants";
import { Listbox } from "@headlessui/react";
import { IoIosArrowDown } from "react-icons/io";
import { isValidAddress } from "../utils/methods";
import { toast } from "react-toastify";
import { useAccount, useChainId } from "wagmi";
import { useEthersSigner } from "../utils/provider";
import { ethers } from "ethers";
import { Card } from "../components/Card/Card";
import { Field } from "../components/Field/Field";

const ModifyTaxPage = () => {
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
    // <div className="flex flex-col w-[1000px] gap-2 text-left">
    //   <TopBar />
    //   <div className="rounded-large border-[16px] border-gray-shadow max-w-[800px] mx-auto">
    //     <div className="bg-card-bg rounded-3xl border-8 border-card-border h-full">
    //       <Card className="px-[30px] py-10 rounded-3xl border border-solid border-gray-border flex flex-col gap-4 pt-8">
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between w-full h-auto mb-2">
        <div className="m-auto text-sm font-medium text-white">ModifyTax</div>
      </div>
      <div className="relative">
        <div className="text-gray-normal text-left">
          Enable Trading Function
        </div>
        <Listbox value={template} onChange={setTemplate}>
          <Listbox.Button className="outline-none rounded-lg border border-gray-blue text-orange placeholder:text-gray-border px-2.5 bg-transparent w-full h-8 mt-1 disabled:border-gray-highlight disabled:text-gray-border relative pr-7">
            <span className="flex items-center">
              <span className="block truncate">{template}</span>
            </span>
            <IoIosArrowDown className="absolute inset-y-0 -right-1 flex items-center w-8 pr-2 mt-2.5 pointer-events-none opacity-50" />
          </Listbox.Button>
          <Listbox.Options className="absolute z-20 w-full overflow-auto border border-t-0 text-gray-normal mt bg-gray-dark border-gray-border">
            {TEMPLATES.map((item, index) => {
              return (
                <Listbox.Option
                  key={index}
                  className={`relative px-2 py-1 cursor-default hover:bg-gray-border ${item === template && "text-white"
                    }`}
                  value={item}
                >
                  <div className="flex items-center">
                    <span className="block font-normal truncate">{item}</span>
                  </div>
                </Listbox.Option>
              );
            })}
          </Listbox.Options>
        </Listbox>
      </div>
      <div className="">
        <div className="text-white text-left">
          Token Contract Address
          <span className="pl-1 text-green-normal">*</span>
        </div>
        <input
          className="outline-none rounded-lg text-orange border border-gray-blue placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
          placeholder="Enter address"
          value={tokenAddress}
          onChange={(e) => setTokenAddress(e.target.value)}
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
            <div className="w-full">
              <label className="flex items-center gap-1 text-white text-left cursor-pointer">
                Marketing Wallet
              </label>
              <input
                className="outline-none rounded-lg text-orange border border-gray-blue disabled:border-gray-border disabled:text-gray-normal placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
                placeholder="Enter marketing wallet"
                disabled={!changeMarketingWallet}
                value={marketingWallet}
                onChange={(e) => setMarketingWallet(e.target.value)}
              />
            </div>
            <div className="w-full">
              <label className="flex items-center gap-1 text-white text-left cursor-pointer">
                Buy Tax(%)
              </label>
              <input
                className="outline-none rounded-lg text-orange border border-gray-blue disabled:border-gray-border disabled:text-gray-normal placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
                placeholder="Enter marketing buy tax"
                value={marketingBuyTax}
                disabled={!changeMarketingWallet}
                onChange={(e) => setMarketingBuyTax(e.target.value)}
              />
            </div>
            <div className="w-full">
              <label className="flex items-center gap-1 text-white text-left cursor-pointer">
                Sell Tax(%)
              </label>
              <input
                className="outline-none rounded-lg text-orange border border-gray-blue disabled:border-gray-border disabled:text-gray-normal placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
                placeholder="Enter marketing sell tax"
                value={marketingSellTax}
                disabled={!changeMarketingWallet}
                onChange={(e) => setMarketingSellTax(e.target.value)}
              />
            </div>
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
            <div className="w-full">
              <label className="flex items-center gap-1 text-white text-left cursor-pointer">
                Development Wallet
              </label>
              <input
                className="outline-none rounded-lg text-orange border border-gray-blue disabled:border-gray-border disabled:text-gray-normal placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
                placeholder="Enter development wallet"
                disabled={!changeDevelopmentWallet}
                value={developmentWallet}
                onChange={(e) => setDevelopmentWallet(e.target.value)}
              />
            </div>
            <div className="w-full">
              <label className="flex items-center gap-1 text-white text-left cursor-pointer">
                Buy Tax(%)
              </label>
              <input
                className="outline-none rounded-lg text-orange border border-gray-blue disabled:border-gray-border disabled:text-gray-normal placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
                placeholder="Enter development buy tax"
                disabled={!changeDevelopmentWallet}
                value={developmentBuyTax}
                onChange={(e) => setDevelopmentBuyTax(e.target.value)}
              />
            </div>
            <div className="w-full">
              <label className="flex items-center gap-1 text-white text-left cursor-pointer">
                Sell Tax(%)
              </label>
              <input
                className="outline-none rounded-lg text-orange border border-gray-blue disabled:border-gray-border disabled:text-gray-normal placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
                placeholder="Enter development sell tax"
                disabled={!changeDevelopmentWallet}
                value={developmentSellTax}
                onChange={(e) => setDevelopmentSellTax(e.target.value)}
              />
            </div>
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
          className="w-full font-medium text-center text-white uppercase px-6 h-10 rounded-lg justify-center items-center gap-2.5 inline-flex bg-gradient-blue-to-purple active:scale-95 transition duration-100 ease-in-out transform focus:outline-none"
          onClick={handleActions}
        >
          Update
        </button>
      </div>
    </div>
    //       </Card>
    //     </div>
    //   </div>
    // </div>
  );
};

export default ModifyTaxPage;
