import { createConfig, http, createStorage, cookieStorage } from 'wagmi'
import { defineChain } from 'viem'
import { Web3Auth } from "@web3auth/modal"
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base"
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider"
import { Web3AuthConnector } from "@web3auth/web3auth-wagmi-connector"
import { getDefaultExternalAdapters } from "@web3auth/default-evm-adapter"
import { AccountAbstractionProvider, SafeSmartAccount } from "@web3auth/account-abstraction-provider"

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

const pimlicoAPIKey = import.meta.env.VITE_PIMLICO_API_KEY || "public";

const accountAbstractionProvider = new AccountAbstractionProvider({
    config: {
        chainConfig,
        smartAccountInit: new SafeSmartAccount(),
        bundlerConfig: {
            url: `https://api.pimlico.io/v2/sepolia/rpc?apikey=${pimlicoAPIKey}`,
        },
        paymasterConfig: {
            url: `https://api.pimlico.io/v2/sepolia/rpc?apikey=${pimlicoAPIKey}`,
        },
    },
});

export const web3AuthInstance = new Web3Auth({
    clientId,
    chainConfig,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
    privateKeyProvider,
    accountAbstractionProvider,
})

import { injected } from 'wagmi/connectors'
import { createConnector } from 'wagmi'
import { getAddress, UserRejectedRequestError } from 'viem'

// Custom connector to bypass the broken modal check in the official package
export function customWeb3AuthConnector(web3AuthInstance: any) {
  let provider: any;
  return createConnector((config) => ({
    id: 'web3auth',
    name: 'Web3Auth',
    type: 'web3auth',
    // @ts-ignore
    async connect(parameters: { chainId?: number; isReconnecting?: boolean } = {}) {
      const { chainId } = parameters;
      try {
        config.emitter.emit("message", { type: "connecting" });
        const p: any = await this.getProvider();
        if (!web3AuthInstance.connected) {
          await web3AuthInstance.connect();
        }
        const accounts = await this.getAccounts();
        let currentChainId = await this.getChainId();
        if (chainId && currentChainId !== chainId) {
          if (this.switchChain) {
            const chain = await this.switchChain({ chainId }).catch(() => ({ id: currentChainId }));
            currentChainId = chain?.id ?? currentChainId;
          }
        }
        return { accounts, chainId: currentChainId };
      } catch (err: any) {
        throw new UserRejectedRequestError(err);
      }
    },
    async getAccounts() {
      const p: any = await this.getProvider();
      const accounts = await p.request({ method: "eth_accounts" });
      return accounts.map((x: string) => getAddress(x));
    },
    async getChainId() {
      const p: any = await this.getProvider();
      const chainId = await p.request({ method: "eth_chainId" });
      return Number(chainId);
    },
    async getProvider() {
      if (provider) return provider;
      if (web3AuthInstance.status === "not_ready") {
        try {
          const adapters = await getDefaultExternalAdapters({ options: { clientId, chainConfig } });
          adapters.forEach((adapter: any) => {
            web3AuthInstance.configureAdapter(adapter);
          });

          if (typeof web3AuthInstance.initModal === 'function') {
            await web3AuthInstance.initModal();
          } else {
            await web3AuthInstance.init();
          }
        } catch (e) {
          console.error("Web3Auth init error:", e);
        }
      }
      provider = web3AuthInstance.provider;
      return provider;
    },
    async disconnect() {
      await web3AuthInstance.logout();
    },
    async isAuthorized() {
      try {
        const accounts = await this.getAccounts();
        return !!accounts.length;
      } catch {
        return false;
      }
    },
    onAccountsChanged(accounts) {},
    onChainChanged(chain) {},
    onDisconnect() {},
  }));
}

export const web3AuthConnector = customWeb3AuthConnector(web3AuthInstance);

export const config = createConfig({
    chains: [sepolia],
    transports: {
        [sepolia.id]: http(SEPOLIA_RPC),
    },
    connectors: [web3AuthConnector, injected()],
    storage: createStorage({
        storage: cookieStorage
    }),
    ssr: true,
})

