import { useContext, useEffect, useState } from "react";
import { InputWithLabel } from "../Inputs/Inputs";
import { useAccount, useChainId } from "wagmi";
import { toast } from "react-toastify";
import { AppContext } from "../../App";
import { ethers } from "ethers";
import { UNISWAP_V2_ROUTER } from "../../utils/constants";
import tokenABI from "../../abi/ITradingToken.json";
import routerABI from "../../abi/IUniSwapV2Router02.json";
import factoryABI from "../../abi/IUniswapV2Factory.json";
import { useEthersSigner } from "../../utils/provider";
import BigNumber from "bignumber.js";
import { GradientButton } from "../Buttons/Buttons";
import { isValidAddress } from "../../utils/methods";

export default function AddRemoveLiquidity() {
    const { setLoadingPrompt, setOpenLoading } = useContext(AppContext);
    const [baseTokenAddress, setBaseTokenAddress] = useState("");
    const [baseTokenAmount, setBaseTokenAmount] = useState("");
    const [ethAmount, setEthAmount] = useState("");
    const { isConnected, address } = useAccount();
    const chainId = useChainId();
    const signer = useEthersSigner(chainId);

    const [removeLpBaseTokenAddress, setRemoveLpBaseTokenAddress] = useState("");
    const [removeLpTokenPercent, setRemoveLpTokenPercent] = useState("0");
    const [removeLpTokenAmount, setRemoveLpTokenAmount] = useState("0");
    const [removeLpTokenBalance, setRemoveLpTokenBalance] = useState("0");
    const [removeLpTokenDecimals, setRemoveLpTokenDecimals] = useState(0);

    const handleAddLiquidity = async () => {
        if (!isConnected) {
            toast.warn("Please connect wallet!");
            return;
        }

        if (!isValidAddress(baseTokenAddress)) {
            toast.warn("Invalid token address!");
            return;
        }

        const amount0 = Number(baseTokenAmount.replaceAll(",", ""));
        if (isNaN(amount0) || amount0 < 0) {
            toast.warn("Invalid token amount!");
            return;
        }

        const amount1 = Number(ethAmount.replaceAll(",", ""));
        if (isNaN(amount1) || amount1 < 0) {
            toast.warn("Invalid ETH amount!");
            return;
        }

        try {
            setLoadingPrompt("Checking pair...");
            setOpenLoading(true);

            const routerContract = new ethers.Contract(
                UNISWAP_V2_ROUTER[chainId],
                routerABI,
                signer
            );
            const WETH = await routerContract.WETH();
            const factoryAddr = await routerContract.factory();
            const factoryContract = new ethers.Contract(
                factoryAddr,
                factoryABI,
                signer
            );
            const pairAddr = await factoryContract.getPair(
                baseTokenAddress,
                WETH.toString()
            );
            console.log(pairAddr);
            if (pairAddr === "0x0000000000000000000000000000000000000000") {
                setLoadingPrompt("Creating pair...");
                const tx = await factoryContract.createPair(
                    baseTokenAddress,
                    WETH.toString()
                );
                if (tx) await tx.wait();
            }

            const tokenContract = new ethers.Contract(
                baseTokenAddress,
                tokenABI,
                signer
            );
            const decimals = await tokenContract.decimals();
            const amount0Wei = new BigNumber(
                amount0.toString() + "e" + decimals.toString()
            );
            const amount1Wei = new BigNumber(amount1.toString() + "e18");

            const allowance = await tokenContract.allowance(
                address,
                UNISWAP_V2_ROUTER[chainId]
            );
            if (amount0Wei.gt(new BigNumber(allowance.toString()))) {
                setLoadingPrompt("Approving...");
                const tx = await tokenContract.approve(
                    UNISWAP_V2_ROUTER[chainId],
                    ethers.MaxUint256
                );
                if (tx) await tx.wait();
            }

            setLoadingPrompt("Adding liquidity...");
            const args = [
                baseTokenAddress,
                amount0Wei.toFixed(0),
                "0",
                "0",
                address,
                Math.floor(Date.now() / 1000) + 3600,
                { value: amount1Wei.toFixed(0) },
            ];
            const tx = await routerContract.addLiquidityETH(...args);
            if (tx) await tx.wait();

            const balance = await updateBalance(baseTokenAddress, address, signer);
            setBaseTokenAddress(balance);

            toast.success("Added liquidity!");
        } catch (err) {
            console.log(err);
            toast.warn("Failed to add liquidity!");
        }
        setOpenLoading(false);
    };

    const updateBalance = async (tokenAddress, address, signer) => {
        try {
            console.log("Updating token balance...");
            const tokenContract = new ethers.Contract(tokenAddress, tokenABI, signer);
            const decimals = await tokenContract.decimals();
            const balance = await tokenContract.balanceOf(address);
            const amount = new BigNumber(
                balance.toString() + "e-" + decimals.toString()
            );
            return amount.toString();
        } catch (err) {
            console.log(err);
            return "";
        }
    };

    useEffect(() => {
        if (baseTokenAddress !== "")
            updateBalance(baseTokenAddress, address, signer).then((amount) =>
                setBaseTokenAmount(amount)
            );
        else setBaseTokenAmount("");
    }, [baseTokenAddress, signer, address]);

    const updateLpBalance = async (chainId, tokenAddress, address, signer) => {
        try {
            console.log("Updating LP balance...");
            const routerContract = new ethers.Contract(
                UNISWAP_V2_ROUTER[chainId],
                routerABI,
                signer
            );
            const WETH = await routerContract.WETH();
            const factoryAddr = await routerContract.factory();
            const factoryContract = new ethers.Contract(
                factoryAddr,
                factoryABI,
                signer
            );
            const lpAddr = await factoryContract.getPair(WETH, tokenAddress);
            const lpContract = new ethers.Contract(lpAddr, tokenABI, signer);
            const decimals = await lpContract.decimals();
            const balance = await lpContract.balanceOf(address);

            console.log(lpAddr, lpContract, decimals, balance)

            setRemoveLpTokenDecimals(parseInt(decimals.toString()));

            const amount = new BigNumber(
                balance.toString() + "e-" + decimals.toString()
            );
            return amount.toString();
        } catch (err) {
            console.log(err);
            return "";
        }
    };

    useEffect(() => {
        if (removeLpBaseTokenAddress !== "")
            updateLpBalance(chainId, removeLpBaseTokenAddress, address, signer).then(
                (amount) => setRemoveLpTokenBalance(amount)
            );
        else setRemoveLpTokenBalance("0");
    }, [removeLpBaseTokenAddress, chainId, signer, address]);

    useEffect(() => {
        setRemoveLpTokenAmount(
            new BigNumber(removeLpTokenBalance)
                .multipliedBy(parseInt(removeLpTokenPercent))
                .div(100)
                .toString()
        );
    }, [removeLpTokenPercent])

    const handleRemoveLiquidity = async () => {
        if (!isConnected) {
            toast.warn("Please connect wallet!");
            return;
        }

        if (!isValidAddress(removeLpBaseTokenAddress)) {
            toast.warn("Invalid token address!");
            return;
        }

        if (
            new BigNumber(removeLpTokenAmount).gt(new BigNumber(removeLpTokenBalance))
        ) {
            toast.warn("Invalid lp token amount!");
            return;
        }

        try {
            setLoadingPrompt("Removing liquidity...");
            setOpenLoading(true);

            const routerContract = new ethers.Contract(
                UNISWAP_V2_ROUTER[chainId],
                routerABI,
                signer
            );
            const WETH = await routerContract.WETH();
            const factoryAddr = await routerContract.factory();
            const factoryContract = new ethers.Contract(
                factoryAddr,
                factoryABI,
                signer
            );
            const lpAddr = await factoryContract.getPair(
                WETH,
                removeLpBaseTokenAddress
            );
            const lpContract = new ethers.Contract(lpAddr, tokenABI, signer);
            // const decimals = await lpContract.decimals();
            const allowance = new BigNumber(
                (
                    await lpContract.allowance(address, UNISWAP_V2_ROUTER[chainId])
                ).toString()
            );

            const amount = new BigNumber(
                `${removeLpTokenAmount}e${removeLpTokenDecimals}`
            ).toFixed(0);

            if (allowance.lt(amount)) {
                const tx = await lpContract.approve(
                    UNISWAP_V2_ROUTER[chainId],
                    ethers.MaxUint256
                );
                if (tx) await tx.wait();
            }

            console.log(removeLpBaseTokenAddress, amount, address)

            const tx =
                await routerContract.removeLiquidityETHSupportingFeeOnTransferTokens(
                    removeLpBaseTokenAddress,
                    amount,
                    "0",
                    "0",
                    address,
                    Math.floor(Date.now() / 1000) + 3600
                );
            if (tx) await tx.wait();

            const lpBalance = await updateLpBalance(
                chainId,
                removeLpBaseTokenAddress,
                address,
                signer
            );
            setRemoveLpTokenBalance(lpBalance);

            toast.success("Removed liquidity!");
        } catch (err) {
            console.log(err);
            toast.warn("Failed to remove liquidity!");
        }
        setOpenLoading(false);
    };

    return (
        <div className="w-full flex flex-col items-center gap-6">
            <img className="" src="/assets/img/uniswap_logo.png" width={200} />
            <div className="w-full flex flex-col gap-3">
                <div className="flex flex-col gap-3 items-center justify-between w-full h-auto">
                    <div className="text-base font-conthrax font-medium text-white">
                        Add Liquidity
                    </div>
                    <span className="px-20 text-gray-label">
                        When providing liquidity to a Uniswap pool, you receive pool tokens that represent your ownership stake. These tokens can be securely locked using the Unicrypt Liquidity Management Tool, enhancing transparency and fostering investor confidence by preventing unauthorized withdrawals.
                    </span>
                </div>
                <div className="flex flex-col gap-3 w-full rounded-b-[10px]">
                    <InputWithLabel
                        required={true}
                        label="Enter the Uniswap V2 Address You'd Like to Add Liquidity For"
                        placeholder="Enter token address"
                        value={baseTokenAddress}
                        onChange={(v) => setBaseTokenAddress(v)}
                    />
                    <InputWithLabel
                        required={true}
                        label="Token Amount Added To Liquidity Pool"
                        placeholder="Enter token amount"
                        value={baseTokenAmount}
                        onChange={(v) => setBaseTokenAmount(v)}
                    />
                    <InputWithLabel
                        required={true}
                        label="ETH Amount for Liquidity Pool"
                        placeholder="Enter ETH amount"
                        value={ethAmount}
                        onChange={(v) => setEthAmount(v)}
                    />
                    <div className="flex items-center gap-3">
                        <img className="w-6 h-6" src="/assets/icon/ic_info.svg" />
                        <span className="text-gray-label text-left">Ensure that the "Owner" Wallet has sufficient funds before proceeding with Adding or Locking Liquidity for the contracts or the transaction may fail.</span>
                    </div>
                    <div className="relative flex h-full text-white bg-transparent justify-evenly bg-clip-border">
                        <button
                            className="w-full font-conthrax font-medium text-center text-white uppercase px-6 h-10 rounded-lg justify-center items-center gap-2.5 inline-flex bg-gradient-blue-to-purple active:scale-95 transition duration-100 ease-in-out transform focus:outline-none"
                            onClick={handleAddLiquidity}
                        >
                            Add Liquidity
                        </button>
                    </div>
                </div>
            </div>
            <div className="w-full flex flex-col gap-3">
                <div className="flex items-center justify-between w-full h-auto">
                    <div className="m-auto text-base font-conthrax font-medium text-white">
                        Remove Liquidity
                    </div>
                </div>
                <div className="flex flex-col gap-3 w-full">
                    <InputWithLabel
                        required={true}
                        label="Token Contract Address"
                        placeholder="Enter address"
                        value={removeLpBaseTokenAddress}
                        onChange={(v) => setRemoveLpBaseTokenAddress(v)}
                    />
                    <div className="">
                        <div className="text-gray-label text-left">
                            Remove Liquidity Amount
                            <span className="pl-1 text-white">*</span>
                        </div>
                        <div className="outline-none rounded-lg text-orange border border-gray-blue placeholder:text-gray-border px-3.5 bg-light-black w-full py-2 mt-1">
                            <p className="text-right !text-orange">
                                Balance: {removeLpTokenBalance}
                            </p>
                            <input
                                className="w-full text-right text-orange bg-transparent outline-none placeholder:text-gray-border h-8"
                                placeholder="Enter % amount to remove from liquidity"
                                value={removeLpTokenAmount}
                                onChange={(e) => setRemoveLpTokenAmount(e.target.value)}
                            />
                            <div className="flex text-white text-[10px] gap-1 justify-end">
                                <GradientButton
                                    className={`px-3 py-[2px] rounded-full bg-card-border active:scale-95 transition duration-100 ease-in-out transform text-xxs text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed`}
                                    onClick={() => setRemoveLpTokenPercent("25")}
                                    selected={removeLpTokenPercent === "25"}
                                >
                                    25%
                                </GradientButton>
                                <GradientButton
                                    className={`px-3 py-[2px] rounded-full bg-card-border active:scale-95 transition duration-100 ease-in-out transform text-xxs text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed`}
                                    onClick={() => setRemoveLpTokenPercent("50")}
                                    selected={removeLpTokenPercent === "50"}
                                >
                                    50%
                                </GradientButton>
                                <GradientButton
                                    className={`px-3 py-[2px] rounded-full bg-card-border active:scale-95 transition duration-100 ease-in-out transform text-xxs text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed`}
                                    onClick={() => setRemoveLpTokenPercent("75")}
                                    selected={removeLpTokenPercent === "75"}
                                >
                                    75%
                                </GradientButton>
                                <GradientButton
                                    className={`px-3 py-[2px] rounded-full bg-card-border active:scale-95 transition duration-100 ease-in-out transform text-xxs text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed`}
                                    onClick={() => setRemoveLpTokenPercent("100")}
                                    selected={removeLpTokenPercent === "100"}
                                >
                                    100%
                                </GradientButton>
                            </div>
                        </div>
                    </div>
                    <div className="relative flex h-full text-white bg-transparent justify-evenly bg-clip-border">
                        <button
                            className="w-full font-conthrax font-medium text-center text-white uppercase px-6 h-10 rounded-lg justify-center items-center gap-2.5 inline-flex bg-gradient-blue-to-purple active:scale-95 transition duration-100 ease-in-out transform focus:outline-none"
                            onClick={handleRemoveLiquidity}
                        >
                            Remove Liquidity
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}