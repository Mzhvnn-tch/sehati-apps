import { createStorage, cookieStorage } from 'wagmi'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
// mainnet and sepolia removed to force Lisk Sepolia
import { type AppKitNetwork } from '@reown/appkit/networks'
import { defineChain } from '@reown/appkit/networks'

export const projectId = '0f835a14e7056382454b2d9f13a0be56'

// Define Lisk Sepolia manually as it might not be in the default export
export const liskSepolia = defineChain({
    id: 4202,
    caipNetworkId: 'eip155:4202',
    chainNamespace: 'eip155',
    name: 'Lisk Sepolia',
    nativeCurrency: {
        decimals: 18,
        name: 'Lisk',
        symbol: 'LSK',
    },
    rpcUrls: {
        default: {
            http: ['https://rpc.sepolia-api.lisk.com'],
            webSocket: ['wss://ws.sepolia-api.lisk.com'],
        },
    },
    blockExplorers: {
        default: { name: 'Blockscout', url: 'https://sepolia-blockscout.lisk.com' },
    },
    testnet: true,
})

export const networks = [liskSepolia] as [AppKitNetwork, ...AppKitNetwork[]]

export const wagmiAdapter = new WagmiAdapter({
    storage: createStorage({
        storage: cookieStorage
    }),
    ssr: true,
    projectId,
    networks
})

export const config = wagmiAdapter.wagmiConfig
