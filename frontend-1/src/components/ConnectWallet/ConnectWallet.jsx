import { DefaultButton, RoundedButton } from "../Buttons/Buttons";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { GradientDiv } from "../Primary/Elements";

const ConnectWallet = () => {
    return (
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
                    <div className="h-full"
                        {...(!ready && {
                            'aria-hidden': true,
                            'style': {
                                opacity: 0,
                                pointerEvents: 'none',
                                userSelect: 'none',
                            },
                        })}
                    >
                        {(() => {
                            if (!connected) {
                                return (
                                    <RoundedButton
                                        sm='true'
                                        onClick={openConnectModal}
                                        className={"bg-gradient-blue-to-purple border-none outline-none"}
                                    >
                                        Connect
                                    </RoundedButton>
                                );
                            }
                            if (chain.unsupported) {
                                return (
                                    <RoundedButton
                                        sm='true'
                                        onClick={openChainModal}
                                        className={"bg-gradient-blue-to-purple border-none outline-none"}
                                    >
                                        Wrong
                                    </RoundedButton>
                                );
                            }
                            return (
                                <div className="h-full flex gap-1.5">
                                    <RoundedButton
                                        sm='true'
                                        onClick={openChainModal}
                                        className={"bg-black rounded-md flex flex-row items-center px-2"}
                                    >
                                        {chain.hasIcon && (
                                            <div className="flex flex-row items-center gap-2">
                                                {chain.iconUrl && (
                                                    <img
                                                        alt={chain.name ?? 'Ethereum'}
                                                        src={chain.iconUrl}
                                                        width={20}
                                                        height={20}
                                                    />
                                                )}
                                                {chain.name}
                                            </div>
                                        )}
                                    </RoundedButton>
                                    <RoundedButton
                                        className={"bg-gradient-blue-to-purple !py-0 flex-col border-none hover:outline-0 hover:brightness-125 px-2"}
                                        sm='true'
                                        style={{width: "100px"}}
                                        onClick={openAccountModal}>
                                        {account.displayName}
                                        <span>
                                            {account.displayBalance
                                                ? ` (${account.displayBalance})`
                                                : ''}</span>
                                    </RoundedButton>
                                </div>
                            );
                        })()}
                    </div>
                );
            }}
        </ConnectButton.Custom>
    );
};

export default ConnectWallet;
