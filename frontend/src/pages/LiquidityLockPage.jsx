import TopBar from "../components/TopBar/TopBar";
import { useContext, useEffect, useRef, useState } from "react";
import tokenABI from "../abi/ITradingToken.json";
import routerABI from "../abi/IUniSwapV2Router02.json";
import factoryABI from "../abi/IUniswapV2Factory.json";
import { useAccount, useChainId, useConfig } from "wagmi";
import { useEthersSigner } from "../utils/provider";
import { ethers } from "ethers";
import BigNumber from "bignumber.js";
import { isValidAddress } from "../utils/methods";
import { toast } from "react-toastify";
import DateTimePicker from "react-datetime-picker";
import UniswapV2Locker_ABI from "../abi/UniswapV2Locker.json";
import { Card } from "../components/Card/Card";
import { Field } from "../components/Field/Field";
import { DefaultButton, GradientButton } from "../components/Buttons/Buttons";

import "../styles/DateTimePicker.css";
import "../styles/Calendar.css";
import "../styles/Clock.css";
import { ToggleButton } from "../components/Buttons/Buttons";
import { AppContext } from "../App";
import LiquidityPage from "./LiquidityPage";
import { getBalance } from "@wagmi/core";

const UNISWAP_V2_ROUTER = {
  1: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  8453: "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24",
  5: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  11155111: "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008",
};

const contractAddress = {
  mainnet: "0x663A5C229c09b049E36dCc11a9B0d4a8Eb9db214",
  sepolia: "0x753c0D0bcfC983385dEdd9Eff49A3a82f12B4922",
};

