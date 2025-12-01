import axios from "axios";
import { useContext, useEffect, useRef, useState } from "react";
import { AppContext, CHAIN_STRING } from "../../App";
import { useChainId } from "wagmi";
import { ellipsisAddress, formatNumber } from "../../utils/methods";
import { FaBackspace, FaCheck } from "react-icons/fa";

const TokenSearchPanel = (props) => {
  const { setShowCandidate, handleSetToken, tokenAddress, setTokenAddress } =
    props;
  const inputRef = useRef();
  const [candidates, setCandidates] = useState([]);
  const [timer, setTimer] = useState();
  const chainId = useChainId();
  const { setActiveTokenAddress } = useContext(AppContext);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setShowCandidate(false);
      }
    });
  }, []);

  useEffect(() => {
    if (timer) {
      clearTimeout(timer);
    }

    if (tokenAddress == "") {
      setIsSearching(false);
      setCandidates([]);
      return;
    }

    const newTimer = setTimeout(async () => {
      setIsSearching(true);
      if (tokenAddress == "") {
        setCandidates([]);
        return;
      }
      const { data } = await axios.get(
        `https://api.dexscreener.com/latest/dex/search/?q=${tokenAddress}`,
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      if (data?.pairs) {
        const pairs = data.pairs.filter(
          (element) =>
            element.chainId === "ethereum" &&
            element.dexId === "uniswap" &&
            element.labels[0] === "v2"
        );
        setCandidates(pairs);
      } else {
        setCandidates([]);
      }
      setIsSearching(false);
    }, 1000);

    setTimer(newTimer);
  }, [tokenAddress]);

  const handleTokenAddressChange = (event) => {
    setTokenAddress(event.target.value);
  };

  return (
    <div className="fixed z-50 left-0 top-0 w-full h-full flex justify-center bg-black/70">
      <div
        className="fixed z-40 left-0 top-0 w-full h-full"
        onClick={() => setShowCandidate(false)}
      ></div>
      <div className="z-50 w-[800px] max-h-[80vh] h-fit mt-24 flex flex-col bg-gray-light rounded-md bg-black border border-solid border-gray-border">
        <div className="h-12 bg-gray-highlight p-3 flex gap-2 justify-between">
          <div className="flex gap-2 grow">
            <img src="/assets/icon/ic_search.svg" className="w-6 h-6" />
            <input
              className="outline-none bg-transparent text-sm grow"
              placeholder="Search"
              value={tokenAddress}
              onChange={handleTokenAddressChange}
              ref={inputRef}
            />
          </div>
          <div className="flex gap-4">
            <button onClick={() => setTokenAddress("")}>
              <FaBackspace />
            </button>
            <button onClick={handleSetToken}>
              <FaCheck />
            </button>
          </div>
        </div>
        <div className="min-h-24 overflow-auto">
          {candidates.length == 0 && !isSearching && (
            <div className="p-5">
              <div className="text-xl mb-2">¯\_(ツ)_/¯</div>
              <div className="text-sm">No results found</div>
            </div>
          )}
          {isSearching && tokenAddress != "" && (
            <div className="p-5">
              <div role="status" className="mb-2">
                <svg
                  aria-hidden="true"
                  className="inline w-10 h-10 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
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
              </div>
              <div className="text-sm">Searching...</div>
            </div>
          )}
          {candidates.length > 0 && !isSearching && (
            <div className="px-3 pt-5 pb-3 flex flex-col gap-2">
              {candidates.map((candidate) => {
                return (
                  <div
                    key={candidate.pairAddress}
                    className="p-3 flex gap-4 rounded-md hover:outline hover:outline-2 hover:outline-white items-center cursor-pointer bg-gray-dark"
                    onClick={() => {
                      setTokenAddress(candidate.baseToken.address);
                      setActiveTokenAddress(candidate.baseToken.address);
                      setShowCandidate(false);
                    }}
                  >
                    <img
                      src={
                        candidate.quoteToken.symbol == "ETH" ||
                        candidate.quoteToken.symbol == "WETH"
                          ? "/assets/icon/ic_ether.png"
                          : CHAIN_STRING[chainId.toString()]
                          ? `https://dd.dexscreener.com/ds-data/tokens/${
                              CHAIN_STRING[chainId.toString()]
                            }/${candidate.baseToken.address}.png`
                          : "/assets/icon/ic_question.svg"
                      }
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-1 text-xs">
                        <div>{candidate.baseToken.symbol}</div>
                        <div className="text-gray-normal mr-3">
                          {" / "}
                          {candidate.quoteToken.symbol}
                        </div>
                        <img
                          src={
                            candidate.baseToken.symbol == "ETH" ||
                            candidate.baseToken.symbol == "WETH"
                              ? "/assets/icon/ic_ether.png"
                              : CHAIN_STRING[chainId.toString()]
                              ? `https://dd.dexscreener.com/ds-data/tokens/${
                                  CHAIN_STRING[chainId.toString()]
                                }/${candidate.baseToken.address}.png`
                              : "/assets/icon/ic_question.svg"
                          }
                          className="w-4 h-4 rounded-full"
                        />
                        {candidate.baseToken.name}
                      </div>
                      <div className="flex gap-2 text-xs">
                        <div>${candidate.priceUsd}</div>
                        <div className="text-red-normal mr-1">
                          {candidate.priceChange.m5}%
                        </div>
                        {candidate.liquidity && (
                          <div className="text-xxs">
                            <span className="font-extralight">Liquidity:</span>{" "}
                            ${formatNumber(candidate.liquidity?.usd, 1)}
                          </div>
                        )}
                        <div className="text-xxs">
                          <span className="font-extralight">24H Volume:</span> $
                          {formatNumber(candidate.volume.h24, 0)}
                        </div>
                        <div className="text-xxs">
                          <span className="font-extralight">Market Cap:</span> $
                          {formatNumber(candidate.fdv, 1)}
                        </div>
                      </div>
                      <div className="flex gap-1 text-xxs text-gray-normal">
                        <div>
                          Pair: {ellipsisAddress(candidate.pairAddress, false)}
                        </div>
                        <div>
                          Token:{" "}
                          {ellipsisAddress(candidate.baseToken.address, false)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TokenSearchPanel;
