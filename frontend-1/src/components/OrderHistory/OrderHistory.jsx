/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { HorizontalDivider } from "../Dividers/Dividers";
import "../../index.css";
import { RoundedButton } from "../Buttons/Buttons";
import { dashboardContext } from "../../pages/Dashboard";
import axios from "axios";
import { multicall } from '@wagmi/core'
import { useContext, useEffect, useState, useRef, useCallback } from "react";
import {
  ellipsisAddress,
  formatNumber,
} from "../../utils/methods";
import Web3 from "web3";

import { Alchemy, Network } from "alchemy-sdk";
import { ethers } from "ethers";
import { useChainId, useConfig } from "wagmi";
import { useEthersProvider } from "../../utils/provider";
import tokenABI from "../../abi/ERC20.json";
import UNISWAP_V2_PAIR_ABI from "../../abi/IUniswapV2Pair.json";
import { AppContext } from "../../App";

const web3 = new Web3("https://rpc.mevblocker.io");

const UNISWAP_V2_SUBGRAPH_URL =
  "https://gateway-arbitrum.network.thegraph.com/api/b0413b72fe24079ca30565b014b0c9c9/subgraphs/id/A3Np3RQbaBA6oKJgiwDJeo5T3zrYfGHPWFYayMwtNDum";

function timeAgo(timestamp) {
  const currentTime = Math.floor(Date.now() / 1000);
  const difference = currentTime - timestamp;

  if (difference < 0) {
    return `in ${0 - difference}s`;
  } else if (difference < 60) {
    return `${difference}s ago`;
  } else if (difference < 3600) {
    return `${Math.floor(difference / 60)}m ago`;
  } else if (difference < 86400) {
    return `${Math.floor(difference / 3600)}h ago`;
  } else {
    return `${Math.floor(difference / 86400)}d ago`;
  }
}

