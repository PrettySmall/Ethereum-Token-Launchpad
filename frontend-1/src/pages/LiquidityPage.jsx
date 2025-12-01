/* eslint-disable react/prop-types */
import { useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useAccount, useChainId } from "wagmi";
import { ethers } from "ethers";
import BigNumber from "bignumber.js";

import { AppContext } from "../App";
import { useEthersSigner } from "../utils/provider";
import { isValidAddress } from "../utils/methods";

import tokenABI from "../abi/ITradingToken.json";
import routerABI from "../abi/IUniSwapV2Router02.json";
import factoryABI from "../abi/IUniswapV2Factory.json";
import { TEMPLATES } from "../utils/constants";
import { Listbox } from "@headlessui/react";
import { IoIosArrowDown } from "react-icons/io";
import { GradientButton } from "../components/Buttons/Buttons";

const UNISWAP_V2_ROUTER = {
  1: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  8453: "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24",
  5: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  11155111: "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008",
};

export default function LiquidityPage({ className, onlyEnableTrading }) {
  const { setLoadingPrompt, setOpenLoading } = useContext(AppContext);
  const chainId = useChainId();
  const { isConnected, address } = useAccount();
  // const provider = useEthersProvider(chainId);
  const signer = useEthersSigner(chainId);

  const [addBaseTokenAddress, setAddBaseTokenAddress] = useState("");
  const [addBaseTokenAmount, setAddBaseTokenAmount] = useState("");
  const [addEthAmount, setAddEthAmount] = useState("");
  const [removeBaseTokenAddress, setRemoveBaseTokenAddress] = useState("");
  const [removeLpTokenPercent, setRemoveLpTokenPercent] = useState("0");
  const [removeLpTokenAmount, setRemoveLpTokenAmount] = useState("0");
  const [removeLpTokenBalance, setRemoveLpTokenBalance] = useState("0");
  const [removeLpTokenDecimals, setRemoveLpTokenDecimals] = useState(0);
  const [enableTradingTokenAddress, setEnableTradingTokenAddress] =
    useState("");
  const [deadBlock, setDeadBlock] = useState("");
  const [template, setTemplate] = useState(TEMPLATES[0]);
  const [templateForRenounce, setTemplateForRenounce] = useState(TEMPLATES[0]);
  const [tokenAddressForRenounce, setTokenAddressForRenounce] = useState("");

  const updateBalance = async (tokenAddress, address, signer) => {
    try {
      console.log("Updating token balance...");
      const tokenContract = new ethers.Contract(tokenAddress, tokenABI, signer);
      const decimals = await tokenContract.decimals();
      const balance = await tokenContract.balanceOf(address);
      const amount = new BigNumber(
        balance.toString() + "e-" + decimals.toString()
      );
      return amount.toString();
    } catch (err) {
      console.log(err);
      return "";
    }
  };

  const updateLpBalance = async (chainId, tokenAddress, address, signer) => {
    try {
      console.log("Updating LP balance...");
      const routerContract = new ethers.Contract(
        UNISWAP_V2_ROUTER[chainId],
        routerABI,
        signer
      );
      const WETH = await routerContract.WETH();
      const factoryAddr = await routerContract.factory();
      const factoryContract = new ethers.Contract(
        factoryAddr,
        factoryABI,
        signer
      );
      const lpAddr = await factoryContract.getPair(WETH, tokenAddress);
      const lpContract = new ethers.Contract(lpAddr, tokenABI, signer);
      const decimals = await lpContract.decimals();
      const balance = await lpContract.balanceOf(address);

      console.log(lpAddr, lpContract, decimals, balance)

      setRemoveLpTokenDecimals(parseInt(decimals.toString()));

      const amount = new BigNumber(
        balance.toString() + "e-" + decimals.toString()
      );
      return amount.toString();
    } catch (err) {
      console.log(err);
      return "";
    }
  };

  useEffect(() => {
    if (addBaseTokenAddress !== "")
      updateBalance(addBaseTokenAddress, address, signer).then((amount) =>
        setAddBaseTokenAmount(amount)
      );
    else setAddBaseTokenAmount("");
  }, [addBaseTokenAddress, signer, address]);

  useEffect(() => {
    if (removeBaseTokenAddress !== "")
      updateLpBalance(chainId, removeBaseTokenAddress, address, signer).then(
        (amount) => setRemoveLpTokenBalance(amount)
      );
    else setRemoveLpTokenBalance("0");
  }, [removeBaseTokenAddress, chainId, signer, address]);

  useEffect(() => {
    setRemoveLpTokenAmount(
      new BigNumber(removeLpTokenBalance)
        .multipliedBy(parseInt(removeLpTokenPercent))
        .div(100)
        .toString()
    );
  }, [removeLpTokenPercent])

  const handleAddLiquidity = async () => {
    if (!isConnected) {
      toast.warn("Please connect wallet!");
      return;
    }

    if (!isValidAddress(addBaseTokenAddress)) {
      toast.warn("Invalid token address!");
      return;
    }

    const amount0 = Number(addBaseTokenAmount.replaceAll(",", ""));
    if (isNaN(amount0) || amount0 < 0) {
      toast.warn("Invalid token amount!");
      return;
    }

    const amount1 = Number(addEthAmount.replaceAll(",", ""));
    if (isNaN(amount1) || amount1 < 0) {
      toast.warn("Invalid ETH amount!");
      return;
    }

    try {
      setLoadingPrompt("Checking pair...");
      setOpenLoading(true);

      const routerContract = new ethers.Contract(
        UNISWAP_V2_ROUTER[chainId],
        routerABI,
        signer
      );
      const WETH = await routerContract.WETH();
      const factoryAddr = await routerContract.factory();
      const factoryContract = new ethers.Contract(
        factoryAddr,
        factoryABI,
        signer
      );
      const pairAddr = await factoryContract.getPair(
        addBaseTokenAddress,
        WETH.toString()
      );
      console.log(pairAddr);
      if (pairAddr === "0x0000000000000000000000000000000000000000") {
        setLoadingPrompt("Creating pair...");
        const tx = await factoryContract.createPair(
          addBaseTokenAddress,
          WETH.toString()
        );
        if (tx) await tx.wait();
      }

      const tokenContract = new ethers.Contract(
        addBaseTokenAddress,
        tokenABI,
        signer
      );
      const decimals = await tokenContract.decimals();
      const amount0Wei = new BigNumber(
        amount0.toString() + "e" + decimals.toString()
      );
      const amount1Wei = new BigNumber(amount1.toString() + "e18");

      const allowance = await tokenContract.allowance(
        address,
        UNISWAP_V2_ROUTER[chainId]
      );
      if (amount0Wei.gt(new BigNumber(allowance.toString()))) {
        setLoadingPrompt("Approving...");
        const tx = await tokenContract.approve(
          UNISWAP_V2_ROUTER[chainId],
          ethers.MaxUint256
        );
        if (tx) await tx.wait();
      }

      setLoadingPrompt("Adding liquidity...");
      const args = [
        addBaseTokenAddress,
        amount0Wei.toFixed(0),
        "0",
        "0",
        address,
        Math.floor(Date.now() / 1000) + 3600,
        { value: amount1Wei.toFixed(0) },
      ];
      const tx = await routerContract.addLiquidityETH(...args);
      if (tx) await tx.wait();

      const balance = await updateBalance(addBaseTokenAddress, address, signer);
      setAddBaseTokenAmount(balance);

      toast.success("Added liquidity!");
    } catch (err) {
      console.log(err);
      toast.warn("Failed to add liquidity!");
    }
    setOpenLoading(false);
  };

  const handleRemoveLiquidity = async () => {
    if (!isConnected) {
      toast.warn("Please connect wallet!");
      return;
    }

    if (!isValidAddress(removeBaseTokenAddress)) {
      toast.warn("Invalid token address!");
      return;
    }

    if (
      new BigNumber(removeLpTokenAmount).gt(new BigNumber(removeLpTokenBalance))
    ) {
      toast.warn("Invalid lp token amount!");
      return;
    }

    try {
      setLoadingPrompt("Removing liquidity...");
      setOpenLoading(true);

      const routerContract = new ethers.Contract(
        UNISWAP_V2_ROUTER[chainId],
        routerABI,
        signer
      );
      const WETH = await routerContract.WETH();
      const factoryAddr = await routerContract.factory();
      const factoryContract = new ethers.Contract(
        factoryAddr,
        factoryABI,
        signer
      );
      const lpAddr = await factoryContract.getPair(
        WETH,
        removeBaseTokenAddress
      );
      const lpContract = new ethers.Contract(lpAddr, tokenABI, signer);
      // const decimals = await lpContract.decimals();
      const allowance = new BigNumber(
        (
          await lpContract.allowance(address, UNISWAP_V2_ROUTER[chainId])
        ).toString()
      );

      const amount = new BigNumber(
        `${removeLpTokenAmount}e${removeLpTokenDecimals}`
      ).toFixed(0);
      
      if (allowance.lt(amount)) {
        const tx = await lpContract.approve(
          UNISWAP_V2_ROUTER[chainId],
          ethers.MaxUint256
        );
        if (tx) await tx.wait();
      }

      const tx =
        await routerContract.removeLiquidityETHSupportingFeeOnTransferTokens(
          removeBaseTokenAddress,
          amount,
          "0",
          "0",
          address,
          Math.floor(Date.now() / 1000) + 3600
        );
      if (tx) await tx.wait();

      const lpBalance = await updateLpBalance(
        chainId,
        removeBaseTokenAddress,
        address,
        signer
      );
      setRemoveLpTokenBalance(lpBalance);

      toast.success("Removed liquidity!");
    } catch (err) {
      console.log(err);
      toast.warn("Failed to remove liquidity!");
    }
    setOpenLoading(false);
  };

  const handleEnableTrading = async () => {
    if (!isConnected) {
      toast.warn("Please connect wallet!");
      return;
    }

    if (!isValidAddress(enableTradingTokenAddress)) {
      toast.warn("Invalid token address!");
      return;
    }

    if (template == TEMPLATES[6] && isNaN(Number(deadBlock))) {
      toast.warn("Invalid block number!");
      return;
    }

    try {
      setLoadingPrompt("Trading Enabling...");
      setOpenLoading(true);

      const tokenContract = new ethers.Contract(
        enableTradingTokenAddress,
        tokenABI,
        signer
      );

      let tx;
      if (template == TEMPLATES[0]) {
        tx = await tokenContract.enableTrading();
      } else if (template == TEMPLATES[1]) {
        tx = await tokenContract.openTrading();
      } else if (template == TEMPLATES[2]) {
        tx = await tokenContract.startTrading();
      } else if (template == TEMPLATES[3]) {
        tx = await tokenContract.activateTrading();
      } else if (template == TEMPLATES[4]) {
        tx = await tokenContract.trade();
      } else if (template == TEMPLATES[5]) {
        tx = await tokenContract.launch();
      } else if (template == TEMPLATES[6]) {
        tx = await tokenContract.start(deadBlock);
      }

      if (tx) await tx.wait();

      toast.success("Trading Enabled!");
    } catch (err) {
      console.log(err);
      toast.warn("Failed to enable trading!");
    }
    setOpenLoading(false);
  };

  const handleRenounce = async () => {
    if (!isConnected) {
      toast.warn("Please connect wallet!");
      return;
    }

    if (!isValidAddress(tokenAddressForRenounce)) {
      toast.warn("Invalid token address!");
      return;
    }

    try {
      setLoadingPrompt("Trading Enabling...");
      setOpenLoading(true);

      const tokenContract = new ethers.Contract(
        tokenAddressForRenounce,
        tokenABI,
        signer
      );

      const tx = await tokenContract.renounceOwnership();
      
      if (tx) await tx.wait();

      toast.success("Contract Renounced!");
    } catch (err) {
      console.log(err);
      toast.warn("Failed to renounce contract!");
    }
    setOpenLoading(false);
  };

  return (
    <div className={`flex flex-col text-white m-auto ${className}`}>
      { !onlyEnableTrading ? 
      <>
      <div className="w-full">
        <div className="flex items-center justify-between w-full h-auto mb-3">
          <div className="m-auto text-2xl font-medium text-white">
            Add Liquidity
          </div>
        </div>
        <div className="flex flex-col gap-3 w-full rounded-b-[10px]">
          <div className="">
            <div className="text-white text-left">
              Token Contract Address
              <span className="pl-1 text-white">*</span>
            </div>
            <input
              className="outline-none rounded-lg text-orange border border-gray-blue placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
              placeholder="Enter address"
              value={addBaseTokenAddress}
              onChange={(e) => setAddBaseTokenAddress(e.target.value)}
            />
          </div>
          <div className="">
            <div className="text-white text-left">
              Token Amount Added To Liquidity Pool
              <span className="pl-1 text-green-normal">*</span>
            </div>
            <input
              className="outline-none rounded-lg text-orange border border-gray-blue placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
              placeholder="Enter token amount"
              value={addBaseTokenAmount}
              onChange={(e) => setAddBaseTokenAmount(e.target.value)}
            />
          </div>
          <div className="">
            <div className="text-white text-left">
              ETH Amount for Liquidity Pool
              <span className="pl-1 text-white">*</span>
            </div>
            <input
              className="outline-none rounded-lg border border-gray-blue text-orange placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
              placeholder="Enter ETH amount"
              value={addEthAmount}
              onChange={(e) => setAddEthAmount(e.target.value)}
            />
          </div>
          <div className="relative flex h-full text-white bg-transparent justify-evenly bg-clip-border">
            <button
              className="w-full font-medium text-center text-white uppercase px-6 h-10 rounded-lg justify-center items-center gap-2.5 inline-flex bg-gradient-blue-to-purple active:scale-95 transition duration-100 ease-in-out transform focus:outline-none"
              onClick={handleAddLiquidity}
            >
              Add Liquidity
            </button>
          </div>
        </div>
      </div>
      <div className="w-full mt-12">
        <div className="flex items-center justify-between w-full h-auto mb-3">
          <div className="m-auto text-xl font-medium text-white">
            Remove Liquidity
          </div>
        </div>
        <div className="flex flex-col gap-3 w-full rounded-b-[10px]">
          <div className="">
            <div className="text-white text-left">
              Token Contract Address
              <span className="pl-1 text-white">*</span>
            </div>
            <input
              className="outline-none rounded-lg text-orange border border-gray-blue placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
              placeholder="Enter address"
              value={removeBaseTokenAddress}
              onChange={(e) => setRemoveBaseTokenAddress(e.target.value)}
            />
          </div>
          <div className="">
            <div className="text-white text-left">
              Remove liquidity
              <span className="pl-1 text-white">*</span>
            </div>
            <div className="outline-none rounded-lg text-orange border border-gray-blue placeholder:text-gray-border px-3.5 bg-light-black w-full py-2 mt-1">
              <p className="text-right !text-orange">
                Balance: {removeLpTokenBalance}
              </p>
              <input
                className="w-full text-right text-orange bg-transparent outline-none placeholder:text-gray-border h-8"
                placeholder="Enter % amount to remove from liquidity"
                value={removeLpTokenAmount}
                onChange={(e) => setRemoveLpTokenAmount(e.target.value)}
              />
              <div className="flex text-white text-[10px] gap-1 justify-end">
                <GradientButton
                  className={`px-3 py-[2px] rounded-full bg-card-border active:scale-95 transition duration-100 ease-in-out transform text-xxs text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed`}
                  onClick={() => setRemoveLpTokenPercent("25")}
                  selected={removeLpTokenPercent === "25"}
                >
                  25%
                </GradientButton>
                <GradientButton
                  className={`px-3 py-[2px] rounded-full bg-card-border active:scale-95 transition duration-100 ease-in-out transform text-xxs text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed`}
                  onClick={() => setRemoveLpTokenPercent("50")}
                  selected={removeLpTokenPercent === "50"}
                >
                  50%
                </GradientButton>
                <GradientButton
                  className={`px-3 py-[2px] rounded-full bg-card-border active:scale-95 transition duration-100 ease-in-out transform text-xxs text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed`}
                  onClick={() => setRemoveLpTokenPercent("75")}
                  selected={removeLpTokenPercent === "75"}
                >
                  75%
                </GradientButton>
                <GradientButton
                  className={`px-3 py-[2px] rounded-full bg-card-border active:scale-95 transition duration-100 ease-in-out transform text-xxs text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed`}
                  onClick={() => setRemoveLpTokenPercent("100")}
                  selected={removeLpTokenPercent === "100"}
                >
                  100%
                </GradientButton>
              </div>
            </div>
          </div>
          <div className="relative flex h-full text-white bg-transparent justify-evenly bg-clip-border">
            <button
              className="w-full font-medium text-center text-white uppercase px-6 h-10 rounded-lg justify-center items-center gap-2.5 inline-flex bg-gradient-blue-to-purple active:scale-95 transition duration-100 ease-in-out transform focus:outline-none"
              onClick={handleRemoveLiquidity}
            >
              Remove Liquidity
            </button>
          </div>
        </div>
      </div>
      {/* <div className="w-full h-[1px] bg-gray-border" /> */}
      </> :
      <div className="w-full flex justify-between gap-8">
      <div className="w-1/2 mt-4">
        <div className="flex items-center justify-between w-full h-auto mb-3">
          <div className="m-auto text-sm font-medium text-white">
            Enable Trading
          </div>
        </div>
        <div className="flex flex-col gap-3 w-full rounded-b-[10px]">
          <div className="relative">
            <div className="text-left">
              Enable Trading Function
              <span className="pl-1 text-green-normal">*</span>
            </div>
            <Listbox value={template} onChange={setTemplate}>
              <Listbox.Button className="outline-none rounded-lg border border-gray-border text-orange placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1 disabled:border-gray-highlight disabled:text-gray-border relative pr-7">
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
                      className={`relative px-2 py-1 cursor-default hover:bg-gray-border ${
                        item === template && "text-white"
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
          <div className="">
            <div className="text-white text-left">
              Token Contract Address
              <span className="pl-1 text-white">*</span>
            </div>
            <input
              className="outline-none rounded-lg text-orange border border-gray-blue placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
              placeholder="Enter address"
              value={enableTradingTokenAddress}
              onChange={(e) => setEnableTradingTokenAddress(e.target.value)}
            />
          </div>
          {template == TEMPLATES[6] && (
            <div className="">
              <div className="text-white text-left">
                Dead Block Numbers
                <span className="pl-1 text-white">*</span>
              </div>
              <input
                className="outline-none rounded-lg text-orange border border-gray-blue placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
                placeholder="Enter address"
                value={deadBlock}
                onChange={(e) => setDeadBlock(e.target.value)}
              />
            </div>
          )}
          <div className="relative flex h-full text-white bg-transparent justify-evenly bg-clip-border">
            <button
              className="w-full font-medium text-center text-white uppercase px-6 h-10 rounded-lg justify-center items-center gap-2.5 inline-flex bg-gradient-blue-to-purple active:scale-95 transition duration-100 ease-in-out transform focus:outline-none"
              onClick={handleEnableTrading}
            >
              Enable Trading
            </button>
          </div>
        </div>
      </div>
      <div className="w-1/2 mt-4">
        <div className="flex items-center justify-between w-full h-auto mb-3">
          <div className="m-auto text-sm font-medium text-white">
            Renounce
          </div>
        </div>
        <div className="flex flex-col gap-3 w-full rounded-b-[10px]">
          <div className="relative">
            <div className="text-left">
              Enable Trading Function
              <span className="pl-1 text-green-normal">*</span>
            </div>
            <Listbox value={templateForRenounce} onChange={setTemplateForRenounce}>
              <Listbox.Button className="outline-none rounded-lg border border-gray-border text-orange placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1 disabled:border-gray-highlight disabled:text-gray-border relative pr-7">
                <span className="flex items-center">
                  <span className="block truncate">{templateForRenounce}</span>
                </span>
                <IoIosArrowDown className="absolute inset-y-0 -right-1 flex items-center w-8 pr-2 mt-2.5 pointer-events-none opacity-50" />
              </Listbox.Button>
              <Listbox.Options className="absolute z-20 w-full overflow-auto border border-t-0 text-gray-normal mt bg-gray-dark border-gray-border">
                {TEMPLATES.map((item, index) => {
                  return (
                    <Listbox.Option
                      key={index}
                      className={`relative px-2 py-1 cursor-default hover:bg-gray-border ${
                        item === templateForRenounce && "text-white"
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
          <div className="">
            <div className="text-white text-left">
              Token Contract Address
              <span className="pl-1 text-white">*</span>
            </div>
            <input
              className="outline-none rounded-lg text-orange border border-gray-blue placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
              placeholder="Enter address"
              value={tokenAddressForRenounce}
              onChange={(e) => setTokenAddressForRenounce(e.target.value)}
            />
          </div>
          <div className="relative flex h-full text-white bg-transparent justify-evenly bg-clip-border">
            <button
              className="w-full font-medium text-center text-white uppercase px-6 h-10 rounded-lg justify-center items-center gap-2.5 inline-flex bg-gradient-blue-to-purple active:scale-95 transition duration-100 ease-in-out transform focus:outline-none"
              onClick={handleRenounce}
            >
              Renounce Contract
            </button>
          </div>
        </div>
      </div>
      </div>
    }
    </div>
  );
}
