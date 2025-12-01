import { useState } from "react";

import TopBar from "../components/TopBar/TopBar";
import { Card } from "../components/Card/Card";

const McCalculator = () => {

    // for raydium
    const [marketCap, setMarketCap] = useState(100000);
    const [ethPrice, setEthPrice] = useState(4000);
    const [initialEthLiquidity, setInitialEthLiquidity] = useState(1)
    const [initialTokenLiquidity, setInitialTokenLiquidity] = useState(100)
    const [snipedEth, setSnipedEth] = useState(5)
    const [snipedTokenPercent, setSnipedTokenPercent] = useState(80)

    const calculateRaydium = () => {
        const _ethAmount = Math.sqrt(initialTokenLiquidity / 100 * (marketCap / ethPrice) * initialEthLiquidity)
        setSnipedEth(_ethAmount)
        const _tokenPercent = _ethAmount * ethPrice * 100 / marketCap
        setSnipedTokenPercent(100 - _tokenPercent)
    }

    return (
        <div className="w-screen h-screen flex flex-col max-[1800px]:items-start items-center overflow-auto">
            <div className="flex flex-col mx-6 my-3">
                <TopBar />
                <div className="flex gap-6 my-8 justify-center">
                    <Card className="!w-[800px] rounded-3xl border-8 border-card-border py-6">
                        <div className={`w-full flex flex-col text-white font-sans gap-10 m-auto`}>
                            <div className="flex flex-col gap-3">
                                <div className="items-center grow grid grid-cols-2 gap-2">
                                    <div>
                                        <div className="text-white text-left">
                                            Target Market Cap ($)<span className="pl-1 text-white">*</span>
                                        </div>
                                        <div
                                            className="flex rounded-lg outline outline-1 outline-gray-blue bg-light-black w-full h-10 mt-1 overflow-hidden"
                                        >
                                            <input
                                                className="outline-none text-orange placeholder:text-gray-border px-2.5 bg-trnasparent w-full h-full"
                                                placeholder="100000"
                                                value={marketCap}
                                                onChange={(e) => setMarketCap(e.target.value)}
                                                type="number"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-white text-left">
                                            Eth Price ($)<span className="pl-1 text-white">*</span>
                                        </div>
                                        <div
                                            className="flex rounded-lg outline outline-1 outline-gray-blue bg-light-black w-full h-10 mt-1 overflow-hidden"
                                        >
                                            <input
                                                className="outline-none text-orange placeholder:text-gray-border px-2.5 bg-trnasparent w-full h-full"
                                                placeholder="200"
                                                value={ethPrice}
                                                onChange={(e) => setEthPrice(e.target.value)}
                                                type="number"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="items-center grow grid grid-cols-2 gap-2">
                                    <div>
                                        <div className="text-white text-left">
                                            Eth Amount of Initial Liquidity (ETH)<span className="pl-1 text-white">*</span>
                                        </div>
                                        <div
                                            className="flex rounded-lg outline outline-1 outline-gray-blue bg-light-black w-full h-10 mt-1 overflow-hidden"
                                        >
                                            <input
                                                className="outline-none text-orange placeholder:text-gray-border px-2.5 bg-trnasparent w-full h-full"
                                                placeholder="100000"
                                                value={initialEthLiquidity}
                                                onChange={(e) => setInitialEthLiquidity(e.target.value)}
                                                type="number"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-white text-left">
                                            Token Percent of Initial Liquidity (%)<span className="pl-1 text-white">*</span>
                                        </div>
                                        <div
                                            className="flex rounded-lg outline outline-1 outline-gray-blue bg-light-black w-full h-10 mt-1 overflow-hidden"
                                        >
                                            <input
                                                className="outline-none text-orange placeholder:text-gray-border px-2.5 bg-trnasparent w-full h-full"
                                                placeholder="100"
                                                value={initialTokenLiquidity}
                                                onChange={(e) => setInitialTokenLiquidity(e.target.value)}
                                                type="number"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <button
                                    className="w-full h-full font-medium font-conthrax text-center text-white uppercase px-6 py-4 rounded-lg justify-center items-center gap-2.5 inline-flex bg-gradient-blue-to-purple active:brightness-75 transition duration-100 ease-in-out transform focus:outline-none"
                                    onClick={calculateRaydium}>
                                    Calculate
                                </button>
                                <div className="h-0 w-full border-t-[1px] border-gray-normal" />
                                <div className="items-center grow grid grid-cols-2 gap-2">
                                    <div>
                                        <div className="text-white text-left">
                                            Eth Amount To Snipe (ETH)<span className="pl-1 text-white">*</span>
                                        </div>
                                        <div
                                            className="flex rounded-lg outline outline-1 outline-gray-blue bg-light-black w-full h-10 mt-1 overflow-hidden"
                                        >
                                            <input
                                                className="outline-none text-orange placeholder:text-gray-border px-2.5 bg-trnasparent w-full h-full"
                                                placeholder="30"
                                                value={snipedEth}
                                                onChange={(e) => setSnipedEth(e.target.value)}
                                                type="number"
                                                disabled
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-white text-left">
                                            Token Percent To Snipe (%)<span className="pl-1 text-white">*</span>
                                        </div>
                                        <div
                                            className="flex rounded-lg outline outline-1 outline-gray-blue bg-light-black w-full h-10 mt-1 overflow-hidden"
                                        >
                                            <input
                                                className="outline-none text-orange placeholder:text-gray-border px-2.5 bg-trnasparent w-full h-full"
                                                placeholder="80"
                                                value={snipedTokenPercent}
                                                onChange={(e) => setSnipedTokenPercent(e.target.value)}
                                                type="number"
                                                disabled
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default McCalculator