import { useContext, useEffect, useState } from "react";
import { useChainId, useAccount, useConfig, createConfig, http } from "wagmi";
import { mainnet, sepolia } from 'wagmi/chains'
import { multicall, getBalance } from '@wagmi/core'
import axios from "axios";
import { toast } from "react-toastify";
import { FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { AppContext } from "../App";
import * as ENV from "../config/env";
import { ExtendedButton } from "../components/Buttons/Buttons";
import { Card } from "../components/Card/Card";
import ConnectWallet from "../components/ConnectWallet/ConnectWallet";
import NewProjectDialog from "../components/Dialogs/NewProjectDialog";

import { ellipsisAddress, getTokenPriceByAddress, formatNumber, isValidAddress, getCurrentDate } from "../utils/methods";

import tokenABI from "../abi/ERC20.json";
import TopBar from "../components/TopBar/TopBar";
import copy from "copy-to-clipboard";
import { Contract, ethers, formatUnits } from "ethers";
import { useEthersProvider } from "../utils/provider";

export default function MyAccountPage() {
  const {
    loadAllProjects,
    projects,
    currentProject,
    setCurrentProject,
    sigData,
    signingData,
  } = useContext(AppContext);

  const chainId = useChainId();
  const network = chainId === 1 ? mainnet : sepolia
  const multicallConfig = createConfig({
    chains: [network],
    transports: {
      [chainId]: http(chainId === 1 ? import.meta.env.VITE_ETH_RPC : import.meta.env.VITE_SEPOLIA_RPC),
    },
  })

  const config = useConfig();
  const navigate = useNavigate();
  const { isConnected, address, connector } = useAccount();

  const [newProjectDialog, setNewProjectDialog] = useState(false);
  const [walletDashBalance, setWalletDashBalance] = useState(0);
  const [dashPrice, setDashPrice] = useState(0);
  const [nameSymbols, setNameSymbols] = useState(null)

  const [dashAddress, setDashAddress] = useState("0x0000000000000000000000000");
  const [totalSupply, setTotalSupply] = useState(0);
  const [holderCount, setHolderCount] = useState(0);
  const [marketCap, setMarketCap] = useState(0);

  const provider = useEthersProvider({ chainId });

  useEffect(() => {
    setDashAddress(chainId === 1 ? import.meta.env.VITE_MAINNET_BUNDLE_IO_TOKEN : import.meta.env.VITE_SEPOLIA_BUNDLE_IO_TOKEN);
  }, [chainId])

  useEffect(() => {
    console.log(totalSupply, dashPrice);
    setMarketCap(totalSupply * dashPrice);
  }, [totalSupply, dashPrice])

  const handleCreateNewProject = async (
    name,
    address,
    paymentId,
    selfToken
  ) => {
    if (!isConnected) {
      toast.warn("Please connect your wallet.");
      return;
    }
    console.log("Creating new project...", name);
    try {
      const { data } = await axios.post(
        `${ENV.SERVER_URL}/api/v1/project/create`,
        {
          name: name,
          paymentId,
          selfToken,
          chainId,
          address,
          sigData,
          signingData,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log(data);

      return {
        projectId: data.project._id,
        depositWallet: data.project.depositWallet.address,
        projectTokenAmount: data.project.projectTokenAmount,
        expireTime: data.expireTime,
        qrcode: data.project.qrcode,
      };
    } catch (err) {
      return { error: err };
    }
  };

  const handleCheckNewProject = async (projectId) => {
    console.log("Checking new project...", projectId);
    try {
      const { data } = await axios.post(
        `${ENV.SERVER_URL}/api/v1/project/check-status`,
        {
          projectId,
          sigData,
          signingData,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (data.success) {
        return {
          activated: true,
        };
      } else {
        return {
          expired: data.expired,
          expireTime: data.expireTime,
        };
      }
    } catch (err) {
      return { error: err };
    }
  };

  const handleDoneCreatingNewProject = () => {
    setNewProjectDialog(false);
    loadAllProjects();
  };

  const onClickNewProjectButton = () => {
    if (!isConnected) {
      toast.warn("Please connect your wallet.");
      return;
    }
    setNewProjectDialog(true);
  };

  const onClickProject = (idx) => {
    if (!isConnected) {
      toast.warn("Please connect your wallet.");
      return;
    }
    if (!projects || projects.length == 0) {
      toast.warn("You have no any projects now. Please create.");
      return;
    }
    if (projects.length <= idx) {
      toast.warn(
        "Something wrong in project selection. Please refresh and try again."
      );
      return;
    }
    setCurrentProject(projects[idx]);
    navigate("/dashboard");
  };

  const getDashBalance = async () => {
    if (chainId == 1 || chainId == 11155111) {
      const tokenAddress =
        chainId == 1
          ? import.meta.env.VITE_MAINNET_BUNDLE_IO_TOKEN
          : import.meta.env.VITE_SEPOLIA_BUNDLE_IO_TOKEN;
      console.log(tokenAddress);
      const _balance = await getBalance(config, {
        address: address,
        token: tokenAddress,
      });
      setWalletDashBalance(_balance);

      const price = await getTokenPriceByAddress(tokenAddress);
      setDashPrice(price?.usdPrice);
    }
  };

  useEffect(() => {
    if (isConnected) {
      getDashBalance();
      getHolderCount(dashAddress);
      getTotalSupply(dashAddress);
    }
  }, [chainId, dashAddress]);

  const getNameAndSymbols = async () => {
    if (isConnected && projects && projects.length > 0) {
      let contracts = []
      let addresses = []
      projects.map((_p) => {
        if (isValidAddress(_p.token.address)) {
          addresses.push(_p.token.address)
          contracts.push({
            address: _p.token.address,
            abi: tokenABI,
            functionName: "name",
          })
          contracts.push({
            address: _p.token.address,
            abi: tokenABI,
            functionName: "symbol",
          })
        }
      })
      if (contracts.length > 0) {
        const _data = await multicall(multicallConfig, {
          contracts
        })
        let tmp = {}
        for (let i = 0; i < contracts.length; i += 2) {
          const name = _data[i].status === "success" ? _data[i].result : ""
          const symbol = _data[i + 1].status === "success" ? _data[i + 1].result : ""
          tmp = {
            ...tmp,
            [addresses[i / 2]]: { name, symbol }
          }
        }
        setNameSymbols(tmp)
      }
    }
  }

  useEffect(() => {
    if (currentProject && Object.keys(currentProject).length > 0) {
      navigate('/dashboard')
    }
  }, [currentProject])

  useEffect(() => {
    getNameAndSymbols()
  }, [projects])

  const handleCopyPublicKey = () => {
    if (dashAddress) {
      copy(dashAddress);
    }
  };

  const handleOpenDexScreener = () => {
    if (ethers.isAddress(dashAddress)) {
      window.open(
        `https://dexscreener.com/ethereum/${dashAddress}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  const handleOpenEtherscan = () => {
    if (ethers.isAddress(dashAddress)) {
      window.open(
        `https://etherscan.io/address/${dashAddress}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  const handleVisitDASHGitbook = () => {
    window.open(
      `https://dash-developer-tools.gitbook.io/dash_developer_tools`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  const getTotalSupply = async (contractAddress) => {
    try {
      const contract = new Contract(contractAddress, tokenABI, provider);
      const totalSupply = await contract.totalSupply();
      const decimals = await contract.decimals();
      console.log(totalSupply, decimals.toString())
      setTotalSupply(parseFloat(formatUnits(totalSupply, parseInt(decimals.toString()))));
    } catch (error) {
      console.log(error);
      return;
    }
  }

  const getHolderCount = async (contractAddress) => {
    const apiKey = import.meta.env.VITE_BITQUERY_API_KEY
    const accessToken = import.meta.env.VITE_BITQUERY_ACCESS_TOKEN;

    console.log(contractAddress)
    let data = JSON.stringify({
      "query": `{\n  EVM(dataset: archive, network: eth) {\n    TokenHolders(\n      date: \"${getCurrentDate()}\"\n      tokenSmartContract: \"${contractAddress}\"\n      where: {Balance: {Amount: {gt: \"0\"}}}\n    ) {\n      uniq(of: Holder_Address)\n    }\n  }\n}`,
      "variables": "{}"
    });

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://streaming.bitquery.io/graphql',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
        'Authorization': `Bearer ${accessToken}`
      },
      data: data
    };
    try {
      const response = await axios.request(config)
      console.log(response);
      const holderCount = response.data.data.EVM.TokenHolders[0].uniq;
      setHolderCount(holderCount);
      console.log(`Holder Count: ${holderCount}`);
    } catch (error) {
      console.error('Error fetching holder count:', error);
    }
  }

  return (
    <div className="w-screen h-screen flex flex-col max-[1800px]:items-start items-center overflow-auto">
      <div className="flex flex-col mx-6 pt-3 my-3">
        <TopBar noProject={true} />
        <div className="flex flex-col mt-12">
          <div className="mb-6 flex gap-24 items-center justify-between">
            <div className="flex gap-20 items-center">
              <div className="flex gap-4 items-center">
                <div className="flex gap-2 items-center">
                  <img className="w-8 h-8 rounded-full border border-solid border-gray-border py-2 px-1" src="/assets/img/mark.png" alt="dash" />
                  <span className="text-white font-conthrax font-semibold text-xl">Meme Tools Token</span> :
                  <span className="flex items-center gap-1 rounded-md bg-white/10 text-white p-2">
                    {ellipsisAddress(dashAddress, true)}
                    <img
                      className="w-4 h-4 active:scale-95 hover:scale-110 transition duration-100 ease-in-out transform cursor-pointer"
                      src="/assets/icon/ic_copy.svg"
                      alt="copy"
                      onClick={handleCopyPublicKey}
                    />
                  </span>
                </div>
                <div className="flex gap-4 items-center">
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
              </div>
              <div className="flex gap-8 items-center">
                <div className="flex gap-2 items-center">
                  <span className="text-xxs">Price:</span>
                  <span className="font-semibold font-conthrax text-xs">{dashPrice?.toFixed(6) ? dashPrice?.toFixed(6) : 0}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-xxs">Market Cap:</span>
                  <span className="font-semibold font-conthrax text-xs">${formatNumber(marketCap)}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-xxs">Holders:</span>
                  <span className="font-semibold font-conthrax text-xs">{holderCount}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              {/* <button
                className={`text-xs font-medium text-center text-white px-6 py-2.5 rounded-lg justify-center items-center gap-2.5 bg-gradient-to-br from-[#4B65F1ED] to-[#FA03FF44] active:scale-95 transition duration-100 ease-in-out transform focus:outline-none disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed`}
                onClick={handleVisitDASHGitbook}>
                Visit DASH Gitbook
              </button> */}
              {projects.length == 0 &&
                <button
                  className={`text-xs font-medium text-center text-white uppercase px-6 py-2.5 rounded-lg justify-center items-center gap-2.5 bg-gradient-to-br from-[#4B65F1ED] to-[#FA03FF44] active:scale-95 transition duration-100 ease-in-out transform focus:outline-none disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed`}
                  onClick={onClickNewProjectButton}>
                  Create New Project
                </button>
              }
            </div>
          </div>
          <div className="">
            <table className="w-full text-left">
              <thead className="sticky top-0 inter-500 bg-slate-700">
                <tr className="text-sm">
                  <th scope="col" className="px-3 py-3">
                    Owner
                  </th>
                  <th scope="col" className="px-3 py-3">
                    Project Name
                  </th>
                  <th scope="col" className="px-3 py-3">
                    Project Type
                  </th>
                  <th scope="col" className="px-3 py-3">
                    Token Name
                  </th>
                  <th scope="col" className="px-3 py-3">
                    Token Symbol
                  </th>
                  <th scope="col" className="px-3 py-3">
                    Token Address
                  </th>
                  <th scope="col" className="px-3 py-3">
                    Created Time
                  </th>
                  <th scope="col" className="px-3 py-3">
                  </th>
                </tr>
              </thead>
              <tbody>
                {projects &&
                  projects.map((_v, _i) => {
                    return (
                      <tr
                        key={"table" + _i}
                        className={`text-sm ${_i % 2 == 0 ? "bg-gray-dark/10" : "bg-gray-normal/10"}`}
                      >
                        <td className="px-3 py-2">
                          {ellipsisAddress(_v?.userName)}
                        </td>
                        <td className="px-3 py-2">{_v?.name}</td>
                        <td className="px-3 py-2 uppercase !text-xxs text-white w-fit">
                          {_v?.paymentId === 0 && "New Account"}
                          {_v?.paymentId === 1 && "Bundler Package 1"}
                          {_v?.paymentId === 2 && "Bundler Package 2"}
                          {_v?.paymentId === 3 && "Bundler Package 3"}
                        </td>
                        <td className="px-3 py-2">{nameSymbols && nameSymbols[_v?.token?.address] ? nameSymbols[_v?.token?.address].name : ""}</td>
                        <td className="px-3 py-2">{nameSymbols && nameSymbols[_v?.token?.address] ? nameSymbols[_v?.token?.address].symbol : ""}</td>
                        <td className="px-3 py-2">
                          {ellipsisAddress(_v?.token?.address, true)}
                        </td>
                        <td className="px-3 py-2">{new Date(_v?.timestamp).toLocaleString()}</td>
                        <td className="pl-3 py-2">
                          <div className="w-full h-full rounded-md bg-gradient-blue-to-purple p-px active:scale-95 cursor-pointer">
                            <div
                              className="w-full h-full rounded-md bg-black flex justify-center items-center p-2"
                              onClick={() => onClickProject(_i)}
                            >
                              Go To Project
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
        <NewProjectDialog
          isOpen={newProjectDialog}
          createProject={handleCreateNewProject}
          checkProject={handleCheckNewProject}
          onDone={handleDoneCreatingNewProject}
          onCancel={() => setNewProjectDialog(false)}
          initialData={{ step: -1, projectName: "" }}
        />
      </div>
    </div>
  );
}
