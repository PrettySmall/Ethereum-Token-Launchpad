/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useContext, useState, useEffect } from 'react'
import { toast } from "react-toastify";
import { useAccount, useChainId } from "wagmi";
import axios from 'axios'

import { AppContext } from "../../App";
import { dashboardContext } from "../../pages/Dashboard";
import { ExtendedButton, DefaultButton, GradientButton, RoundedButton } from "../Buttons/Buttons";
import { HorizontalDivider } from "../Dividers/Dividers";
import { Input1, Input2 } from "../Inputs/Inputs";

import { ellipsisAddress, isValidAddress } from "../../utils/methods"
import { RxUpdate } from 'react-icons/rx';
import ConfirmDialog from '../Dialogs/ConfirmDialog';

const WalletManagement = ({ className, ref }) => {

  const chainId = useChainId();
  const { isConnected } = useAccount();

  const {
    SERVER_URL,
    setLoadingPrompt,
    setOpenLoading,
    currentProject,
    setCurrentProject,
    walletBalanceData,
    additionalWalletBalanceData,
    activeTokenAddress,
    setRefresh,
    executedStatus,
    setExecutedStatus,
    sigData,
    signingData,
    refresh,
    notifyStatus,
    tokenInfo
  } = useContext(AppContext);

  const { enable100Wallet, walletActiveTokenBalanceData, additionalWalletActiveTokenBalanceData } = useContext(dashboardContext);

  const [activeWallet, setActiveWallet] = useState({})
  const [toggleToken, setToggleToken] = useState(false)
  const [toggleSendReceive, setToggleSendReceive] = useState(false)
  const [toggleDropdown, setToggleDropdown] = useState(false)
  const [walletEthBalance, setWalletEthBalance] = useState([]);
  const [walletTokenBalance, setWalletTokenBalance] = useState([]);
  const [additionalWalletEthBalance, setAdditionalWalletEthBalance] = useState([]);
  const [additionalWalletTokenBalance, setAdditionalWalletTokenBalance] = useState([]);

  const [inputWalletAddress, setInputWalletAddress] = useState("")

  const [inputAmount, setInputAmount] = useState({})
  const [activeWalletAmount, setActiveWalletAmount] = useState(0)
  const [walletToIndex, setWalletToIndex] = useState({})
  const [additionalWalletToIndex, setAdditionalWalletToIndex] = useState({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [isMainWallet, setIsMainWallet] = useState(true);

  const [showConfirmDailog, setShowConfirmDialog] = useState(false);
  const [confirmDialogMessage, setConfirmDialogMessage] = useState("");
  const [removeTargetWalletAddress, setRemoveTargetWalletAddress] = useState("");

  useEffect(() => {
    if (currentProject.wallets && currentProject.wallets.length > 0) setActiveWallet(currentProject.wallets[0])
    setIsMainWallet(true);
  }, [currentProject.wallets]);

  useEffect(() => {
    if (notifyStatus.tag === "TRANSFER_COMPLETED") {
      if (notifyStatus.success) {
        toast.success("Transfer success");
        setExecutedStatus({ success: true });
      }
      else
        toast.warn("Failed to transfer");

      setIsExecuting(false);
      setRefresh(!refresh)
      // setNotifyStatus({ success: true, tag: "NONE" });
    }
  }, [notifyStatus, currentProject._id]);

  useEffect(() => {
    if (currentProject.wallets && currentProject.wallets.length > 0) {
      let zeroArray = currentProject.wallets.map((_w) => { return "0" })
      setWalletEthBalance(zeroArray);
      setWalletTokenBalance(zeroArray);

      let _walletToIndex = {}
      currentProject.wallets.map((_w, _idx) => { _walletToIndex[_w.address] = _idx })
      setWalletToIndex(_walletToIndex)
    }
    else {
      setWalletEthBalance([]);
      setWalletTokenBalance([]);
      setWalletToIndex({})
    }
  }, [currentProject.wallets, currentProject.token]);

  useEffect(() => {
    if (currentProject.additionalWallets) {
      let zeroArray = currentProject.additionalWallets.map((_w) => { return "0" })
      setAdditionalWalletEthBalance(zeroArray);
      setAdditionalWalletTokenBalance(zeroArray);

      let _additionalWalletToIndex = {}
      currentProject.additionalWallets.map((_w, _idx) => { _additionalWalletToIndex[_w.address] = _idx })
      setAdditionalWalletToIndex(_additionalWalletToIndex)
    }
    else {
      setAdditionalWalletEthBalance([]);
      setAdditionalWalletTokenBalance([]);
      setAdditionalWalletToIndex({})
    }
  }, [currentProject.additionalWallets, currentProject.token]);

  useEffect(() => {
    if (walletActiveTokenBalanceData.length === walletTokenBalance.length) {
      let activeWalletIdx = -1
      if (isMainWallet) {
        currentProject.wallets?.map((_w, idx) => {
          if (_w.address === activeWallet.address) activeWalletIdx = idx
        })
      } else {
        currentProject.additionalWallets?.map((_v, _i) => {
          if (_v.address == activeWallet.address) activeWalletIdx = _i
        })
      }
      if (activeWalletIdx > -1) {
        if (isMainWallet) {
          setAdditionalWalletTokenBalance(additionalWalletActiveTokenBalanceData)
          let _tokenBalanceData = [...walletActiveTokenBalanceData]
          const tmp = _tokenBalanceData[activeWalletIdx]
          _tokenBalanceData.splice(activeWalletIdx, 1)
          _tokenBalanceData.unshift(tmp)
          setWalletTokenBalance(_tokenBalanceData);
        } else {
          setWalletTokenBalance(walletActiveTokenBalanceData);
          let _additionalTokenBalanceData = [...additionalWalletActiveTokenBalanceData]
          const tmp = _additionalTokenBalanceData[activeWalletIdx]
          _additionalTokenBalanceData.splice(activeWalletIdx, 1)
          _additionalTokenBalanceData.unshift(tmp);
          setAdditionalWalletTokenBalance(_additionalTokenBalanceData);
        }
      }
    }
  }, [activeTokenAddress, walletActiveTokenBalanceData, additionalWalletActiveTokenBalanceData, activeWallet.address]);

  useEffect(() => {
    if (walletBalanceData.eth.length === walletEthBalance.length) {
      let activeWalletIdx = -1
      if (isMainWallet) {
        currentProject.wallets?.map((_w, idx) => {
          if (_w.address === activeWallet.address) activeWalletIdx = idx
        })
      } else {
        currentProject.additionalWallets?.map((_v, _i) => {
          if (_v.address == activeWallet.address) activeWalletIdx = _i
        })
      }
      if (activeWalletIdx > -1) {
        if (isMainWallet) {
          setAdditionalWalletEthBalance(additionalWalletBalanceData.eth)
          let _ethBalanceData = [...walletBalanceData.eth]
          const tmp = _ethBalanceData[activeWalletIdx]
          _ethBalanceData.splice(activeWalletIdx, 1)
          _ethBalanceData.unshift(tmp)
          setWalletEthBalance(_ethBalanceData);
        } else {
          setWalletEthBalance(walletBalanceData.eth);
          let _additionalEthBalanceData = [...additionalWalletBalanceData.eth]
          const tmp = _additionalEthBalanceData[activeWalletIdx]
          _additionalEthBalanceData.splice(activeWalletIdx, 1)
          _additionalEthBalanceData.unshift(tmp);
          setAdditionalWalletEthBalance(_additionalEthBalanceData);
        }
      }
    }
  }, [activeTokenAddress, walletBalanceData.address, walletBalanceData.eth, walletEthBalance.length, additionalWalletBalanceData.address, additionalWalletBalanceData.eth, additionalWalletEthBalance.length, activeWallet.address]);

  useEffect(() => {
    let total = 0
    Object.keys(inputAmount).map((addr) => {
      if (inputAmount[addr] && inputAmount[addr] !== "") total += Number(inputAmount[addr])
    })
    setActiveWalletAmount(total)
  }, [inputAmount])

  useEffect(() => {
    async function add100Wallets() {
      if (enable100Wallet) {
        if (currentProject.wallets.length < 100) {
          setLoadingPrompt("Adding an additilnal wallet...");
          setOpenLoading(true);
          try {
            const { data } = await axios.post(`${SERVER_URL}/api/v1/project/add-100-wallets`,
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
            if (data.success) {
              toast.success("Added an additional wallet successfully.")
              setCurrentProject(data.project)
            }
            else toast.warn(data.error)
          } catch (err) {
            console.log(err);
            toast.warn("Failed to adding an additional wallet!")
          }
          setOpenLoading(false);
        }
      }
    }
    add100Wallets()
  }, [enable100Wallet])

  useEffect(() => {
    if (executedStatus.success) {
      let emptyInputAmount = {}
      Object.keys(inputAmount).map((key) => {
        emptyInputAmount = {
          ...emptyInputAmount,
          [key]: ""
        }
      })
      setInputAmount(emptyInputAmount)

      setExecutedStatus({ success: false })
    }
  }, [executedStatus])

  useEffect(() => {
    let emptyInputAmount = {}
    Object.keys(inputAmount).map((key) => {
      emptyInputAmount = {
        ...emptyInputAmount,
        [key]: ""
      }
    })
    setInputAmount(emptyInputAmount)
  }, [toggleSendReceive, toggleToken])

  const addAdditionalWallet = async () => {
    if (!currentProject._id) {
      toast.warn("Select the project");
      return;
    }
    if (inputWalletAddress.trim().length === 0) {
      toast.warn(`Please enter the value!`);
      return
    }
    if (!isValidAddress(inputWalletAddress)) {
      toast.warn(`${inputWalletAddress} is invalid address!`);
      return
    }
    setLoadingPrompt("Adding an additilnal wallet...");
    setOpenLoading(true);
    try {
      const { data } = await axios.post(`${SERVER_URL}/api/v1/project/add-additional-wallet`,
        {
          projectId: currentProject._id,
          address: inputWalletAddress.trim(),
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
        toast.success("Added an additional wallet successfully.")
        setCurrentProject(data.project)
        setInputWalletAddress("")
      }
      else toast.warn(data.error)
    } catch (err) {
      console.log(err);
      toast.warn("Failed to adding an additional wallet!")
    }
    setOpenLoading(false);
  }

  const removeAdditionalWallet = async () => {
    setShowConfirmDialog(false)

    if (!currentProject._id) {
      toast.warn("Select the project");
      return;
    }

    if (removeTargetWalletAddress.trim().length === 0) {
      toast.warn(`Please enter the value!`);
      return
    }

    if (!isValidAddress(removeTargetWalletAddress)) {
      toast.warn(`${removeTargetWalletAddress} is invalid address!`);
      return
    }

    setLoadingPrompt("Removing an additilnal wallet...");
    setOpenLoading(true);
    try {
      const { data } = await axios.post(`${SERVER_URL}/api/v1/project/remove-additional-wallet`,
        {
          projectId: currentProject._id,
          address: removeTargetWalletAddress,
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
        toast.success("An additional wallet removed successfully.")
        setCurrentProject(data.project)
      }
      else toast.warn(data.error)
    } catch (err) {
      console.log(err);
      toast.warn("Failed to removing an additional wallet!")
    }
    setOpenLoading(false);
  }

  const handleRemoveWallet = (address) => {
    setRemoveTargetWalletAddress(address);
    setConfirmDialogMessage(`Do you really want to remove ${address} wallet?`);
    setShowConfirmDialog(true);
  }

  const onChangeInputAmount = (e, address) => {
    if (!isNaN(Number(e.target.value))) {
      if (/^0+\.\d*$/.test(e.target.value)) {
        setInputAmount({
          ...inputAmount,
          [address]: e.target.value.replace(/^0+(\.\d+)$/, '0$1')
        })
      } else if (/^0\d+$/.test(e.target.value)) {
        setInputAmount({
          ...inputAmount,
          [address]: e.target.value.replace(/^0+/, '')
        })
      } else {
        setInputAmount({
          ...inputAmount,
          [address]: e.target.value
        })
      }
    } else {
      setInputAmount({
        ...inputAmount,
        [address]: ""
      })
    }
  }

  const setInputMax = (value, address) => {
    if (!isNaN(Number(value))) {
      if (/^0+\.\d*$/.test(value)) {
        setInputAmount({
          ...inputAmount,
          [address]: value.replace(/^0+(\.\d+)$/, '0$1')
        })
      } else if (/^0\d+$/.test(value)) {
        setInputAmount({
          ...inputAmount,
          [address]: value.replace(/^0+/, '')
        })
      } else {
        setInputAmount({
          ...inputAmount,
          [address]: value
        })
      }
    } else {
      setInputAmount({
        ...inputAmount,
        [address]: ""
      })
    }
  }

  const onExecute = async () => {
    if (!isConnected) {
      toast.warn("Connect your wallet!")
      return;
    }
    if (activeWalletAmount === 0) {
      toast.warn("Please enter the amount.")
      return
    }
    // setLoadingPrompt(`Executing an ${toggleToken ? "ETH" : tokenInfo.symbol} ${toggleSendReceive ? "Receive" : "Send"} action...`);
    console.log(`Executing an ${toggleToken ? "ETH" : tokenInfo.symbol} ${toggleSendReceive ? "Receive" : "Send"} action...`)
    // setOpenLoading(true);
    setIsExecuting(true);

    let _inputAmount = {}
    try {
      const addresses = Object.keys(inputAmount)
      for (let i = 0; i < addresses.length; i++) {
        if (Number(inputAmount[addresses[i]]) > 0) {
          _inputAmount[addresses[i]] = Number(inputAmount[addresses[i]])
        }
      }
      const { data } = await axios.post(`${SERVER_URL}/api/v1/project/execute-send-receive`,
        {
          projectId: currentProject._id,
          action: toggleSendReceive ? "receive" : "send",
          currency: toggleToken ? "0x0000000000000000000000000000000000000000" : tokenInfo.address,
          src: activeWallet.address,
          dest: _inputAmount,
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

      if (data.success === false) {
        // setOpenLoading (false)
      }
    } catch (err) {
      console.log(err);
      toast.warn("Failed to executing actions!")
    }
    setIsExecuting(false);
  }

  const copyToClipboard = async (key, text) => {
    if ('clipboard' in navigator) {
      await navigator.clipboard.writeText(text);
      toast.success("Copied");
    }
    else
      console.error('Clipboard not supported');
  };

  const handleOpenBlockExplorer = (address) => {
    const url = `https://etherscan.io/address/${address}`
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={`h-full container !bg-[#88888826] p-3 flex flex-col gap-3`} ref={ref}>
      <ConfirmDialog
        isOpen={showConfirmDailog}
        title={"Remove Additional Wallet"}
        message={confirmDialogMessage}
        onOK={removeAdditionalWallet}
        onCancel={() => setShowConfirmDialog(false)}
      />
      <div className="flex justify-between gap-3">
        <div className="flex flex-col justify-between">
          <div className="flex items-center text-sm font-medium gap-2">
            Wallet Management <div className='cursor-pointer hover:scale-110 active:scale-90 text-xs' onClick={() => setRefresh(true)}><RxUpdate /></div>
          </div>
          <div className="mr-4 z-20 relative h-8 rounded-full border border-solid border-gray-border flex items-center">
            <DefaultButton className={`w-[50%] h-full gap-2 rounded-full lg:rounded-large px-2 py-1 border-none ${toggleToken && 'hover:bg-gray-highlight'}`} onClick={() => setToggleToken(false)}>
              <img
                src={tokenInfo.logo ? tokenInfo.logo : "/assets/icon/ic_question.svg"}
                className="w-4 h-4 rounded-full"
                alt="token-logo"
              />
              <span className="hidden lg:block">{tokenInfo.symbol ? tokenInfo.symbol : "???"}</span>
            </DefaultButton>
            <DefaultButton className={`w-[50%] h-full gap-2 rounded-full lg:rounded-large px-2 py-1 border-none ${!toggleToken && 'hover:bg-gray-highlight'}`} onClick={() => setToggleToken(true)}>
              <img
                src="/assets/icon/ic_ether.png"
                className="w-4 h-4 rounded-full"
                alt="ether-logo"
              />
              <span className="hidden lg:block">ETH</span>
            </DefaultButton>
            <div className={`absolute -z-20 translate-x-0 ${toggleToken && 'translate-x-full'} bg-gradient-blue-to-purple w-[50%] h-full p-px rounded-full`}>
              <div className='w-full h-full inward-shadow-box rounded-full' />
            </div>
          </div>
        </div>
        <div className="flex">
          <div className="grid grid-cols-2 justify-between gap-1 mr-4">
            {/* <div className="grid grid-cols-2 justify-between gap-2"> */}
            <div className='col-span-2 p-px flex rounded-lg border border-solid border-gray-border gap-px'>
              <div className={`${!toggleSendReceive ? "bg-gradient-blue-to-purple" : ""} w-[50%] rounded-md p-[1px]`}>
                <ExtendedButton className={`${!toggleSendReceive ? "bg-black/50" : "bg-transparent hover:bg-gray-highlight"} !h-full w-full`} onClick={() => setToggleSendReceive(false)}>Send</ExtendedButton>
              </div>
              <div className={`${toggleSendReceive ? "bg-gradient-blue-to-purple" : ""} w-[50%] rounded-md p-[1px]`}>
                <ExtendedButton className={`${toggleSendReceive ? "bg-black/50" : "bg-transparent hover:bg-gray-highlight"} !h-full w-full`} onClick={() => setToggleSendReceive(true)}>Receive</ExtendedButton>
              </div>
            </div>
            {/* </div> */}
            <ExtendedButton className="col-span-2 !h-full bg-gradient-blue-to-purple hover:brightness-125 text-black text-xs border-0 gap-1" onClick={onExecute} disabled={isExecuting}>
              Execute
              {isExecuting && (
                <div role="status gap-1">
                  <svg
                    aria-hidden="true"
                    className="inline w-4 h-4 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                    viewBox="0 0 100 101"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                      fill="#FFFFFF"
                    />
                    <path
                      d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                      fill="#4B65FF"
                    />
                  </svg>
                  <span className="sr-only">Loading...</span>
                </div>
              )}
            </ExtendedButton>
          </div>
          <div className="!w-[160px] container !rounded-[8px] !bg-black-dark py-1 px-2 flex flex-col gap-0.5">
            <div className='relative'>
              <div className="h-5 flex items-center justify-between cursor-pointer" onClick={() => setToggleDropdown(!toggleDropdown)}>
                <div>
                  {isMainWallet ?
                    <span>{`${walletToIndex[activeWallet.address] !== undefined ? walletToIndex[activeWallet.address] + 1 : 1} ➤ `}</span> :
                    <span className='text-green-normal'>{`EXT: ${additionalWalletToIndex[activeWallet.address] !== undefined ? additionalWalletToIndex[activeWallet.address] + 1 : 1} ➤ `}</span>
                  }
                  <span className='hover:underline active:text-gray-dead cursor-pointer' onClick={() => copyToClipboard("wallet_address", activeWallet?.address)}>
                    {`${activeWallet && activeWallet.address ? ellipsisAddress(activeWallet.address, false) : "???"}`}
                  </span>
                </div>
                <img src="/assets/icon/ic_arrow_down.svg" width={8} alt="arrow-logo" />
              </div>
              <div className={`${toggleDropdown ? "block" : "hidden"} absolute right-0 z-10 mt-0 origin-top-right rounded-md bg-gray-600 w-fit bg-container-secondary`}>
                <div className="py-1 h-48 overflow-y-auto" role="none">
                  {
                    currentProject.additionalWallets && currentProject.additionalWallets.filter((v) => v.address != activeWallet.address).map((_w, _i) => {
                      return (
                        <div
                          className="text-gray-300 px-4 py-2 flex flex-row items-center justify-between cursor-pointer truncate hover:bg-slate-500"
                          key={`EXT${_i}`} role="menuitem"
                          onClick={() => { setToggleDropdown(false); setActiveWallet(_w); setIsMainWallet(false) }}
                        >
                          {`EXT:${additionalWalletToIndex[_w.address] + 1}. ${ellipsisAddress(_w.address, false)} = ${toggleToken ? additionalWalletEthBalance[isMainWallet ? _i : _i + 1] : additionalWalletTokenBalance[isMainWallet ? _i : _i + 1]}`}
                        </div>
                      )
                    })
                  }
                  {
                    enable100Wallet ?
                      currentProject.wallets && currentProject.wallets.length > 0 && currentProject.wallets.filter((v) => v.address != activeWallet.address).map((_w, idx) => {
                        return (
                          <div
                            className="w-full text-gray-300 px-4 py-2 flex items-center justify-between cursor-pointer truncate hover:bg-slate-500"
                            key={idx} role="menuitem"
                            onClick={() => { setToggleDropdown(false); setActiveWallet(_w); setIsMainWallet(true) }}
                          >
                            {`${walletToIndex[_w.address] + 1}. ${ellipsisAddress(_w.address, false)} = ${toggleToken ? walletEthBalance[isMainWallet ? idx + 1 : idx] : walletTokenBalance[isMainWallet ? idx + 1 : idx]}`}
                          </div>
                        )
                      }) :
                      currentProject.wallets && currentProject.wallets.length > 0 && currentProject.wallets?.slice(0, 24).filter((v) => v.address != activeWallet.address).map((_w, idx) => {
                        return (
                          <div
                            className="text-gray-300 px-4 py-2 flex flex-row items-center justify-between cursor-pointer truncate hover:bg-slate-500"
                            key={idx} role="menuitem"
                            onClick={() => { setToggleDropdown(false); setActiveWallet(_w); setIsMainWallet(true) }}
                          >
                            {`${walletToIndex[_w.address] + 1}. ${ellipsisAddress(_w.address, false)} = ${toggleToken ? walletEthBalance[isMainWallet ? idx + 1 : idx] : walletTokenBalance[isMainWallet ? idx + 1 : idx]}`}
                          </div>
                        )
                      })
                  }
                </div>
              </div>
            </div>
            <div className='flex justify-between items-center gap-0.5'>
              <Input1 className={"w-[80%] grow"} type="number" disabled={true} value={activeWalletAmount} onChange={() => { }} />
              <img className='w-4 h-4 hover:scale-105 active:scale-95 cursor-pointer' src='/assets/icon/ic_goto.svg' alt='goto' onClick={() => handleOpenBlockExplorer(activeWallet?.address)} />
            </div>
            <div className="flex gap-0.5">
              {/* Balance: */}
              <span className='font-semibold'>{isMainWallet ? (currentProject.wallets && currentProject.wallets.length > 0 ? toggleToken ? walletEthBalance[0] : walletTokenBalance[0] : "???") : (currentProject.additionalWallets && currentProject.additionalWallets.length > 0 ? toggleToken ? additionalWalletEthBalance[0] : additionalWalletTokenBalance[0] : "???")}</span>
            </div>
          </div>
          {/* <ExtendedButton className="button-bg-gradient !px-6 !h-full font-16">
            Execute
          </ExtendedButton> */}
        </div>
      </div>
      <HorizontalDivider />
      <div className="grid grid-cols-4 gap-1.5 overflow-y-auto">
        <div className="col-span-2 container !rounded-[8px] !bg-black-dark py-1 px-1.5 flex gap-1.5">
          <div className="flex flex-col grow gap-1.5 justify-center">
            <div className="text-xs text-left">Wallet address</div>
            <Input2 placeholder={"Add external address..."} value={inputWalletAddress} onChange={(e) => setInputWalletAddress(e.target.value)} />
          </div>
          <div className='bg-gradient-blue-to-purple rounded-md p-[1px]'>
            <ExtendedButton className="!bg-gray-weight grow-0 !h-full hover:brightness-150" onClick={addAdditionalWallet}>Add +</ExtendedButton>
          </div>
        </div>
        {
          currentProject.additionalWallets && currentProject.additionalWallets && activeWallet.address &&
          currentProject.additionalWallets.filter(_w => _w.address !== activeWallet.address).map((_w, _i) => {
            const index = additionalWalletToIndex[_w.address] !== undefined ? additionalWalletToIndex[_w.address] : 0;
            return (
              <div className="shrink container !rounded-[8px] !bg-black-dark py-1 px-1.5 flex flex-col gap-1" key={`additional-wallet-${_i}`}>
                <div className="overflow-hidden text-nowrap overflow-ellipsis text-left">
                  <span className='text-green-normal'>{`EXT: ${index + 1} ➤ `}</span>
                  <span className='hover:underline active:text-gray-dead cursor-pointer' onClick={() => copyToClipboard("wallet_address", _w.address)}>
                    {`${ellipsisAddress(_w.address, false)}`}
                  </span>
                </div>
                <div className='flex justify-between items-center gap-0.5'>
                  <Input1 disabled={toggleSendReceive} className={'w-[80%] grow'} placeholder="0.0" type="text" value={inputAmount[_w.address]} onChange={(e) => onChangeInputAmount(e, _w.address)} />
                  <img className='w-4 h-4 hover:scale-105 active:scale-95 cursor-pointer' src='/assets/icon/ic_goto.svg' alt='goto' onClick={() => handleOpenBlockExplorer(_w.address)} />
                </div>
                <div className="flex gap-0.5 items-center justify-between">
                  {/* {"Balance:"} */}
                  <span className='w-[70%] font-semibold truncate text-left'>{toggleToken ? additionalWalletEthBalance[isMainWallet ? _i : _i + 1] : additionalWalletTokenBalance[isMainWallet ? _i : _i + 1]}</span>
                  <button className='px-1 text-red-normal hover:scale-105 active:scale-95' onClick={() => handleRemoveWallet(_w.address)}>REMOVE</button>
                </div>
              </div>
            )
          })
        }
        {
          enable100Wallet && currentProject.wallets && currentProject.wallets.length > 0 && activeWallet.address &&
          currentProject.wallets.filter(_w => _w.address !== activeWallet.address).map((_v, _i) => {
            const index = walletToIndex[_v.address] !== undefined ? walletToIndex[_v.address] : 0;
            return (
              <div key={`wallet-manaege-${_i}`} className="shrink container !rounded-[8px] !bg-black-dark py-1 px-1.5 flex flex-col gap-1">
                <div className="overflow-hidden text-nowrap overflow-ellipsis text-left">
                  <span>{`${index + 1} ➤ `}</span>
                  <span className='hover:underline active:text-gray-dead cursor-pointer' onClick={() => copyToClipboard("wallet_address", _v.address)}>
                    {`${ellipsisAddress(_v.address, false)}`}
                  </span>
                </div>
                <div className='flex justify-between items-center gap-0.5'>
                  <Input1 className={'w-[80%] grow'} placeholder="0.0" type="number" value={inputAmount[_v.address] ? inputAmount[_v.address] : ""} onChange={(e) => onChangeInputAmount(e, _v.address)} />
                  <img className='w-4 h-4 hover:scale-105 active:scale-95 cursor-pointer' src='/assets/icon/ic_goto.svg' alt='goto' onClick={() => handleOpenBlockExplorer(_v.address)} />
                </div>
                <div className="flex gap-0.5 items-center justify-between">
                  {/* Balance: */}
                  <span className='w-[70%] font-semibold truncate text-left'>{toggleToken ? walletEthBalance[isMainWallet ? _i + 1 : _i] : walletTokenBalance[isMainWallet ? _i + 1 : _i]}</span>
                  <button disabled={!toggleSendReceive} className='px-1 text-green-normal hover:scale-105 active:scale-95 disabled:text-gray-normal disabled:hover:scale-100 disabled:active:scale-100' onClick={() => setInputMax(toggleToken ? walletEthBalance[isMainWallet ? _i + 1 : _i] : walletTokenBalance[isMainWallet ? _i + 1 : _i], _v.address)}>MAX</button>
                </div>
              </div>
            );
          })
        }
        {
          !enable100Wallet && currentProject.wallets && currentProject.wallets.length > 0 && activeWallet.address &&
          currentProject.wallets?.slice(0, 24).filter(_w => _w.address !== activeWallet.address).map((_v, _i) => {
            const index = walletToIndex[_v.address] !== undefined ? walletToIndex[_v.address] : 0;
            return (
              <div key={`wallet-manaege-${_i}`} className="shrink container !rounded-[8px] !bg-black-dark py-1 px-1.5 flex flex-col gap-1">
                <div className="overflow-hidden text-nowrap overflow-ellipsis text-left">
                  <span>{`${index + 1} ➤ `}</span>
                  <span className='hover:underline active:text-gray-dead cursor-pointer' onClick={() => copyToClipboard("wallet_address", _v.address)}>
                    {`${ellipsisAddress(_v.address, false)}`}
                  </span>
                </div>
                <div className='flex justify-between items-center gap-0.5'>
                  <Input1 className={'w-[80%] grow'} placeholder="0.0" type="text" value={inputAmount[_v.address]} onChange={(e) => onChangeInputAmount(e, _v.address)} />
                  <img className='w-4 h-4 hover:scale-105 active:scale-95 cursor-pointer' src='/assets/icon/ic_goto.svg' alt='goto' onClick={() => handleOpenBlockExplorer(_v.address)} />
                </div>
                <div className="flex gap-0.5 items-center justify-between">
                  {/* Balance: */}
                  <span className='w-[70%] font-semibold truncate text-left'>{toggleToken ? walletEthBalance[isMainWallet ? _i + 1 : _i] : walletTokenBalance[isMainWallet ? _i + 1 : _i]}</span>
                  <button disabled={!toggleSendReceive} className='px-1 text-green-normal hover:scale-105 active:scale-95 disabled:text-gray-normal disabled:hover:scale-100 disabled:active:scale-100' onClick={() => setInputMax(toggleToken ? walletEthBalance[isMainWallet ? _i + 1 : _i] : walletTokenBalance[isMainWallet ? _i + 1 : _i], _v.address)}>MAX</button>
                </div>
              </div>
            );
          })
        }
      </div>
    </div>
  );
};

export default WalletManagement;
