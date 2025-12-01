
import { useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Listbox, Popover } from "@headlessui/react";
import { FaDatabase, FaEllipsisV, FaEthereum, FaExclamationTriangle, FaGasPump, FaQuestion, FaRegCopy, FaSave } from "react-icons/fa";
import { IoIosAddCircle, IoIosArrowDown, IoIosClose, IoIosDownload, IoIosRefresh } from "react-icons/io";
import { useAccount, useChainId } from "wagmi";
import { Contract, ethers, formatEther, formatUnits } from "ethers";
import axios from "axios";
import BigNumber from "bignumber.js";

import { AppContext } from "../App";
import ZombieDialog from "../components/Dialogs/ZombieDialog";
import NewWalletDialog from "../components/Dialogs/NewWalletDialog";
import TokenAmountDialog from "../components/Dialogs/TokenAmountDialog";
import EthAmountDialog from "../components/Dialogs/EthAmountDialog";
import SimulationDialog from "../components/Dialogs/SimulationDialog";
import { useEthersSigner, useEthersProvider } from "../utils/provider";
import { ellipsisAddress, isValidAddress } from "../utils/methods";
import { TEMPLATES } from "../utils/constants";
import goliveABI from "../abi/IGoLive.json";
import tokenABI from "../abi/ITradingToken.json";
import TopBar from "../components/TopBar/TopBar";
import { erc20Abi } from "viem";

// const ENABLE_MODES = [
//     "Sign with Owner's Wallet",
//     "Use Owner's Private Key",
// ];

