import React from 'react';
import { usePublicClient, useWalletClient } from 'wagmi';
import { FallbackProvider, JsonRpcProvider, BrowserProvider, JsonRpcSigner } from 'ethers';

function publicClientToProvider(publicClient) {
    const { chain, transport } = publicClient;
    const network = {
        chainId: chain.id,
        name: chain.name,
        ensAddress: chain.contracts?.ensRegistry?.address,
    };
    if (transport.type === 'fallback') {
        const providers = transport.transports.map(({ value }) => new JsonRpcProvider(value?.url, network));
        if (providers.length === 1)
            return providers[0];
        return new FallbackProvider(providers);
    }
    return new JsonRpcProvider(transport.url, network);
}

function walletClientToSigner(walletClient) {
    const { account, chain, transport } = walletClient;
    const network = {
        chainId: chain.id,
        name: chain.name,
        ensAddress: chain.contracts?.ensRegistry?.address,
    };
    const provider = new BrowserProvider(transport, network);
    const signer = new JsonRpcSigner(provider, account.address);
    return signer;
}

/** Hook to convert a viem Public Client to an ethers.js Provider. */
export function useEthersProvider({ chainId }) {
    const publicClient = usePublicClient({ chainId });
    return React.useMemo(() => publicClientToProvider(publicClient), [publicClient]);
}

/** Hook to convert a viem Wallet Client to an ethers.js Signer. */
export function useEthersSigner({ chainId }) {
    const { data: walletClient } = useWalletClient({ chainId });
    return React.useMemo(() => (walletClient ? walletClientToSigner(walletClient) : undefined), [walletClient]);
}