const LiquidityLockPage = () => {
  const { setLoadingPrompt, setOpenLoading } = useContext(AppContext);

  const [pageLabel, setPageLabel] = useState("lock");

  const [lockLpBaseTokenAddress, setLockLpBaseTokenAddress] = useState("");
  const [lockLpTokenPercent, setLockLpTokenPercent] = useState("0");
  const [lockLpTokenAmount, setLockLpTokenAmount] = useState("0");
  const [lockLpTokenBalance, setLockLpTokenBalance] = useState("0");
  const [lockLpTokenAddress, setLockLpTokenAddress] = useState("");
  const [lockLpTokenDecimals, setLockLpTokenDecimals] = useState(9);
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [referralAddress, setReferralAddress] = useState("");
  const chainId = useChainId();
  const signer = useEthersSigner(chainId);
  const config = useConfig();
  const { isConnected, address } = useAccount();
  const [unlockTime, setUnlockTime] = useState(new Date());
  const [useReferral, setUseReferral] = useState(false);

  const [withdrawBaseTokenAddress, setWithdrawBaseTokenAddress] = useState("");
  const [withdrawLpTokenAddress, setWithdrawLpTokenAddress] = useState("");
  const [withdrawLpTokenDecimals, setWithdrawLpTokenDecimals] = useState(9);
  const [withdrawLpTokenBalance, setWithdrawLpTokenBalance] = useState("0");
  const [withdrawLpTokenAmount, setWithdrawLpTokenAmount] = useState("0");
  const [withdrawLpTokenPercent, setWithdrawLpTokenPercent] = useState("0");
  const [withdrawLockID, setWithdrawLockID] = useState("");
  const [withdrawIndex, setWithdrawIndex] = useState("");

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
      const amount = new BigNumber(
        balance.toString() + "e-" + decimals.toString()
      );
      setLockLpTokenDecimals(decimals);
      setLockLpTokenAddress(lpAddr);
      return amount.toString();
    } catch (err) {
      setLockLpTokenAddress("");
      console.log(err);
      return "";
    }
  };

  useEffect(() => {
    setLockLpTokenAmount(
      new BigNumber(lockLpTokenBalance)
        .multipliedBy(parseInt(lockLpTokenPercent))
        .div(100)
        .toString()
    );
  }, [lockLpTokenPercent]);

  useEffect(() => {
    if (lockLpBaseTokenAddress !== "")
      updateLpBalance(chainId, lockLpBaseTokenAddress, address, signer).then(
        (amount) => setLockLpTokenBalance(amount)
      );
    else setLockLpTokenBalance("0");
  }, [lockLpBaseTokenAddress, chainId, signer, address]);

  const handleLockLiquidity = async () => {
    if (!isConnected) {
      toast.warn("Please connect wallet!");
      return;
    }

    if (!isValidAddress(lockLpBaseTokenAddress)) {
      toast.warn("Invalid token address!");
      return;
    }

    if (!isValidAddress(lockLpTokenAddress)) {
      toast.warn("Invalid LP token address!");
      return;
    }

    if (new BigNumber(0).gte(new BigNumber(lockLpTokenBalance))) {
      toast.warn("Invalid lp token balance!");
      return;
    }

    if (
      new BigNumber(lockLpTokenAmount).gt(new BigNumber(lockLpTokenBalance))
    ) {
      toast.warn("Invalid lp token amount!");
      return;
    }

    // const dateTimeString = `${year}:${month}:${day} ${hour}:${minute}`
    if (unlockTime.getTime() <= Date.now()) {
      toast.warn("Invalid unlock date time!");
      return;
    }

    if (!isValidAddress(withdrawAddress)) {
      toast.warn("Invalid withdraw address!");
      return;
    }

    if (useReferral && !isValidAddress(referralAddress)) {
      toast.warn("Invalid referral address!");
      return;
    }

    const balance = await getBalance(config, { address: address })
    console.log(balance.formatted)
    if (parseFloat(balance.formatted) <= 0.1005) {
      toast.warn("Not enough eth in your wallet!");
      return;
    }

    const lpContract = new ethers.Contract(
      lockLpTokenAddress,
      tokenABI,
      signer
    );

    const contract = new ethers.Contract(
      chainId == 1 ? contractAddress.mainnet : contractAddress.sepolia,
      UniswapV2Locker_ABI,
      signer
    );

    try {
      setLoadingPrompt("Approving...");
      setOpenLoading(true);
      const feeResult = await contract.gFees();
      const ethFee = feeResult[0].toString();
      const referralDiscount = feeResult[8].toString();
      const realEthFee = useReferral
        ? new BigNumber(ethFee)
          .multipliedBy(1000 - parseInt(referralDiscount))
          .div(1000)
          .toFixed(0)
        : ethFee;

      const amount = new BigNumber(
        `${lockLpTokenAmount}e${lockLpTokenDecimals}`
      ).toFixed(0);

      const approveTx = await lpContract.approve(
        chainId == 1 ? contractAddress.mainnet : contractAddress.sepolia,
        amount
      );
      await approveTx.wait();

      setLoadingPrompt("Locking...");

      console.log(
        lockLpTokenAddress,
        realEthFee,
        amount,
        unlockTime.getTime() / 1000
      );
      let tx;
      if (!useReferral) {
        tx = await contract.lockLPToken(
          lockLpTokenAddress,
          amount,
          parseInt(unlockTime.getTime() / 1000),
          "0x0000000000000000000000000000000000000000",
          true,
          withdrawAddress,
          { value: realEthFee }
        );
      } else {
        tx = await contract.lockLPToken(
          lockLpTokenAddress,
          amount,
          parseInt(unlockTime.getTime() / 1000),
          referralAddress,
          true,
          withdrawAddress,
          { value: realEthFee }
        );
      }
      await tx.wait();
      setLoadingPrompt("Finished");
      setOpenLoading(false);
    } catch (error) {
      console.log(error);
      setLoadingPrompt("Failed");
      setOpenLoading(false);
    }
  };

  const updatedLockedLPTokenInfo = async (
    chainId,
    tokenAddress,
    address,
    signer
  ) => {
    try {
      console.log("Updating Locked LP balance...");
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
      setWithdrawLpTokenAddress(lpAddr);
      const lpContract = new ethers.Contract(lpAddr, tokenABI, signer);
      const decimals = await lpContract.decimals();
      setWithdrawLpTokenDecimals(decimals);

      const lpLockerContract = new ethers.Contract(
        chainId == 1 ? contractAddress.mainnet : contractAddress.sepolia,
        UniswapV2Locker_ABI,
        signer
      );

      const num = await lpLockerContract.getUserNumLocksForToken(
        address,
        lpAddr
      );
      setWithdrawIndex(parseInt(num.toString()) - 1);
      const lockedTokenInfo = await lpLockerContract.tokenLocks(
        lpAddr,
        parseInt(num.toString()) - 1
      );
      console.log(lockedTokenInfo);
      const balance = lockedTokenInfo[1];
      setWithdrawLockID(lockedTokenInfo[4].toString());
      const amount = new BigNumber(
        balance.toString() + "e-" + decimals.toString()
      );
      return amount.toString();
    } catch (err) {
      setWithdrawLpTokenAddress("");
      console.log(err);
      return "";
    }
  };

  useEffect(() => {
    if (withdrawBaseTokenAddress !== "")
      updatedLockedLPTokenInfo(
        chainId,
        withdrawBaseTokenAddress,
        address,
        signer
      ).then((amount) => setWithdrawLpTokenBalance(amount));
    else setWithdrawLpTokenBalance("0");
  }, [withdrawBaseTokenAddress, chainId, signer, address]);

  useEffect(() => {
    setWithdrawLpTokenAmount(
      new BigNumber(withdrawLpTokenBalance)
        .multipliedBy(parseInt(withdrawLpTokenPercent))
        .div(100)
        .toString()
    );
  }, [withdrawLpTokenPercent]);

  const handleWithdrawLiquidity = async () => {
    if (!isConnected) {
      toast.warn("Please connect wallet!");
      return;
    }

    if (!isValidAddress(withdrawBaseTokenAddress)) {
      toast.warn("Invalid token address!");
      return;
    }

    if (!isValidAddress(withdrawLpTokenAddress)) {
      toast.warn("Invalid LP token address!");
      return;
    }

    if (new BigNumber(0).gte(new BigNumber(withdrawLpTokenBalance))) {
      toast.warn("Invalid lp token balance!");
      return;
    }

    if (
      new BigNumber(withdrawLpTokenAmount).gt(
        new BigNumber(withdrawLpTokenBalance)
      )
    ) {
      toast.warn("Invalid lp token amount!");
      return;
    }

    // const lpContract = new ethers.Contract(lockLpTokenAddress, tokenABI, signer);

    const contract = new ethers.Contract(
      chainId == 1 ? contractAddress.mainnet : contractAddress.sepolia,
      UniswapV2Locker_ABI,
      signer
    );

    try {
      setLoadingPrompt("Withdrawing...");
      setOpenLoading(true);

      const amount = new BigNumber(
        `${withdrawLpTokenAmount}e${withdrawLpTokenDecimals}`
      ).toFixed(0);

      console.log(
        withdrawLpTokenAddress,
        withdrawIndex,
        withdrawLockID,
        amount
      );

      const tx = await contract.withdraw(
        withdrawLpTokenAddress,
        withdrawIndex,
        withdrawLockID,
        amount
      );

      await tx.wait();
      setLoadingPrompt("Finished");
      setOpenLoading(false);
    } catch (error) {
      console.log(error);
      setLoadingPrompt("Failed");
      setOpenLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col max-[1800px]:items-start items-center">
      <div className="mx-6 w-fit h-full pt-5 pb-3 flex flex-col gap-3">
        <TopBar />
        <div className="w-full flex gap-4 justify-center my-10">
          <div className="w-full bg-transparent rounded-3xl border-8 border-card-border h-full">
            <Card className="px-8 py-10 rounded-3xl h-full">
              <div className="my-4 flex gap-8 h-full">
                <LiquidityPage onlyEnableTrading={false} className={"w-full h-full"} />
              </div>
            </Card>
          </div>
          <div className="w-full bg-transparent rounded-3xl border-8 border-card-border h-full">
            <Card className="px-8 py-10 rounded-3xl h-full">
              <div className="my-4 flex gap-8 h-full">
                <div className="w-full flex flex-col">
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between w-full h-auto mb-3">
                      <div className="flex items-center mx-auto text-2xl font-medium text-white">
                        <img className="w-12 h-12" src="/assets/img/uncx-triangle.png" alt="uncx-logo" />
                        Liquidity Lock
                      </div>
                    </div>
                    <div className="">
                      <div className="text-white text-left">
                        Token Contract Address
                        <span className="pl-1 text-white">*</span>
                      </div>
                      <input
                        className="outline-none rounded-lg text-orange border border-gray-blue placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
                        placeholder="Enter address"
                        value={lockLpBaseTokenAddress}
                        onChange={(e) =>
                          setLockLpBaseTokenAddress(e.target.value)
                        }
                      />
                    </div>
                    <div className="mt-3 flex gap-3">
                      <div className="w-[50%]">
                        <div className="text-white text-left">
                          Liquidity Lock Amount
                          <span className="pl-1 text-white">*</span>
                        </div>
                        <div className="outline-none rounded-lg text-orange border border-gray-blue placeholder:text-gray-border px-3.5 bg-light-black w-full pb-1 mt-1">
                          <p className="text-right text-yellow-normal my-2">
                            Balance: {lockLpTokenBalance ? lockLpTokenBalance : 0}
                          </p>
                          <input
                            className="w-full text-right text-orange bg-transparent outline-none placeholder:text-gray-border h-8"
                            placeholder="Enter % amount to remove from liquidity"
                            value={lockLpTokenAmount}
                            onChange={(e) => setLockLpTokenAmount(e.target.value)}
                          />
                          <div className="flex text-white text-[10px] gap-2.5 justify-end">
                            <GradientButton
                              className={`px-3 py-[2px] rounded-full bg-card-border active:scale-95 transition duration-100 ease-in-out transform text-xxs text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed`}
                              onClick={() => setLockLpTokenPercent("25")}
                              selected={lockLpTokenPercent === "25"}
                            >
                              25%
                            </GradientButton>
                            <GradientButton
                              className={`px-3 py-[2px] rounded-full bg-card-border active:scale-95 transition duration-100 ease-in-out transform text-xxs text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed`}
                              onClick={() => setLockLpTokenPercent("50")}
                              selected={lockLpTokenPercent === "50"}
                            >
                              50%
                            </GradientButton>
                            <GradientButton
                              className={`px-3 py-[2px] rounded-full bg-card-border active:scale-95 transition duration-100 ease-in-out transform text-xxs text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed`}
                              onClick={() => setLockLpTokenPercent("75")}
                              selected={lockLpTokenPercent === "75"}
                            >
                              75%
                            </GradientButton>
                            <GradientButton
                              className={`px-3 py-[2px] rounded-full bg-card-border active:scale-95 transition duration-100 ease-in-out transform text-xxs text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed`}
                              onClick={() => setLockLpTokenPercent("100")}
                              selected={lockLpTokenPercent === "100"}
                            >
                              100%
                            </GradientButton>
                          </div>
                        </div>
                      </div>
                      <div className="w-[50%]">
                        <div className="">
                          <div className="text-white text-left mb-1">
                            Unlock Time
                            <span className="pl-1 text-white">*</span>
                          </div>
                          <div className="flex">
                            <DateTimePicker
                              amPmAriaLabel="Select AM/PM"
                              calendarAriaLabel="Toggle calendar"
                              clearAriaLabel="Clear value"
                              dayAriaLabel="Day"
                              hourAriaLabel="Hour"
                              maxDetail="second"
                              minuteAriaLabel="Minute"
                              monthAriaLabel="Month"
                              nativeInputAriaLabel="Date and time"
                              onChange={setUnlockTime}
                              secondAriaLabel="Second"
                              value={unlockTime}
                              yearAriaLabel="Year"
                            />
                          </div>
                        </div>
                        <div className="flex flex-row items-center justify-between mt-3">
                          <div className="w-full">
                            <div className="text-white text-left">
                              Withdraw Address
                              <span className="pl-1 text-white">*</span>
                            </div>
                            <input
                              className="outline-none rounded-lg text-orange border border-gray-blue placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
                              placeholder="Enter address"
                              value={withdrawAddress}
                              onChange={(e) => setWithdrawAddress(e.target.value)}
                            />
                          </div>
                          {/* <div className="w-1/3 h-full">
                      <div className="flex items-end h-full text-white justify-end hidden">
                        Referral Address
                        <span className="pl-1 pr-3 text-white">*</span>
                        <ToggleButton
                          checked={useReferral}
                          onToggle={(v) => setUseReferral(v)}
                        />
                      </div>
                      {useReferral && (
                        <input
                          className="outline-none rounded-lg border border-gray-blue text-orange placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
                          placeholder="Enter address"
                          value={referralAddress}
                          onChange={(e) => setReferralAddress(e.target.value)}
                        />
                      )}
                    </div> */}
                        </div>
                      </div>
                    </div>
                    <div className="relative mt-3 flex h-full text-white bg-transparent justify-evenly bg-clip-border">
                      <button
                        className="w-full font-medium text-center text-white uppercase px-6 h-10 rounded-lg justify-center items-center gap-2.5 inline-flex bg-gradient-blue-to-purple active:scale-95 transition duration-100 ease-in-out transform focus:outline-none"
                        onClick={handleLockLiquidity}
                      >
                        Lock (0.1 ETH)
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col mt-12">
                    <div className="flex items-center justify-between w-full h-auto mb-3">
                      <div className="m-auto text-xl font-medium text-white">
                        Liquidity Withdraw
                      </div>
                    </div>
                    <div className="">
                      <div className="text-white text-left">
                        Token Contract Address
                        <span className="pl-1 text-white">*</span>
                      </div>
                      <input
                        className="outline-none rounded-lg text-orange border border-gray-blue placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
                        placeholder="Enter address"
                        value={withdrawBaseTokenAddress}
                        onChange={(e) =>
                          setWithdrawBaseTokenAddress(e.target.value)
                        }
                      />
                    </div>
                    <div className="mt-3">
                      <div className="text-white text-left">
                        Withdraw Amount
                        <span className="pl-1 text-white">*</span>
                      </div>
                      <div className="outline-none rounded-lg text-white border border-gray-blue placeholder:text-gray-border px-3.5 bg-light-black w-full py-2 mt-1">
                        <p className="text-right text-orange">
                          Balance: {withdrawLpTokenBalance ? withdrawLpTokenBalance : 0}
                        </p>
                        <input
                          className="w-full text-right text-orange bg-transparent outline-none placeholder:text-gray-border h-8"
                          placeholder="Enter % amount to remove from liquidity"
                          value={withdrawLpTokenAmount}
                          onChange={(e) =>
                            setWithdrawLpTokenAmount(e.target.value)
                          }
                        />
                        <div className="flex text-white text-[10px] gap-2.5 justify-end">
                          <GradientButton
                            className={`px-[12px] py-[2px] rounded-full bg-card-border active:scale-95 transition duration-100 ease-in-out transform text-xxs text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed`}
                            onClick={() => setWithdrawLpTokenPercent("25")}
                            selected={withdrawLpTokenPercent === "25"}
                          >
                            25%
                          </GradientButton>
                          <GradientButton
                            className={`px-[12px] py-[2px] rounded-full bg-card-border active:scale-95 transition duration-100 ease-in-out transform text-xxs text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed`}
                            onClick={() => setWithdrawLpTokenPercent("50")}
                            selected={withdrawLpTokenPercent === "50"}
                          >
                            50%
                          </GradientButton>
                          <GradientButton
                            className={`px-[12px] py-[2px] rounded-full bg-card-border active:scale-95 transition duration-100 ease-in-out transform text-xxs text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed`}
                            onClick={() => setWithdrawLpTokenPercent("75")}
                            selected={withdrawLpTokenPercent === "75"}
                          >
                            75%
                          </GradientButton>
                          <GradientButton
                            className={`px-[12px] py-[2px] rounded-full bg-card-border active:scale-95 transition duration-100 ease-in-out transform text-xxs text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed`}
                            onClick={() => setWithdrawLpTokenPercent("100")}
                            selected={withdrawLpTokenPercent === "100"}
                          >
                            100%
                          </GradientButton>
                        </div>
                      </div>
                    </div>
                    <div className="relative mt-3 flex h-full text-white bg-transparent justify-evenly bg-clip-border">
                      <button
                        className="w-full font-medium text-center text-white uppercase px-6 h-10 rounded-lg justify-center items-center gap-2.5 inline-flex bg-gradient-blue-to-purple active:scale-95 transition duration-100 ease-in-out transform focus:outline-none"
                        onClick={handleWithdrawLiquidity}
                      >
                        Withdraw
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiquidityLockPage;
