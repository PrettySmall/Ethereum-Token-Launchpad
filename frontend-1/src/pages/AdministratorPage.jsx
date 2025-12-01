import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaRegCopy, FaWallet, FaCheck, FaEye, FaTrash } from "react-icons/fa";
import { IoIosAdd, IoIosAddCircle, IoIosRefresh } from "react-icons/io";
import { MdOutlineTransferWithinAStation } from "react-icons/md";
import { useAccount, useChainId } from "wagmi";
import { ethers } from "ethers";
import axios from "axios";

import { AppContext } from "../App";
import SaveDisperseContractDialog from "../components/Dialogs/SaveDisperseContractDialog";
import AddExtraWalletDialog from "../components/Dialogs/AddExtraWalletDialog";
import AddEmailDialog from "../components/Dialogs/AddEmailDialog";
import NewProjectDialog from "../components/Dialogs/NewProjectDialog";
import AntiDrainerDialog from "../components/Dialogs/AntiDrainerDialog";
import ConfirmDialog from "../components/Dialogs/ConfirmDialog";
import { useEthersSigner } from "../utils/provider";
import { ellipsisAddress, isValidAddress } from "../utils/methods";
import antiDrainerABI from "../abi/IAntiDrainer.json";
import { FULL_ADMIN } from "../utils/constants";