export default function BundlePage({ className }) {
    const {
        SERVER_URL,
        setLoadingPrompt,
        setOpenLoading,
        user,
        currentProject,
        setCurrentProject,
        updateProject,
        walletBalanceData,
        notifyStatus,
        sigData,
        signingData
    } = useContext(AppContext);
    const chainId = useChainId();
    const { isConnected } = useAccount();

    const [copied, setCopied] = useState({});
    const [targetWallet, setTargetWallet] = useState("");
    const [zombieDialog, setZombieDialog] = useState(false);
    const [zombieIndex, setZombieIndex] = useState(0);
    const [newWalletDialog, setNewWalletDialog] = useState(false);
    const [tokenAmountDialog, setTokenAmountDialog] = useState(false);
    const [ethAmountDialog, setEthAmountDialog] = useState(false);
    const [simulateData, setSimulateData] = useState({});
    const [simulateZombies, setSimulateZombies] = useState([]);
    const [simulationDialog, setSimulationDialog] = useState(false);
    const [gasPrice, setGasPrice] = useState("0");
    const [gasPriceMultiplier, setGasPriceMultiplier] = useState("");

    const [token, setToken] = useState("");
    const [tokenInfo, setTokenInfo] = useState({ decimals: "", totalSupply: "" });
    const [template, setTemplate] = useState(TEMPLATES[0]);
    const [enableMode, setEnableMode] = useState(0);
    const [zombieWallet0, setZombieWallet0] = useState({ address: "", privateKey: "" });
    const [zombieWallet1, setZombieWallet1] = useState({ address: "", privateKey: "" });
    const [deadBlocks, setDeadBlocks] = useState("2");
    const [depositTokenBalance, setDepositTokenBalance] = useState("1");
    const [depositETHBalance, setDepositETHBalance] = useState("1");
    const [walletAllChecked, setWalletAllChecked] = useState(false);
    const [walletChecked, setWalletChecked] = useState([]);
    const [walletEthBalance, setWalletEthBalance] = useState([]);
    const [walletTokenBalance, setWalletTokenBalance] = useState([]);
    const [walletTokenAmount, setWalletTokenAmount] = useState([]);
    const [walletEthAmount, setWalletEthAmount] = useState([]);
    const [isDragging, setIsDragging] = useState(false);

    const provider = useEthersProvider(chainId);
    const signer = useEthersSigner(chainId);
    const disabled = !currentProject._id || currentProject.status !== "OPEN" || !user || user.role === "admin";

    useEffect(() => {
        if (currentProject.token || currentProject.template || currentProject.enableMode || currentProject.zombies) {
            const matchedTemplate = [...TEMPLATES, "Custom"].find(item => item === currentProject.template);
            setTemplate(matchedTemplate ? currentProject.template : TEMPLATES[0]);
            setToken(currentProject.token.address);
            setEnableMode(currentProject.enableMode);
            setZombieWallet0({
                address: currentProject.zombies[0],
                privateKey: "",
            });
            setZombieWallet1({
                address: currentProject.zombies[1],
                privateKey: "",
            });
        }
        else {
            setTemplate(TEMPLATES[0]);
            setToken("");
            setEnableMode(0);
            setZombieWallet0({ address: "", privateKey: "" });
            setZombieWallet1({ address: "", privateKey: "" });
            setWalletAllChecked(false);
            setWalletChecked([]);
        }
    }, [currentProject.token, currentProject.template, currentProject.enableMode, currentProject.zombies]);

    useEffect(() => {
        const getTokenInfo = async (token, provider) => {
            try {
                console.log("Getting token info...", token);
                const tokenContract = new ethers.Contract(token, tokenABI, provider);
                const decimals = await tokenContract.decimals();
                const totalSupply = await tokenContract.totalSupply();
                setTokenInfo({
                    decimals: decimals.toString(),
                    totalSupply: new BigNumber(totalSupply.toString() + "e-" + decimals.toString()).toFixed(0)
                });
            }
            catch (err) {
                console.log(err);
                setTokenInfo({
                    decimals: "",
                    totalSupply: "",
                });
            }
        }
        if (isValidAddress(token)) {
            getTokenInfo(token, provider);
        }
        else {
            setTokenInfo({
                decimals: "",
                totalSupply: "",
            });
        }
    }, [token, provider]);

    useEffect(() => {
        if (currentProject.wallets) {
            if (currentProject.wallets.length !== walletChecked.length) {
                const newWalletChecked = currentProject.wallets.map(() => false);
                setWalletChecked(newWalletChecked);
                setWalletAllChecked(false);
            }

            setWalletEthBalance(currentProject.wallets.map(() => "-"));
            setWalletTokenBalance(currentProject.wallets.map(() => "0"));
            setWalletTokenAmount(currentProject.wallets.map((item) => item.initialTokenAmount));
            setWalletEthAmount(currentProject.wallets.map(item => item.initialEthAmount));
        }
        else {
            setWalletEthBalance([]);
            setWalletTokenBalance([]);
            setWalletTokenAmount([]);
            setWalletEthAmount([]);
        }
    }, [currentProject.wallets, walletChecked.length]);


    useEffect(() => {
        if (currentProject.token && walletBalanceData.address === currentProject.token.address && walletBalanceData.token.length === walletTokenBalance.length) {
            setWalletTokenBalance(walletBalanceData.token);
        }
    }, [currentProject.token, walletBalanceData.address, walletBalanceData.token, walletTokenBalance.length]);

    useEffect(() => {
        if (currentProject.token && walletBalanceData.address === currentProject.token.address && walletBalanceData.eth.length === walletEthBalance.length) {
            setWalletEthBalance(walletBalanceData.eth);
        }
    }, [currentProject.token, walletBalanceData.address, walletBalanceData.eth, walletEthBalance.length]);

    useEffect(() => {
        if (notifyStatus.tag === "DIRTY_WALLET_COMPLETED") {
            if (notifyStatus.success)
                toast.success("Succeed to make dirty wallets!");
            else
                toast.warn("Failed to make dirty wallets!");
            // setOpenLoading(false);
            // setNotifyStatus({ success: true, tag: "NONE" });
        }
        else if (notifyStatus.tag === "SIMULATE_COMPLETED") {
            if (notifyStatus.success) {
                toast.success("Succeed to simulate!");
                if (notifyStatus.data) {
                    console.log("notifyStatus.data", notifyStatus.data)
                    setSimulateZombies(notifyStatus.data.zombies);
                    setSimulationDialog(true);
                    setSimulateData(notifyStatus.data);
                }
            }
            else {
                toast.warn(`Failed to simulate! ${notifyStatus.error ? notifyStatus.error : ""}`);
                setSimulateData({});
            }
            // setOpenLoading(false);
            // setNotifyStatus({ success: true, tag: "NONE" });
        }
        else if (notifyStatus.tag === "BUY_COMPLETED") {
            if (notifyStatus.success)
                toast.success("Succeed to enable and buy!");
            else
                toast.warn("Failed to enable and buy!");

            if (notifyStatus.project) {
                updateProject(notifyStatus.project);
                if (currentProject._id === notifyStatus.project._id)
                    setCurrentProject(notifyStatus.project);
            }

            // setSimulateData({});
            // setOpenLoading(false);
            // setNotifyStatus({ success: true, tag: "NONE" });
        }
        else if (notifyStatus.tag === "COLLECT_ALL_ETH") {
            if (notifyStatus.success)
                toast.success("Succeed to collect all ETH!");
            else
                toast.warn("Failed to collect all ETH!");

            if (notifyStatus.project) {
                updateProject(notifyStatus.project);
                if (currentProject._id === notifyStatus.project._id)
                    setCurrentProject(notifyStatus.project);
            }

            // setOpenLoading(false);
            // setNotifyStatus({ success: true, tag: "NONE" });
        }
    }, [notifyStatus, currentProject._id]);

    const handleMouseDown = (e, id) => {
        e.preventDefault();
        setIsDragging(true);
        handleWalletChanged(id, "checked", !walletChecked[id])
    };

    const handleMouseEnter = (id) => {
        if (isDragging) {
            handleWalletChanged(id, "checked", !walletChecked[id])
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const copyToClipboard = async (key, text) => {
        if ('clipboard' in navigator) {
            await navigator.clipboard.writeText(text);
            toast.success("Copied");
            setCopied({
                ...copied,
                [key]: true,
            });
            setTimeout(() => setCopied({
                ...copied,
                [key]: false,
            }), 2000);
        }
        else
            console.error('Clipboard not supported');
    };

    const getSelectedTokenBalance = () => {
        try {
            let selectedBalance = 0;
            for (let i = 0; i < walletChecked.length; i++) {
                if (!walletChecked[i])
                    continue;

                selectedBalance += Number(walletTokenAmount[i]);
            }
            return selectedBalance.toFixed(4);
        }
        catch (err) {
            console.log(err);
        }
        return 0;
    };

    const getSelectedTokenRealBalance = () => {
        try {
            let selectedBalance = 0;
            for (let i = 0; i < walletChecked.length; i++) {
                if (!walletChecked[i])
                    continue;

                selectedBalance += Number(walletTokenBalance[i]);
            }
            return selectedBalance.toFixed(4);
        }
        catch (err) {
            console.log(err);
        }
        return 0;
    }

    const handleQueryGasPrice = async () => {
        if (isConnected) {
            setLoadingPrompt("Querying gas price...");
            setOpenLoading(true);
            try {
                const feeData = await provider.getFeeData();
                setGasPrice(Number(new BigNumber(feeData.gasPrice.toString() + "e-9")).toFixed(1));
                console.log("gasPrice:", feeData.gasPrice, "maxFeePerGas:", feeData.maxFeePerGas, "maxPriorityFeePerGas:", feeData.maxPriorityFeePerGas);
            }
            catch (err) {
                setGasPrice("0");
            }
            setOpenLoading(false);
        }
    };

    const handleVisitDASHGitbook = () => {
        window.open(
            `https://dash-developer-tools.gitbook.io/dash_developer_tools`,
            "_blank",
            "noopener,noreferrer"
        );
    }

    const handleSaveProject = async () => {
        setLoadingPrompt("Saving project...");
        setOpenLoading(true);
        try {
            const wallets = currentProject.wallets.map((item, index) => {
                return {
                    address: item.address,
                    initialTokenAmount: walletTokenAmount[index],
                    initialEthAmount: walletEthAmount[index],
                };
            });
            const { data } = await axios.post(`${SERVER_URL}/api/v1/project/save`,
                {
                    projectId: currentProject._id,
                    chainId: chainId,
                    token: token,
                    template: template,
                    enableMode: enableMode,
                    zombies: [
                        zombieWallet0,
                        zombieWallet1,
                    ],
                    wallets: wallets,
                    sigData,
                    signingData,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "MW-USER-ID": localStorage.getItem("access-token"),
                    },
                }
            );

            updateProject(data.project);
            if (currentProject._id === data.project._id)
                setCurrentProject(data.project);
            toast.success("Project has been saved successfully");
        }
        catch (err) {
            console.log(err);
            toast.warn("Failed to save token info");
        }
        setOpenLoading(false);
    };

    const handleOKZombiePrivateKey = (index, key) => {
        try {
            const wallet = new ethers.Wallet(key);
            if (index === 0)
                setZombieWallet0({ address: wallet.address, privateKey: key });
            else
                setZombieWallet1({ address: wallet.address, privateKey: key });
        }
        catch (err) {
            console.log(err);
            toast.warn("Invalid private key!");
        }

        setZombieDialog(false);
    };

    const handleSetZombieWallet = (index) => {
        setZombieIndex(index);
        setZombieDialog(true);
    };

    const handleOKNewWallet = async (walletCount, fresh) => {
        let count = 0;
        try {
            count = parseInt(walletCount);
        }
        catch (err) {
            console.log(err);
        }

        if (isNaN(count) || count < 0 || count > 100) {
            toast.warn("Invalid wallet count, wallet count must be in the range 1-100");
            return;
        }

        setNewWalletDialog(false);
        setLoadingPrompt("Generating new wallets...");
        setOpenLoading(true);
        try {
            const { data } = await axios.post(`${SERVER_URL}/api/v1/project/generate-wallets`,
                {
                    projectId: currentProject._id,
                    count: walletCount,
                    fresh: fresh,
                    sigData,
                    signingData,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "MW-USER-ID": localStorage.getItem("access-token"),
                    },
                }
            );
            const newCurrentProject = {
                ...currentProject,
                wallets: data.project.wallets,
            };
            updateProject(newCurrentProject);
            setCurrentProject(newCurrentProject);
            toast.success("New wallets has been generated successfully");
        }
        catch (err) {
            console.log(err);
            toast.warn("Failed to generate new wallets!");
        }
        setOpenLoading(false);
    };

    const handleDownloadSimulateData = async () => {
        if (Object.keys(simulateData).length > 0) {
            let new_data = { ...simulateData };
            let totalAdditionalEth = new BigNumber(0);
            if (new_data.teamWallets) {
                for (let i = 0; i < new_data.teamWallets.length; i++) {
                    totalAdditionalEth = totalAdditionalEth.plus(new_data.teamWallets[i].sim.ethAmount);
                }
            }

            if (new_data.extraWallets) {
                for (let i = 0; i < new_data.extraWallets.length; i++) {
                    totalAdditionalEth = totalAdditionalEth.plus(new_data.extraWallets[i].sim.ethAmount);
                }
            }

            let distributeAmount = totalAdditionalEth.div(new_data.wallets.length);

            const contract = new Contract(new_data.token.address, erc20Abi, provider);
            const decimals = await contract.decimals();

            let csvContent = "address,initialTokenAmount,initialEthAmount,sim.disperseAmount,sim.ethAmount,sim.gasLimit,sim.tokenAmount\n";
            for (let i = 0; i < new_data.wallets.length; i++) {
                let wallet = new_data.wallets[i];
                wallet.sim.ethAmount = formatEther(new BigNumber(wallet.sim.ethAmount).plus(distributeAmount).toString());
                wallet.sim.disperseAmount = formatEther(wallet.sim.disperseAmount);
                wallet.sim.tokenAmount = formatUnits(wallet.sim.tokenAmount, parseInt(decimals.toString()));
                csvContent += wallet?.address + ',' + wallet?.initialTokenAmount + ',' + wallet?.initialEthAmount + ',' + wallet?.sim?.disperseAmount + ',' + wallet?.sim?.ethAmount + ',' + wallet?.sim?.gasLimit + ',' + wallet?.sim?.tokenAmount + '\n';
            }

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "simulate_result.csv";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    const handleDownloadWallets = async () => {
        if (!currentProject._id) {
            toast.warn("Select the project");
            return;
        }

        setLoadingPrompt("Downloading wallets...");
        setOpenLoading(true);
        try {
            const { data } = await axios.post(`${SERVER_URL}/api/v1/project/download-wallets`,
                {
                    projectId: currentProject._id,
                    sigData,
                    signingData,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "MW-USER-ID": localStorage.getItem("access-token"),
                    },
                }
            );

            const downloadFile = (data, fileName) => {
                const url = window.URL.createObjectURL(new Blob([data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute(
                    'download',
                    fileName,
                );

                // Append to html link element page
                document.body.appendChild(link);

                // Start download
                link.click();

                // Clean up and remove the link
                link.parentNode.removeChild(link);
            };

            downloadFile(data, `wallets_${currentProject.name}.csv`);
        }
        catch (err) {
            console.log(err);
            toast.warn("Failed to download wallets!");
        }
        setOpenLoading(false);
    };

    const handleOKMinMaxTokenAmounts = async (minAmount, maxAmount) => {
        function getRandomNumber(min, max) {
            return (Math.floor(Math.random() * (max - min + 1)) + min);
        }

        try {
            let minX = -1;
            let maxX = -1;
            if (minAmount.charAt(minAmount.length - 1) === '%') {
                minX = Number(minAmount.slice(0, minAmount.length - 1));
                minX = Number(tokenInfo.totalSupply) * minX / 100;
            }
            else
                minX = Number(minAmount);

            if (isNaN(minX) || minX <= 0) {
                toast.warn("Invalid minimum amount");
                return;
            }

            if (maxAmount.charAt(maxAmount.length - 1) === '%') {
                maxX = Number(maxAmount.slice(0, maxAmount.length - 1));
                maxX = Number(tokenInfo.totalSupply) * maxX / 100;
            }
            else
                maxX = Number(maxAmount);

            if (isNaN(maxX) || maxX <= 0) {
                toast.warn("Invalid maximum amount");
                return;
            }

            if (minX > maxX) {
                const t = minX;
                minX = maxX;
                maxX = t;
            }

            console.log("Min:", minX, "Max:", maxX);

            let newWalletTokenAmount = [...walletTokenAmount];
            for (let i = 0; i < newWalletTokenAmount.length; i++) {
                if (walletChecked[i])
                    newWalletTokenAmount[i] = getRandomNumber(minX, maxX);
            }
            setWalletTokenAmount(newWalletTokenAmount);
        }
        catch (err) {
            console.log(err);
            toast.warn("Invalid minimum/maximum amount");
        }

        setTokenAmountDialog(false);
    };

    const handleSetTokenAmounts = () => {
        const selectedWallets = walletChecked.filter((item) => item === true);
        if (selectedWallets.length === 0) {
            toast.warn("Please select wallets to set token amount");
            return;
        }
        setTokenAmountDialog(true);
    };

    const handleOKEthAmount = (ethAmount) => {
        let amount = -1;
        try {
            amount = Number(ethAmount);
        }
        catch (err) {
            console.log(err);
        }

        if (isNaN(amount) || amount < 0) {
            toast.warn("Invalid ETH amount");
            return;
        }

        let newWalletEthAmount = [...walletEthAmount];
        for (let i = 0; i < newWalletEthAmount.length; i++) {
            if (walletChecked[i])
                newWalletEthAmount[i] = amount;
        }
        setWalletEthAmount(newWalletEthAmount);
        setEthAmountDialog(false);
    };

    const handleSetETHAmounts = () => {
        const selectedWallets = walletChecked.filter((item) => item === true);
        if (selectedWallets.length === 0) {
            toast.warn("Please select wallets to set additional ETH amount");
            return;
        }
        setEthAmountDialog(true);
    };

    const handleCollectAllEth = async () => {
        if (!currentProject._id)
            return;

        if (!isConnected) {
            toast.warn("Please connect wallet!");
            return;
        }

        if (!isValidAddress(targetWallet)) {
            toast.warn("Please input wallet to send ETH!");
            return;
        }

        const validWalletChecked = walletChecked.filter(item => item === true);
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
            let teamWallets = [];
            for (let i = 0; i < currentProject.wallets.length; i++) {
                if (walletChecked[i]) {
                    wallets = [
                        ...wallets,
                        currentProject.wallets[i].address,
                    ];
                }
            }

            // if (currentProject.teamWallets) {
            //     for (let i = 0; i < currentProject.teamWallets.length; i++) {
            //         if (teamWalletChecked[i]) {
            //             teamWallets = [
            //                 ...teamWallets,
            //                 currentProject.teamWallets[i].address,
            //             ];
            //         }
            //     }
            // }

            await axios.post(`${SERVER_URL}/api/v1/project/collect-all-eth`,
                {
                    projectId: currentProject._id,
                    chainId,
                    targetWallet,
                    wallets,
                    teamWallets,
                    sigData,
                    signingData,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "MW-USER-ID": localStorage.getItem("access-token"),
                    },
                }
            );
        }
        catch (err) {
            console.log(err);
            toast.warn("Failed to collect all ETH!");
            setOpenLoading(false);
        }
    };

    const handleWalletAllChecked = (e) => {
        console.log("Wallet all checked:", e.target.value, walletAllChecked);
        const newWalletAllChecked = !walletAllChecked;
        setWalletAllChecked(newWalletAllChecked);
        if (newWalletAllChecked) {
            setWalletChecked(walletChecked.map((v, i) => {
                if (i < 70) return true;
                else return false;
            }));
        } else {
            setWalletChecked(walletChecked.map(() => newWalletAllChecked));
        }
    };

    const handleWalletChanged = (index, key, value) => {
        console.log("Wallet changed:", index, key, value);
        if (key === "checked") {
            let newWalletChecked = [...walletChecked];
            if (!newWalletChecked[index]) {
                let checkedCount = walletChecked.filter((v) => { return v == true }).length;
                if (checkedCount == 70) {
                    toast.warn('You can use up to 70 wallets for bundle.')
                    return;
                }
            }
            newWalletChecked[index] = !newWalletChecked[index];
            setWalletChecked(newWalletChecked);

            let newWalletAllChecked = true;
            for (let i = 0; i < newWalletChecked.length; i++)
                newWalletAllChecked &&= newWalletChecked[i];
            setWalletAllChecked(newWalletAllChecked);
        }
        else if (key === "token_amount") {
            let newWalletTokenAmount = [...walletTokenAmount];
            newWalletTokenAmount[index] = value;
            setWalletTokenAmount(newWalletTokenAmount);
        }
        else if (key === "eth_amount") {
            let newWalletETHAmount = [...walletEthAmount];
            newWalletETHAmount[index] = value;
            setWalletEthAmount(newWalletETHAmount);
        }
    };

    // const handleTeamWalletAllChecked = (e) => {
    //     console.log("Team wallet all checked:", e.target.value, teamWalletAllChecked);
    //     const newTeamWalletAllChecked = !teamWalletAllChecked;
    //     setTeamWalletAllChecked(newTeamWalletAllChecked);
    //     setTeamWalletChecked(teamWalletChecked.map(() => newTeamWalletAllChecked));
    // };

    // const handleTeamWalletChanged = (index, key, value) => {
    //     console.log("Team wallet changed:", index, key, value);
    //     if (key === "checked") {
    //         let newTeamWalletChecked = [...teamWalletChecked];
    //         newTeamWalletChecked[index] = !newTeamWalletChecked[index];
    //         setTeamWalletChecked(newTeamWalletChecked);

    //         let newTeamWalletAllChecked = true;
    //         for (let i = 0; i < newTeamWalletChecked.length; i++)
    //             newTeamWalletAllChecked &&= newTeamWalletChecked[i];
    //         setTeamWalletAllChecked(newTeamWalletAllChecked);
    //     }
    // };

    const handleDoneSimulate = () => {
        setSimulationDialog(false);
        if (simulateData.token) {
            let newCurrentProject = { ...currentProject };
            newCurrentProject.token = simulateData.token;
            newCurrentProject.template = simulateData.template;
            newCurrentProject.enableMode = simulateData.enableMode;
            newCurrentProject.zombies = [simulateData.zombies[0].address, simulateData.zombies[1].address];
            for (let i = 0; i < simulateData.wallets.length; i++) {
                for (let j = 0; j < newCurrentProject.wallets.length; j++) {
                    if (simulateData.wallets[i].address === newCurrentProject.wallets[j].address) {
                        newCurrentProject.wallets[j].initialTokenAmount = simulateData.wallets[i].initialTokenAmount;
                        newCurrentProject.wallets[j].initialEthAmount = simulateData.wallets[i].initialEthAmount;
                        newCurrentProject.wallets[j].sim = simulateData.wallets[i].sim;
                        break;
                    }
                }
            }
            updateProject(newCurrentProject);
            if (currentProject._id === newCurrentProject._id)
                setCurrentProject(newCurrentProject);
        }
    };

    const handleMakeDirtyWallets = async () => {
        if (!isConnected) {
            toast.warn("Please connect wallet!");
            return;
        }

        const validWalletChecked = walletChecked.filter(item => item === true);
        if (validWalletChecked.length === 0) {
            toast.warn("Please check wallets to make dirty");
            return;
        }

        let addresses = [];
        let amounts = [];
        let totalAmount = 0;
        for (let i = 0; i < currentProject.wallets.length; i++) {
            if (!walletChecked[i])
                continue;

            addresses = [
                ...addresses,
                currentProject.wallets[i].address,
            ];
            amounts = [
                ...amounts,
                "50000000000000000",
            ];
            totalAmount += 0.05;
        }

        setLoadingPrompt("Making dirty wallets...");
        setOpenLoading(true);
        try {
            const contractAddress = (chainId === 1) ? "0xED9E67ef7A90757A1C163d86aDc6b9cd7A930Cef" : (chainId === 5) ? "0x587DEcAebfd987b836EF7f9B839b936a07f2Dae8" : "0xf4B4E98b7b5f71558c2780F262Ff7539701257Ae";
            const goliveContract = new ethers.Contract(contractAddress, goliveABI, signer);
            const totalAmountWei = new BigNumber(totalAmount.toString() + "e18").toFixed(0);
            const tx = await goliveContract.handle(addresses, amounts, { value: totalAmountWei });
            if (tx)
                await tx.wait();

            await axios.post(`${SERVER_URL}/api/v1/project/dirty-wallets`,
                {
                    chainId: chainId,
                    wallets: addresses,
                    sigData,
                    signingData,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "MW-USER-ID": localStorage.getItem("access-token"),
                    },
                }
            );
        }
        catch (err) {
            console.log(err);
            toast.warn("Failed to make dirty wallets!");
            setOpenLoading(false);
        }
    };

    const handleSimulate = async () => {
        setSimulationDialog(false)
        if (!currentProject._id)
            return;

        if (!isConnected) {
            toast.warn("Please connect wallet!");
            return;
        }

        if (!isValidAddress(token)) {
            toast.warn("Invalid token address!");
            return;
        }

        if (!isValidAddress(zombieWallet0.address)) {
            toast.warn("Invalid zombie wallet #1!");
            return;
        }

        if (!isValidAddress(zombieWallet1.address)) {
            toast.warn("Invalid zombie wallet #2!");
            return;
        }

        if (template === "ERC-20/Template-7 (startWithPermit)") {
            const numDeadBlocks = parseInt(deadBlocks);
            if (isNaN(numDeadBlocks) || numDeadBlocks < 0) {
                toast.warn("Invalid dead blocks");
                return;
            }
        }

        // if (currentProject.selfToken) {
        if (template == "Custom") {
            const numDepositTokenBalance = parseFloat(depositTokenBalance);
            if (isNaN(numDepositTokenBalance) || numDepositTokenBalance <= 0) {
                toast.warn("Invalid token deposit balance");
                return;
            }

            const numDepositETHBalance = parseFloat(depositETHBalance);
            if (isNaN(numDepositETHBalance) || numDepositETHBalance <= 0) {
                toast.warn("Invalid ETH deposit balance");
                return;
            }
        }

        const validWalletChecked = walletChecked.filter(item => item === true);
        if (validWalletChecked.length === 0) {
            toast.warn("Please check wallets to buy tokens");
            return;
        }

        let wallets = [];
        for (let i = 0; i < currentProject.wallets.length; i++) {
            if (!walletChecked[i])
                continue;

            const tokenAmount = Number(walletTokenAmount[i].toString().replaceAll(",", ""));
            if (isNaN(tokenAmount) || tokenAmount <= 0) {
                toast.warn(`Wallet #${i + 1}: Invalid token amount`);
                return;
            }

            const ethAmount = Number(walletEthAmount[i].toString().replaceAll(",", ""));
            if (isNaN(ethAmount) || ethAmount < 0) {
                toast.warn(`Wallet #${i + 1}: Invalid additional ETH amount`);
                return;
            }

            wallets = [
                ...wallets,
                {
                    address: currentProject.wallets[i].address,
                    initialTokenAmount: tokenAmount,
                    initialEthAmount: ethAmount,
                }
            ];
        }

        try {
            let unpackedSig = null;
            if (enableMode === 0) {
                setLoadingPrompt("Signing with owner wallet...");
                setOpenLoading(true);
                const signature = await signer.signTypedData({
                    name: "Trading Token",
                    version: "1",
                    chainId: chainId,
                    verifyingContract: token,
                }, {
                    Permit: [
                        { name: "content", type: "string" },
                        { name: "nonce", type: "uint256" },
                    ],
                }, {
                    content: "Enable Trading",
                    nonce: 0,
                });
                unpackedSig = ethers.Signature.from(signature);
            }

            setLoadingPrompt("Simulating... Please wait 1-2 minutes.");
            setOpenLoading(true);
            // if (!currentProject.selfToken)
            if (template != "Custom")
                await axios.post(`${SERVER_URL}/api/v1/project/simulate`,
                    {
                        projectId: currentProject._id,
                        chainId,
                        token,
                        template,
                        enableMode,
                        signature: unpackedSig ? {
                            v: unpackedSig.v,
                            r: unpackedSig.r,
                            s: unpackedSig.s,
                        } : null,
                        zombies: [zombieWallet0, zombieWallet1],
                        wallets,
                        deadBlocks,
                        gasPriceMultiplier: gasPriceMultiplier === "" ? 0 : Math.round(Number(gasPriceMultiplier)),
                        sigData,
                        signingData,
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                            "MW-USER-ID": localStorage.getItem("access-token"),
                        },
                    }
                );
            else {
                await axios.post(`${SERVER_URL}/api/v1/project/simulate-with-addliquidity`,
                    {
                        projectId: currentProject._id,
                        chainId,
                        token,
                        template,
                        enableMode,
                        signature: unpackedSig ? {
                            v: unpackedSig.v,
                            r: unpackedSig.r,
                            s: unpackedSig.s,
                        } : null,
                        zombies: [zombieWallet0, zombieWallet1],
                        wallets,
                        deadBlocks,
                        selfToken: template == "Custom",
                        depositTokenBalance,
                        depositETHBalance,
                        gasPriceMultiplier: gasPriceMultiplier === "" ? 0 : Math.round(Number(gasPriceMultiplier)),
                        sigData,
                        signingData,
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                            "MW-USER-ID": localStorage.getItem("access-token"),
                        },
                    }
                );
            }
        }
        catch (err) {
            console.log(err);
            toast.warn("Failed to simulate!");
            setOpenLoading(false);
        }
    };

    const handleBuyTokens = async () => {
        if (!currentProject._id)
            return;

        if (!isConnected) {
            toast.warn("Please connect wallet!");
            return;
        }

        if (!isValidAddress(token)) {
            toast.warn("Invalid token address!");
            return;
        }

        if (!isValidAddress(zombieWallet0.address)) {
            toast.warn("Invalid zombie wallet #1!");
            return;
        }

        if (!isValidAddress(zombieWallet1.address)) {
            toast.warn("Invalid zombie wallet #2!");
            return;
        }

        const validWalletChecked = walletChecked.filter(item => item === true);
        if (validWalletChecked.length === 0) {
            toast.warn("Please check wallets to buy tokens");
            return;
        }

        console.log("SimulateData:", simulateData);

        let simulated = true;
        if (!simulateData.zombies) {
            simulated = false;
            console.log("Zombie not set!");
        }

        if (!simulateData.token || simulateData.token.address.toUpperCase() !== token.toUpperCase()) {
            simulated = false;
            console.log("Token address mismatch!");
        }
        if (simulated && template != 'Custom' && (!simulateData.template || simulateData.template !== template)) {
            simulated = false;
            console.log("Template mismatch!");
        }
        if (simulated && template != 'Custom' && simulateData.template === "ERC-20/Template-7 (startWithPermit)" && simulateData.deadBlocks !== deadBlocks) {
            simulated = false;
            console.log("Dead blocks mismatch!");
        }

        if (simulated && (simulateData.enableMode !== enableMode)) {
            simulated = false;
            console.log("Enable mode mismatch!");
        }
        if (simulated &&
            (simulateData.zombies[0].address.toUpperCase() !== zombieWallet0.address.toUpperCase() ||
                simulateData.zombies[1].address.toUpperCase() !== zombieWallet1.address.toUpperCase())) {
            simulated = false;
            console.log("Zombie wallet mismatch!");
        }
        if (simulated && simulateData.wallets) {
            for (let i = 0; i < simulateData.wallets.length; i++) {
                let matched = false;
                const ethAmount0 = simulateData.wallets[i].initialEthAmount.toString() === "" ? "0" : simulateData.wallets[i].initialEthAmount.toString();
                for (let j = 0; j < walletTokenAmount.length; j++) {
                    if (simulateData.wallets[i].address.toUpperCase() === currentProject.wallets[j].address.toUpperCase()) {
                        matched = true;
                        const ethAmount1 = walletEthAmount[j].toString() === "" ? "0" : walletEthAmount[j].toString();
                        if (!walletChecked[j] ||
                            simulateData.wallets[i].initialTokenAmount.toString() !== walletTokenAmount[j].toString() ||
                            ethAmount0 !== ethAmount1) {
                            simulated = false;
                            console.log("Token amount or ETH amount mismatch!");
                        }
                        break;
                    }
                }
                if (!matched) {
                    simulated = false;
                    console.log("No matched!");
                }
                if (!simulated)
                    break;
            }
        }
        else
            simulated = false;

        if (!simulated) {
            toast.warn("Please simulate first");
            return;
        }

        if (simulateData.zombies[0].value !== "0" || simulateData.zombies[1].value !== "0") {
            toast.warn("Please send enough ETH to zombie wallets and simulate again");
            return;
        }

        setSimulationDialog(false);

        try {
            let unpackedSig = null;
            if (enableMode === 0) {
                setLoadingPrompt("Signing with ower wallet...")
                setOpenLoading(true);

                const signature = await signer.signTypedData({
                    name: "Trading Token",
                    version: "1",
                    chainId: chainId,
                    verifyingContract: token,
                }, {
                    Permit: [
                        { name: "content", type: "string" },
                        { name: "nonce", type: "uint256" },
                    ],
                }, {
                    content: "Enable Trading",
                    nonce: 0,
                });
                unpackedSig = ethers.Signature.from(signature);
            }

            setLoadingPrompt("Enabling and Buying Tokens...");
            setOpenLoading(true);
            // if (!currentProject.selfToken) {
            if (template != "Custom") {
                await axios.post(`${SERVER_URL}/api/v1/project/buy`,
                    {
                        projectId: currentProject._id,
                        chainId,
                        signature: unpackedSig ? {
                            v: unpackedSig.v,
                            r: unpackedSig.r,
                            s: unpackedSig.s,
                        } : null,
                        simulateData,
                        gasPriceMultiplier: gasPriceMultiplier === "" ? 0 : Math.round(Number(gasPriceMultiplier)),
                        sigData,
                        signingData,
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                            "MW-USER-ID": localStorage.getItem("access-token"),
                        },
                    }
                );
            } else {
                await axios.post(`${SERVER_URL}/api/v1/project/buy-with-addliquidity`,
                    {
                        projectId: currentProject._id,
                        chainId,
                        signature: unpackedSig ? {
                            v: unpackedSig.v,
                            r: unpackedSig.r,
                            s: unpackedSig.s,
                        } : null,
                        simulateData,
                        gasPriceMultiplier: gasPriceMultiplier === "" ? 0 : Math.round(Number(gasPriceMultiplier)),
                        sigData,
                        signingData,
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                            "MW-USER-ID": localStorage.getItem("access-token"),
                        },
                    }
                );
            }
        }
        catch (err) {
            console.log(err);
            toast.warn("Failed to enable and buy!");
            setOpenLoading(false);
        }
    };

    return (
        <div className="w-screen h-screen flex flex-col max-[1800px]:items-start items-center overflow-auto">
            <div className="mx-6 w-fit h-full pt-5 pb-3 flex flex-col gap-3">
                <TopBar />
                <div className={`${className} grow h-[50%] flex flex-col text-white rounded-lg p-4 pb-3 mt-8`}>
                    <ZombieDialog isOpen={zombieDialog} index={zombieIndex} onOK={handleOKZombiePrivateKey} onCancel={() => setZombieDialog(false)} />
                    <NewWalletDialog isOpen={newWalletDialog} onOK={handleOKNewWallet} onCancel={() => setNewWalletDialog(false)} />
                    <TokenAmountDialog isOpen={tokenAmountDialog} onOK={handleOKMinMaxTokenAmounts} onCancel={() => setTokenAmountDialog(false)} />
                    <EthAmountDialog isOpen={ethAmountDialog} onOK={handleOKEthAmount} onCancel={() => setEthAmountDialog(false)} />
                    <SimulationDialog isOpen={simulationDialog} zombies={simulateZombies} onClose={() => setSimulationDialog(false)} handleDownloadSimuation={handleDownloadSimulateData} handleSimulateAgain={handleSimulate} handleBundle={handleBuyTokens} />
                    <div className="h-full flex flex-col">
                        <div className="flex items-start justify-between w-full h-auto">
                            <div className="flex items-center text-xs font-medium text-white">
                                <div className="font-bold uppercase text-xl">Bundling-</div>
                                <span className="text-gradient-blue-to-purple text-xl">{currentProject.name ? `${currentProject.name}` : "No project"}</span>
                                {currentProject?.token?.address &&
                                    <>
                                        <div className="mx-2 text-gray-normal opacity-30">/</div>
                                        <div className="font-semibold text-gray-normal">{ellipsisAddress(currentProject?.token?.address)}</div>
                                        {copied["token_address"] ?
                                            (<svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>) :
                                            <FaRegCopy className="w-3.5 h-3.5 ml-2 transition ease-in-out transform cursor-pointer active:scale-95 duration-100" onClick={() => copyToClipboard("token_address", currentProject?.token?.address)} />}
                                        <a href={`https://${(currentProject?.token?.chainId === 8453) ? "basescan.org" : "etherscan.io"}/address/${currentProject?.token?.address}`} target="_blank" rel="noreferrer">
                                            <img className="w-3.5 h-3.5 object-contain ml-2" src="/assets/img/etherscan.png" alt="etherscan" />
                                        </a>
                                        <a href={`https://www.dextools.io/app/en/${(currentProject?.token?.chainId === 8453) ? "base" : "ether"}/pair-explorer/${currentProject?.token?.address}`} target="_blank" rel="noreferrer">
                                            <img className="w-3.5 h-3.5 object-contain ml-2" src="/assets/img/dextool.png" alt="dextools" />
                                        </a>
                                        <a href={`https://dexscreener.com/${(currentProject?.token?.chainId === 8453) ? "base" : "ethereum"}/${currentProject?.token?.address}`} target="_blank" rel="noreferrer">
                                            <img className="w-3.5 h-3.5 object-contain ml-2" src="/assets/img/dexscreener.png" alt="dexscreener" />
                                        </a>
                                    </>
                                }
                            </div>
                            <div className="flex gap-3">
                                {/* <button
                                    className={`text-xs font-medium text-center text-white px-6 py-2 rounded-lg justify-center items-center gap-2.5 bg-gradient-to-br from-[#4B65F1ED] to-[#FA03FF44] active:scale-95 transition duration-100 ease-in-out transform focus:outline-none disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed`}
                                    onClick={handleVisitDASHGitbook}>
                                    Visit MemeTools Gitbook
                                </button> */}
                                <button
                                    className={`text-xs font-medium text-center text-white uppercase px-6 py-2 rounded-lg justify-center items-center gap-2.5 bg-gradient-to-br from-[#4B65F1ED] to-[#FA03FF44] active:scale-95 transition duration-100 ease-in-out transform focus:outline-none disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed`}
                                    disabled={disabled}
                                    onClick={handleSaveProject}>
                                    {/* <FaSave className="w-4 h-4 m-auto" /> */}
                                    {/* <img src="/assets/icon/ic_question.svg" width={24} alt="question" /> */}
                                    Save Project
                                </button>
                            </div>
                        </div>
                        <div className="w-full mt-[6px] grid grid-cols-12 gap-3">
                            <div className="col-span-8 md:col-span-4 2xl:col-span-3">
                                <div className="text-xs text-left uppercase text-gray-normal">
                                    Token Address<span className="pl-1 text-green-normal">*</span>
                                </div>
                                <input
                                    className="outline-none border border-blue-950 text-white placeholder:text-gray-border text-sm px-2.5 bg-transparent w-full h-button mt-1 rounded-lg"
                                    placeholder="Enter Address"
                                    disabled={disabled}
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                />
                            </div>
                            <div className="relative col-span-8 md:col-span-4 2xl:col-span-3">
                                <div className="text-xs text-left uppercase text-gray-normal">
                                    Template<span className="pl-1 text-green-normal">*</span>
                                </div>
                                <Listbox value={template} onChange={setTemplate} disabled={disabled}>
                                    <Listbox.Button
                                        className="outline-none border border-gray-border text-white placeholder:text-gray-border text-sm px-2.5 bg-transparent w-full h-button mt-1 disabled:border-gray-highlight disabled:text-gray-border relative pr-7"
                                        disabled={disabled}
                                    >
                                        <span className="flex items-center">
                                            <span className="block truncate">
                                                {template}
                                            </span>
                                        </span>
                                        <IoIosArrowDown className="absolute inset-y-0 -right-1 flex items-center w-8 pr-2 mt-2.5 pointer-events-none opacity-50" />
                                    </Listbox.Button>
                                    <Listbox.Options className="absolute z-20 w-full overflow-auto text-xs border border-t-0 text-gray-normal mt bg-gray-dark border-gray-border">
                                        {
                                            [...TEMPLATES, "Custom"].map((item, index) => {
                                                return (
                                                    <Listbox.Option key={index}
                                                        className={`relative px-2 py-1 cursor-default hover:bg-gray-border ${item === template && "text-white"}`}
                                                        value={item}
                                                    >
                                                        <div className="flex items-center">
                                                            <span className="block font-normal truncate">
                                                                {item}
                                                            </span>
                                                        </div>
                                                    </Listbox.Option>
                                                );
                                            })
                                        }
                                    </Listbox.Options>
                                </Listbox>
                            </div>
                            <div className="col-span-8 md:col-span-4 2xl:col-span-2">
                                <Popover className="relative flex items-center text-xs uppercase text-gray-normal">
                                    <div className="whitespace-nowrap">Zombie Wallet #1<span className="pl-1 text-green-normal">*</span></div>
                                    <Popover.Button className="border border-green-normal text-[6px] flex items-center justify-center cursor-pointer rounded-full w-3 h-3 ml-1">
                                        <FaQuestion className="text-green-normal" />
                                    </Popover.Button>
                                    <Popover.Panel className="absolute z-10 px-2 py-1 text-xs text-center text-white normal-case border rounded-sm bg-gray-highlight bottom-5 border-green-normal">
                                        This wallet distributes ETH to all wallets.
                                    </Popover.Panel>
                                </Popover>
                                <div className={`flex items-center justify-between outline-none border border-gray-border text-gray-normal text-sm pl-2.5 bg-transparent w-full h-button mt-1 pr-1 ${disabled && "text-gray-border border-gray-highlight"}`}>
                                    <div className={`w-full pr-1 truncate ${zombieWallet0.address && "text-white"}`}>
                                        {
                                            zombieWallet0.address ?
                                                ellipsisAddress(zombieWallet0.address) :
                                                "NOT SET"
                                        }
                                    </div>
                                    <div className="flex items-center text-base">
                                        {zombieWallet0.address && !copied["zombie_wallet_0"] &&
                                            <FaRegCopy className="w-4 cursor-pointer text-gray-normal hover:text-green-normal" onClick={() => copyToClipboard("zombie_wallet_0", zombieWallet0.address)} />
                                        }
                                        {zombieWallet0.address && copied["zombie_wallet_0"] &&
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        }
                                        {!disabled && <FaEllipsisV className="w-4 ml-1 cursor-pointer text-gray-normal hover:text-green-normal" onClick={() => handleSetZombieWallet(0)} />}
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-8 md:col-span-4 2xl:col-span-2">
                                <Popover className="relative flex items-center text-xs uppercase text-gray-normal">
                                    <div className="whitespace-nowrap">Zombie Wallet #2<span className="pl-1 text-green-normal">*</span></div>
                                    <Popover.Button className="border border-green-normal text-[6px] flex items-center justify-center cursor-pointer rounded-full w-3 h-3 ml-1">
                                        <FaQuestion className="text-green-normal" />
                                    </Popover.Button>
                                    <Popover.Panel className="absolute z-10 px-2 py-1 text-xs text-center text-white normal-case border rounded-sm bg-gray-highlight bottom-5 border-green-normal">
                                        This wallet is one for enabling trade.
                                    </Popover.Panel>
                                </Popover>
                                <div className={`flex items-center justify-between outline-none border border-gray-border text-gray-normal text-sm pl-2.5 bg-transparent w-full h-button mt-1 pr-1 ${disabled && "text-gray-border border-gray-highlight"}`}>
                                    <div className={`w-full pr-1 truncate ${zombieWallet1.address && "text-white"}`}>
                                        {
                                            zombieWallet1.address ?
                                                ellipsisAddress(zombieWallet1.address) :
                                                "NOT SET"
                                        }
                                    </div>
                                    <div className="flex items-center text-base">
                                        {zombieWallet1.address && !copied["zombie_wallet_1"] &&
                                            <FaRegCopy className="w-4 cursor-pointer text-gray-normal hover:text-green-normal" onClick={() => copyToClipboard("zombie_wallet_1", zombieWallet1.address)} />
                                        }
                                        {zombieWallet1.address && copied["zombie_wallet_1"] &&
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        }
                                        {!disabled && <FaEllipsisV className="w-4 ml-1 cursor-pointer text-gray-normal hover:text-green-normal" onClick={() => handleSetZombieWallet(1)} />}
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-4 md:col-span-2 2xl:col-span-2">
                                <div className="text-xs uppercase text-gray-normal">
                                    Dead Blocks
                                    {template === "ERC-20/Template-7 (startWithPermit)" && <span className="pl-1 text-green-normal">*</span>}
                                </div>
                                <input
                                    className="outline-none border border-gray-border text-white placeholder:text-gray-border text-sm px-2.5 bg-transparent w-full h-button mt-1 rounded-lg"
                                    placeholder="Enter dead blocks"
                                    disabled={disabled}
                                    value={deadBlocks}
                                    onChange={(e) => setDeadBlocks(e.target.value)}
                                />
                            </div>
                        </div>
                        {template == "Custom" && <div className="w-full mt-[6px] flex gap-8">
                            <div className="w-[50%] flex gap-4 items-center">
                                <div className="text-xs uppercase text-gray-normal text-nowrap">
                                    Deposit Token Balance:
                                </div>
                                <input
                                    className="outline-none border border-gray-border text-white placeholder:text-gray-border text-sm px-2.5 bg-transparent w-full h-button mt-1 rounded-lg"
                                    placeholder="Enter dead blocks"
                                    disabled={disabled}
                                    value={depositTokenBalance}
                                    onChange={(e) => setDepositTokenBalance(e.target.value)}
                                />
                            </div>
                            <div className="w-[50%] flex gap-4 items-center">
                                <div className="text-xs uppercase text-gray-normal text-nowrap">
                                    Deposit ETH Balance:
                                </div>
                                <input
                                    className="outline-none border border-gray-border text-white placeholder:text-gray-border text-sm px-2.5 bg-transparent w-full h-button mt-1 rounded-lg"
                                    placeholder="Enter dead blocks"
                                    disabled={disabled}
                                    value={depositETHBalance}
                                    onChange={(e) => setDepositETHBalance(e.target.value)}
                                />
                            </div>
                        </div>}
                        <div className="flex flex-row justify-between w-full gap-2 mt-3 mb-3 font-sans">
                            <div className="flex items-center gap-3 text-sm text-gray-normal">
                                <div>
                                    Selected: <span className="text-white">{walletChecked.filter(wal => wal).length}</span>
                                </div>
                                <div>
                                    Token balance: <span className="text-white">{`${Number(getSelectedTokenRealBalance()?.split(".")[0] ?? "0").toLocaleString()}.${getSelectedTokenRealBalance()?.split(".")[1] ?? "00"}`}</span>
                                </div>
                            </div>
                            <div className="flex flex-col justify-end gap-2 lg:items-center lg:flex-row">
                                <button
                                    className="pl-3 pr-4 h-button rounded-lg justify-center items-center gap-1 inline-flex bg-[#1A1A37] active:scale-95 transition duration-100 ease-in-out transform focus:outline-none text-xs font-medium text-center text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                    disabled={disabled}
                                    onClick={() => setNewWalletDialog(true)}
                                >
                                    {/* <IoIosAddCircle className="text-lg text-green-normal" /> */}
                                    Generate Wallets
                                    <img src="/assets/icon/ic_plus.svg" width={16} alt="plus" />
                                </button>
                                <button
                                    className="pl-3 pr-4 h-button rounded-lg justify-center items-center gap-1 inline-flex bg-[#1A1A37] active:scale-95 transition duration-100 ease-in-out transform focus:outline-none text-xs font-medium text-center text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                    onClick={handleDownloadWallets}
                                >
                                    {/* <IoIosDownload className="text-lg text-green-normal" /> */}
                                    Download Wallets
                                    <img src="/assets/icon/ic_download.svg" width={16} alt="download" />
                                </button>
                                {Object.keys(simulateData).length > 0 && <button
                                    className="pl-3 pr-4 h-button rounded-lg justify-center items-center gap-1 inline-flex bg-[#1A1A37] active:scale-95 transition duration-100 ease-in-out transform focus:outline-none text-xs font-medium text-center text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                    onClick={handleDownloadSimulateData}
                                >
                                    {/* <IoIosDownload className="text-lg text-green-normal" /> */}
                                    Download Simulation Data
                                    <img src="/assets/icon/ic_download.svg" width={16} alt="download" />
                                </button>}
                                <button
                                    className="pl-3 pr-4 h-button rounded-lg justify-center items-center gap-1 inline-flex bg-[#1A1A37] active:scale-95 transition duration-100 ease-in-out transform focus:outline-none text-xs font-medium text-center text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                    disabled={disabled}
                                    onClick={handleSetTokenAmounts}
                                >
                                    {/* <FaDatabase className="text-sm text-green-normal" /> */}
                                    Set token amount
                                    <img src="/assets/icon/ic_database.svg" width={16} alt="download" />
                                </button>
                                <button
                                    className="pl-3 pr-4 h-button rounded-lg justify-center items-center gap-1 inline-flex bg-[#1A1A37] active:scale-95 transition duration-100 ease-in-out transform focus:outline-none text-xs font-medium text-center text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                    disabled={disabled}
                                    onClick={handleSetETHAmounts}
                                >
                                    {/* <FaEthereum className="text-sm text-green-normal" /> */}
                                    Set ETH amount
                                    <img src="/assets/icon/ic_ethereum.svg" width={16} alt="download" />
                                </button>
                            </div>
                        </div>
                        <div className="w-full grow h-[30%] overflow-visible font-sans ">
                            <div className="flex flex-col w-full h-full text-white bg-transparent bg-clip-border">
                                <div className="w-full h-full relative border border-gray-highlight rounded-lg">
                                    {
                                        currentProject.teamWallets && currentProject.wallets &&
                                        <div className="absolute -left-[23px] top-[8px] z-10 text-xxs text-center text-white font-bold uppercase -rotate-90">User</div>
                                    }
                                    <div className={`h-full overflow-y-auto`}>
                                        {(!currentProject.wallets || currentProject.wallets.length === 0) &&
                                            <div className="absolute flex items-center justify-center gap-2 my-3 text-base font-bold text-center uppercase -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 text-gray-border">
                                                <FaExclamationTriangle className="text-sm opacity-50 text-green-normal" /> No Wallet
                                            </div>
                                        }
                                        <table className="min-w-[700px] w-full text-xs">
                                            <thead className=" text-gray-normal">
                                                <tr className="uppercase h-7 bg-[#1A1A37] sticky top-0 z-10">
                                                    <th className="w-8 text-center">
                                                        <div className="flex items-center justify-center">
                                                            <input type="checkbox"
                                                                className="w-4 h-4 outline-none bg-gray-highlight opacity-20 accent-green-normal ring-0 rounded-lg"
                                                                checked={walletAllChecked}
                                                                onChange={handleWalletAllChecked} />
                                                        </div>
                                                    </th>
                                                    <th className="w-8">
                                                        <p className="leading-none text-center">
                                                            #
                                                        </p>
                                                    </th>
                                                    <th className="">
                                                        <p className="leading-none text-center">
                                                            Address
                                                        </p>
                                                    </th>
                                                    <th className="">
                                                        <p className="leading-none text-left">
                                                            ETH Balance
                                                        </p>
                                                    </th>
                                                    <th className="">
                                                        <p className="leading-none text-left">
                                                            Token Balance
                                                        </p>
                                                    </th>
                                                    <th className="w-[15%]">
                                                        <p className="leading-none text-center">
                                                            Tokens to buy
                                                        </p>
                                                    </th>
                                                    <th className="w-[15%]">
                                                        <p className="leading-none text-center">
                                                            Additional ETH
                                                        </p>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-xs text-white" onMouseLeave={handleMouseUp}>
                                                {
                                                    currentProject.wallets &&
                                                    currentProject.wallets.map((item, index) => {
                                                        return (
                                                            <tr key={index}
                                                                className={`${walletChecked[index] ? "bg-[#222222]/50" : index % 2 === 1 ? "bg-[#20223765]" : ""} hover:bg-[#ffffff33] h-12`}
                                                            >
                                                                <td className="text-center"
                                                                    onMouseDown={(e) => handleMouseDown(e, index)}
                                                                    onMouseEnter={() => handleMouseEnter(index)}
                                                                    onMouseUp={handleMouseUp}
                                                                >
                                                                    <div className="flex items-center justify-center">
                                                                        <input type="checkbox"
                                                                            className="w-4 h-4 outline-none bg-gray-highlight opacity-20 accent-green-normal ring-0 rounded-lg"
                                                                            checked={walletChecked[index]}
                                                                        />
                                                                    </div>
                                                                </td>
                                                                <td className="">
                                                                    <p className="leading-none text-center text-gray-normal">
                                                                        {index + 1}
                                                                    </p>
                                                                </td>
                                                                <td className="">
                                                                    <div className="flex items-center justify-center gap-1 antialiased font-normal leading-normal text-gray-normal">
                                                                        <p className="bg-transparent border-none outline-none">
                                                                            {/* {item.address} */}
                                                                            {ellipsisAddress(item.address, 12)}
                                                                        </p>
                                                                        {
                                                                            copied["wallet_" + index] ?
                                                                                (<svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                                </svg>) :
                                                                                (<FaRegCopy className="w-3 h-3 transition duration-100 ease-in-out transform cursor-pointer active:scale-95" onClick={() => copyToClipboard("wallet_" + index, item.address)} />)
                                                                        }
                                                                    </div>
                                                                </td>
                                                                <td className="">
                                                                    <p className="flex items-center justify-start text-yellow-normal">
                                                                        <FaEthereum className="mr-1 opacity-50 text-gray-normal" />
                                                                        {walletEthBalance[index]}
                                                                    </p>
                                                                </td>
                                                                <td className="">
                                                                    <p className="flex items-center justify-start text-white">
                                                                        <FaDatabase className="mr-1 opacity-50 text-xxs text-gray-normal" />
                                                                        <span>{Number(walletTokenBalance[index]?.split(".")[0] ?? "0").toLocaleString()}</span>
                                                                        <span className="font-normal text-gray-normal">.{walletTokenBalance[index]?.split(".")[1] ?? "00"}</span>
                                                                    </p>
                                                                </td>
                                                                <td className="text-center">
                                                                    <input
                                                                        className="outline-none border border-gray-highlight font-medium text-yellow-normal placeholder:text-gray-border text-xs px-2.5 bg-transparent text-center w-[150px] h-[26px] rounded-lg"
                                                                        disabled={disabled}
                                                                        // value={`${Number(walletTokenAmount[index]?.split(".")[0] ?? "0").toLocaleString()}.${walletTokenAmount[index]?.split(".")[1] ?? ""}`}
                                                                        value={Number(walletTokenAmount[index]).toLocaleString()}
                                                                        onChange={(e) => {
                                                                            const rawValue = e.target.value.replace(/\D/g, "");
                                                                            handleWalletChanged(index, "token_amount", rawValue)
                                                                        }}
                                                                    />
                                                                </td>
                                                                <td className="text-center">
                                                                    <input
                                                                        className="outline-none border border-gray-highlight font-medium text-yellow-normal placeholder:text-gray-border text-xs px-2.5 bg-transparent text-center w-[100px] h-[26px] rounded-lg"
                                                                        disabled={disabled}
                                                                        value={walletEthAmount[index]}
                                                                        onChange={(e) => handleWalletChanged(index, "eth_amount", e.target.value)} />
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                }
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                {/* {currentProject.teamWallets &&
                            (
                                <div className="relative mt-[5px] border border-gray-highlight rounded-lg">
                                    <div className="absolute -left-[23px] top-[8px] z-10 text-xxs text-center text-white font-bold uppercase -rotate-90">Team</div>
                                    <div className="h-[190px] overflow-y-auto">
                                        <table className="w-full text-xs min-w-[700px]">
                                            <thead className=" text-gray-normal">
                                                <tr className="uppercase bg-[#1A1A37] sticky top-0 z-10 h-7">
                                                    <th className="w-8 text-center">
                                                        <div className="flex items-center justify-center">
                                                            <input type="checkbox"
                                                                className="w-4 h-4 outline-none bg-gray-highlight opacity-20 accent-green-normal ring-0 rounded-lg"
                                                                checked={teamWalletAllChecked}
                                                                onChange={handleTeamWalletAllChecked} />
                                                        </div>
                                                    </th>
                                                    <th className="w-8">
                                                        <p className="leading-none text-center">
                                                            #
                                                        </p>
                                                    </th>
                                                    <th className="">
                                                        <p className="leading-none text-center">
                                                            Address
                                                        </p>
                                                    </th>
                                                    <th className="">
                                                        <p className="leading-none text-left">
                                                            ETH Balance
                                                        </p>
                                                    </th>
                                                    <th className="">
                                                        <p className="leading-none text-left">
                                                            Token Balance
                                                        </p>
                                                    </th>
                                                    <th className="w-[15%]">
                                                        <p className="leading-none text-center">
                                                            Tokens to buy
                                                        </p>
                                                    </th>
                                                    <th className="w-[15%]">
                                                        <p className="leading-none text-center">
                                                            Additional ETH
                                                        </p>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="">
                                                {
                                                    currentProject.teamWallets.map((item, index) => {
                                                        return (
                                                            <tr key={index}
                                                                className={`${index % 2 === 1 && "bg-[#ffffff02]"} hover:bg-[#ffffff08] ${teamWalletChecked[index] && "!bg-[#00000030]"} h-8`}
                                                            >
                                                                <td className="text-center">
                                                                    <div className="flex items-center justify-center">
                                                                        <input type="checkbox"
                                                                            className="w-4 h-4 outline-none bg-gray-highlight opacity-20 accent-green-normal ring-0 rounded-lg"
                                                                            checked={teamWalletChecked[index]}
                                                                            onChange={(e) => handleTeamWalletChanged(index, "checked", e.target.value)} />
                                                                    </div>
                                                                </td>
                                                                <td className="">
                                                                    <p className="leading-none text-center text-gray-normal">
                                                                        {index + 1}
                                                                    </p>
                                                                </td>
                                                                <td className="">
                                                                    <div className="flex items-center justify-center gap-1 antialiased font-normal leading-normal text-gray-normal">
                                                                        <p className="bg-transparent border-none outline-none">
                                                                            {ellipsisAddress(item.address, true)}
                                                                        </p>
                                                                        {
                                                                            copied["team_wallet_" + index] ?
                                                                                (<svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                                </svg>) :
                                                                                (<FaRegCopy className="w-3 h-3 transition duration-100 ease-in-out transform cursor-pointer active:scale-95" onClick={() => copyToClipboard("team_wallet_" + index, item.address)} />)
                                                                        }
                                                                    </div>
                                                                </td>
                                                                <td className="">
                                                                    <p className="flex items-center justify-start text-yellow-normal">
                                                                        <FaEthereum className="mr-1 opacity-50 text-gray-normal" />
                                                                        {teamWalletEthBalance[index]}
                                                                    </p>
                                                                </td>
                                                                <td className="">
                                                                    <p className="flex items-center justify-start text-white">
                                                                        <FaDatabase className="mr-1 opacity-50 text-xxs text-gray-normal" />
                                                                        <span>{Number(teamWalletTokenBalance[index]?.split(".")[0] ?? "0").toLocaleString()}</span>
                                                                        <span className="font-normal text-gray-normal">.{teamWalletTokenBalance[index]?.split(".")[1] ?? "00"}</span>
                                                                    </p>
                                                                </td>
                                                                <td className="text-center">
                                                                    <input
                                                                        className="outline-none border border-gray-highlight font-medium text-gray-normal placeholder:text-gray-border text-xs px-2.5 bg-transparent text-center w-[150px] h-[26px] rounded-lg"
                                                                        disabled={disabled}
                                                                        value={teamWalletTokenAmount[index]} />
                                                                </td>
                                                                <td className="text-center">
                                                                    <p className="leading-none text-center text-gray-normal" />
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                }
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )
                        } */}
                            </div>
                        </div>
                        <div className="relative flex flex-col items-end mt-3 text-white bg-transparent bg-clip-border">
                            <div className="flex items-center gap-3 text-nowrap text-sm text-gray-normal">
                                Bundle Token Amount: <span className="text-white">{`${Number(getSelectedTokenBalance()?.split(".")[0] ?? "0").toLocaleString()}.${getSelectedTokenBalance()?.split(".")[1] ?? "00"}`}</span>
                            </div>
                            <div className="ml-1 mb-1 w-full text-xs text-left text-gray-normal whitespace-nowrap">
                                Target Address:
                            </div>
                            <div className="w-full flex items-center justify-between gap-3">
                                {/* <div className="flex items-center text-gray-normal">
                                    <FaGasPump className="text-sm" />
                                    <span className="pl-2 font-medium text-white">{gasPrice}</span>
                                    <IoIosClose className="p-1 text-3xl text-gray-normal" />
                                    <input
                                        className="outline-none border border-gray-border text-white placeholder:text-gray-border text-sm px-1.5 bg-transparent w-14 h-[24px] rounded-lg"
                                        placeholder="125%"
                                        value={gasPriceMultiplier}
                                        onChange={(e) => setGasPriceMultiplier(e.target.value)}
                                    />
                                    <button className="flex items-center justify-center w-6 h-6 ml-1 transition duration-100 ease-in-out transform rounded-full bg-gray-highlight active:scale-90" onClick={handleQueryGasPrice}>
                                        <IoIosRefresh className="text-xs font-bold cursor-pointer text-gray-normal" />
                                    </button>
                                </div> */}
                                <div className="flex items-center gap-3">
                                    <input
                                        className="outline-none border border-gray-border text-white placeholder:text-gray-border text-sm px-2.5 bg-transparent w-full h-button grow max-w-[430px] rounded-lg"
                                        placeholder="Target Wallet Address"
                                        value={targetWallet}
                                        onChange={(e) => setTargetWallet(e.target.value)}
                                    />

                                    <button
                                        className="text-xs font-conthrax font-medium text-center text-white uppercase px-6 h-10 rounded-lg justify-center items-center gap-2.5 bg-gradient-to-br from-[#4B65F1ED] to-[#FA03FF44] active:scale-95 transition duration-100 ease-in-out transform focus:outline-none text-nowrap"
                                        onClick={handleCollectAllEth}
                                    >
                                        Collect All ETH
                                    </button>
                                </div>
                                {/* <button
                                    className="text-xs font-medium text-center text-white uppercase px-6 h-10 rounded-lg justify-center items-center gap-2.5 bg-gradient-to-br from-[#4B65F1ED] to-[#FA03FF44] active:scale-95 transition duration-100 ease-in-out transform focus:outline-none hidden"
                                    onClick={handleMakeDirtyWallets}>
                                    Make Dirty Wallets
                                </button> */}
                                <div className="w-1/4 grow flex items-center justify-center gap-1.5">
                                    <img className="w-6 h-6" src="/assets/icon/ic_info.svg" />
                                    <span className="text-gray-label text-left">When bundling an Ethereum token with a tax, deduct the tax percentage from the total tokens to calculate the accurate amount. For example, if bundling 1 million tokens with a 10% tax, you’ll receive 900,000 tokens (1,000,000 - 10% = 900,000).</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        className="text-xs font-conthrax font-medium text-center text-white uppercase px-6 h-10 rounded-lg justify-center items-center gap-2.5 bg-gradient-to-br from-[#4B65F1ED] to-[#FA03FF44] active:scale-95 transition duration-100 ease-in-out transform focus:outline-none disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed"
                                        disabled={disabled}
                                        onClick={handleSimulate}>
                                        Simulate
                                    </button>
                                    <button
                                        className="text-xs font-conthrax font-medium text-center text-white uppercase px-6 h-10 rounded-lg justify-center items-center gap-2.5 bg-gradient-to-br from-[#4B65F1ED] to-[#FA03FF44] active:scale-95 transition duration-100 ease-in-out transform focus:outline-none disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed"
                                        disabled={disabled}
                                        onClick={handleBuyTokens}>
                                        {template == "Custom" ? "Add Liquidity & Buy" : "Enable & Buy"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div >
            </div>
        </div>
    );
}
