/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect } from "react";
import { useChainId, createConfig, http } from "wagmi";
import { multicall } from '@wagmi/core'
import { mainnet, sepolia } from 'wagmi/chains'

import { formatUnits } from "viem";

import { AppContext } from "../App";

import tokenABI from "../abi/ERC20.json";
import ControlPanel from "../components/ControlPanel/ControlPanel";
import SwapPanel from "../components/SwapPanel/SwapPanel";
import BundlerWalletManagement from "../components/BundlerWalletManagement/BundlerWalletManagement";
import TokenInfoPanel from "../components/TokenInfoPanel/TokenInfoPanel";
import WalletManagement from "../components/WalletManagement/WalletManagement";
import OrderHistory from "../components/OrderHistory/OrderHistory";
import TopBar from "../components/TopBar/TopBar";
import { isValidAddress } from "../utils/methods";

export const dashboardContext = createContext(null);

function Dashboard() {
  const {
    currentProject,
    refresh,
    setRefresh,
    setLoadingPrompt,
    setOpenLoading,
    activeTokenAddress
  } = useContext(AppContext);

  const chainId = useChainId()
  const network = chainId === 1 ? mainnet : sepolia
  // const config = useConfig()
  const config = createConfig({
    chains: [network],
    transports: {
      [chainId]: http(chainId === 1 ? import.meta.env.VITE_ETH_RPC : //"https://ethereum-rpc.publicnode.com" : mainnet.rpc.aklinfura.pro
        import.meta.env.VITE_SEPOLIA_RPC // ethereum-sepolia.rpc.subquery.network/public
      ),
    },
  })

  const [showChart, setShowChart] = useState(true);
  const [enable100Wallet, setEnable100Wallet] = useState(false);
  const [enableWalletManage, setEnableWalletManage] = useState(true);

  const [pairAddress, setPairAddress] = useState();
  const [pairs, setPairs] = useState([]);
  const [selectedPairId, setSelectedPairId] = useState(0);

  const [walletActiveTokenBalanceData, setWalletActiveTokenBalanceData] = useState([]);
  const [teamWalletActiveTokenBalanceData, setTeamWalletActiveTokenBalanceData] = useState([]);
  const [additionalWalletActiveTokenBalanceData, setAdditionalWalletActiveTokenBalanceData] = useState([]);

  const updateAllActiveTokenBalances = async (token, wallets, teamWallets, additionalWallets) => {
    console.log("Updating all balances in dashboard... 1", token, wallets, teamWallets, additionalWallets);
    setLoadingPrompt("Updating wallet balances...")
    setOpenLoading(true)

    let activeTokenBalances = [];
    let teamActiveTokenBalances = [];
    let additionalActiveTokenBalances = [];

    let contracts = [];
    try {
      if (isValidAddress(token)) {
        contracts.push({
          address: token,
          abi: tokenABI,
          functionName: "decimals",
        });
        for (let i = 0; i < wallets.length; i++) {
          contracts.push({
            address: token,
            abi: tokenABI,
            functionName: "balanceOf",
            args: [wallets[i]],
          });
        }
        for (let i = 0; i < teamWallets.length; i++) {
          contracts.push({
            address: token,
            abi: tokenABI,
            functionName: "balanceOf",
            args: [teamWallets[i]],
          });
        }
        for (let i = 0; i < additionalWallets.length; i++) {
          contracts.push({
            address: token,
            abi: tokenABI,
            functionName: "balanceOf",
            args: [additionalWallets[i]],
          });
        }
      }
      let _data = await multicall(config, {
        contracts,
      });
      if (isValidAddress(token)) {
        let delta = 0
        let decimals =
          _data[0].status === "success" ? parseInt(_data[0].result) : 0;
        for (let i = 0; i < wallets.length; i++) {
          const weiBalance =
            _data[delta + i + 1].status === "success" ? _data[delta + i + 1].result : 0;
          activeTokenBalances = [
            ...activeTokenBalances,
            parseFloat(parseFloat(formatUnits(weiBalance, decimals)).toFixed(4)).toString(),
          ];
        }
        delta += wallets.length
        for (let i = 0; i < teamWallets.length; i++) {
          const weiBalance =
            _data[delta + i + 1].status === "success" ? _data[delta + i + 1].result : 0;
          teamActiveTokenBalances = [
            ...teamActiveTokenBalances,
            parseFloat(parseFloat(formatUnits(weiBalance, decimals)).toFixed(4)).toString(),
          ];
        }
        delta += teamWallets.length
        for (let i = 0; i < additionalWallets.length; i++) {
          const weiBalance =
            _data[delta + i + 1].status === "success" ? _data[delta + i + 1].result : 0;
          additionalActiveTokenBalances = [
            ...additionalActiveTokenBalances,
            parseFloat(parseFloat(formatUnits(weiBalance, decimals)).toFixed(4)).toString(),
          ];
        }
      }
    } catch (err) {
      console.log(err);
      activeTokenBalances = wallets.map(() => "0");
      teamActiveTokenBalances = teamWallets ? teamWallets.map(() => "0") : [];
      additionalActiveTokenBalances = additionalWallets ? additionalWallets.map(() => "0") : [];
    }

    console.log("Updated all balances!");
    setWalletActiveTokenBalanceData(activeTokenBalances);
    setTeamWalletActiveTokenBalanceData(teamActiveTokenBalances)
    setAdditionalWalletActiveTokenBalanceData(additionalActiveTokenBalances);
    setOpenLoading(false)
    setRefresh(false)
  };

  useEffect(() => {
    if (activeTokenAddress || (currentProject.wallets && currentProject.wallets.length > 0) || (currentProject.teamWallets && currentProject.teamWallets.length > 0) || (currentProject.additionalWallets && currentProject.additionalWallets.length > 0)) {
      const wallets = currentProject.wallets.map(item => item.address);
      const teamWallets = currentProject.teamWallets ? currentProject.teamWallets.map(item => item.address) : [];
      const additionalWallets = currentProject.additionalWallets ? currentProject.additionalWallets.map(item => item.address) : [];
      updateAllActiveTokenBalances(activeTokenAddress, wallets, teamWallets, additionalWallets);
    }
    else {
      setWalletActiveTokenBalanceData([]);
      setTeamWalletActiveTokenBalanceData([]);
      setAdditionalWalletActiveTokenBalanceData([]);
    }
  }, [activeTokenAddress, currentProject.wallets, currentProject.teamWallets, currentProject.additionalWallets]);

  useEffect(() => {
    const _updateAllBalances = async () => {
      if (refresh) {
        const wallets = currentProject.wallets.map(item => item.address);
        const teamWallets = currentProject.teamWallets ? currentProject.teamWallets.map(item => item.address) : [];
        const additionalWallets = currentProject.additionalWallets ? currentProject.additionalWallets.map(item => item.address) : [];
        await updateAllActiveTokenBalances(activeTokenAddress, wallets, teamWallets, additionalWallets)
      }
    }
    _updateAllBalances()
  }, [refresh])

  return (
    <dashboardContext.Provider
      value={{
        showChart,
        setShowChart,
        enable100Wallet,
        setEnable100Wallet,
        enableWalletManage,
        setEnableWalletManage,
        pairAddress,
        setPairAddress,
        selectedPairId,
        setSelectedPairId,
        pairs,
        setPairs,
        walletActiveTokenBalanceData,
        teamWalletActiveTokenBalanceData,
        additionalWalletActiveTokenBalanceData
      }}
    >
      <div className="w-screen h-screen flex flex-col max-[1800px]:items-start items-center overflow-auto">
        <div className="mx-6 w-fit h-full pt-5 pb-3 flex flex-col gap-3">
          <TopBar />
          <ControlPanel />
          <div className={`w-fit h-[50%] grow flex gap-3`}>
            <div className="w-[400px] h-full flex flex-col grow-0 shrink-0 gap-1.5">
              <div className="grow-0">
                <SwapPanel />
              </div>
              <div className="grow h-[30%]">
                {enableWalletManage && <BundlerWalletManagement />}
              </div>
            </div>
            <div className="w-[700px] h-full flex flex-col select-none overflow-auto">
              <div className="mb-2">
                <TokenInfoPanel />
              </div>
              <div className="grow h-[20%] min-h-[200px]">
                <OrderHistory />
              </div>
            </div>
            <div className="w-[600px] h-full flex flex-col shrink-0 grow-0">
              <div className="h-fit rounded-xl mb-2 text-transparent overflow-hidden">
                <video className="h-full" autoPlay loop>
                  <source src="/assets/video/banner.mp4" />
                </video>
              </div>
              {enableWalletManage && (
                <div className="w-full grow h-[50%]">
                  <WalletManagement />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </dashboardContext.Provider>
  );
}

export default Dashboard;
