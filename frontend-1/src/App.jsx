/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-refresh/only-export-components */
/* eslint-disable no-unused-vars */
import { createContext, useCallback, useEffect, useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useChainId, createConfig, http, useAccount, useConfig } from "wagmi";
import { mainnet, sepolia } from 'wagmi/chains'
import { multicall, signMessage } from '@wagmi/core'
import { formatUnits } from "viem";
import axios from 'axios'
import io from 'socket.io-client';

import "./App.css";
import "react-loading-skeleton/dist/skeleton.css";

import 'react-animation/dist/keyframes.css'

import * as ENV from "./config/env"

import { useEthersProvider } from "./utils/provider";
import LoadingDialog from "./components/Dialogs/LoadingDialog";
import tokenABI from "./abi/ERC20.json";
import multicallABI from "./abi/Multicall.json";
import { multicallAddress } from "./utils/constants";
import MenuBar from "./components/MenuBar/MenuBar";
import ContractManagementPage from "./pages/ContractManagementPage";
import BundlePage from "./pages/BundlePage";

import { isValidAddress } from "./utils/methods";
import Dashboard from "./pages/Dashboard";
import HomePage from "./pages/HomePage";
import MyAccountPage from "./pages/MyAccountPage";
import AdministratorPage from "./pages/AdministratorPage";
import CrossChainMixerPage from "./pages/CrossChainMixerPage";
import Faq from "./pages/Faq";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminProjectsPage from "./pages/AdminProjectsPage";
import AdminAntiDrainersPage from "./pages/AdminAntiDrainersPage";
import AdminExtraWalletsPage from "./pages/AdminExtraWalletsPage";
import AdminEmailsPage from "./pages/AdminEmailsPage";
import AdminFinancePage from "./pages/AdminFinancePage";
import ModifyTaxPage from "./pages/ModifyTaxPage";
import LiquidityManagementPage from "./pages/LiquidityManagementPage";
import StandardTokenLaunchPage from "./pages/StandardTokenLaunchPage";
import CustomTokenLaunchPage from "./pages/CustomTokenLaunchPage";
import QuickTokenLaunchPage from "./pages/QuickTokenLaunchPage";
import AdminZombieWalletPage from "./pages/AdminZombieWalletPage";
import AdminTokenDepositWalletPage from "./pages/AdminTokenDepositWalletPage";
import McCalculator from './pages/McCalculator';

export const AppContext = createContext(null);

