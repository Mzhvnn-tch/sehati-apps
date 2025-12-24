import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { mainnet, lisk } from '@reown/appkit/networks';
import type { AppKitNetwork } from '@reown/appkit/networks';

const projectId = '0f835a14e7056382454b2d9f13a0be56';

const metadata = {
  name: 'SEHATI',
  description: 'Secure, decentralized health identity management',
  url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000',
  icons: ['https://avatars.githubusercontent.com/u/179229932'],
};

const networks: [AppKitNetwork, ...AppKitNetwork[]] = [mainnet, lisk];

const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true,
});

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  features: {
    analytics: true,
  },
});

export { wagmiAdapter };
