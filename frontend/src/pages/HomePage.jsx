import { useContext } from "react";
import { useChainId, useAccount } from "wagmi";
import { ConnectButton } from '@rainbow-me/rainbowkit';

import spinner from "../assets/images/spinner.svg"
import markDescriptionIcon from "../assets/images/mark-description.png"

import { AppContext } from "../App";
import * as ENV from "../config/env"

export default function HomePage() {

    const siteKey = import.meta.env.VITE_CLOUDFLARE_SITEKEY

    const {
        signWallet,
        signPending
    } = useContext(AppContext);

    const chainId = useChainId()
    const { isConnected, address, connector } = useAccount()

    return (
        <div className="flex flex-col">
            <div className="flex flex-col items-center justify-center h-screen">
                <img src={markDescriptionIcon} className="h-28 w-auto mb-10" />
                <div className="text-white font-bold text-[40px] leading-10" style={{fontFamily: "Conthrax-SB"}}>
                    Welcome To Meme Tools
                </div>
                <div className="w-[600px] flex flex-col mt-2 gap-2">
                    <div className="text-white text-[20px] font-medium mb-10">To Continue please connect your wallet</div>
                    {
                        isConnected && address && connector && ENV.CHAINID_LIST.includes(chainId) &&
                        <button className="flex gap-2 items-center justify-center bg-gradient-sign-message w-full rounded-md text-xl py-3 px-2" onClick={signWallet} disabled={signPending}>
                            {signPending && <img src={spinner} className="w-6 h-6"/>}
                            Sign message
                        </button>
                    }
                    <ConnectButton.Custom>
                        {({
                            account,
                            chain,
                            openAccountModal,
                            openChainModal,
                            openConnectModal,
                            authenticationStatus,
                            mounted,
                        }) => {
                            // Note: If your app doesn't use authentication, you
                            // can remove all 'authenticationStatus' checks
                            const ready = mounted && authenticationStatus !== 'loading';
                            const connected =
                                ready &&
                                account &&
                                chain &&
                                (!authenticationStatus ||
                                    authenticationStatus === 'authenticated');
                            return (
                                <div
                                    {...(!ready && {
                                        'aria-hidden': true,
                                        'style': {
                                            opacity: 0,
                                            pointerEvents: 'none',
                                            userSelect: 'none',
                                        },
                                    })}
                                    className="bg-gradient-sign-message p-px w-full rounded-md text-xl"
                                >
                                    {(() => {
                                        if (!connected) {
                                            return (
                                                <button
                                                    onClick={openConnectModal}
                                                    className="w-full bg-black py-3 px-2 rounded-md"
                                                >
                                                    Connect your wallet
                                                </button>
                                            );
                                        }
                                        if (chain.unsupported) {
                                            return (
                                                <button
                                                    onClick={openChainModal}
                                                    className="w-full bg-black py-3 px-2 rounded-md"
                                                >
                                                    Wrong network
                                                </button>
                                            );
                                        }
                                        return (
                                            <div style={{ display: 'flex', gap: 12 }}>
                                                <button
                                                    className="w-full bg-black py-3 px-2 rounded-md"
                                                    onClick={openAccountModal}>
                                                    {account.displayName}
                                                    {account.displayBalance
                                                        ? ` (${account.displayBalance})`
                                                        : ''}
                                                </button>
                                            </div>
                                        );
                                    })()}
                                </div>
                            );
                        }}
                    </ConnectButton.Custom>
                </div>
                <div className="block flex flex-row mt-2">
                    <div
                        className="cf-turnstile"
                        data-sitekey={siteKey}
                        data-callback="javascriptCallback"
                    ></div>
                </div>
                {/* <div className="flex flex-row gap-2">
                    <div className="relative text-left">
                        <RoundedButton onClick={() => setToggle(!toggle)} className={"flex flex-row justify-between !w-60"}>
                            {Object.keys(currentProject).length === 0 && currentProject.constructor === Object ? "Choose your project..." : currentProject.name}&nbsp;
                            <img src="/assets/icon/ic_arrow_down.svg" alt="down-arrow"></img>
                        </RoundedButton>
                        <div className={`${toggle ? "block" : "hidden"} absolute right-0 z-10 mt-2 origin-top-right rounded-md bg-gray-600 w-full bg-container-secondary max-h-[300px] overflow-y-auto`}>
                            <div className="py-1" role="none">
                                {
                                    projects.map((p, idx) => {
                                        return (
                                            <div
                                                className="text-gray-300 px-4 py-2 flex flex-row items-center justify-between text-sm cursor-pointer hover:bg-slate-500"
                                                key={idx} role="menuitem"
                                                onClick={ () => onClickProject(idx) }
                                            >
                                                {p.name}
                                            </div>
                                        )
                                    })
                                }
                            </div>
                        </div>
                    </div>
                    <RoundedButton onClick={onClickNewProjectButton}>
                        Project&nbsp;
                        <FaPlus className=" text-green-normal"/>
                    </RoundedButton>
                </div>
                <NewProjectDialog isOpen={newProjectDialog}
                    createProject={handleCreateNewProject}
                    checkProject={handleCheckNewProject}
                    onDone={handleDoneCreatingNewProject}
                    onCancel={() => setNewProjectDialog(false)}
                    initialData={{ step: -1, projectName: "" }} /> */}
            </div>
            <div className="text-white text-[14px] tracking-wider fixed bottom-2 left-0 right-0">© 2024 Meme Tools. All rights reserved.</div>
        </div>
    )
}