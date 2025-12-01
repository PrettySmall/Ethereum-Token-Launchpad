import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../App";
import { useAccount, useChainId } from "wagmi";
import { useEthersSigner } from "../../utils/provider";
import { UNISWAP_V2_ROUTER } from "../../utils/constants";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import { InputWithLabel } from "../Inputs/Inputs";
import tokenABI from "../../abi/ITradingToken.json";
import routerABI from "../../abi/IUniSwapV2Router02.json";
import factoryABI from "../../abi/IUniswapV2Factory.json";
import BigNumber from "bignumber.js";
import { isValidAddress } from "../../utils/methods";

export default function _3AddLiquidity(props) {
    const { setLoadingPrompt, setLoadingDesc, setOpenLoading } = useContext(AppContext);
    const { selectedProject, setStep } = props;
    const [baseTokenAddress, setBaseTokenAddress] = useState("");
    const [baseTokenAmount, setBaseTokenAmount] = useState("");
    const [ethAmount, setEthAmount] = useState("");
    const { isConnected, address } = useAccount();
    const chainId = useChainId();
    const signer = useEthersSigner(chainId);

    const updateBalance = async (tokenAddress, address, signer) => {
        try {
            console.log("Updating token balance...", tokenAddress);
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

    useEffect(() => {
        if (!selectedProject.token?.address || selectedProject.token?.address === "") {
            setBaseTokenAmount("");
            setBaseTokenAddress("");
        } else {
            setBaseTokenAddress(selectedProject.token.address);
        }
    }, [selectedProject.token?.address])

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
        if (isNaN(amount0) || amount0 <= 0) {
            toast.warn("Invalid token amount!");
            return;
        }

        const amount1 = Number(ethAmount.replaceAll(",", ""));
        if (isNaN(amount1) || amount1 <= 0) {
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

            setLoadingPrompt("Adding liquidity in Progress");
            setLoadingDesc("This may take a few moments. Please sign the required transactions through your browser extension. Make sure to keep the browser open and avoid refreshing until the process is complete.");
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
            setBaseTokenAmount(balance);

            toast.success("Added liquidity!");

            setStep(p => p + 1);
        } catch (err) {
            console.log(err);
            toast.warn("Failed to add liquidity!");
        }
        setOpenLoading(false);
        setLoadingDesc("");
    };


    return (
        <div className="flex flex-col gap-4 w-full rounded-b-[10px]">
            <img className="mx-auto" src="/assets/img/uniswap_logo.png" width={150} />
            <div className="flex flex-col gap-3 w-full rounded-b-[10px]">
                <InputWithLabel
                    required={true}
                    disabled={true}
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
    )
}