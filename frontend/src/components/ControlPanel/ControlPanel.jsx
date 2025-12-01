/* eslint-disable no-unused-vars */
import { useContext, useEffect, useState } from "react";

import Skeleton from "react-loading-skeleton";

import { GiWallet } from "react-icons/gi";
import { FaChartArea } from "react-icons/fa";

import { ToggleButton } from "../Buttons/Buttons";
import { dashboardContext } from "../../pages/Dashboard";
import { AppContext } from "../../App";
import copy from "copy-to-clipboard";
import { toast } from "react-toastify";
import * as ENV from "../../config/env";
import axios from "axios";
import {
  ellipsisAddress,
  formatNumber,
} from "../../utils/methods";
import { Switch } from "../Primary/Elements";

const ControlPanel = () => {
  const {
    showChart,
    setShowChart,
    enableWalletManage,
    setEnableWalletManage,
    enable100Wallet,
    setEnable100Wallet,
    pairs,
    selectedPairId,
    walletActiveTokenBalanceData
  } = useContext(dashboardContext);

  const { activeWallet, currentProject, walletBalanceData, sigData, signingData, tokenInfo } = useContext(AppContext);
  const [balance, setBalance] = useState();
  const [tokenBalance, setTokenBalance] = useState();
  const [ethPrice, setEthPrice] = useState(0);
  const [walletIndex, setWalletIndex] = useState(0);

  useEffect(() => {
    if (pairs && pairs[selectedPairId]) {
      setEthPrice(
        parseFloat(pairs[selectedPairId].priceUsd) /
        parseFloat(pairs[selectedPairId].priceNative)
      );
    }
  }, [pairs, selectedPairId]);

  useEffect(() => {
    let index;
    if (activeWallet && currentProject && currentProject.wallets && currentProject.wallets.length > 0) {
      index = currentProject.wallets.findIndex((wallet) => (wallet.address === activeWallet.address));
      setWalletIndex(index);
    }
  }, [tokenInfo, activeWallet, currentProject]);

  const handleCopyPublicKey = () => {
    if (activeWallet) {
      copy(activeWallet.address);
    }
  };

  const handleCopyPrivateKey = async () => {
    if (activeWallet && activeWallet.address != "") {
      const { data } = await axios.post(
        `${ENV.SERVER_URL}/api/v1/project/get-wallet-private-key`,
        {
          projectId: currentProject._id,
          address: activeWallet.address,
          sigData,
          signingData
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      copy(data);
    }
  };

  const handleDownloadWallets = async () => {
    if (
      !(
        Object.keys(currentProject).length === 0 &&
        currentProject.constructor === Object
      )
    ) {
      const { data } = await axios.post(
        `${ENV.SERVER_URL}/api/v1/project/download-wallets`,
        {
          projectId: currentProject._id,
          sigData,
          signingData
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const blob = new Blob([data], { type: "text/csv;charset=utf-8;" });

      // Generate a URL from the Blob
      const url = URL.createObjectURL(blob);

      // Create a temporary link element and trigger the download
      const link = document.createElement("a");
      link.href = url;
      link.download = "wallets.csv"; // Specify the name of the CSV file
      link.style.display = "none"; // Make the link invisible
      document.body.appendChild(link);
      link.click(); // Simulate a click to start the download
      document.body.removeChild(link); // Remove the link from the document

      // Clean up by revoking the Blob URL
      URL.revokeObjectURL(url);
    } else {
      toast.warn("Please select your project");
    }
  };

  return (
    <div className="container-gradient px-[15px] py-2 grid grid-cols-12 justify-between items-center">
      <div className="flex flex-row col-span-5 items-center justify-start gap-10">
        <div className="flex flex-col gap-2">
          <div className="flex gap-5">
            <div className="font-medium">Active Wallet</div>
            <div className="flex gap-4">
              {/* <img
                className="w-4 h-4 active:scale-95 hover:scale-110 transition duration-100 ease-in-out transform cursor-pointer"
                src="/assets/icon/ic_key.svg"
                alt="key"
                onClick={handleCopyPrivateKey}
              /> */}
              <img
                className="w-4 h-4 active:scale-95 hover:scale-110 transition duration-100 ease-in-out transform cursor-pointer"
                src="/assets/icon/ic_copy.svg"
                alt="copy"
                onClick={handleCopyPublicKey}
              />
            </div>
          </div>
          <div className="font-medium overflow-hidden text-nowrap overflow-ellipsis">
            {activeWallet && activeWallet.address ? (
              ellipsisAddress(activeWallet.address, true)
            ) : (
              <Skeleton
                baseColor="#232334"
                style={{ height: "100%" }}
                highlightColor="#444157"
              />
            )}
          </div>
        </div>
        <div className="flex flex-row items-center justify-between gap-5">
          <div className="flex flex-col gap-2">
            <div className="font-medium">ETH</div>
            <div className="max-w-[80px] font-medium overflow-hidden text-nowrap overflow-ellipsis">
              {walletBalanceData.eth && walletBalanceData.eth && walletBalanceData.eth.length > 0 ? (
                formatNumber(walletBalanceData.eth[walletIndex], 4)
              ) : (
                <Skeleton
                  baseColor="#232334"
                  style={{ height: "100%" }}
                  highlightColor="#444157"
                />
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="font-medium">
              {tokenInfo && tokenInfo.symbol ? (
                tokenInfo.symbol
              ) : (
                <Skeleton
                  baseColor="#232334"
                  style={{ height: "100%", width: 30 }}
                  highlightColor="#444157"
                />
              )}
            </div>
            <div className="max-w-[120px] font-medium overflow-hidden text-nowrap overflow-ellipsis">
              {walletActiveTokenBalanceData && walletActiveTokenBalanceData.length > 0 ? (
                formatNumber(walletActiveTokenBalanceData[walletIndex], 4)
              ) : (
                <Skeleton baseColor="#232334" highlightColor="#444157" />
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="font-medium">Value</div>
            <div className="max-w-[90px] font-medium overflow-hidden text-nowrap overflow-ellipsis">
              {walletBalanceData?.eth?.length > 0 && walletBalanceData?.token?.length > 0 && ethPrice ? (
                `$${(
                  parseFloat(walletBalanceData.eth[walletIndex]) * ethPrice +
                  parseFloat(walletActiveTokenBalanceData[walletIndex]) *
                  parseFloat(pairs[selectedPairId]?.priceUsd)).toFixed(4)
                }`
              ) : (
                <Skeleton
                  baseColor="#232334"
                  style={{ width: "100%" }}
                  highlightColor="#444157"
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="font-14-special col-span-2 flex items-center justify-center hover:text-white cursor-pointer">

      </div>
      <div className="flex col-span-5 gap-12 justify-end">
        <div className="flex gap-2 items-center">
          <div className="text-left">
            Hide Chart
          </div>
          <Switch className={'w-12'} checked={showChart} onSwitch={(v) => setShowChart(v)} />
          <div className="text-left">
            Show Chart
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <div className="text-left">
            Wallet<br />Management
          </div>
          <Switch className={'w-12'} checked={enableWalletManage} onSwitch={(v) => setEnableWalletManage(v)} />
        </div>
        <div className="flex gap-2 items-center">
          <div className="text-left">
            Enable<br />100 Wallets
          </div>
          <Switch className={'w-12'} checked={enable100Wallet} onSwitch={(v) => setEnable100Wallet(v)} />
        </div>
        <div
          className="p-1 rounded-md hover:bg-gray-border active:bg-gray-normal flex flex-row gap-2 items-center cursor-pointer"
          onClick={handleDownloadWallets}
        >
          <div className="text-left">
            Download<br />Wallets
          </div>
          <img src="/assets/icon/ic_download.svg" width={24} alt="download" />
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
