// src/config/reown.ts
import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, polygon, arbitrum, optimism, base } from '@reown/appkit/networks'

// 1. Get projectId from https://cloud.reown.com
export const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || '4d0d8421a091e769c3306153621ea088'

// 2. Set up Wagmi adapter
export const networks = [mainnet, polygon, arbitrum, optimism, base]

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
})

// 3. Configure metadata
export const metadata = {
  name: 'DeFi México Hub',
  description: 'El Hub #1 de DeFi en México',
  url: 'https://defimexico.org',
  icons: ['https://defimexico.org/icon.png']
}

// 4. Create modal
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  features: {
    analytics: true,
    email: false,
    socials: [],
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#10b981', // emerald-500
    '--w3m-border-radius-master': '0.5rem',
  }
})

export const config = wagmiAdapter.wagmiConfig