const OrderHistory = ({ className }) => {
  const { pairAddress, pairs, selectedPairId } =
    useContext(dashboardContext);

  const { tokenInfo } = useContext(AppContext);

  const [swaps, setSwaps] = useState([]);
  const [skip, setSkip] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sortType, setSortType] = useState("swap");
  const [decimals, setDecimals] = useState([]);
  // const [history, setHistory] = useState([]);
  // const [quoteTokenPrice, setQuoteTokenPrice] = useState();
  const config = useConfig();
  const observer = useRef();
  let history;

  const chainId = useChainId();
  const provider = useEthersProvider(chainId);

  useEffect(() => {
    history = [];
    setSwaps([]);
    const settings = {
      apiKey: "89JnUI6fpzSxLEnQ6GywqNoZfza7zZc9", // Replace with your Alchemy API Key.
      network: Network.ETH_MAINNET, // Replace with your network.
    };

    const alchemy = new Alchemy(settings);
    if (chainId == 1 && pairAddress && pairAddress != "") {
      // getQuoteTokenPrice();

      getTokenDecimals(
        pairs[selectedPairId]?.baseToken?.address,
        pairs[selectedPairId]?.quoteToken?.address
      );
      const pairContract = new web3.eth.Contract(
        UNISWAP_V2_PAIR_ABI,
        pairAddress
      );

      alchemy.ws.on("block", (blockNumber) => {
        pairContract
          .getPastEvents(
            "Swap",
            {
              fromBlock: blockNumber - 4,
              toBlock: blockNumber,
            },
            function (error, events) { }
          )
          .then(function (events) {
            if (events.length > 0) {
              events.map((_event, _index) => {
                console.log(_event)
                const result = {
                  pair: {
                    token0: {
                      symbol: pairs[selectedPairId]?.quoteToken?.symbol,
                    },
                    token1: {
                      symbol: pairs[selectedPairId]?.baseToken?.symbol,
                    },
                  },
                  amount0In: _event?.returnValues?.amount0In,
                  amount0Out: _event?.returnValues?.amount0Out,
                  amount1In: _event?.returnValues?.amount1In,
                  amount1Out: _event?.returnValues?.amount1Out,
                  amountUSD: "0",
                  sender: _event?.returnValues?.sender,
                  to: _event?.returnValues?.to,
                  transaction: {
                    id: _event?.transactionHash,
                    timestamp: "",
                  },
                };

                let findfromSwaps = undefined;
                if (history.length < 100) {
                  findfromSwaps = swaps.find(
                    (value) => value?.transaction.id == _event?.transactionHash
                  );
                }

                const findout = history.find(
                  (value) => value?.transactionHash == _event?.transactionHash
                );

                if (!findout && !findfromSwaps) {
                  // setHistory((prev) => [_event, ...prev]);
                  history.push(_event);
                  addNewTransaction(_event.blockNumber, result);
                }
              });
            }
          });
      });

      getTransactionHistoryUsingSubgraph();
    }

    return () => { };
  }, [pairAddress]);

  useEffect(() => {
    getTransactionHistoryUsingSubgraph();
    // getTransactionUsingBirdeye();
  }, [page]);

  const addNewTransaction = async (blockNumber, result) => {
    let pendings = [];

    const transactionPending = web3.eth.getTransaction(result.transaction.id);
    pendings.push(transactionPending);

    const blockPending = provider.getBlock(blockNumber);
    pendings.push(blockPending);

    const balances = await Promise.all(pendings);

    // const price = balances[0];
    const transaction = balances[0];
    const block = balances[1];

    console.log(transaction)
    result.amount0In = ethers.formatUnits(result.amount0In, decimals[0]);
    result.amount0Out = ethers.formatUnits(result.amount0Out, decimals[0]);
    result.amount1In = ethers.formatUnits(result.amount1In, decimals[1]);
    result.amount1Out = ethers.formatUnits(result.amount1Out, decimals[1]);

    result.sender = transaction?.from;
    result.to = transaction?.to;

    const eth_price =
      parseFloat(pairs[selectedPairId].priceUsd) /
      parseFloat(pairs[selectedPairId].priceNative);

    result.amountUSD = pairs[selectedPairId]?.quoteToken?.symbol == "WETH" ?
      (parseFloat(result.amount0In)
        ? parseFloat(result.amount0In) * eth_price
        : parseFloat(result.amount0Out) * eth_price) :
      (parseFloat(result.amount1In)
        ? parseFloat(result.amount1In) * eth_price
        : parseFloat(result.amount1Out) * eth_price);

    result.transaction.timestamp = block.timestamp;
    setSwaps((prev) => [result, ...prev]);
  };

  const getTokenDecimals = async (tokenAddress1, tokenAddress2) => {
    try {
      const contracts = [
        {
          address: tokenAddress1,
          abi: tokenABI,
          functionName: "decimals",
        },
        {
          address: tokenAddress2,
          abi: tokenABI,
          functionName: "decimals",
        },
      ];
      const _data = await multicall(config, {
        contracts,
      });
      const decimals1 = _data[0].status === "success" ? _data[0].result : "";
      const decimals2 = _data[1].status === "success" ? _data[1].result : "";
      setDecimals([parseInt(decimals1), parseInt(decimals2)]);
    } catch (e) {
      console.log(
        "This chain has no this token. Please check your token address again on this chain."
      );
    }
  };

  const lastElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          setPage((prevPage) => prevPage + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading]
  );

  const getTransactionState = async (txHash) => {
    try {
      const receipt = await web3.eth.getTransactionReceipt(txHash);
      if (receipt) {
        if (receipt.status) {
          return "Completed";
        } else {
          return "Failed";
        }
      } else {
        return "Processing";
      }
    } catch (error) {
      console.error("Error fetching transaction receipt:", error);
      return "Unknown";
    }
  };

  const getTransactionUsingBirdeye = async () => {
    const url = `https://public-api.birdeye.so/defi/txs/pair?address=${pairAddress}&offset=${swaps.length
      }&limit=${25}&tx_type=${sortType}&sort_type=desc`;
    const response = await axios.get(url, {
      headers: {
        "x-chain": "ethereum",
        "X-API-KEY": "a3eda8163adc40128d8beb908de0881c",
      },
    });
    if (response.data.success) {
      setSwaps((prev) => [...prev, ...response.data.data.items]);
    }
  };

  const getTransactionHistoryUsingSubgraph = async () => {
    if (chainId != 1 && pairAddress == "") return;
    setLoading(true);
    const getSwapsQuery = (pairAddress, first, skip) => `
      {
          swaps(first:${first} skip:${skip} orderBy: timestamp, orderDirection: desc, where:
          { pair: "${pairAddress?.toLowerCase()}" }
          ) {
              pair {
                token0 {
                  symbol
                }
                token1 {
                  symbol
                }
              }
              transaction {
                id
                timestamp
              }
              amount0In
              amount0Out
              amount1In
              amount1Out
              amountUSD
              sender
              to
          }
          }
      `;
    const first = 25;
    const query = getSwapsQuery(pairAddress, first, swaps.length);

    const response = await axios.post(UNISWAP_V2_SUBGRAPH_URL, { query });
    if (response?.data?.data?.swaps) {
      const new_swaps = response.data.data.swaps;
      for (const swap of new_swaps) {
        const txHash = swap.transaction.id;
        // getTransactionState(txHash).then((state) => {
        //   swap.state = state;
        //   setSwaps((swaps) => [...swaps]);
        // });
        web3.eth.getTransaction(swap.transaction.id).then((_transaction) => {
          swap.sender = _transaction.from;
          swap.to = _transaction.to;
          setSwaps((swaps) => [...swaps]);
        });
      }
      setSwaps([...swaps, ...new_swaps]);
    }
    setSkip(skip + first);
    setLoading(false);
  };

  const handleOpenEtherscan = (_txHash) => {
    const website_url = `https://etherscan.io/tx/${_txHash}`;
    window.open(website_url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={`w-full h-full flex flex-col gap-1`}>
      <div className="flex flex-col gap-2">
        <div className="font-medium text-sm text-left">
          Order History
        </div>
      </div>
      <div className="overflow-y-auto overflow-x-auto">
        <table className="w-full text-left">
          <thead className="sticky top-0 inter-500 bg-[#2B2E33]">
            <tr>
              <th scope="col" className="px-2 py-1.5 rounded-s-lg">
                Date
              </th>
              <th scope="col" className="px-2 py-1.5 text-nowrap">
                TX Type
              </th>
              <th scope="col" className="px-2 py-1.5 text-nowrap">
                Total USD
              </th>
              <th scope="col" className="px-2 py-1.5 text-nowrap">
                Token Amount
              </th>
              <th scope="col" className="px-2 py-1.5 text-nowrap">
                ETH Amount
              </th>
              <th scope="col" className="px-2 py-1.5">
                Price
              </th>
              <th scope="col" className="px-2 py-1.5">
                Maker
              </th>
              <th scope="col" className="text-right pr-3 py-1.5 rounded-e-lg text-nowrap">
                View TX
              </th>
            </tr>
          </thead>
          <tbody>
            {swaps &&
              swaps.map((_log, _i) => {
                let txType;
                if (_log.pair.token0.symbol == tokenInfo.symbol) {
                  txType = (_log.amount0In == "0" || _log.amount0In == "0.0") ? "Buy" : "Sell";
                } else {
                  txType = (_log.amount1In == "0" || _log.amount1In == "0.0") ? "Buy" : "Sell";
                }
                const tokenAmount = _log.pair.token0.symbol == tokenInfo.symbol ? (txType == "Buy" ? _log.amount0Out : _log.amount0In) : (txType == "Buy" ? _log.amount1Out : _log.amount1In)
                const etherAmount = _log.pair.token0.symbol == tokenInfo.symbol ? (txType == "Buy" ? _log.amount1In : _log.amount1Out) : (txType == "Buy" ? _log.amount0In : _log.amount0Out)
                return (
                  <tr
                    key={_i}
                    className="border-b last:border-none border-white/10"
                    ref={_i === swaps.length - 10 ? lastElementRef : null}
                  >
                    <th
                      scope="row"
                      className="w-12 poppins-regular px-2 py-1 text-white text-nowrap"
                    >
                      {timeAgo(_log.transaction.timestamp)}
                      {/* {ellipsisAddress(_log.owner, false)} */}
                    </th>
                    <td className="poppins-regular px-2 py-1">
                      <div className="flex items-center gap-1">
                        <div
                          className={`w-[5px] h-[5px] rounded-full ${txType == "Transfer"
                            ? "bg-[#E7FF52]"
                            : txType == "Buy"
                              ? "bg-[#52FF8D]"
                              : txType == "Sell"
                                ? "bg-[#fd2929ee]"
                                : "bg-[#FFAF52]"
                            }`}
                        />
                        <div
                          className={`poppins-regular ${txType == "Transfer"
                            ? "text-[#E7FF52]"
                            : txType == "Buy"
                              ? "text-[#52FF8D]"
                              : txType == "Sell"
                                ? "text-[#fd2929ee]"
                                : "text-[#FFAF52]"
                            }`}
                        >
                          {txType}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-1">
                      <div
                        className={`flex items-center gap-2 poppins-regular ${txType == "Transfer"
                          ? "text-[#E7FF52]"
                          : txType == "Buy"
                            ? "text-[#52FF8D]"
                            : txType == "Sell"
                              ? "text-[#fd2929ee]"
                              : "text-[#FFAF52]"
                          }`}
                      >
                        ${formatNumber(_log.amountUSD)}
                      </div>
                    </td>
                    <td className="px-2 py-1">
                      <div
                        className={`flex items-center gap-1 poppins-regular ${txType == "Transfer"
                          ? "text-[#E7FF52]"
                          : txType == "Buy"
                            ? "text-[#52FF8D]"
                            : txType == "Sell"
                              ? "text-[#fd2929ee]"
                              : "text-[#FFAF52]"
                          }`}
                      >
                        <img
                          className="rounded-full"
                          src={
                            tokenInfo.logo && tokenInfo.logo !== ""
                              ? tokenInfo.logo
                              : "/assets/icon/ic_question.png"
                          }
                          width={14}
                          height={14}
                          alt="token_logo"
                        />
                        {formatNumber(tokenAmount)}
                      </div>
                    </td>
                    <td className="px-2 py-1">
                      <div
                        className={`flex items-center text-nowrap gap-1 poppins-regular ${txType == "Transfer"
                          ? "text-[#E7FF52]"
                          : txType == "Buy"
                            ? "text-[#52FF8D]"
                            : txType == "Sell"
                              ? "text-[#fd2929ee]"
                              : "text-[#FFAF52]"
                          }`}
                      >
                        <img
                          className="rounded-full"
                          src='/assets/icon/ic_ether.png'
                          width={14}
                          height={14}
                          alt="token_logo"
                        />
                        {formatNumber(etherAmount)}{" ETH"}
                      </div>
                    </td>
                    <td className="px-2 py-1">
                      <div
                        className={`flex items-center text-nowrap gap-2 poppins-regular ${txType == "Transfer"
                          ? "text-[#E7FF52]"
                          : txType == "Buy"
                            ? "text-[#52FF8D]"
                            : txType == "Sell"
                              ? "text-[#fd2929ee]"
                              : "text-[#FFAF52]"
                          }`}
                      >
                        ${formatNumber((parseFloat(_log.amountUSD) / parseFloat(tokenAmount)).toString())}
                      </div>
                    </td>
                    <td className="poppins-regular px-2 py-1">
                      {/* {getUTCTime(_log.transaction.timestamp)} */}
                      {ellipsisAddress(_log.sender, false)}
                    </td>
                    <td className="text-right px-2 py-1">
                      <div className="flex items-center justify-end">
                        <img
                          className="w-3.5 h-3.5 active:scale-95 hover:scale-110 transition-transform cursor-pointer"
                          src="/assets/icon/ic_etherscan.svg"
                          onClick={() => handleOpenEtherscan(_log.transaction.id)}
                          alt="etherscan"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderHistory;
