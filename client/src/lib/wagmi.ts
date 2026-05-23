import { createConfig, http, createStorage, cookieStorage } from 'wagmi'
import { defineChain } from 'viem'
import { Web3Auth } from "@web3auth/modal"
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base"
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider"
import { Web3AuthConnector } from "@web3auth/web3auth-wagmi-connector"

const clientId = "BJI1ggIxFGa8hmqGQxEYXHGjKNkQjWNwMxcpjyXLO7OEFNzon8UC6P1_HDPuM47uikNNUFSZs-PWnYDK4bLB5_c";

const SEPOLIA_RPC = "https://ethereum-sepolia-rpc.publicnode.com";

export const sepolia = defineChain({
    id: 11155111,
    name: 'Ethereum Sepolia',
    nativeCurrency: {
        decimals: 18,
        name: 'Sepolia Ether',
        symbol: 'ETH',
    },
    rpcUrls: {
        default: {
            http: [SEPOLIA_RPC],
        },
    },
    blockExplorers: {
        default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' },
    },
    testnet: true,
})

const chainConfig = {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: "0xaa36a7", // 11155111 in hex
    rpcTarget: SEPOLIA_RPC,
    displayName: "Ethereum Sepolia",
    blockExplorerUrl: "https://sepolia.etherscan.io",
    ticker: "ETH",
    tickerName: "Sepolia Ether",
}

const privateKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig } })

export const web3AuthInstance = new Web3Auth({
    clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
    chainConfig,
    privateKeyProvider,
})

export const web3AuthConnector = Web3AuthConnector({
    web3AuthInstance
})

export const config = createConfig({
    chains: [sepolia],
    transports: {
        [sepolia.id]: http(SEPOLIA_RPC),
    },
    connectors: [web3AuthConnector],
    storage: createStorage({
        storage: cookieStorage
    }),
    ssr: true,
})

