import { CircledButton, RoundedButton } from "../Buttons/Buttons";
import { HorizontalDivider } from "../Dividers/Dividers";
import { PairSelectButton } from "../DropDown/DropDown";
import { useContext, useEffect, useRef, useState } from "react";
import { ethers } from "ethers";
import axios from "axios";
import { useChainId } from "wagmi";

import { FaCheck } from "react-icons/fa";
import { FaTimes } from "react-icons/fa";

import { dashboardContext } from "../../pages/Dashboard";

import { toast } from "react-toastify";
import { GoPlus, ErrorCode } from "@goplus/sdk-node";
import { formatNumber } from "../../utils/methods";
import { AppContext } from "../../App";
import { useEthersProvider } from "../../utils/provider";
import ERC20ABI from "../../abi/ERC20.json";
import TokenSearchPanel from "./TokenSearchPanel";
import copy from "copy-to-clipboard";
import { GradientDiv } from "../Primary/Elements";

const TokenInfoPanel = () => {
  const {
    showChart,
    setPairAddress,
    pairs,
    setPairs,
    selectedPairId,
    setSelectedPairId
  } = useContext(dashboardContext);

  const {
    currentProject,
    activeTokenAddress,
    setActiveTokenAddress,
    setLoadingPrompt,
    setOpenLoading,
    tokenInfo,
    setTokenInfo
  } = useContext(AppContext);

  const [tokenAddress, setTokenAddress] = useState(activeTokenAddress);
  const [overviewTime, setOverviewTime] = useState("h24");
  const [tokenAudit, setTokenAudit] = useState();

  const DEFAULT_IFRAME_HEIGHT = 300;

  const chainId = useChainId();
  const provider = useEthersProvider(chainId);
  const [gettingPairs, setGettingPairs] = useState(false);
  const [gettingAudit, setGettingAudit] = useState(false);
  const [iframeHeight, setIframeHeight] = useState(DEFAULT_IFRAME_HEIGHT);
  const [showCandidate, setShowCandidate] = useState(false);
  const [isDown, setIsDown] = useState(false);
  const infoRef = useRef();
  const iframeRef = useRef();

  useEffect(() => {
    if (showChart && chainId == 1 && pairs && pairs[selectedPairId]) {
      const viewportHeight =
        window.innerHeight > 1000 ? 1000 : window.innerHeight;
      const sizeLimit = viewportHeight - 390;
      if (sizeLimit - iframeHeight < 200) {
        setIframeHeight(sizeLimit);
      }
    } else {
      setIframeHeight(DEFAULT_IFRAME_HEIGHT);
    }
  }, [showChart, chainId, pairs, selectedPairId, tokenInfo]);

  // useEffect(() => {
  //   setPairs([]);
  //   setTokenAudit();
  //   setActiveTokenAddress("");
  //   setTokenAddress("");
  // }, [chainId]);

  useEffect(() => {
    setPairs([]);
    setTokenAudit();

    if (activeTokenAddress !== "" && !gettingAudit && !gettingPairs) {
      getTokenPairs();
      getTokenAudit();
    }
    if (activeTokenAddress !== "") setTokenAddress(activeTokenAddress);
  }, [activeTokenAddress]);

  useEffect(() => {
    if (pairs.length > 0) {
      setPairAddress(pairs[selectedPairId].pairAddress);
    } else {
      setPairAddress("");
    }
  }, [selectedPairId, pairs]);

  const getTokenPairs = async () => {
    setGettingPairs(true);
    const url = `https://api.dexscreener.io/latest/dex/tokens/${activeTokenAddress}`;
    const result = await axios.get(url, {
      headers: { "Content-Type": "application/json" },
    });
    if (result?.data?.pairs) {
      const pairs = result.data.pairs.filter(
        (element) =>
          element.chainId === "ethereum" &&
          element.dexId === "uniswap" &&
          element.labels[0] === "v2"
      );
      setPairs(pairs);
    } else {
      setPairs([]);
    }
    // return result.data.pa
    setGettingPairs(false);
  };

  const getTokenAudit = async () => {
    setGettingAudit(true);
    const res = await GoPlus.tokenSecurity(chainId, activeTokenAddress, 30);
    if (res.code != ErrorCode.SUCCESS) {
      console.error("-----------TokenAudit", res.message);
    } else {
      setTokenAudit(Object.values(res.result)[0]);
    }
    setGettingAudit(false);
  };

  const handleSetToken = async () => {
    setShowCandidate(false);
    if (
      !(
        Object.keys(currentProject).length === 0 &&
        currentProject.constructor === Object
      )
    ) {
      if (tokenAddress === activeTokenAddress) {
        toast.warn("The same token address. Please another set token.");
        return;
      }
      if (ethers.isAddress(tokenAddress)) {
        try {
          const tokenContract = new ethers.Contract(
            tokenAddress,
            ERC20ABI,
            provider
          );
          await tokenContract.totalSupply();
        } catch (err) {
          toast.warn("Invalid Token Address!");
          return;
        }
        setActiveTokenAddress(tokenAddress);
      } else {
        toast.warn("Invalid Token Address!");
      }
    } else {
      toast.warn("Please select your project");
    }
  };

  const handleOpenSite = () => {
    if (pairs.length) {
      const website_url = pairs[selectedPairId]?.info?.websites[0]?.url;
      if (website_url) {
        window.open(website_url, "_blank", "noopener,noreferrer");
      }
    }
  };

  const handleOpenSocial = (social_type) => {
    if (pairs.length) {
      const socials = pairs[selectedPairId].info.socials;
      const telegram = socials.filter(
        (element) => element.type === social_type
      );

      if (telegram) {
        window.open(telegram[0].url, "_blank", "noopener,noreferrer");
      }
    }
  };

  const handleRefresh = () => {
    if (activeTokenAddress !== "" && !gettingAudit && !gettingPairs) {
      console.log("Refresh clicked");
      getTokenPairs();
      getTokenAudit();
    }
  };

  const handleOpenDexScreener = () => {
    if (
      tokenInfo &&
      tokenInfo.address !== "" &&
      ethers.isAddress(tokenInfo.address)
    ) {
      window.open(
        `https://dexscreener.com/ethereum/${tokenInfo.address}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  const handleOpenEtherscan = () => {
    if (
      tokenInfo &&
      tokenInfo.address !== "" &&
      ethers.isAddress(tokenInfo.address)
    ) {
      window.open(
        `https://etherscan.io/address/${tokenInfo.address}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  const handleMouseDownForResize = (e) => {
    const startY = e.clientY;
    setIsDown(true);

    const handleMouseMove = (e) => {
      const viewportHeight =
        window.innerHeight > 1000 ? 1000 : window.innerHeight;
      const sizeLimit = 600;
      const newHeight = iframeHeight + (e.clientY - startY);
      if (newHeight >= 200 && newHeight < sizeLimit) {
        // if (e.clientY - startY > 0 && sizeLimit - newHeight < 200) {
        //   setIframeHeight(sizeLimit);
        //   setViewMode(1);
        // } else if (
        //   e.clientY - startY < 0 &&
        //   sizeLimit - newHeight < 200
        // ) {
        //   setIframeHeight(sizeLimit - 200);
        //   setViewMode(0);
        // } else {
        //   setIframeHeight(newHeight);
        //   setViewMode(0);
        // }
        setIframeHeight(newHeight)
      }
    };

    const handleMouseUp = () => {
      setIsDown(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleSearchClick = () => {
    setShowCandidate(true);
  };

  const handleCopyTokenAddress = () => {
    if (tokenAddress != "") {
      copy(tokenAddress);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-col" ref={infoRef}>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <img
              src={
                tokenInfo && tokenInfo.logo && tokenInfo.logo !== ""
                  ? tokenInfo.logo
                  : "/assets/icon/ic_question.svg"
              }
              className="rounded-[50%] mr-[11px]"
              width={20}
              height={20}
              alt="token-logo"
              onError={() => {
                setTokenInfo({
                  ...tokenInfo,
                  logo: "/assets/icon/ic_question.svg"
                })
              }}
            />
            <div className="text-xs mr-1 text-nowrap">
              {pairs.length > 0 && pairs[selectedPairId].baseToken.symbol} /
            </div>
            <div className="text-xxs">
              {pairs.length > 0 && pairs[selectedPairId].quoteToken.symbol}
            </div>
            {/* <div className="text-xxs text-['#FFFFFFB2'] mr-1">
              Price&nbsp;:&nbsp;
            </div>
            <div className="text-xxs text-['#FFFFFFB2']">
              $
              {pairs[selectedPairId]
                ? pairs && pairs[selectedPairId]?.priceUsd
                : "0"}
            </div> */}
          </div>
          <div id="social-buttons" className="flex items-center gap-4">
            <button onClick={() => handleOpenSite()}>
              <img
                className="w-3.5 h-3.5 active:scale-95 hover:scale-110 transition duration-100 ease-in-out transform cursor-pointer"
                src="/assets/icon/ic_responsive.svg"
                alt="responsive"
              />
            </button>
            <button onClick={() => handleOpenSocial("telegram")}>
              <img
                className="w-3.5 h-3.5 active:scale-95 hover:scale-110 transition duration-100 ease-in-out transform cursor-pointer"
                src="/assets/icon/ic_telegram.svg"
                alt="telegram"
              />
            </button>
            <button onClick={() => handleOpenSocial("twitter")}>
              <img
                className="w-3.5 h-3.5 active:scale-95 hover:scale-110 transition duration-100 ease-in-out transform cursor-pointer"
                src="/assets/icon/ic_twitter.svg"
                alt="twitter"
              />
            </button>
            <button onClick={handleOpenDexScreener}>
              <img
                className="w-3.5 h-3.5 active:scale-95 hover:scale-110 transition duration-100 ease-in-out transform cursor-pointer"
                src="/assets/icon/ic_dexscreener.svg"
                alt="dexscreenr"
              />
            </button>
            <button onClick={handleOpenEtherscan}>
              <img
                className="w-3.5 h-3.5 active:scale-95 hover:scale-110 transition duration-100 ease-in-out transform cursor-pointer"
                src="/assets/icon/ic_etherscan.svg"
                alt="etherscan"
              />
            </button>
          </div>
          <div id="search-entry" className="flex items-center gap-2">
            <div className="flex gap-4">
              <button onClick={handleRefresh}>
                <img
                  className="active:scale-95 hover:scale-110 transition duration-100 ease-in-out transform cursor-pointer"
                  src="/assets/icon/ic_refresh.svg"
                  width={14}
                  alt="refresh"
                />
              </button>
            </div>
            <div className="relative w-[200px] flex flex-col">
              <div className="container-gradient w-full h-6 flex justify-between items-center gap-2 rounded-full border border-solid border-white/20 p-[1px]">
                <CircledButton className="!w-5 grow-0" onClick={handleCopyTokenAddress}>
                  <FaCheck />
                </CircledButton>
                <input
                  className="w-[150px] outline-none bg-transparent grow text-left text-gray-normal"
                  onClick={handleSearchClick}
                  value={tokenAddress}
                  onChange={(e) => console.log(e.target.value)}
                  placeholder="Enter a token address..."
                ></input>
                <CircledButton
                  className="!w-5 grow-0"
                  onClick={() => {
                    setPairs([]);
                    setTokenAudit();
                    setActiveTokenAddress("");
                    setTokenAddress("");
                    setShowCandidate(false);
                  }}
                >
                  <FaTimes />
                </CircledButton>
              </div>
              {showCandidate && (
                <TokenSearchPanel
                  setShowCandidate={setShowCandidate}
                  handleSetToken={handleSetToken}
                  tokenAddress={tokenAddress}
                  setTokenAddress={setTokenAddress}
                />
              )}
            </div>
          </div>
          {/* <div id="pair-select" className="w-fit rounded-lg p-0.5 flex justify-center items-center gap-[6px] bg-[#2B2E33]">
            <PairSelectButton
              pairs={pairs}
              selectedIndex={selectedPairId}
              setSelectedIndex={setSelectedPairId}
              tokenInfo={tokenInfo}
            />
          </div> */}
        </div>
        <div className="flex h-6 justify-between items-center mb-2">
          <div className="w-[50%] flex items-center gap-3">
            <GradientDiv>
              <div className="px-2 py-px">Token Info</div>
            </GradientDiv>
            <div
              className={`${overviewTime === "m5" ? "bg-purple-gradient" : "bg-gray-border"
                } rounded-full p-[1px]`}
            >
              <RoundedButton
                className={`!h-4 !px-2 !py-2 !bg-black !border-none`}
                onClick={() => setOverviewTime("m5")}
              >
                5 Min
              </RoundedButton>
            </div>
            <div
              className={`${overviewTime === "h1" ? "bg-purple-gradient" : "bg-gray-border"
                } rounded-full p-[1px]`}
            >
              <RoundedButton
                className={`!h-4 !px-2 !py-2 !bg-black !border-none`}
                onClick={() => setOverviewTime("h1")}
              >
                1 H
              </RoundedButton>
            </div>
            <div
              className={`${overviewTime === "h6" ? "bg-purple-gradient" : "bg-gray-border"
                } rounded-full p-[1px]`}
            >
              <RoundedButton
                className={`!h-4 !px-2 !py-2 !bg-black !border-none`}
                onClick={() => setOverviewTime("h6")}
              >
                6 H
              </RoundedButton>
            </div>
            <div
              className={`${overviewTime === "h24" ? "bg-purple-gradient" : "bg-gray-border"
                } rounded-full p-[1px]`}
            >
              <RoundedButton
                className={`!h-4 !px-2 !py-2 !bg-black !border-none`}
                onClick={() => setOverviewTime("h24")}
              >
                24 H
              </RoundedButton>
            </div>
          </div>
          <div className="flex items-center gap-3 justify-end">
            <div className="text-xxs">
              <span className="font-medium text-green-dark">Buys: </span>
              <span className="text-xs font-medium">
                {pairs && pairs[selectedPairId]?.txns[overviewTime]?.buys}
              </span>
            </div>
            <div className="text-xxs">
              <span className="font-medium text-red-normal">Sell: </span>
              <span className="text-xs font-medium">
                {pairs && pairs[selectedPairId]?.txns[overviewTime]?.sells}
              </span>
            </div>
            <div className="text-xxs">
              <span className="font-medium text-[#BBBCBD]">Vol: </span>
              <span className="text-xs font-medium">
                {pairs &&
                  pairs[selectedPairId] &&
                  formatNumber(pairs[selectedPairId].volume[overviewTime])}
              </span>
            </div>
            <div className="text-xxs">
              <span className="font-medium text-[#BBBCBD]">Chg: </span>
              <span className={`text-xs font-medium ${pairs && (pairs[selectedPairId]?.priceChange[overviewTime] >= 0 ? 'text-green-dark' : 'text-red-normal')}`}>
                {pairs && pairs[selectedPairId]?.priceChange[overviewTime]}%
              </span>
            </div>
          </div>
        </div>
        <div className="container-gradient p-2 flex flex-col gap-1.5">
          <div className="flex gap-4 justify-between">
            <div className="flex flex-col gap-1 items-center">
              <span className="font-medium text-[#BBBCBD]">Supply</span>
              <span className="text-xs font-medium">
                {tokenInfo && tokenInfo.totalSupply && tokenInfo.decimals
                  ? formatNumber(tokenInfo?.totalSupply)
                  : ""}
              </span>
            </div>
            <div className="flex flex-col gap-1 items-center">
              <span className="font-medium text-[#BBBCBD]">MCap</span>
              <span className="text-xs font-medium">
                {pairs && pairs[selectedPairId]
                  ? `$${formatNumber(pairs[selectedPairId].fdv)}`
                  : ""}
              </span>
            </div>
            <div className="flex flex-col gap-1 items-center">
              <span className="font-medium text-[#BBBCBD]">Tax</span>
              <span className="text-xs font-medium">
                {tokenAudit && tokenAudit.buy_tax && tokenAudit.sell_tax
                  ? `${formatNumber(
                    parseFloat(tokenAudit.buy_tax) * 100
                  )}%/${formatNumber(parseFloat(tokenAudit.sell_tax) * 100)}%`
                  : ""}
              </span>
            </div>
            <div className="flex flex-col gap-1 items-center">
              <span className="font-medium text-[#BBBCBD]">Max</span>
              <span className="text-xs font-medium">
                {tokenAudit ? `${parseFloat(tokenAudit.buy_tax) * 100}%` : ""}
              </span>
            </div>
            <div className="flex flex-col gap-1 items-center">
              <span className="font-medium text-[#BBBCBD]">Honey</span>
              <span className="text-xs font-medium">
                {tokenAudit
                  ? tokenAudit && tokenAudit.is_honeypot == "0"
                    ? "No"
                    : "Yes"
                  : ""}
              </span>
            </div>
            <div className="flex flex-col gap-1 items-center">
              <span className="font-medium text-[#BBBCBD]">ETH Pool</span>
              <span className="text-xs font-medium">
                {pairs && pairs[selectedPairId]?.liquidity?.quote
                  ? pairs[selectedPairId]?.liquidity?.quote
                  : ""}
              </span>
            </div>
            <div className="flex flex-col gap-1 items-center">
              <span className="font-medium text-[#BBBCBD]">ERC Pool</span>
              <span className="text-xs font-medium">
                {pairs &&
                  pairs[selectedPairId] &&
                  formatNumber(pairs[selectedPairId].liquidity.base)
                  ? formatNumber(pairs[selectedPairId].liquidity.base)
                  : ""}
              </span>
            </div>
            <div className="flex flex-col gap-1 items-center">
              <span className="font-medium text-[#BBBCBD]">24H Vol</span>
              <span className="text-xs font-medium">
                {pairs &&
                  pairs[selectedPairId] &&
                  formatNumber(pairs[selectedPairId].volume.h24)
                  ? formatNumber(pairs[selectedPairId].volume.h24)
                  : ""}
              </span>
            </div>
          </div>
        </div>
      </div>
      {showChart && chainId == 1 && pairs && pairs[selectedPairId] && (
        <div className="flex flex-col items-center">
          <div
            className={`relative w-full h-[${iframeHeight}px] mt-2 rounded-[16px] overflow-hidden`}
            ref={iframeRef}
          >
            <iframe
              id="tradingview_061a1"
              name="tradingview_061a1"
              src={`https://dexscreener.com/ethereum/${pairs[selectedPairId].pairAddress}?embed=1&trades=0&swaps=0&info=0&theme=dark`}
              className="w-[100%] h-[100%] top-0 left-0 absolute"
            ></iframe>
            {isDown && (
              <div className="w-[200%] h-[200%] scale-50 top-[-50%] left-[-50%] absolute"></div>
            )}
          </div>
          <div
            className="w-[90%] h-1 bg-transparent cursor-row-resize"
            onMouseDown={handleMouseDownForResize}
          ></div>
        </div>
      )}
    </div>
  );
};

export default TokenInfoPanel;
