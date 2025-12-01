import { act, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAccount, useChainId, useConfig } from "wagmi";
import axios from "axios";

import { AppContext } from "../App";
import ConfirmDialog from "../components/Dialogs/ConfirmDialog";
import { useEthersProvider, useEthersSigner } from "../utils/provider";
import { IoIosCheckmark, IoIosRefresh } from "react-icons/io";
import AddressSetDialog from "../components/Dialogs/AddressSetDialog";
import { isValidAddress } from "../utils/methods";
import { FaCheck } from "react-icons/fa";
import { multicall } from "@wagmi/core";
import multicallABI from "../abi/Multicall.json";
import { multicallAddress } from "../utils/constants";
import { formatUnits } from "ethers";
import ConnectWallet from "../components/ConnectWallet/ConnectWallet";

export default function AdminFinancePage({ className }) {
  const {
    SERVER_URL,
    setLoadingPrompt,
    setOpenLoading,
    user,
    setUsers,
    projects,
    setProjects,
    loadAllProjects,
    sigData,
    signingData
  } = useContext(AppContext);
  const config = useConfig();
  const chainId = useChainId();
  const { isConnected } = useAccount();

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const [swapFeeAddress, setSwapFeeAddress] = useState(
    "0x0000000000000000000000000000000000000000"
  );
  const [showAddressDialog, setShowAddressDailog] = useState(false);
  const [titleOfDialog, setTitleOfDialog] = useState("Set Swap Fee Address");
  const [actionOfDialog, setActionOfDialog] = useState("set-swap-fee-address");

  const [tokenFeeAddress, setTokenFeeAddress] = useState(
    "0x0000000000000000000000000000000000000000"
  );
  const [ethBalances, setEthBalances] = useState([]);
  const [walletChecked, setWalletChecked] = useState([]);
  const [walletAllChecked, setWalletAllChecked] = useState(false);
  const [selectedETHBalance, setSelectedETHBalance] = useState(0);
  const [targetWallet, setTargetWallet] = useState("");

  useEffect(() => {
    setSelectedETHBalance(0);
    if (projects && projects.length > 0) {
      const newWalletChecked = projects.map(() => false);
      setWalletChecked(newWalletChecked);
      setWalletAllChecked(false);
      getProjectsEthBalance(projects);
    } else {
      setWalletAllChecked(false);
      setWalletChecked([]);
      setEthBalances([]);
    }
  }, [projects]);

  useEffect(() => {
    getTaxAddresses();
  }, []);

  const getTaxAddresses = async () => {
    try {
      const { data } = await axios.post(
        `${SERVER_URL}/api/v1/admin/get-tax-wallets`,
        {
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
        setSwapFeeAddress(data.data.swapTaxWallet);
        setTokenFeeAddress(data.data.tokenTaxWallet);
      }
      console.log(data);
    } catch (err) {
      console.log(err);
    }
  };

  const getProjectsEthBalance = async (projects) => {
    let contracts = [];
    let new_ethBalances = [];
    for (let i = 0; i < projects.length; i++) {
      contracts.push({
        address: multicallAddress,
        abi: multicallABI,
        functionName: "getEthBalance",
        args: [projects[i].depositWallet.address],
      });
    }
    const _data = await multicall(config, {
      contracts,
    });
    let delta = 0;
    for (let i = 0; i < projects.length; i++) {
      const weiBalance =
        _data[delta + i].status === "success" ? _data[delta + i].result : 0;
      new_ethBalances = [
        ...new_ethBalances,
        parseFloat(formatUnits(weiBalance, 18)).toFixed(4),
      ];
    }
    setEthBalances(new_ethBalances);
  };

  const onAddressDialogOK = async (new_address) => {
    setShowAddressDailog(false);
    if (!isValidAddress(new_address)) {
      toast.warn("Invalid Address");
      return;
    }
    if (actionOfDialog == "set-swap-fee-address") {
      setLoadingPrompt("Setting swap tax wallet...");
      setOpenLoading(true);
      try {
        const { data } = await axios.post(
          `${SERVER_URL}/api/v1/admin/set-swap-tax-wallet`,
          {
            address: new_address,
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
          setSwapFeeAddress(new_address);
          toast.success(
            "Setting swap tax wallet has been completed successfully"
          );
        } else {
          console.log(data);
          toast.error(data.error);
        }
      } catch (err) {
        console.log(err);
        toast.warn("Failed to set swap tax wallet");
      }
      setOpenLoading(false);
    } else if (actionOfDialog == "set-token-fee-address") {
      setLoadingPrompt("Setting token tax wallet...");
      setOpenLoading(true);
      try {
        const { data } = await axios.post(
          `${SERVER_URL}/api/v1/admin/set-token-tax-wallet`,
          {
            address: new_address,
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
          setTokenFeeAddress(new_address);
          toast.success(
            "Setting token tax wallet has been completed successfully"
          );
        } else {
          console.log(data);
          toast.error(data.error);
        }
      } catch (err) {
        console.log(err);
        toast.warn("Failed to set token tax wallet");
      }
      setOpenLoading(false);
    }
  };

  const handleWalletAllChecked = () => {
    const newWalletAllChecked = !walletAllChecked;
    setWalletAllChecked(newWalletAllChecked);
    setWalletChecked(walletChecked.map(() => newWalletAllChecked));
    let sum = 0;
    if (newWalletAllChecked) {
      ethBalances.map((v) => (sum = sum + Number(v)));
    }
    setSelectedETHBalance(sum);
  };

  const handleWalletChanged = (index, value) => {
    let newWalletChecked = [...walletChecked];
    newWalletChecked[index] = !newWalletChecked[index];

    if (value) {
      ``;
      setSelectedETHBalance(selectedETHBalance + Number(ethBalances[index]));
    } else {
      setSelectedETHBalance(selectedETHBalance - Number(ethBalances[index]));
    }

    setWalletChecked(newWalletChecked);

    let newWalletAllChecked = true;
    for (let i = 0; i < newWalletChecked.length; i++)
      newWalletAllChecked &&= newWalletChecked[i];
    setWalletAllChecked(newWalletAllChecked);
  };

  const handleClickCollect = (e) => {
    e.preventDefault();

    if (!isConnected) {
      toast.warn("Please connect wallet!");
      return;
    }

    if (!isValidAddress(targetWallet)) {
      toast.warn("Please input wallet to send ETH!");
      return;
    }

    const validWalletChecked = walletChecked.filter((item) => item === true);
    // const validTeamWalletChecked = teamWalletChecked.filter(item => item === true);
    // if (validWalletChecked.length === 0 && validTeamWalletChecked.length === 0) {
    if (validWalletChecked.length === 0) {
      toast.warn("Please check wallets to collect ETH from!");
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleCollectAllEth = async () => {
    setShowConfirmDialog(false);

    if (!isConnected) {
      toast.warn("Please connect wallet!");
      return;
    }

    if (!isValidAddress(targetWallet)) {
      toast.warn("Please input wallet to send ETH!");
      return;
    }

    const validWalletChecked = walletChecked.filter((item) => item === true);
    // const validTeamWalletChecked = teamWalletChecked.filter(item => item === true);
    // if (validWalletChecked.length === 0 && validTeamWalletChecked.length === 0) {
    if (validWalletChecked.length === 0) {
      toast.warn("Please check wallets to collect ETH from!");
      return;
    }

    setLoadingPrompt("Collecting all ETH...");
    setOpenLoading(true);
    try {
      let wallets = [];
      for (let i = 0; i < projects.length; i++) {
        if (walletChecked[i]) {
          wallets = [...wallets, projects[i].depositWallet.address];
        }
      }

      const { data } = await axios.post(
        `${SERVER_URL}/api/v1/admin/collect-all-eth`,
        {
          chainId,
          targetWallet,
          wallets,
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
        toast.success("Success!");
        setOpenLoading(false);
      } else {
        toast.error(data.error);
        setOpenLoading(false);
      }
    } catch (err) {
      console.log(err);
      toast.warn("Failed to collect all ETH!");
      setOpenLoading(false);
    }
  };

  return (
    <div
      className={`${className} w-fit min-w-[1000px] flex flex-col mx-6 my-3 text-white pr-3`}
    >
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title={"Collect"}
        message={`Do you really want to collect ETH from deposit wallets to ${targetWallet} ?`}
        onOK={handleCollectAllEth}
        onCancel={() => setShowConfirmDialog(false)}
      />
      <AddressSetDialog
        isOpen={showAddressDialog}
        onOK={onAddressDialogOK}
        onClose={() => setShowAddressDailog(false)}
        title={titleOfDialog}
      />
      <div className="flex w-full mt-8 justify-end">
        <ConnectWallet />
      </div>
      <div className="w-full mt-8">
        <div className="text-base text-left mb-2">Swap Tax Wallet</div>
        <div className="flex w-full text-xs">
          <div className="grow-0 flex-1 bg-gray-normal px-3 py-1 border border-solid border-gray-border">
            Address
          </div>
          <div className="grow-1 w-full flex-3 px-6 py-1 text-left border border-solid border-gray-border">
            {swapFeeAddress}
          </div>
          <button
            className="grow-0 flex-1 flex items-center px-3 py-1 bg-blue-950 border border-solid border-gray-border"
            onClick={() => {
              setActionOfDialog("set-swap-fee-address");
              setTitleOfDialog("Set Swap Fee Address");
              setShowAddressDailog(true);
            }}
          >
            <IoIosCheckmark className="text-lg text-green-normal" />
            Change
          </button>
        </div>
      </div>
      <div className="w-full mt-8">
        <div className="text-base text-left mb-2">Token Tax Wallet</div>
        <div className="flex w-full text-xs">
          <div className="grow-0 flex-1 bg-gray-normal px-3 py-1 border border-solid border-gray-border">
            Address
          </div>
          <div className="grow-1 w-full flex-3 px-6 py-1 text-left border border-solid border-gray-border">
            {tokenFeeAddress}
          </div>
          <button
            className="grow-0 flex-1 flex items-center px-3 py-1 bg-blue-950 border border-solid border-gray-border"
            onClick={() => {
              setActionOfDialog("set-token-fee-address");
              setTitleOfDialog("Set Token Fee Address");
              setShowAddressDailog(true);
            }}
          >
            <IoIosCheckmark className="text-lg text-green-normal" />
            Change
          </button>
        </div>
      </div>
      <div className="w-full mt-8">
        <div className="flex items-center justify-between w-full h-auto mb-2 text-xs font-medium text-white uppercase">
          <div className="text-base">Collect ETH from Projects</div>
          <button
            className="pl-3 pr-4 h-button rounded-lg justify-center items-center gap-1 inline-flex bg-[#1A1A37] active:scale-95 transition duration-100 ease-in-out transform focus:outline-none text-xs font-medium text-center text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            onClick={() => {
              setSelectedETHBalance(0);
              setTargetWallet("");
              loadAllProjects();
            }}
          >
            <IoIosRefresh className="text-lg text-green-normal" />
            Refresh
          </button>
        </div>
        <div className="flex items-center justify-between w-full h-auto mb-2 text-xs font-medium text-white uppercase">
          <div className="flex gap-2 items-center">
            <div className="ml-3 text-xs uppercase text-gray-normal whitespace-nowrap">
              Selected ETH Balance:
            </div>
            <div className="text-xs uppercase text-green-normal whitespace-nowrap">
              {selectedETHBalance}
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <div className="ml-3 text-xs uppercase text-gray-normal whitespace-nowrap">
              Target Wallet:
            </div>
            <input
              className="outline-none border border-gray-border text-white placeholder:text-gray-border text-sm px-2.5 bg-transparent w-full h-button ml-2 grow max-w-[430px] rounded-lg"
              placeholder="Target Wallet Address"
              value={targetWallet}
              onChange={(e) => setTargetWallet(e.target.value)}
            />
            <button
              className="text-xs font-medium text-center text-nowrap text-white uppercase px-6 h-10 rounded-lg justify-center items-center gap-2.5 bg-gradient-to-br from-[#4B65F1ED] to-[#FA03FF44] active:scale-95 transition duration-100 ease-in-out transform focus:outline-none"
              onClick={handleClickCollect}
            >
              Collect All ETH
            </button>
          </div>
        </div>
        <div className="relative flex flex-col w-full overflow-x-hidden text-white bg-transparent border border-gray-highlight rounded-lg">
          <table className="w-full text-xs">
            <thead className=" text-gray-normal">
              <tr className="uppercase bg-[#1A1A37] sticky top-0 z-10 h-7">
                <th className="w-8">
                  <input
                    type="checkbox"
                    className="w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    checked={walletAllChecked}
                    onChange={handleWalletAllChecked}
                  />
                </th>
                <th className="">User Name</th>
                <th className="">Project Name</th>
                <th className="">Status</th>
                <th className="">Deposite Wallet</th>
                <th className="">ETH Balance</th>
              </tr>
            </thead>
            <tbody className="text-xs text-gray-normal">
              {projects.map((item, index) => {
                return (
                  <tr
                    className={`${
                      index % 2 === 1 && "bg-[#ffffff02]"
                    } hover:bg-[#ffffff20] h-8`}
                    key={`project${index}`}
                  >
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={
                          walletChecked[index] ? walletChecked[index] : false
                        }
                        onChange={(e) => handleWalletChanged(index, e)}
                        className="w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </td>
                    <td className="text-center">{item.userName}</td>
                    <td className="text-center text-white">{item.name}</td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${(() => {
                            switch (item.status) {
                              case "INIT":
                                return "bg-white";
                              case "EXPIRED":
                                return "bg-gray-normal";
                              case "TRADE":
                                return "bg-green-normal";
                              default:
                                return "bg-green-normal";
                            }
                          })()}`}
                        ></div>
                        {item.status}
                      </div>
                    </td>
                    <td className="text-left">{item.depositWallet?.address}</td>
                    <td
                      className={`text-center ${
                        parseFloat(ethBalances[index]) >= 1
                          ? "text-red-normal"
                          : parseFloat(ethBalances[index]) >= 0.5
                          ? "text-yellow-normal"
                          : parseFloat(ethBalances[index]) > 0
                          ? "text-green-normal"
                          : ""
                      }`}
                    >
                      {ethBalances[index]}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {projects.length === 0 && (
            <div className="my-3 text-sm font-bold text-center text-gray-700 uppercase">
              No Project
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
