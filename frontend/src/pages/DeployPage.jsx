/* eslint-disable react/prop-types */
import { useContext, useState } from "react";
import { toast } from "react-toastify";
import { Listbox } from "@headlessui/react";
import { IoIosArrowDown } from "react-icons/io";
import { useAccount, useChainId } from "wagmi";
import { ethers } from "ethers";
import axios from "axios";

import { AppContext } from "../App";
import NotifyAddressDialog from "../components/Dialogs/NotifyAddressDialog";
import PaymentDialog from "../components/Dialogs/PaymentDialog";
import { useEthersSigner } from "../utils/provider";
import { isValidAddress, sleep } from "../utils/methods";
import { TEMPLATES } from "../utils/constants";

import etherIcon from '../assets/images/ethereum.svg'
import InstructionPopupDialog from "../components/Dialogs/InstructionPopupDialog";

export default function DeployPage({ className }) {
  const { SERVER_URL, setLoadingPrompt, setOpenLoading, sigData, signingData } =
    useContext(AppContext);
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const signer = useEthersSigner(chainId);

  const [template, setTemplate] = useState(TEMPLATES[0]);
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [decimals, setDecimals] = useState("");
  const [totalSupply, setTotalSupply] = useState("");
  const [maxTokensPerTxn, setMaxTokensPerTxn] = useState("");
  const [maxTokensPerWallet, setMaxTokensPerWallet] = useState("");
  const [maxSwapbackThreshold, setMaxSwapbackThreshold] = useState("");
  const [marketingOption, setMarketingOption] = useState(true);
  const [marketingBuyTax, setMarketingBuyTax] = useState("");
  const [marketingSellTax, setMarketingSellTax] = useState("");
  const [marketingWallet, setMarketingWallet] = useState("");
  const [developmentOption, setDevelopmentOption] = useState(true);
  const [developmentBuyTax, setDevelopmentBuyTax] = useState("");
  const [developmentSellTax, setDevelopmentSellTax] = useState("");
  const [developmentWallet, setDevelopmentWallet] = useState("");

  const [taxWallet, setTaxWallet] = useState("");
  const [initialBuyTax, setInitialBuyTax] = useState("");
  const [initialSellTax, setInitialSellTax] = useState("");
  const [buyTax, setBuyTax] = useState("");
  const [sellTax, setSellTax] = useState("");
  const [reduceBuyTaxAt, setReduceBuyTaxAt] = useState("");
  const [reduceSellTaxAt, setReduceSellTaxAt] = useState("");

  const [contractName, setContractName] = useState("");
  const [contractContent, setContractContent] = useState("");

  const [notifyAddressDialog, setNotifyAddressDialog] = useState(false);
  const [contractAddress, setContractAddress] = useState("");

  const steps = ["Create Smart Contract", "Pay", "Deploy"];
  const buttonTxts = [
    "Deploy Smart Contract",
    "Click Here to Make Payment",
    "Deploy",
  ];
  const [step, setStep] = useState(0);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [checksum, setChecksum] = useState("");
  const [depositWallet, setDepositWallet] = useState();
  const [expireTime, setExpireTime] = useState();

  const [showInstructionDialog, setShowInstructionDialog] = useState(false);

  const isTemplate56 = template === TEMPLATES[4] || template === TEMPLATES[5];

  const handleCheck = (checksum) => {
    const id = setInterval(async () => {
      console.log("Checking...", checksum);
      const { data } = await axios.post(
        `${SERVER_URL}/api/v1/misc/check-pay-confirmed`,
        {
          checksum,
          sigData,
          signingData
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (data.success && data.checked) {
        setPaymentDialog(false);

        clearInterval(id);
        setStep(2);
      } else if (data.success && !data.checked) {
        clearInterval(id);
      } else {
        setExpireTime(data.expireTime);
      }
    }, 1000);
  };

  const handleActions = async () => {
    if (step === 0) {
      if (!isConnected) {
        toast.warn("Please connect wallet!");
        return;
      }

      if (template != 'Custom') {

        if (name === "") {
          toast.warn("Please input token name");
          return;
        }

        if (symbol === "") {
          toast.warn("Please input token symbol");
          return;
        }

        const numDecimals = parseInt(decimals);
        if (isNaN(numDecimals) || numDecimals <= 0) {
          toast.warn("Invalid decimals");
          return;
        }

        const numTotalSupply = parseInt(totalSupply.replaceAll(",", ""));
        if (isNaN(numTotalSupply) || numTotalSupply <= 0) {
          toast.warn("Invalid total supply");
          return;
        }

        const numMaxTokensPerTxn = parseInt(maxTokensPerTxn.replaceAll(",", ""));
        if (
          isNaN(numMaxTokensPerTxn) ||
          numMaxTokensPerTxn <= 0 ||
          numMaxTokensPerTxn > numTotalSupply
        ) {
          toast.warn("Invalid max tokens per transaction");
          return;
        }

        const numMaxTokensPerWallet = parseInt(
          maxTokensPerWallet.replaceAll(",", "")
        );
        if (
          isNaN(numMaxTokensPerWallet) ||
          numMaxTokensPerWallet <= 0 ||
          numMaxTokensPerWallet > numTotalSupply
        ) {
          toast.warn("Invalid max tokens per wallet");
          return;
        }

        const numMaxSwapbackThreshold = parseInt(
          maxSwapbackThreshold.replaceAll(",", "")
        );
        if (
          isNaN(numMaxSwapbackThreshold) ||
          numMaxSwapbackThreshold <= 0 ||
          numMaxSwapbackThreshold > numTotalSupply
        ) {
          toast.warn("Invalid max swapback threshold");
          return;
        }

        if (!isTemplate56) {
          if (marketingOption) {
            if (!isValidAddress(marketingWallet)) {
              toast.warn("Invalid marketing wallet");
              return;
            }

            const numBuyTax = parseInt(marketingBuyTax);
            if (isNaN(numBuyTax) || numBuyTax < 0) {
              toast.warn("Invalid marketing buy tax");
              return;
            }

            const numSellTax = parseInt(marketingSellTax);
            if (isNaN(numSellTax) || numSellTax < 0) {
              toast.warn("Invalid marketing sell tax");
              return;
            }
          }

          if (developmentOption) {
            if (!isValidAddress(developmentWallet)) {
              toast.warn("Invalid development wallet");
              return;
            }

            const numBuyTax = parseInt(developmentBuyTax);
            if (isNaN(numBuyTax) || numBuyTax < 0) {
              toast.warn("Invalid development buy tax");
              return;
            }

            const numSellTax = parseInt(developmentSellTax);
            if (isNaN(numSellTax) || numSellTax < 0) {
              toast.warn("Invalid development sell tax");
              return;
            }
          }
        } else {
          if (!isValidAddress(taxWallet)) {
            toast.warn("Invalid tax wallet");
            return;
          }

          const numInitialBuyTax = parseInt(initialBuyTax);
          if (isNaN(numInitialBuyTax) || numInitialBuyTax < 0) {
            toast.warn("Invalid initial buy tax");
            return;
          }

          const numInitialSellTax = parseInt(initialSellTax);
          if (isNaN(numInitialSellTax) || numInitialSellTax < 0) {
            toast.warn("Invalid initial sell tax");
            return;
          }

          const numBuyTax = parseInt(buyTax);
          if (isNaN(numBuyTax) || numBuyTax < 0) {
            toast.warn("Invalid buy tax");
            return;
          }

          const numSellTax = parseInt(sellTax);
          if (isNaN(numSellTax) || numSellTax < 0) {
            toast.warn("Invalid sell tax");
            return;
          }

          const numReduceBuyTaxAt = parseInt(reduceBuyTaxAt);
          if (isNaN(numReduceBuyTaxAt) || numReduceBuyTaxAt < 0) {
            toast.warn("Invalid reduce buy tax at");
            return;
          }

          const numReduceSellTaxAt = parseInt(reduceSellTaxAt);
          if (isNaN(numReduceSellTaxAt) || numReduceSellTaxAt < 0) {
            toast.warn("Invalid reduce sell tax at");
            return;
          }
        }
      } else {
        if (contractName.trim() == "") {
          toast.warn("Please input contract name");
          return;
        }

        if (contractContent == "") {
          toast.warn("Empty contract content");
          return;
        }
      }
      setLoadingPrompt("Compiling token...");
      setOpenLoading(true);
      try {
        const { data } = await axios.post(
          `${SERVER_URL}/api/v1/misc/compile-token`,
          {
            template,
            name: name.replaceAll(" ", "").replaceAll(",", "").replaceAll("-", ""),
            symbol,
            decimals,
            totalSupply: totalSupply.replaceAll(",", ""),
            maxTokensPerTxn: maxTokensPerTxn.replaceAll(",", ""),
            maxTokensPerWallet: maxTokensPerWallet.replaceAll(",", ""),
            maxSwapbackThreshold: maxSwapbackThreshold.replaceAll(",", ""),
            marketingOption,
            marketingWallet,
            marketingBuyTax: parseInt(marketingBuyTax),
            marketingSellTax: parseInt(marketingSellTax),
            developmentOption,
            developmentWallet,
            developmentBuyTax: parseInt(developmentBuyTax),
            developmentSellTax: parseInt(developmentSellTax),
            taxWallet,
            initialBuyTax: parseInt(initialBuyTax),
            initialSellTax: parseInt(initialSellTax),
            buyTax: parseInt(buyTax),
            sellTax: parseInt(sellTax),
            reduceBuyTaxAt: parseInt(reduceBuyTaxAt),
            reduceSellTaxAt: parseInt(reduceSellTaxAt),
            contractContent: contractContent,
            contractName: contractName.replaceAll(" ", "").replaceAll(",", "").replaceAll("-", ""),
            sigData,
            signingData
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        if (data.success) {
          toast.success("Compiled successfully.");
          setChecksum(data.checksum);
          handleCheck(data.checksum);
          setStep(1);
        }
        setOpenLoading(false);
      } catch (err) {
        setOpenLoading(false);
        toast.warn("Failed in compiling token");
      }
    } else if (step === 1) {
      setLoadingPrompt("Processing...");
      setOpenLoading(true);
      try {
        const { data } = await axios.post(
          `${SERVER_URL}/api/v1/misc/pay-create-token`,
          {
            checksum,
            chainId,
            sigData,
            signingData
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        if (data.success) {
          setDepositWallet(data.payload.depositWallet);
          setExpireTime(data.payload.expireTime);

          setPaymentDialog(true);
        }
        setOpenLoading(false);
      } catch (err) {
        setOpenLoading(false);
        toast.warn("Failed in creating deposit wallet!");
      }
    } else if (step === 2) {
      setLoadingPrompt("Deploying...");
      setOpenLoading(true);
      const { data } = await axios.post(
        `${SERVER_URL}/api/v1/misc/get-contract-object`,
        {
          checksum,
          sigData,
          signingData
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (data.success) {
        const factory = new ethers.ContractFactory(
          data.abi,
          data.bytecode,
          signer
        );
        const contract = await factory.deploy();
        await contract.waitForDeployment()
        if (contract.target) {
          setLoadingPrompt("Verifying token...");

          try {
            const form = new FormData();
            form.append("apikey", import.meta.env.VITE_ETHERSCAN_API_KEY);
            form.append("module", "contract");
            form.append("action", "verifysourcecode");
            form.append("chainId", chainId);
            form.append("codeformat", data.codeFormat);
            form.append("compilerversion", data.compilerVersion);
            form.append("contractaddress", contract.target);
            form.append("contractname", data.name);
            form.append("runs", 200);
            form.append("sourceCode", JSON.stringify(data.sourceCode));

            const sentTime = Date.now();
            while (Date.now() - sentTime <= 120000) {
              try {
                console.log("Sending verify request...");
                const { data: verifyResponse } = await axios.post(
                  chainId === 1
                    ? "https://api.etherscan.io/api"
                    : "https://api-sepolia.etherscan.io/api",
                  form,
                  {
                    headers: {
                      "Content-Type": "multipart/form-data",
                    },
                  }
                );
                await sleep(5000);

                if (verifyResponse.message === "OK") {
                  console.log("Checking verify status...");
                  const { data: checkResponse } = await axios.get(
                    `${chainId === 1 ? "https://api.etherscan.io/api" : "https://api-sepolia.etherscan.io/api"}?module=contract&action=checkverifystatus&guid=${verifyResponse.result
                    }&apikey=${import.meta.env.VITE_ETHERSCAN_API_KEY}`
                  );

                  console.log("Check Status:", checkResponse);
                  if (
                    checkResponse.message === "OK" ||
                    checkResponse.result === "Already Verified"
                  ) {
                    console.log("Succeed to verify contract");
                    break;
                  }
                } else {
                  console.log("Failed to verify contract");
                  // break;
                }
                await sleep(5000);
              } catch (err) {
                console.log(err);
                break;
              }
            }
          } catch (err) {
            console.log(err);
          }
        }
        setOpenLoading(false);
        setContractAddress(contract.target);
        setNotifyAddressDialog(true);

        toast.success("Succeed to deploy token");
        setStep(0);
      } else {
        toast.warn(data.error);
        setOpenLoading(false);
        setStep(0);
      }
    }
  };

  const handleDone = async () => {
    setNotifyAddressDialog(false);
    setShowInstructionDialog(true);
    setStep(0);
    setName("");
    setSymbol("");
    setDecimals("");
    setTotalSupply("");
    setMaxTokensPerTxn("");
    setMaxTokensPerWallet("");
    setMaxSwapbackThreshold("");
    setMarketingOption(true);
    setMarketingBuyTax("");
    setMarketingSellTax("");
    setMarketingWallet("");
    setDevelopmentOption(true);
    setDevelopmentBuyTax("");
    setDevelopmentSellTax("");
    setDevelopmentWallet("");
    setContractAddress("");
    setTaxWallet("");
    setInitialBuyTax("");
    setInitialSellTax("");
    setBuyTax("");
    setSellTax("");
    setReduceBuyTaxAt("");
    setReduceSellTaxAt("");
    setChecksum("");
    setDepositWallet("");
    setExpireTime(0);
  };

  return (
    <div className={`${className} w-full h-full flex justify-center text-white rounded-3xl `}>
      <NotifyAddressDialog
        isOpen={notifyAddressDialog}
        title="Token Contract"
        label="Contract Address"
        address={contractAddress}
        onClose={handleDone}
      />
      <PaymentDialog
        isOpen={paymentDialog}
        ethAmount={0.2}
        expireTime={expireTime}
        depositWallet={depositWallet}
        onCancel={() => setPaymentDialog(false)}
      />
      <InstructionPopupDialog 
        isOpen={showInstructionDialog}
        onClose={() => setShowInstructionDialog(false)} 
        activateLink={true}
      />
      <div className="w-full flex flex-col h-full">
        {/* <div className="flex mb-2">
          <button
            className={`text-xs font-medium text-center underline text-blue-primary px-6 py-2 rounded-lg justify-center items-center gap-2.5 active:scale-95 transition duration-100 ease-in-out transform focus:outline-none disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed`}
            onClick={() => navigate("/faq#deploy-and-bundle")}
          >
            Instructions Here
          </button>
        </div> */}
        <div className="flex items-center justify-between w-full h-auto mb-3">
          <div className="flex gap-2 items-center m-auto text-sm font-medium text-white">
            <img src={etherIcon} className="w-12 h-12" /> {steps[step]}
          </div>
        </div>
        <div className="flex flex-col gap-3 w-full h-full rounded-b-[10px]">
          <div>
            <div className="relative">
              <div className="text-left text-white">
                Enable Trading Function
              </div>
              <Listbox value={template} onChange={setTemplate}>
                <Listbox.Button className="outline-none rounded-[10px] border border-gray-blue text-orange placeholder:text-gray-border px-2.5 bg-transparent w-full h-8 mt-1 disabled:border-gray-highlight disabled:text-gray-border relative pr-7">
                  <span className="flex items-center">
                    <span className="block truncate">{template}</span>
                  </span>
                  <IoIosArrowDown className="absolute inset-y-0 -right-1 flex items-center w-8 pr-2 mt-2.5 pointer-events-none opacity-50" />
                </Listbox.Button>
                <Listbox.Options className="absolute z-20 w-full overflow-auto border border-t-0 text-gray-normal mt bg-card-border border-gray-border rounded-lg">
                  {[...TEMPLATES, "Custom"].map((item, index) => {
                    return (
                      <Listbox.Option
                        key={index}
                        className={`relative px-2 py-1 cursor-default hover:bg-gray-border ${item === template && "text-white"
                          }`}
                        value={item}
                      >
                        <div className="flex items-center">
                          <span className="block font-normal truncate">
                            {item}
                          </span>
                        </div>
                      </Listbox.Option>
                    );
                  })}
                </Listbox.Options>
              </Listbox>
            </div>
          </div>
          {template != "Custom" ? (
            <>
              <div className="flex justify-between gap-4">
                <div className="w-[50%]">
                  <div className="text-white text-left">
                    Token Name<span className="pl-1 text-white">*</span>
                  </div>
                  <input
                    className="outline-none rounded-lg text-orange border border-gray-blue placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
                    placeholder="Enter token name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={step}
                  />
                </div>
                <div className="w-[50%]">
                  <div className="text-white text-left">
                    Symbol<span className="pl-1 text-white">*</span>
                  </div>
                  <input
                    className="outline-none rounded-lg text-orange border border-gray-blue placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
                    placeholder="Enter token symbol"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    disabled={step}
                  />
                </div>
              </div>
              <div className="flex justify-between gap-4">
                <div className="w-[50%]">
                  <div className="text-white text-left">
                    Decimals<span className="pl-1 text-white">*</span>
                  </div>
                  <input
                    className="outline-none rounded-lg text-orange border border-gray-blue placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
                    placeholder="Enter decimals"
                    value={decimals}
                    onChange={(e) => setDecimals(e.target.value)}
                    disabled={step}
                  />
                </div>
                <div className="w-[50%]">
                  <div className="text-white text-left">
                    Total Supply<span className="pl-1 text-white">*</span>
                  </div>
                  <input
                    className="outline-none rounded-lg text-orange border border-gray-blue placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
                    placeholder="Enter total supply"
                    value={totalSupply}
                    onChange={(e) => setTotalSupply(e.target.value)}
                    disabled={step}
                  />
                </div>
              </div>
              <div className="flex justify-between gap-4">
                <div className="w-[50%]">
                  <div className="text-white text-left">
                    Max Tokens Per Transaction
                    <span className="pl-1 text-white">*</span>
                  </div>
                  <input
                    className="outline-none rounded-lg text-orange border border-gray-blue placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
                    placeholder="Enter max tokens per transaction"
                    value={maxTokensPerTxn}
                    onChange={(e) => setMaxTokensPerTxn(e.target.value)}
                    disabled={step}
                  />
                </div>
                <div className="w-[50%]">
                  <div className="text-white text-left">
                    Max Tokens Per Wallet
                    <span className="pl-1 text-white">*</span>
                  </div>
                  <input
                    className="outline-none rounded-lg text-orange border border-gray-blue placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
                    placeholder="Enter max tokens per wallet"
                    value={maxTokensPerWallet}
                    onChange={(e) => setMaxTokensPerWallet(e.target.value)}
                    disabled={step}
                  />
                </div>
              </div>
              <div className="">
                <div className="text-white text-left">
                  Max SWAP back threshold
                  <span className="pl-1 text-white">*</span>
                </div>
                <input
                  className="outline-none rounded-lg text-orange border border-gray-blue placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
                  placeholder="Enter max tokens per transaction"
                  value={maxSwapbackThreshold}
                  onChange={(e) => setMaxSwapbackThreshold(e.target.value)}
                  disabled={step}
                />
              </div>
              {!isTemplate56 && (
                <div className="mt-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 outline-none bg-gray-highlight opacity-70 accent-[#4f0a7c70] ring-0"
                      checked={marketingOption}
                      onChange={(e) => setMarketingOption(e.target.checked)}
                      disabled={step}
                    />
                    <span className="ml-3 text-gradient-blue-to-purple">Marketing</span>
                  </label>
                </div>
              )}
              {marketingOption && !isTemplate56 && (
                <div className="flex flex-row items-center justify-between gap-2">
                  <div className="w-full">
                    <div className="text-white text-left">
                      Marketing Wallet
                      <span className="pl-1 text-white">*</span>
                    </div>
                    <input
                      className="outline-none rounded-lg text-orange border border-gray-blue placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
                      placeholder="Enter marketing wallet"
                      value={marketingWallet}
                      onChange={(e) => setMarketingWallet(e.target.value)}
                      disabled={step}
                    />
                  </div>
                  <div className="w-full">
                    <div className="text-white text-left">
                      Buy Tax(%)<span className="pl-1 text-white">*</span>
                    </div>
                    <input
                      className="outline-none rounded-lg text-orange border border-gray-blue placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
                      placeholder="Enter marketing buy tax"
                      value={marketingBuyTax}
                      onChange={(e) => setMarketingBuyTax(e.target.value)}
                      disabled={step}
                    />
                  </div>
                  <div className="w-full">
                    <div className="text-white text-left">
                      Sell Tax(%)<span className="pl-1 text-white">*</span>
                    </div>
                    <input
                      className="outline-none rounded-lg text-orange border border-gray-blue placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
                      placeholder="Enter marketing sell tax"
                      value={marketingSellTax}
                      onChange={(e) => setMarketingSellTax(e.target.value)}
                      disabled={step}
                    />
                  </div>
                </div>
              )}
              {!isTemplate56 && (
                <div className="mt-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 outline-none bg-gray-highlight opacity-70 accent-[#4f0a7c70] ring-0"
                      checked={developmentOption}
                      onChange={(e) => setDevelopmentOption(e.target.checked)}
                      disabled={step}
                    />
                    <span className="ml-3 text-gradient-blue-to-purple">Development</span>
                  </label>
                </div>
              )}
              {developmentOption && !isTemplate56 && (
                <div className="flex flex-row items-center justify-between gap-2">
                  <div className="w-full">
                    <div className="text-white text-left">
                      Development Wallet
                      <span className="pl-1 text-white">*</span>
                    </div>
                    <input
                      className="outline-none rounded-lg text-orange border border-gray-blue placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
                      placeholder="Enter development wallet"
                      value={developmentWallet}
                      onChange={(e) => setDevelopmentWallet(e.target.value)}
                      disabled={step}
                    />
                  </div>
                  <div className="w-full">
                    <div className="text-white text-left">
                      Buy Tax(%)<span className="pl-1 text-white">*</span>
                    </div>
                    <input
                      className="outline-none rounded-lg text-orange border border-gray-blue placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
                      placeholder="Enter development buy tax"
                      value={developmentBuyTax}
                      onChange={(e) => setDevelopmentBuyTax(e.target.value)}
                      disabled={step}
                    />
                  </div>
                  <div className="w-full">
                    <div className="text-white text-left">
                      Sell Tax(%)<span className="pl-1 text-white">*</span>
                    </div>
                    <input
                      className="outline-none rounded-lg text-orange border border-gray-blue placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
                      placeholder="Enter development sell tax"
                      value={developmentSellTax}
                      onChange={(e) => setDevelopmentSellTax(e.target.value)}
                      disabled={step}
                    />
                  </div>
                </div>
              )}
              {isTemplate56 && (
                <div className="">
                  <div className="text-white text-left">
                    Tax Wallet<span className="pl-1 text-white">*</span>
                  </div>
                  <input
                    className="outline-none rounded-lg text-orange border border-gray-blue placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
                    placeholder="Enter tax wallet"
                    value={taxWallet}
                    onChange={(e) => setTaxWallet(e.target.value)}
                    disabled={step}
                  />
                </div>
              )}
              {isTemplate56 && (
                <div className="flex justify-between gap-4">
                  <div className="w-[50%]">
                    <div className="text-white text-left">
                      Initial Buy Tax(%)
                      <span className="pl-1 text-white">*</span>
                    </div>
                    <input
                      className="outline-none rounded-lg text-orange border border-gray-blue placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
                      placeholder="Enter initial buy tax"
                      value={initialBuyTax}
                      onChange={(e) => setInitialBuyTax(e.target.value)}
                      disabled={step}
                    />
                  </div>
                  <div className="w-[50%]">
                    <div className="text-white text-left">
                      Initial Sell Tax(%)
                      <span className="pl-1 text-white">*</span>
                    </div>
                    <input
                      className="outline-none rounded-lg text-orange border border-gray-blue placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
                      placeholder="Enter initial sell tax"
                      value={initialSellTax}
                      onChange={(e) => setInitialSellTax(e.target.value)}
                      disabled={step}
                    />
                  </div>
                </div>
              )}
              {isTemplate56 && (
                <div className="flex justify-between gap-4">
                  <div className="w-[50%]">
                    <div className="text-white text-left">
                      Buy Tax(%)<span className="pl-1 text-white">*</span>
                    </div>
                    <input
                      className="outline-none rounded-lg text-orange border border-gray-blue placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
                      placeholder="Enter buy tax"
                      value={buyTax}
                      onChange={(e) => setBuyTax(e.target.value)}
                      disabled={step}
                    />
                  </div>
                  <div className="w-[50%]">
                    <div className="text-white text-left">
                      Sell Tax(%)<span className="pl-1 text-white">*</span>
                    </div>
                    <input
                      className="outline-none rounded-lg text-orange border border-gray-blue placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
                      placeholder="Enter sell tax"
                      value={sellTax}
                      onChange={(e) => setSellTax(e.target.value)}
                      disabled={step}
                    />
                  </div>
                </div>
              )}
              {isTemplate56 && (
                <div className="flex justify-between gap-4">
                  <div className="w-[50%]">
                    <div className="text-white text-left">
                      Reduce Buy Tax At
                      <span className="pl-1 text-white">*</span>
                    </div>
                    <input
                      className="outline-none rounded-lg text-orange border border-gray-blue placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
                      placeholder="Enter reduce buy tax at"
                      value={reduceBuyTaxAt}
                      onChange={(e) => setReduceBuyTaxAt(e.target.value)}
                      disabled={step}
                    />
                  </div>
                  <div className="w-[50%]">
                    <div className="text-white text-left">
                      Reduce Sell Tax At
                      <span className="pl-1 text-white">*</span>
                    </div>
                    <input
                      className="outline-none rounded-lg text-orange border border-gray-blue placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
                      placeholder="Enter reduce sell tax at"
                      value={reduceSellTaxAt}
                      onChange={(e) => setReduceSellTaxAt(e.target.value)}
                      disabled={step}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-full flex flex-col">
              <div className="">
                <div className="text-white text-left">
                  Deploy Contract Name
                  <span className="pl-1 text-white">*</span>
                </div>
                <input
                  className="outline-none font-sans text-orange border rounded-lg border-gray-blue placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
                  placeholder="Enter the deploy contract name"
                  value={contractName}
                  onChange={(e) => setContractName(e.target.value)}
                  disabled={step}
                />
              </div>
              <div className="mt-3 h-full">
                <div className="text-white text-left">
                  Contract Content
                  <span className="pl-1 text-white">*</span>
                </div>
                <textarea
                  className="outline-none font-sans text-orange rounded-lg border border-gray-blue placeholder:text-gray-border p-2.5 bg-light-black w-full h-full mt-1"
                  value={contractContent}
                  onChange={(e) => setContractContent(e.target.value)}
                  placeholder="Please type in your own token smart contract"
                ></textarea>
              </div>
            </div>
          )}
          <div className="relative flex mt-2 text-white bg-transparent justify-evenly bg-clip-border">
            <button
              className="w-full font-medium text-center text-white uppercase px-6 h-10 rounded-lg justify-center items-center gap-2.5 inline-flex bg-gradient-blue-to-purple active:scale-95 transition duration-100 ease-in-out transform focus:outline-none"
              onClick={handleActions}
            >
              {buttonTxts[step]}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