export const CHAIN_STRING = {
  "1": "ethereum",
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const chainId = useChainId();
  const network = chainId === 1 ? mainnet : sepolia
  const curConfig = useConfig()
  const config = createConfig({
    chains: [network],
    transports: {
      [chainId]: http(chainId === 1 ? import.meta.env.VITE_ETH_RPC : //"https://ethereum-rpc.publicnode.com" :  mainnet.rpc.aklinfura.pro
        import.meta.env.VITE_SEPOLIA_RPC // ethereum-sepolia.rpc.subquery.network/public
      ),
    },
  })
  const account = useAccount();

  const provider = useEthersProvider(chainId);

  const [loadingPrompt, setLoadingPrompt] = useState("");
  const [loadingDesc, setLoadingDesc] = useState("");
  const [openLoading, setOpenLoading] = useState(false);

  const userInfo = localStorage.getItem("user-info")
  const [user, setUser] = useState(userInfo ? JSON.parse(userInfo) : null);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState({});
  const [webSocket, setWebSocket] = useState(null);
  const [disperseContract, setDisperseContract] = useState({});
  const [emails, setEmails] = useState([]);
  const [walletBalanceData, setWalletBalanceData] = useState({ address: "", token: [], eth: [] });
  const [teamWalletBalanceData, setTeamWalletBalanceData] = useState({ address: "", token: [], eth: [] });
  const [additionalWalletBalanceData, setAdditionalWalletBalanceData] = useState({ address: "", token: [], eth: [] });
  const [notifyStatus, setNotifyStatus] = useState({ success: true, tag: "NONE" });

  const [tokenInfo, setTokenInfo] = useState({})
  const [showMenu, setShowMenu] = useState(false);

  let userSignature = localStorage.getItem("user-signature")
  userSignature = userSignature ? JSON.parse(userSignature) : null

  // active wallet
  const [activeWallet, setActiveWallet] = useState({})
  const [activeTokenAddress, setActiveTokenAddress] = useState(
    chainId === 1 ? import.meta.env.VITE_MAINNET_BUNDLE_IO_TOKEN : import.meta.env.VITE_SEPOLIA_BUNDLE_IO_TOKEN
  );
  const [refresh, setRefresh] = useState(false)
  const [executedStatus, setExecutedStatus] = useState({ success: false })
  const [timers, setTimers] = useState({});
  const [signingData, setSigningData] = useState(userSignature ? userSignature.signingData : undefined)
  const [sigData, setSigData] = useState(userSignature ? userSignature.signature : undefined)
  const [signPending, setSignPending] = useState(false)

  const [bitcoinInfo, setBitcoinInfo] = useState();
  const [etherInfo, setEtherInfo] = useState();
  const [solInfo, setSolInfo] = useState();
  const [timer, setTimer] = useState(null);

  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);

  const openWebSocket = (userId) => {
    console.log("Starting websocket...");
    const ws = new io(ENV.SERVER_URL);
    ws.on("connect", () => {
      console.log('WebSocket connection established');
      ws.emit("NEW_USER", userId);
    });

    ws.on("BUY_PENDING", async (value) => {
      setNotifyStatus({ success: true, tag: "BUY_PENDING" });
    });

    ws.on("DIRTY_WALLET_COMPLETED", async (value) => {
      const m = JSON.parse(value);
      if (m.message === "OK")
        setNotifyStatus({ success: true, tag: "DIRTY_WALLET_COMPLETED" });
      else
        setNotifyStatus({ success: false, tag: "DIRTY_WALLET_COMPLETED" });
    });

    ws.on("SIMULATE_COMPLETED", async (value) => {
      const m = JSON.parse(value);
      if (m.message === "OK")
        setNotifyStatus({ success: true, tag: "SIMULATE_COMPLETED", data: m.data });
      else
        setNotifyStatus({ success: false, tag: "SIMULATE_COMPLETED", error: m.error });
    });

    ws.on("BUY_COMPLETED", async (value) => {
      const m = JSON.parse(value);
      if (m.message === "OK")
        setNotifyStatus({ success: true, tag: "BUY_COMPLETED", project: m.project });
      else
        setNotifyStatus({ success: false, tag: "BUY_COMPLETED" });
    });

    ws.on("SELL_COMPLETED", async (value) => {
      const m = JSON.parse(value);
      setNotifyStatus({ success: m.message === "OK", tag: "SELL_COMPLETED", project: m.project });
    });

    ws.on("TRANSFER_COMPLETED", async (value) => {
      const m = JSON.parse(value);
      setNotifyStatus({ success: m.message === "OK", tag: "TRANSFER_COMPLETED", project: m.project });
    });

    ws.on("EXECUTE_COMPLETED", async (value) => {
      const m = JSON.parse(value);
      setNotifyStatus({ success: m.message === "OK", tag: "EXECUTE_COMPLETED", project: m.project });
      setExecutedStatus({ success: m.message === "OK" })
      setRefresh(true)
    });

    ws.on("COLLECT_ALL_ETH", async (value) => {
      const m = JSON.parse(value);
      setNotifyStatus({ success: m.message === "OK", tag: "COLLECT_ALL_ETH", project: m.project });
    });

    ws.on("COLLECT_ALL_FEE", async (value) => {
      const m = JSON.parse(value);
      if (m.message === "OK")
        setNotifyStatus({ success: true, tag: "COLLECT_ALL_FEE" });
      else
        setNotifyStatus({ success: false, tag: "COLLECT_ALL_FEE" });
    });

    ws.on("NEW_METRICS", async (value) => {
      const m = JSON.parse(value);
      // console.log("New metrics", m.userId, m.metrics);
      setNotifyStatus({ success: true, tag: "NEW_METRICS", userId: m.userId, metrics: m.metrics });
    });

    ws.on("LOG", (value) => {
      console.log("SERVER:", value);
    });

    ws.on("disconnect", () => {
      console.log('WebSocket connection closed');
      // setConnected(false);
    });

    setWebSocket(ws);
  };

  const closeWebSocket = () => {
    if (webSocket)
      webSocket.close();
    setWebSocket(null);
  };

  const updateAllBalances = async (token, wallets, teamWallets, additionalWallets) => {
    console.log("Updating all balances  in app...", token, multicallAddress);

    let tokenBalances = [];
    let ethBalances = [];
    let teamTokenBalances = [];
    let teamEthBalances = [];
    let additionalTokenBalances = [];
    let additionalEthBalances = [];
    let contracts = []
    try {
      for (let i = 0; i < wallets.length; i++) {
        contracts.push({
          address: multicallAddress,
          abi: multicallABI,
          functionName: "getEthBalance",
          args: [wallets[i]]
        })
      }
      if (teamWallets && teamWallets?.length > 0) {
        for (let i = 0; i < teamWallets.length; i++) {
          contracts.push({
            address: multicallAddress,
            abi: multicallABI,
            functionName: "getEthBalance",
            args: [teamWallets[i]]
          })
        }
      }
      if (additionalWallets && additionalWallets?.length > 0) {
        for (let i = 0; i < additionalWallets.length; i++) {
          contracts.push({
            address: multicallAddress,
            abi: multicallABI,
            functionName: "getEthBalance",
            args: [additionalWallets[i]]
          })
        }
      }
      if (isValidAddress(token)) {
        contracts.push({
          address: token,
          abi: tokenABI,
          functionName: "decimals"
        })
        for (let i = 0; i < wallets.length; i++) {
          contracts.push({
            address: token,
            abi: tokenABI,
            functionName: "balanceOf",
            args: [wallets[i]]
          })
        }
        if (teamWallets && teamWallets?.length > 0) {
          for (let i = 0; i < teamWallets.length; i++) {
            contracts.push({
              address: token,
              abi: tokenABI,
              functionName: "balanceOf",
              args: [teamWallets[i]]
            })
          }
        }
        if (additionalWallets && additionalWallets?.length > 0) {
          for (let i = 0; i < additionalWallets.length; i++) {
            contracts.push({
              address: token,
              abi: tokenABI,
              functionName: "balanceOf",
              args: [additionalWallets[i]]
            })
          }
        }
      }
      const _data = await multicall(config, {
        contracts
      })
      let delta = 0
      for (let i = 0; i < wallets.length; i++) {
        const weiBalance = _data[delta + i].status === "success" ? _data[delta + i].result : 0
        ethBalances = [
          ...ethBalances,
          parseFloat(parseFloat(formatUnits(weiBalance, 18)).toFixed(4)).toString()
        ];
      }
      delta += wallets.length
      if (teamWallets && teamWallets?.length > 0) {
        for (let i = 0; i < teamWallets.length; i++) {
          const weiBalance = _data[delta + i].status === "success" ? _data[delta + i].result : 0
          teamEthBalances = [
            ...teamEthBalances,
            parseFloat(parseFloat(formatUnits(weiBalance, 18)).toFixed(4)).toString()
          ];
        }
        delta += teamWallets.length
      }
      if (additionalWallets && additionalWallets?.length > 0) {
        for (let i = 0; i < additionalWallets.length; i++) {
          const weiBalance = _data[delta + i].status === "success" ? _data[delta + i].result : 0
          additionalEthBalances = [
            ...additionalEthBalances,
            parseFloat(parseFloat(formatUnits(weiBalance, 18)).toFixed(4)).toString()
          ];
        }
        delta += additionalWallets.length
      }
      if (isValidAddress(token)) {
        let decimals = _data[delta].status === "success" ? parseInt(_data[delta].result) : 0
        for (let i = 0; i < wallets.length; i++) {
          const weiBalance = _data[delta + i + 1].status === "success" ? _data[delta + i + 1].result : 0
          tokenBalances = [
            ...tokenBalances,
            parseFloat(parseFloat(formatUnits(weiBalance, decimals)).toFixed(4)).toString()
          ];
        }
        delta += wallets.length
        if (teamWallets && teamWallets?.length > 0) {
          for (let i = 0; i < teamWallets.length; i++) {
            const weiBalance = _data[delta + i + 1].status === "success" ? _data[delta + i + 1].result : 0
            teamTokenBalances = [
              ...teamTokenBalances,
              parseFloat(parseFloat(formatUnits(weiBalance, decimals)).toFixed(4)).toString()
            ];
          }
          delta += teamWallets.length
        }
        if (additionalWallets && additionalWallets?.length > 0) {
          for (let i = 0; i < additionalWallets.length; i++) {
            const weiBalance = _data[delta + i + 1].status === "success" ? _data[delta + i + 1].result : 0
            additionalTokenBalances = [
              ...additionalTokenBalances,
              parseFloat(parseFloat(formatUnits(weiBalance, decimals)).toFixed(4)).toString()
            ];
          }
        }
      } else {
        tokenBalances = wallets.map(() => "0");
        teamTokenBalances = teamWallets ? teamWallets.map(() => "0") : [];
        additionalTokenBalances = additionalWallets ? additionalWallets.map(() => "0") : [];
      }
    } catch (err) {
      console.log(err);
      tokenBalances = wallets.map(() => "0");
      teamTokenBalances = teamWallets ? teamWallets.map(() => "0") : [];
      additionalTokenBalances = additionalWallets ? additionalWallets.map(() => "0") : [];
      ethBalances = wallets.map(() => "0");
      teamEthBalances = teamWallets ? teamWallets.map(() => "0") : [];
      additionalEthBalances = additionalWallets ? additionalWallets.map(() => "0") : [];
    }

    console.log("Updated all balances! token", tokenBalances, ethBalances);
    setWalletBalanceData({ address: token, token: tokenBalances, eth: ethBalances });
    setTeamWalletBalanceData({ address: token, token: teamTokenBalances, eth: teamEthBalances });
    setAdditionalWalletBalanceData({ address: token, token: additionalTokenBalances, eth: additionalEthBalances });
  };

  const loadAllProjects = async (id = null) => {
    let newProjects = [];
    let copyCurrentProject = { ...currentProject };
    setLoadingPrompt("Loading all projects...");
    setOpenLoading(true);
    try {
      console.log("Loading all projects...");
      const { data } = await axios.post(`${ENV.SERVER_URL}/api/v1/project/load-all`,
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
      if (data.projects)
        newProjects = data.projects;
    }
    catch (err) {
      console.log(err);
      toast.warn("Failed to load projects");
    }

    setOpenLoading(false);
    setProjects(newProjects);
    // setCurrentProject(newProjects.find((v, i) => v.name == copyCurrentProject.name));
    let _curProject
    if (id) {
      _curProject = newProjects.find((v) => v._id == id);
    } else {
      _curProject = newProjects.find((v, i) => v.name == copyCurrentProject.name)
    }
    setCurrentProject(_curProject ? _curProject : {})
  };

  const loadAllUsers = async () => {
    let newUsers = [];
    setLoadingPrompt("Loading all users...");
    setOpenLoading(true);
    try {
      console.log("Loading all users...");
      const { data } = await axios.post(`${ENV.SERVER_URL}/api/v1/user/load-all`,
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
      if (data.users)
        newUsers = data.users;
    }
    catch (err) {
      console.log(err);
      toast.warn("Failed to load users");
    }

    setOpenLoading(false);
    setUsers(newUsers);
  };

  const loadAllEmails = async () => {
    let newEmails = [];
    setLoadingPrompt("Loading all emails...");
    setOpenLoading(true);
    try {
      console.log("Loading all users...");
      const { data } = await axios.post(`${ENV.SERVER_URL}/api/v1/misc/load-emails`,
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
      if (data.emails)
        newEmails = data.emails;
    }
    catch (err) {
      console.log(err);
      toast.warn("Failed to load users");
    }

    setOpenLoading(false);
    setEmails(newEmails);
  };

  const updateProject = (project) => {
    const newProjects = [...projects];
    for (let i = 0; i < newProjects.length; i++) {
      if (project._id === newProjects[i]._id) {
        newProjects[i] = project;
        break;
      }
    }
    setProjects(newProjects);
  };

  const reloadAllBalances = async () => {
    if (currentProject.token || (currentProject.wallets && currentProject.wallets.length > 0) || (currentProject.teamWallets && currentProject.teamWallets.length > 0) || (currentProject.additionalWallets && currentProject.additionalWallets.length > 0)) {
      const wallets = currentProject.wallets.map(item => item.address);
      const teamWallets = currentProject.teamWallets ? currentProject.teamWallets.map(item => item.address) : [];
      const additionalWallets = currentProject.additionalWallets ? currentProject.additionalWallets.map(item => item.address) : [];
      await updateAllBalances(currentProject.token.address, wallets, teamWallets, additionalWallets);
    }
    else {
      setWalletBalanceData({ address: "", token: [], eth: [] });
      setTeamWalletBalanceData({ address: "", token: [], eth: [] });
      setAdditionalWalletBalanceData({ address: "", token: [], eth: [] });
    }
  }

  const initAllData = async (accessToken, user) => {
    let newUsers = [];
    let newProjects = [];
    let newEmails = [];
    // let newAntiDrainers = [];
    // let newExtraWallets = [];
    let newDisperseContract = {};

    setLoadingPrompt("Initializing...");
    setOpenLoading(true);

    if (user.role === "admin") {
      try {
        console.log("Loading all users...");
        const { data } = await axios.post(`${ENV.SERVER_URL}/api/v1/user/load-all`,
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
        if (data.users)
          newUsers = data.users;
      }
      catch (err) {
        console.log(err);
        toast.warn("Failed to load users");
      }
    }

    try {
      console.log("Loading all projects...");
      const { data } = await axios.post(`${ENV.SERVER_URL}/api/v1/project/load-all`,
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
      if (data.projects)
        newProjects = data.projects;
    }
    catch (err) {
      console.log(err);
      toast.warn("Failed to load projects");
    }

    if (user.role === "admin") {
      try {
        console.log("Loading all emails...");
        const { data } = await axios.post(`${ENV.SERVER_URL}/api/v1/misc/load-emails`,
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
        if (data.emails)
          newEmails = data.emails;
      }
      catch (err) {
        console.log(err);
        toast.warn("Failed to load emails");
      }
    }

    if (user.role === "admin") {
      try {
        console.log("Loading all anti-drainers...");
        // const { data } = await axios.get(`${ENV.SERVER_URL}/api/v1/project/load-anti-drainers`,
        //   {
        //     headers: {
        //       "Content-Type": "application/json",
        //       "MW-USER-ID": accessToken,
        //     },
        //   }
        // );
        // if (data.adrainers)
        //   newAntiDrainers = data.adrainers;
      }
      catch (err) {
        console.log(err);
        toast.warn("Failed to load anti-drainers");
      }
    }

    if (user.role === "admin") {
      try {
        console.log("Loading all extra-wallets...");
        // const { data } = await axios.get(`${ENV.SERVER_URL}/api/v1/misc/load-extra-wallets`,
        //   {
        //     headers: {
        //       "Content-Type": "application/json",
        //       "MW-USER-ID": accessToken,
        //     },
        //   }
        // );
        // newExtraWallets = data.contacts;
      }
      catch (err) {
        console.log(err);
        toast.warn("Failed to load extra-wallets");
      }
    }

    if (user.role === "admin") {
      try {
        console.log("Loading disperse contract...");
        const { data } = await axios.post(`${ENV.SERVER_URL}/api/v1/misc/load-disperse-contract`,
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
        newDisperseContract = data.contract;
      }
      catch (err) {
        console.log(err);
        toast.warn("Failed to load disperse contracts");
      }
    }

    setOpenLoading(false);

    setProjects(newProjects);
    setCurrentProject(newProjects.length == 1 ? newProjects[0] : {});
    if (user.role === "admin") {
      setUsers(newUsers);
      setEmails(newEmails);
      setDisperseContract(newDisperseContract);
      // setAntiDrainers(newAntiDrainers);
      // setExtraWallets(newExtraWallets);
    }
  };

  const getTokenInfo = async (tokenAddress) => {
    try {
      const contracts = [
        {
          address: tokenAddress,
          abi: tokenABI,
          functionName: "owner"
        },
        {
          address: tokenAddress,
          abi: tokenABI,
          functionName: "name"
        },
        {
          address: tokenAddress,
          abi: tokenABI,
          functionName: "symbol"
        },
        {
          address: tokenAddress,
          abi: tokenABI,
          functionName: "totalSupply"
        },
        {
          address: tokenAddress,
          abi: tokenABI,
          functionName: "decimals"
        }
      ]
      const _data = await multicall(config, {
        contracts
      })
      setTokenInfo({
        address: tokenAddress,
        owner: _data[0].status === "success" ? _data[0].result : "",
        name: _data[1].status === "success" ? _data[1].result : "",
        symbol: _data[2].status === "success" ? _data[2].result : "",
        totalSupply: _data[3].status === "success" ? parseFloat(formatUnits(_data[3].result, parseInt(_data[4].result))) : 0,
        decimals: _data[4].status === "success" ? parseInt(_data[4].result) : "",
        logo: CHAIN_STRING[chainId.toString()] ?
          `https://dd.dexscreener.com/ds-data/tokens/${CHAIN_STRING[chainId.toString()]}/${tokenAddress}.png` :
          "/assets/icon/ic_question.svg"
      })
    } catch (e) {
      console.log(e)
      console.log("This chain has no this token. Please check your token address again on this chain.")
    }
  }

  const logout = async () => {
    console.log("Logging out...");

    setLoadingPrompt("Logging out...");
    setOpenLoading(true);
    localStorage.removeItem("access-token");
    localStorage.removeItem("user-info");
    localStorage.removeItem("user-signature");
    setUser(null);
    setCurrentProject({})
    setUsers([])
    setProjects([])
    // closeWebSocket();
    setOpenLoading(false);
  };

  const loadUser = async (_sigData, _signingData) => {
    try {
      const { data } = await axios.post(`${ENV.SERVER_URL}/api/v1/user/me`,
        {
          sigData: _sigData,
          signingData: _signingData
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (data.success) {
        setUser(data.user);
        localStorage.setItem("user-info", JSON.stringify(data.user))
      }
    }
    catch (err) {
      console.log(err);
      localStorage.removeItem("user-info")
      setUser(null);
    }
  };

  const getPrices = async () => {
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        params: {
          ids: 'bitcoin,ethereum,solana',
          vs_currencies: 'usd',
          include_24hr_change: 'true',
        },
      });

      const prices = response.data;

      function getPriceInfo(coin) {
        const price = prices[coin].usd;
        const change = prices[coin].usd_24h_change;
        const direction = change >= 0 ? 'up' : 'down';
        return { price, change, direction };
      }

      const bitcoinInfo = getPriceInfo('bitcoin');
      const ethereumInfo = getPriceInfo('ethereum');
      const solanaInfo = getPriceInfo('solana');

      console.log('Current Prices and 24h Change:');
      console.log(`Bitcoin: $${bitcoinInfo.price} (${bitcoinInfo.direction} ${bitcoinInfo.change.toFixed(2)}%)`);
      console.log(`Ethereum: $${ethereumInfo.price} (${ethereumInfo.direction} ${ethereumInfo.change.toFixed(2)}%)`);
      console.log(`Solana: $${solanaInfo.price} (${solanaInfo.direction} ${solanaInfo.change.toFixed(2)}%)`);

      setBitcoinInfo(bitcoinInfo);
      setEtherInfo(ethereumInfo);
      setSolInfo(solanaInfo);
    } catch (error) {
      console.error('Error fetching prices:', error);
    }
  }

  useEffect(() => {
    if (timer) clearInterval(timer);
    setTimer(setInterval(() => {
      getPrices();
    }, 60 * 60 * 1000))

    getPrices();
  }, [])

  useEffect(() => {
    if (currentProject.token || (currentProject.wallets && currentProject.wallets.length > 0) || (currentProject.teamWallets && currentProject.teamWallets.length > 0) || (currentProject.additionalWallets && currentProject.additionalWallets.length > 0)) {
      const wallets = currentProject.wallets.map(item => item.address);
      const teamWallets = currentProject.teamWallets ? currentProject.teamWallets.map(item => item.address) : [];
      const additionalWallets = currentProject.additionalWallets ? currentProject.additionalWallets.map(item => item.address) : [];
      updateAllBalances(currentProject.token.address, wallets, teamWallets, additionalWallets);
      if (currentProject.wallets && currentProject.wallets.length > 0) setActiveWallet(currentProject.wallets[0])
    }
    else {
      setWalletBalanceData({ address: "", token: [], eth: [] });
      // setTeamWalletBalanceData({ address: "", token: [], eth: [] });
    }
  }, [currentProject.token, currentProject.wallets, currentProject.teamWallets, currentProject.additionalWallets, provider]);

  useEffect(() => {
    getTokenInfo(activeTokenAddress);
  }, [activeTokenAddress])

  const signWallet = useCallback(async () => {
    try {
      if (account.isConnected) {
        if (ENV.CHAINID_LIST.includes(account.chainId)) {
          if (!user || (user && user.name !== account.address)) {
            setSignPending(true)
            const signTime = Date.now()
            const tmpSigningData = {
              time: signTime.toString(),
              address: account.address,
              chainId: account.chainId
            }
            const message = JSON.stringify(tmpSigningData);
            const signature = await signMessage(curConfig, { message })
            setSigningData(tmpSigningData);
            setSigData(signature);
            localStorage.setItem("user-signature", JSON.stringify({
              "signature": signature,
              "signingData": tmpSigningData
            }))
            await loadUser(signature, tmpSigningData);
            navigate("/myaccount");
            setSignPending(false)
          }
        } else {
          toast.warn("Please select Ethereum or Sepolia Network!");
          setSigningData(undefined);
          setSigData(undefined);
        }
      } else {
        setSigningData(undefined);
        setSigData(undefined);
      }
    } catch (error) {
      console.log(error)
      setSigningData(undefined);
      setSigData(undefined);
    }
    setSignPending(false)
  }, [account.address, account.chainId])

  useEffect(() => {
    signWallet()
  }, [signWallet])

  useEffect(() => {
    if (!account.isConnected || !ENV.CHAINID_LIST.includes(account.chainId)) {
      setLoadingPrompt("Logging out...");
      setOpenLoading(true);
      localStorage.removeItem("access-token");
      localStorage.removeItem("user-info");
      localStorage.removeItem("user-signature");
      setUser(null)
      setCurrentProject({})
      setUsers([])
      setProjects([])
      setOpenLoading(false)
    }
  }, [account.isConnected, account.chainId])

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    if (!user) {
      if (location.pathname !== "/dashboard") {
        navigate("/dashboard");
      }
    }
    else {
      if (currentProject && currentProject.token && isValidAddress(currentProject.token.address)) {
        if (location.pathname !== "/dashboard" &&
          location.pathname !== "/standard-token-launch" &&
          location.pathname !== "/custom-token-launch" &&
          location.pathname !== "/quick-token-launch" &&
          location.pathname !== "/deploy-token-and-liquidity" &&
          location.pathname !== "/bundle" &&
          location.pathname !== "/administrator" &&
          location.pathname !== "/admin-user" &&
          location.pathname !== "/admin-project" &&
          location.pathname !== "/admin-anti-drainer" &&
          location.pathname !== "/admin-extra-wallet" &&
          location.pathname !== "/admin-email" &&
          location.pathname !== "/admin-zombie-wallets" &&
          location.pathname !== "/admin-token-wallets" &&
          location.pathname !== "/admin-finance" &&
          location.pathname !== "/cross-chain-mixer-page" &&
          location.pathname !== "/liquidity" &&
          location.pathname !== "/modify-token-tax" &&
          location.pathname !== "/mc-calculator" &&
          location.pathname !== "/faq") {
          navigate("/dashboard");
        }
      } else {
        if (location.pathname !== "/dashboard" &&
          location.pathname !== "/standard-token-launch" &&
          location.pathname !== "/custom-token-launch" &&
          location.pathname !== "/quick-token-launch" &&
          location.pathname !== "/deploy-token-and-liquidity" &&
          location.pathname !== "/administrator" &&
          location.pathname !== "/admin-user" &&
          location.pathname !== "/admin-project" &&
          location.pathname !== "/admin-anti-drainer" &&
          location.pathname !== "/admin-extra-wallet" &&
          location.pathname !== "/admin-email" &&
          location.pathname !== "/admin-zombie-wallets" &&
          location.pathname !== "/admin-token-wallets" &&
          location.pathname !== "/admin-finance" &&
          location.pathname !== "/cross-chain-mixer-page" &&
          location.pathname !== "/liquidity" &&
          location.pathname !== "/modify-token-tax" &&
          location.pathname !== "/myaccount" &&
          location.pathname !== "/mc-calculator" &&
          location.pathname !== "/faq") {
          navigate("/dashboard");
        }
      }
    }
  }, [location, navigate, user]);

  useEffect(() => {
    if (user) {
      console.log("Succeed to login");
      toast.success("Succeed to login");

      openWebSocket(user._id);

      const accessToken = localStorage.getItem("access-token");
      initAllData(accessToken, user);
    }
    else
      console.log("Logged out");
  }, [user]);

  useEffect(() => {
    if (notifyStatus.tag === "NEW_METRICS") {
      // new metrics
    }
    else if (notifyStatus.tag === "COLLECT_ALL_FEE") {
      if (notifyStatus.success)
        toast.success("Succeed to collect fee!");
      else
        toast.warn("Failed to collect fee!");
      setOpenLoading(false);
    } else if (notifyStatus.tag === "EXECUTE_COMPLETED") {
      if (notifyStatus.success)
        toast.success("Succeed to execute actions!");
      else
        toast.warn("Failed to execute actions!");
      setOpenLoading(false);
    } else {
      if (notifyStatus.success)
        toast.success("Succeed!");
      else
        toast.warn("Failed!");
      setOpenLoading(false);
    }
  }, [notifyStatus]);

  useEffect(() => {
    const _updateAllBalances = async () => {
      if (refresh && currentProject.token && currentProject.wallets && currentProject.wallets.length > 0) {
        const wallets = currentProject.wallets.map(item => item.address);
        const teamWallets = currentProject.teamWallets ? currentProject.teamWallets.map(item => item.address) : [];
        const additionalWallets = currentProject.additionalWallets ? currentProject.additionalWallets.map(item => item.address) : [];
        setLoadingPrompt("Updating wallet balances...")
        setOpenLoading(true)
        await updateAllBalances(currentProject.token.address, wallets, teamWallets, additionalWallets)
        setOpenLoading(false)
        setRefresh(false)
      }
    }
    _updateAllBalances()
  }, [refresh])

  return (
    <AppContext.Provider
      value={{
        SERVER_URL: ENV.SERVER_URL,
        setLoadingDesc,
        setLoadingPrompt,
        setOpenLoading,
        logout,
        user,
        setUser,
        users,
        setUsers,
        projects,
        setProjects,
        updateProject,
        currentProject,
        setCurrentProject,
        webSocket,
        setWebSocket,
        openWebSocket,
        closeWebSocket,
        disperseContract,
        setDisperseContract,
        emails,
        setEmails,
        loadAllProjects,
        loadAllUsers,
        loadAllEmails,
        walletBalanceData,
        setWalletBalanceData,
        teamWalletBalanceData,
        setTeamWalletBalanceData,
        additionalWalletBalanceData,
        setAdditionalWalletBalanceData,
        updateAllBalances,
        notifyStatus,
        setNotifyStatus,
        tokenInfo,
        setTokenInfo,
        getTokenInfo,
        showMenu,
        setShowMenu,
        activeWallet,
        setActiveWallet,
        activeTokenAddress,
        setActiveTokenAddress,
        refresh,
        setRefresh,
        executedStatus,
        setExecutedStatus,
        timers,
        setTimers,
        sigData,
        signingData,
        signWallet,
        signPending,
        bitcoinInfo,
        etherInfo,
        solInfo,
        reloadAllBalances,
        isCreateProjectOpen,
        setIsCreateProjectOpen
      }}
    >
      <LoadingDialog isOpen={openLoading} prompt={loadingPrompt} desc={loadingDesc} />
      {
        user ?
          (
            <div className="relative flex w-screen h-screen overflow-auto">
              {currentProject.token && <MenuBar />}
              <div className="w-full flex justify-center">
                {
                  currentProject.token ?
                    <Routes>
                      <Route path="/administrator" element={<AdministratorPage />} />
                      <Route path="/admin-user" element={<AdminUsersPage />} />
                      <Route path="/admin-project" element={<AdminProjectsPage />} />
                      <Route path="/admin-anti-drainer" element={<AdminAntiDrainersPage />} />
                      <Route path="/admin-extra-wallet" element={<AdminExtraWalletsPage />} />
                      <Route path="/admin-email" element={<AdminEmailsPage />} />
                      <Route path="/admin-zombie-wallets" element={<AdminZombieWalletPage />} />
                      <Route path="/admin-token-wallets" element={<AdminTokenDepositWalletPage />} />
                      <Route path="/admin-finance" element={<AdminFinancePage />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/standard-token-launch" element={<StandardTokenLaunchPage />} />
                      <Route path="/custom-token-launch" element={<CustomTokenLaunchPage />} />
                      <Route path="/quick-token-launch" element={<QuickTokenLaunchPage />} />
                      <Route path="/deploy-token-and-liquidity" element={<ContractManagementPage />} />
                      <Route path="/cross-chain-mixer-page" element={<CrossChainMixerPage />} />
                      <Route path="/liquidity" element={<LiquidityManagementPage />} />
                      <Route path="/modify-token-tax" element={<ModifyTaxPage />} />
                      <Route path='/mc-calculator' element={<McCalculator />} />
                      <Route path="/faq" element={<Faq />} />
                      <Route path="/myaccount" element={<MyAccountPage />} />
                      {
                        currentProject && currentProject.token && isValidAddress(currentProject.token.address) && <Route path="/bundle" element={<BundlePage />} />
                      }
                    </Routes>
                    :
                    <Routes>
                      <Route
                        path="/administrator"
                        element={<AdministratorPage />}
                      />
                      <Route path="/*" element={<MyAccountPage />} />
                    </Routes>
                }
              </div>
            </div>
          ) :
          (
            <Routes>
              <Route path="/*" element={<HomePage />} />
            </Routes>
          )
      }
    </AppContext.Provider>
  );
}

export default App;