export default function AdministratorPage({ className }) {
    const {
        SERVER_URL,
        setLoadingPrompt,
        setOpenLoading,
        user,
        users,
        setUsers,
        disperseContract,
        setDisperseContract,
        projects,
        setProjects,
        setCurrentProject,
        antiDrainers,
        setAntiDrainers,
        extraWallets,
        setExtraWallets,
        emails,
        setEmails,
        loadAllProjects,
        loadAllUsers,
        loadAllEmails,
        sigData,
        signingData
    } = useContext(AppContext);
    const navigate = useNavigate();
    const chainId = useChainId();
    const { isConnected } = useAccount();
    const signer = useEthersSigner(chainId);

    const [confirmDialog, setConfirmDialog] = useState(false);
    const [confirmDialogTitle, setConfirmDialogTitle] = useState("");
    const [confirmDialogMessage, setConfirmDialogMessage] = useState("");
    const [confirmDialogAction, setConfirmDialogAction] = useState("");

    const [saveDisperseDialog, setSaveDisperseDialog] = useState(false);
    const [addExtraWalletDialog, setAddExtraWalletDialog] = useState(false);
    const [addEmailDialog, setAddEmailDialog] = useState(false);
    const [newProjectDialog, setNewProjectDialog] = useState(false);
    const [antiDrainerDialog, setAntiDrainerDialog] = useState(false);

    const [targetWallet, setTargetWallet] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [selectedExtraWallet, setSelectedExtraWallet] = useState(null);
    const [copied, setCopied] = useState({});
    const chainName = isConnected ? (chainId === 1 ? "eth" : chainId === 8453 ? "base" : chainId === 5 ? "goerli" : "sepolia") : "eth";

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

    const handleConfirmDialogOK = async () => {
        setSelectedProject(null);
        setConfirmDialog(false);

        const accessToken = localStorage.getItem("access-token");
        if (confirmDialogAction === "delete-user") {
            setLoadingPrompt("Deleting user...");
            setOpenLoading(true);
            try {
                const { data } = await axios.post(`${SERVER_URL}/api/v1/user/delete`,
                    {
                        userId: selectedUser._id,
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
                    setUsers(data.users);
                toast.success("User has been deleted successfully");
            }
            catch (err) {
                console.log(err);
                toast.warn("Failed to delete user");
            }
            setOpenLoading(false);
        }
        else if (confirmDialogAction === "switch-free-user") {
            setLoadingPrompt("Switching user role...");
            setOpenLoading(true);
            try {
                const { data } = await axios.post(`${SERVER_URL}/api/v1/user/switch-free`,
                    {
                        userId: selectedUser._id,
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
                    setUsers(data.users);
                toast.success("User role has been changed successfully");
            }
            catch (err) {
                console.log(err);
                toast.warn("Failed to switch user role");
            }
            setOpenLoading(false);
        }
        else if (confirmDialogAction === "activate-project") {
            setLoadingPrompt("Activating project...");
            setOpenLoading(true);
            try {
                const { data } = await axios.post(`${SERVER_URL}/api/v1/project/activate`,
                    {
                        projectId: selectedProject._id,
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
                    setProjects(data.projects);
                toast.success("Project has been activated successfully");
            }
            catch (err) {
                console.log(err);
                toast.warn("Failed to activate project");
            }
            setOpenLoading(false);
        }
        else if (confirmDialogAction === "delete-project") {
            setLoadingPrompt("Deleting project...");
            setOpenLoading(true);
            try {
                const { data } = await axios.post(`${SERVER_URL}/api/v1/project/delete`,
                    {
                        projectId: selectedProject._id,
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
                    setProjects(data.projects);
                toast.success("Project has been deleted successfully");
            }
            catch (err) {
                console.log(err);
                toast.warn("Failed to delete project");
            }
            setOpenLoading(false);
        }
        else if (confirmDialogAction === "delete-email") {
            setLoadingPrompt("Deleting email...");
            setOpenLoading(true);
            try {
                const { data } = await axios.post(`${SERVER_URL}/api/v1/misc/delete-email`,
                    {
                        emailId: selectedEmail._id,
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
                    setEmails(data.emails);
                toast.success("Email has been deleted successfully");
            }
            catch (err) {
                console.log(err);
                toast.warn("Failed to delete email");
            }
            setOpenLoading(false);
        }
        else if (confirmDialogAction === "delete-extra-wallet") {
            setLoadingPrompt("Deleting extra-wallet...");
            setOpenLoading(true);
            try {
                const { data } = await axios.post(`${SERVER_URL}/api/v1/misc/delete-extra-wallet`,
                    {
                        contactId: selectedExtraWallet._id,
                        sigData,
                        signingData
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                );
                if (data.contacts)
                    setExtraWallets(data.contacts);
                toast.success("Extra-wallet has been deleted successfully");
            }
            catch (err) {
                console.log(err);
                toast.warn("Failed to delete extra-wallet");
            }
            setOpenLoading(false);
        }
    };

    const handleCollectFee = async () => {
        if (!isValidAddress(targetWallet)) {
            toast.warn("Target wallet is invalid");
            return;
        }

        setLoadingPrompt("Collecting fee...");
        setOpenLoading(true);
        try {
            await axios.post(`${SERVER_URL}/api/v1/project/collect-fee`,
                {
                    chainId,
                    targetWallet,
                    sigData,
                    signingData
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
        }
        catch (err) {
            console.log(err);
            toast.warn("Failed to collect fee!");
            setOpenLoading(false);
        }
    };

    const handleDeleteUser = (user) => {
        setSelectedUser(user);
        setConfirmDialogTitle("Delete User");
        setConfirmDialogMessage(`Are you sure that you want to delete "${user.name}"?`);
        setConfirmDialogAction("delete-user");
        setConfirmDialog(true);
    };

    const handleSwitchUser = (user) => {
        setSelectedUser(user);
        setConfirmDialogTitle("Switch User Role");
        setConfirmDialogMessage(`Are you sure that you want to switch the role of "${user.name}"?`);
        setConfirmDialogAction("switch-free-user");
        setConfirmDialog(true);
    };

    const handleActivateProject = (project) => {
        setSelectedProject(project);
        setConfirmDialogTitle("Activate Project");
        setConfirmDialogMessage(`Are you sure that you want to activate "${project.name}"?`);
        setConfirmDialogAction("activate-project");
        setConfirmDialog(true);
    };

    const handleDeleteProject = (project) => {
        setSelectedProject(project);
        setConfirmDialogTitle("Delete Project");
        setConfirmDialogMessage(`Are you sure that you want to delete "${project.name}"?`);
        setConfirmDialogAction("delete-project");
        setConfirmDialog(true);
    };

    const handleViewProject = (project) => {
        setCurrentProject(project);
        if (project.status === "OPEN")
            navigate("/buy");
        else
            navigate("/sell");
    };

    const handleDeleteEmail = (email) => {
        setSelectedEmail(email);
        setConfirmDialogTitle("Delete Email");
        setConfirmDialogMessage(`Are you sure that you want to delete "${email.email}"?`);
        setConfirmDialogAction("delete-email");
        setConfirmDialog(true);
    };

    const handleSaveDisperseContract = async (chainName, contractAddress) => {
        console.log("Saving disperse contract...", chainName, contractAddress);
        setSaveDisperseDialog(false);

        setLoadingPrompt("Saving disperse contract...");
        setOpenLoading(true);
        try {
            let selectedChainId = chainName === "Ethereum" ? 1 : chainName === "Base" ? 8453 : chainName === "Goerli" ? 5 : 11155111;
            const { data } = await axios.post(`${SERVER_URL}/api/v1/misc/save-disperse-contract`,
                {
                    chainId: selectedChainId,
                    address: contractAddress,
                    sigData,
                    signingData
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            setDisperseContract(data.contract);
            toast.success("Disperse contract has been saved successfully");
        }
        catch (err) {
            console.log(err);
            toast.warn("Failed to save disperse contract");
        }
        setOpenLoading(false);
    };

    const handleSaveExtraWallet = async (name, privateKey) => {
        console.log("Saving extra-wallet...", name);
        setAddExtraWalletDialog(false);

        setLoadingPrompt("Saving extra-wallet...");
        setOpenLoading(true);
        try {
            const { data } = await axios.post(`${SERVER_URL}/api/v1/misc/add-extra-wallet`,
                {
                    name: name,
                    privateKey: privateKey,
                    sigData,
                    signingData
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            setExtraWallets(data.contacts);
            toast.success("Extra-wallet has been added successfully");
        }
        catch (err) {
            console.log(err);
            toast.warn("Failed to add extra-wallet");
        }
        setOpenLoading(false);
    };

    const handleDeleteExtraWallet = (extraWallet) => {
        setSelectedExtraWallet(extraWallet);
        setConfirmDialogTitle("Delete Extra-Wallet");
        setConfirmDialogMessage(`Are you sure that you want to delete "${extraWallet.name}"?`);
        setConfirmDialogAction("delete-extra-wallet");
        setConfirmDialog(true);
    };

    const handleSaveEmail = async (name, email) => {
        console.log("Saving email...", name, email);
        setAddEmailDialog(false);

        setLoadingPrompt("Adding email...");
        setOpenLoading(true);
        try {
            const { data } = await axios.post(`${SERVER_URL}/api/v1/misc/add-email`,
                {
                    name: name,
                    email: email,
                    sigData,
                    signingData
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            setEmails(data.emails);
            toast.success("Email has been added successfully");
        }
        catch (err) {
            console.log(err);
            toast.warn("Failed to add email");
        }
        setOpenLoading(false);
    };

    const handleCreateNewProject = async (name) => {
        console.log("Creating new project...", name);
        try {
            const { data } = await axios.post(`${SERVER_URL}/api/v1/project/create`,
                {
                    name: name,
                    chainId: chainId,
                    sigData,
                    signingData
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
                expireTime: data.expireTime
            };
        }
        catch (err) {
            return { error: err };
        }
    };

    const handleCheckNewProject = async (projectId) => {
        console.log("Checking new project...", projectId);
        try {
            const { data } = await axios.post(`${SERVER_URL}/api/v1/project/check-status`,
                {
                    projectId,
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
                return {
                    activated: true,
                };
            }
            else {
                return {
                    expired: data.expired,
                    expireTime: data.expireTime,
                }
            }
        }
        catch (err) {
            return { error: err };
        }
    };

    const handleDoneCreatingNewProject = () => {
        setNewProjectDialog(false);
        loadAllProjects();
    };

    const handleEnableAntiDrainer = async (item) => {
        if (!isConnected) {
            toast.warn("Please connect wallet!");
            return;
        }

        setLoadingPrompt("Enabling anti-drainer...");
        setOpenLoading(true);
        try {
            const enable = item.status === "ENABLED" ? false : true;
            const antiContract = new ethers.Contract(item.address, antiDrainerABI, signer);
            const tx = enable ? await antiContract.enable(item.token) : await antiContract.disable(item.token);
            if (tx)
                await tx.wait();

            const { data } = await axios.post(`${SERVER_URL}/api/v1/project/set-anti-drainer`,
                {
                    projectId: item.projectId,
                    chainId: chainId,
                    token: item.token,
                    address: item.address,
                    sigData,
                    signingData
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            setAntiDrainers(data.adrainers);
            toast.success("Succeed to enable anti-drainer");
        }
        catch (err) {
            console.log(err);
            toast.warn("Failed to enable anti-drainer");
        }
        setOpenLoading(false);
    };

    const handleOKAntiDrainer = async (tokenAddress) => {
        if (!isConnected) {
            toast.warn("Please connect wallet!");
            return;
        }

        if (!isValidAddress(tokenAddress)) {
            toast.warn("Please input token address");
            return;
        }

        setLoadingPrompt("Enabling anti-drainer...");
        setOpenLoading(true);
        try {
            const antiDrainerAddress = (chainId === 1) ? "0x8F3dDE175f89723a8F6EBB06Ac4074D66B324d52" : (chainId === 5) ? "0x3370De4C00032c73c048239644e5a9E28F6b7920" : (chainId === 11155111) ? "0x779d644ef71A936c0950b6EA36996Bb07Beda214" : "";
            const antiContract = new ethers.Contract(antiDrainerAddress, antiDrainerABI, signer);
            const tx = await antiContract.enable(tokenAddress);
            if (tx)
                await tx.wait();

            toast.success("Succeed to enable anti-drainer");
        }
        catch (err) {
            console.log(err);
            toast.warn("Failed to enable anti-drainer");
        }
        setOpenLoading(false);
        setAntiDrainerDialog(false);
    };

    return (
        <div className={`${className} w-[1000px] flex flex-col mx-6 my-3 text-white pr-3`}>
            <ConfirmDialog isOpen={confirmDialog}
                title={confirmDialogTitle}
                message={confirmDialogMessage}
                onOK={handleConfirmDialogOK}
                onCancel={() => setConfirmDialog(false)} />
            <SaveDisperseContractDialog isOpen={saveDisperseDialog} onOK={handleSaveDisperseContract} onClose={() => setSaveDisperseDialog(false)} />
            <AddExtraWalletDialog isOpen={addExtraWalletDialog} onOK={handleSaveExtraWallet} onClose={() => setAddExtraWalletDialog(false)} />
            <AddEmailDialog isOpen={addEmailDialog} onOK={handleSaveEmail} onClose={() => setAddEmailDialog(false)} />
            <NewProjectDialog isOpen={newProjectDialog}
                createProject={handleCreateNewProject}
                checkProject={handleCheckNewProject}
                onDone={handleDoneCreatingNewProject}
                onCancel={() => setNewProjectDialog(false)}
                initialData={{ step: 0, projectName: "" }} />
            <AntiDrainerDialog isOpen={antiDrainerDialog} onOK={handleOKAntiDrainer} onCancel={() => setAntiDrainerDialog(false)} isAntiDrainer={false} />
            {
                user.privilege && user && user.role === "admin" &&
                (
                    <div className="flex flex-col justify-between gap-3 mt-3 2xl:flex-row">
                        <div className="flex flex-col w-full 2xl:w-[50%] border rounded-lg border-gray-highlight pb-4 pt-6 px-4">
                            <div className="flex items-center justify-between w-full h-auto text-xs font-medium text-white uppercase">
                                Disperse Contract
                            </div>
                            <div className="flex flex-col items-center justify-between w-full h-auto gap-3 md:flex-row">
                                <div className="text-sm text-gray-normal whitespace-nowrap">
                                    Contract Address:
                                </div>
                                <div className="flex flex-col items-center w-[80%] gap-5 md:flex-row md:gap-0 justify-between">
                                    <div className="flex items-center text-sm font-normal text-gray-normal">
                                        {
                                            disperseContract[chainName] ?
                                                ellipsisAddress(disperseContract[chainName]) :
                                                "NOT SET"
                                        }
                                        {
                                            disperseContract[chainName] &&
                                            (copied["disperseContract"] ?
                                                (<svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>) :
                                                (<FaRegCopy className="w-3.5 h-3.5 mx-1 text-gray-normal hover:text-white transition ease-in-out transform cursor-pointer active:scale-95 duration-100" onClick={() => copyToClipboard("disperseContract", disperseContract[chainName])} />))
                                        }
                                    </div>
                                    <button
                                        className="pl-3 pr-4 h-button rounded-lg justify-center items-center gap-1 inline-flex bg-[#1A1A37] active:scale-95 transition duration-100 ease-in-out transform focus:outline-none text-xs font-medium text-center text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ml-3"
                                        onClick={() => setSaveDisperseDialog(true)}
                                    >
                                        <IoIosAddCircle className="text-lg text-green-normal" />
                                        Change
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col w-full 2xl:w-[50%] border rounded-lg border-gray-highlight pb-4 pt-6 px-4">
                            <div className="flex items-center justify-between w-full h-auto text-xs font-medium text-white uppercase">
                                Service Fee
                            </div>
                            <div className="flex flex-col items-center justify-between w-full h-auto gap-3 md:flex-row">
                                <div className="text-sm text-gray-normal whitespace-nowrap">
                                    Target Wallet:
                                </div>
                                <div className="flex items-center justify-between gap-3 grow">
                                    <input
                                        className="outline-none border border-gray-border text-white placeholder:text-gray-border text-sm px-2.5 bg-transparent w-full lg:max-w-[200px] h-button focus:border-gray-normal"
                                        placeholder="Enter the target wallet"
                                        onChange={(e) => setTargetWallet(e.target.value)}
                                    />
                                    <button
                                        className="pl-3 pr-4 h-button rounded-lg justify-center items-center gap-1 inline-flex bg-[#1A1A37] active:scale-95 transition duration-100 ease-in-out transform focus:outline-none text-xs font-medium text-center text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                        onClick={handleCollectFee}>
                                        <FaWallet className="text-sm text-green-normal" />
                                        Collect
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
            {
                user && user.role === "admin" &&
                (
                    <div className="mt-6">
                        <div className="flex items-center justify-between w-full h-auto mb-2 text-xs font-medium text-white uppercase">
                            <div className="text-base">
                                All Users
                            </div>
                            <button
                                className="pl-3 pr-4 h-button rounded-lg justify-center items-center gap-1 inline-flex bg-[#1A1A37] active:scale-95 transition duration-100 ease-in-out transform focus:outline-none text-xs font-medium text-center text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap" onClick={() => loadAllUsers()}>
                                <IoIosRefresh className="text-lg text-green-normal" />
                                Refresh
                            </button>
                        </div>
                        <div className="relative flex flex-col w-full overflow-x-hidden text-white bg-transparent border border-gray-highlight rounded-lg">
                            <table className="w-full text-xs">
                                <thead className=" text-gray-normal">
                                    <tr className="uppercase bg-[#1A1A37] sticky top-0 z-10 h-7">
                                        <th className="w-8">
                                            <p className="leading-none text-center">
                                                #
                                            </p>
                                        </th>
                                        <th className="">
                                            <p className="leading-none text-center">
                                                Name
                                            </p>
                                        </th>
                                        <th className="">
                                            <p className="leading-none text-center">
                                                Role
                                            </p>
                                        </th>
                                        <th className="">
                                            <p className="leading-none text-center">
                                                Code
                                            </p>
                                        </th>
                                        <th className="">
                                            <p className="leading-none text-center">
                                                Referral
                                            </p>
                                        </th>
                                        <th className="w-[20%]">
                                            <p className="leading-none text-center">
                                                Action
                                            </p>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs text-gray-normal">
                                    {
                                        users.map((item, index) => {
                                            return (
                                                <tr key={index}
                                                    className={`${index % 2 === 1 && "bg-[#ffffff02]"} hover:bg-[#ffffff05] h-8`}
                                                >
                                                    <td className="text-center">
                                                        {index + 1}
                                                    </td>
                                                    <td className="text-center text-white">
                                                        {item.name}
                                                    </td>
                                                    <td className="text-center">
                                                        {item.role}
                                                    </td>
                                                    <td className="text-center">
                                                        {item.code}
                                                    </td>
                                                    <td className="text-center">
                                                        {item.referral}
                                                    </td>
                                                    <td className="text-center">
                                                        <div className="flex justify-center gap-2">
                                                            <button
                                                                className="relative flex items-center justify-center px-2 h-6 text-xxxs transition ease-in-out transform rounded-[2px] font-medium cursor-pointer active:scale-95 duration-100 bg-gray-highlight text-gray-normal hover:bg-gray-border hover:text-white uppercase"
                                                                onClick={() => handleSwitchUser(item)}
                                                            >
                                                                {/* <FaCheck /> */}
                                                                <MdOutlineTransferWithinAStation className="mr-2 text-xxs text-green-normal"/>
                                                                Switch Role
                                                            </button>
                                                            {
                                                                // (user && user.role === "admin" && !user.privilege) ? (<></>) : (
                                                                    <button
                                                                        className="relative flex items-center justify-center px-2 h-6 text-xxxs transition ease-in-out transform rounded-[2px] font-medium cursor-pointer active:scale-95 duration-100 bg-gray-highlight text-gray-normal hover:bg-gray-border hover:text-white uppercase"
                                                                        onClick={() => handleDeleteUser(item)}
                                                                    >
                                                                        <FaTrash className="mr-2 text-xxs text-green-normal" />
                                                                        Delete
                                                                    </button>
                                                                // )
                                                            }
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    }
                                </tbody>
                            </table>
                            {
                                (users.length === 0) &&
                                (
                                    <div className="my-3 text-sm font-bold text-center text-gray-700 uppercase">
                                        No User
                                    </div>
                                )
                            }
                        </div>
                    </div>
                )
            }
            <div className="mt-6">
                <div className="flex items-center justify-between w-full h-auto mb-2 text-xs font-medium text-white uppercase">
                    <div className="text-base">
                        {user && user.role === "admin" ? "All Projects" : "My Projects"}
                    </div>
                    {
                        user && user.role !== "admin" ?
                            (
                                <div className="flex items-center gap-2">
                                    <button
                                        className="pl-3 pr-4 h-button rounded-lg justify-center items-center gap-1 inline-flex bg-[#1A1A37] active:scale-95 transition duration-100 ease-in-out transform focus:outline-none text-xs font-medium text-center text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                        onClick={() => setNewProjectDialog(true)}>
                                        <IoIosAdd className="text-lg text-green-normal" />
                                        New
                                    </button>
                                    <button
                                        className="pl-3 pr-4 h-button rounded-lg justify-center items-center gap-1 inline-flex bg-[#1A1A37] active:scale-95 transition duration-100 ease-in-out transform focus:outline-none text-xs font-medium text-center text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                        onClick={() => loadAllProjects()}>
                                        <IoIosRefresh className="text-lg text-green-normal" />
                                        Refresh
                                    </button>
                                </div>
                            ) :
                            (
                                <button
                                    className="pl-3 pr-4 h-button rounded-lg justify-center items-center gap-1 inline-flex bg-[#1A1A37] active:scale-95 transition duration-100 ease-in-out transform focus:outline-none text-xs font-medium text-center text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                    onClick={() => loadAllProjects()}>
                                    <IoIosRefresh className="text-lg text-green-normal" />
                                    Refresh
                                </button>
                            )
                    }
                </div>
                <div className="relative flex flex-col w-full overflow-x-hidden text-white bg-transparent border border-gray-highlight rounded-lg">
                    <table className="w-full text-xs">
                        <thead className=" text-gray-normal">
                            <tr className="uppercase bg-[#1A1A37] sticky top-0 z-10 h-7">
                                <th className="w-8">
                                    #
                                </th>
                                {
                                    user && user.role === "admin" &&
                                    (
                                        <th className="">
                                            User Name
                                        </th>
                                    )
                                }
                                <th className="">
                                    {user && user.role === "admin" ? "Project Name" : "Name"}
                                </th>
                                <th className="">
                                    Status
                                </th>
                                <th className="w-[20%]">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="text-xs text-gray-normal">
                            {
                                projects.map((item, index) => {
                                    return (
                                        <tr className={`${index % 2 === 1 && "bg-[#ffffff02]"} hover:bg-[#ffffff05] h-8`} key={`project${index}`}>
                                            <td className="text-center">
                                                {index + 1}
                                            </td>
                                            {
                                                user && user.role === "admin" &&
                                                (
                                                    <td className="text-center">
                                                        {item.userName}
                                                    </td>
                                                )
                                            }
                                            <td className="text-center text-white">
                                                {item.name}
                                            </td>
                                            <td className="text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${(() => {
                                                        switch (item.status) {
                                                            case "INIT":
                                                                return "bg-white";
                                                            case "EXPIRED":
                                                                return "bg-gray-normal";
                                                            case "TRADE":
                                                                return "bg-green-normal";
                                                            default:
                                                                return "bg-green-normal";
                                                        }
                                                    })()}`}></div>
                                                    {item.status}
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <div className="flex justify-center gap-1">
                                                    {
                                                        (item.status === "INIT" || item.status === "EXPIRED") ?
                                                            (
                                                                <button
                                                                    className="relative flex items-center justify-center px-2 h-6 text-xxxs transition ease-in-out transform font-medium rounded-[2px] cursor-pointer active:scale-95 duration-100 bg-gray-highlight text-gray-normal hover:bg-gray-border hover:text-white uppercase"
                                                                    onClick={() => handleActivateProject(item)}
                                                                >
                                                                    <FaCheck className="mr-2 text-xxs text-green-normal" />
                                                                    Activate
                                                                </button>
                                                            ) : 
                                                            // (user && user.role === "admin" && !user.privilege) ? (<></>) :
                                                                (
                                                                    <button
                                                                        className="relative flex items-center justify-center px-2 h-6 text-xxxs transition ease-in-out transform font-medium rounded-[2px] cursor-pointer active:scale-95 duration-100 bg-gray-highlight text-gray-normal hover:bg-gray-border hover:text-white uppercase"
                                                                        onClick={() => handleViewProject(item)}
                                                                    >
                                                                        <FaEye className="mr-2 text-xxs text-green-normal" />
                                                                        Go to project
                                                                    </button>
                                                                )
                                                    }
                                                    {
                                                        // (user && user.role === "admin" && !user.privilege) ? (<></>) : (
                                                            <button
                                                                className="relative flex items-center justify-center px-2 h-6 text-xxxs transition ease-in-out transform rounded-[2px] font-medium cursor-pointer active:scale-95 duration-100 bg-gray-highlight text-gray-normal hover:bg-gray-border hover:text-white uppercase"
                                                                onClick={() => handleDeleteProject(item)}
                                                            >
                                                                <FaTrash className="mr-2 text-xxs text-green-normal" />
                                                                Delete
                                                            </button>
                                                        // )
                                                    }
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            }
                        </tbody>
                    </table>
                    {
                        (projects.length === 0) &&
                        (
                            <div className="my-3 text-sm font-bold text-center text-gray-700 uppercase">
                                No Project
                            </div>
                        )
                    }
                </div>
            </div>
            {
                user.privilege && user && user.role === "admin" &&
                (
                    <div className="mt-6">
                        <div className="flex items-center justify-between w-full h-auto mb-2 text-base font-medium text-white uppercase">
                            <div className="">
                                All Anti-Drainers
                            </div>
                            <button
                                className="pl-3 pr-4 h-button rounded-lg justify-center items-center gap-1 inline-flex bg-[#1A1A37] active:scale-95 transition duration-100 ease-in-out transform focus:outline-none text-xs font-medium text-center text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                onClick={() => setAntiDrainerDialog(true)}
                            >
                                <FaCheck className="text-sm text-green-normal" />
                                Enable New Token
                            </button>
                        </div>
                        <div className="relative flex flex-col w-full overflow-x-hidden text-white bg-transparent border border-gray-highlight rounded-lg">
                            <table className="w-full text-xs">
                                <thead className=" text-gray-normal">
                                    <tr className="uppercase h-7 bg-[#1A1A37] sticky top-0 z-10">
                                        <th className="w-8">
                                            #
                                        </th>
                                        <th className="">
                                            User Name
                                        </th>
                                        <th className="">
                                            Project Name
                                        </th>
                                        <th className="">
                                            Token Address
                                        </th>
                                        <th className="">
                                            Anti-Drainer Address
                                        </th>
                                        <th className="">
                                            Status
                                        </th>
                                        <th className="w-[20%]">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-normal">
                                    {
                                        antiDrainers && antiDrainers.length > 0 && antiDrainers.map((item, index) => {
                                            return (
                                                <tr key={index} className={`${index % 2 === 1 && "bg-[#ffffff02]"} hover:bg-[#ffffff08] h-7`}>
                                                    <td className="text-center">
                                                        {index + 1}
                                                    </td>
                                                    <td className="text-center">
                                                        {item.userName}
                                                    </td>
                                                    <td className="text-center">
                                                        {item.projectName}
                                                    </td>
                                                    <td className="text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <p className="bg-transparent border-none outline-none">
                                                                {ellipsisAddress(item.token)}
                                                            </p>
                                                            {
                                                                copied["antiDrainer_token_" + index] ?
                                                                    (<svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                    </svg>) :
                                                                    (<FaRegCopy className="w-3.5 h-3.5 transition ease-in-out transform cursor-pointer active:scale-95 duration-100" onClick={() => copyToClipboard("antiDrainer_token_" + index, item.token)} />)
                                                            }
                                                        </div>
                                                    </td>
                                                    <td className="text-center text-white">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <p className="bg-transparent border-none outline-none">
                                                                {ellipsisAddress(item.address)}
                                                            </p>
                                                            {
                                                                copied["antiDrainer_address_" + index] ?
                                                                    (<svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                    </svg>) :
                                                                    (<FaRegCopy className="text-gray-normal w-3.5 h-3.5 transition ease-in-out transform cursor-pointer active:scale-95 duration-100" onClick={() => copyToClipboard("antiDrainer_address_" + index, item.address)} />)
                                                            }
                                                        </div>
                                                    </td>
                                                    <td className="text-center">
                                                        {item.status}
                                                    </td>
                                                    <td className="text-center">
                                                        <div className="flex justify-center gap-1 ">
                                                            <button
                                                                className="relative flex items-center justify-center px-2 h-6 text-xxs transition ease-in-out transform font-medium rounded-[2px] cursor-pointer active:scale-95 duration-100 bg-gray-highlight text-gray-normal hover:bg-gray-border hover:text-white uppercase"
                                                                onClick={() => handleEnableAntiDrainer(item)}
                                                            >
                                                                <FaCheck className="mr-2 text-green-normal" />
                                                                {item.status === "ENABLED" ? "Disable" : "Enable"}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    }
                                </tbody>
                            </table>
                            {
                                (antiDrainers && antiDrainers.length === 0) &&
                                (
                                    <div className="my-3 text-sm font-bold text-center text-gray-700 uppercase">
                                        No Anti-Drainer
                                    </div>
                                )
                            }
                        </div>
                    </div>
                )
            }
            {
                user.privilege && user && user.role === "admin" &&
                (
                    <div className="mt-6">
                        <div className="flex items-center justify-between w-full h-auto mb-2 text-base font-medium text-white uppercase">
                            <div className="">
                                All Extra-Wallets
                            </div>
                            <button
                                className="pl-3 pr-4 h-button rounded-lg justify-center items-center gap-1 inline-flex bg-[#1A1A37] active:scale-95 transition duration-100 ease-in-out transform focus:outline-none text-xs font-medium text-center text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                onClick={() => setAddExtraWalletDialog(true)}>
                                <IoIosAdd className="text-lg text-green-normal" />
                                Add New
                            </button>
                        </div>
                        <div className="relative flex flex-col w-full overflow-x-hidden text-white bg-transparent border border-gray-highlight rounded-lg">
                            <table className="w-full text-xs">
                                <thead className=" text-gray-normal">
                                    <tr className="uppercase h-7 bg-[#1A1A37] sticky top-0 z-10">
                                        <th className="w-8">
                                            #
                                        </th>
                                        <th className="">
                                            Name
                                        </th>
                                        <th className="">
                                            Address
                                        </th>
                                        <th className="w-[20%]">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-normal">
                                    {
                                        extraWallets && extraWallets.length > 0 && extraWallets.map((item, index) => {
                                            return (
                                                <tr key={index} className={`${index % 2 === 1 && "bg-[#ffffff02]"} hover:bg-[#ffffff08] h-7`}>
                                                    <td className="text-center">
                                                        {index + 1}
                                                    </td>
                                                    <td className="text-center">
                                                        {item.name}
                                                    </td>
                                                    <td className="text-center">
                                                        <div className="flex items-center justify-center gap-1 m-auto min-w-8">
                                                            <p className="">{ellipsisAddress(item.address)}</p>
                                                            {
                                                                copied["extraWallets_" + index] ?
                                                                    (<svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                    </svg>) :
                                                                    (<FaRegCopy className="w-3.5 h-3.5 transition ease-in-out transform cursor-pointer active:scale-95 duration-100" onClick={() => copyToClipboard("extraWallets_" + index, item.address)} />)
                                                            }
                                                        </div>
                                                    </td>
                                                    <td className="text-center">
                                                        <div className="flex justify-center">
                                                            <button
                                                                className="relative flex items-center justify-center px-2 h-6 text-xxs transition ease-in-out transform rounded-[2px] font-medium cursor-pointer active:scale-95 duration-100 bg-gray-highlight text-gray-normal hover:bg-gray-border hover:text-white uppercase"
                                                                onClick={() => handleDeleteExtraWallet(item)}
                                                            >
                                                                <FaTrash className="mr-2 text-green-normal" />
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    }
                                </tbody>
                            </table>
                            {
                                (extraWallets && extraWallets.length === 0) &&
                                (
                                    <div className="my-3 text-sm font-bold text-center text-gray-700 uppercase">
                                        No Extra Wallet
                                    </div>
                                )
                            }
                        </div>
                    </div>
                )
            }
            {
                user.privilege && user && user.role === "admin" &&
                (
                    <div className="mt-6">
                        <div className="flex items-center justify-between w-full h-auto mb-2 text-base font-medium text-white uppercase">
                            <div className="">
                                All Emails
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    className="pl-3 pr-4 h-button rounded-lg justify-center items-center gap-1 inline-flex bg-[#1A1A37] active:scale-95 transition duration-100 ease-in-out transform focus:outline-none text-xs font-medium text-center text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                    onClick={() => setAddEmailDialog(true)}>
                                    <IoIosAdd className="text-lg text-green-normal" />
                                    Add New Email
                                </button>
                                <button
                                    className="pl-3 pr-4 h-button rounded-lg justify-center items-center gap-1 inline-flex bg-[#1A1A37] active:scale-95 transition duration-100 ease-in-out transform focus:outline-none text-xs font-medium text-center text-white uppercase disabled:text-gray-border disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                    onClick={() => loadAllEmails()}>
                                    <IoIosRefresh className="text-lg text-green-normal" />
                                    Refresh
                                </button>
                            </div>
                        </div>
                        <div className="relative flex flex-col w-full overflow-x-hidden text-white bg-transparent border border-gray-highlight rounded-lg">
                            <table className="w-full text-xs">
                                <thead className=" text-gray-normal">
                                    <tr className="uppercase h-7 bg-[#1A1A37] sticky top-0 z-10">
                                        <th className="w-8">
                                            #
                                        </th>
                                        <th className="">
                                            Name
                                        </th>
                                        <th className="">
                                            Email
                                        </th>
                                        <th className="w-[20%]">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-normal">
                                    {
                                        emails.map((item, index) => {
                                            return (
                                                <tr key={index} className={`${index % 2 === 1 && "bg-[#ffffff02]"} hover:bg-[#ffffff08] h-7`}>
                                                    <td className="text-center">
                                                        {index + 1}
                                                    </td>
                                                    <td className="text-center">
                                                        {item.name}
                                                    </td>
                                                    <td className="text-center text-white">
                                                        <div className="flex items-center justify-center gap-1 m-auto">
                                                            <p className="">{item.email}</p>
                                                            {
                                                                copied["email_" + index] ?
                                                                    (<svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                    </svg>) :
                                                                    (<FaRegCopy className="text-gray-normal w-3.5 h-3.5 transition ease-in-out transform cursor-pointer active:scale-95 duration-100" onClick={() => copyToClipboard("email_" + index, item.email)} />)
                                                            }
                                                        </div>
                                                    </td>
                                                    <td className="text-center">
                                                        <div className="flex justify-center">
                                                            <button className="relative flex items-center justify-center px-2 h-6 text-xxs transition ease-in-out transform rounded-[2px] font-medium cursor-pointer active:scale-95 duration-100 bg-gray-highlight text-gray-normal hover:bg-gray-border hover:text-white uppercase" onClick={() => handleDeleteEmail(item)}>
                                                                <FaTrash className="mr-2 text-green-normal" />
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    }
                                </tbody>
                            </table>
                            {
                                (emails.length === 0) &&
                                (
                                    <div className="my-3 text-sm font-bold text-center text-gray-700 uppercase">
                                        No Email
                                    </div>
                                )
                            }
                        </div>
                    </div>
                )
            }
        </div >
    );
}
