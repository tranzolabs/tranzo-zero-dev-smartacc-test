# Tranzo Money — Smart Account Wallet

> Non-custodial smart wallet with gasless transactions, built on ZeroDev Kernel (EIP-7702) + Base Sepolia.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![ZeroDev](https://img.shields.io/badge/ZeroDev-Kernel_v3.1-7c3aed)](https://zerodev.app)
[![Viem](https://img.shields.io/badge/viem-2.x-blue)](https://viem.sh)
[![Base Sepolia](https://img.shields.io/badge/Chain-Base_Sepolia-0052FF)](https://base.org)

---

## What This Is

Tranzo Money is a **crypto card spending wallet** where:

- Users connect via **MetaMask** or use an **embedded key** (no extension needed)
- Their EOA is the signer for a **ZeroDev Kernel Smart Account**
- **All transactions are gasless** — sponsored by ZeroDev paymaster
- **Virtual card** with spending limits (session keys — coming soon)

```
EOA (signer)           →   Kernel Smart Account   →   ZeroDev Paymaster
(MetaMask / local key)     (your actual wallet)        (sponsors all gas)
```

---

## Features

| Feature | Status |
|---------|--------|
| MetaMask wallet connect | ✅ Done |
| Embedded wallet (generated key) | ✅ Done |
| Private key import | ✅ Done |
| Key export (non-custodial) | ✅ Done |
| ZeroDev Kernel smart account | ✅ Done |
| Gasless transactions (UserOps) | ✅ Done |
| ETH balance display | ✅ Done |
| Send ETH (gasless) | ✅ Done |
| Receive — address + copy | ✅ Done |
| Virtual card UI (3D flip) | ✅ Done |
| Transaction history | 🔜 Next |
| Session key card spending | 🔜 Next |
| USDC gas payment | 🔜 Next |
| Real card settlement | 🔜 Future |

---

## Stack

- **Framework**: Next.js 16 (App Router)
- **Smart Account**: [ZeroDev Kernel v3.1](https://docs.zerodev.app)
- **Standard**: ERC-4337, EntryPoint v0.7
- **Chain**: Base Sepolia (testnet)
- **Paymaster**: ZeroDev UltraRelay (30% less gas)
- **Signing**: viem `LocalAccount` + MetaMask WalletClient
- **Styling**: Vanilla CSS (dark mode, purple/pink gradient)

---

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/tranzolabs/tranzo-zero-dev-smartacc-test.git
cd tranzo-zero-dev-smartacc-test
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Get from: https://dashboard.zerodev.app
NEXT_PUBLIC_ZERODEV_RPC=https://rpc.zerodev.app/api/v3/YOUR_PROJECT_ID/chain/84532
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## How It Works

### Smart Account Creation

```ts
// 1. Start with any EOA key
const eoa = privateKeyToAccount(privateKey)

// 2. Create ECDSA validator
const validator = await signerToEcdsaValidator(publicClient, { signer: eoa, ... })

// 3. Create Kernel smart account (deterministic CREATE2 address)
const account = await createKernelAccount(publicClient, {
  plugins: { sudo: validator },
  entryPoint,
  kernelVersion: KERNEL_V3_1,
})

// 4. Smart account address is always the same for the same EOA key
console.log(account.address) // 0xABCD... (your smart account)
```

### Gasless Transfer

```ts
const kernelClient = createKernelAccountClient({
  account,
  paymaster: { getPaymasterData: (op) => paymasterClient.sponsorUserOperation({ op }) },
})

// User pays ZERO gas
await kernelClient.sendUserOperation({
  callData: await account.encodeCalls([{ to, value, data }]),
})
```

---

## Project Structure

```
tranzo-money/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Loading → Welcome → Home router
│   └── globals.css         # Design system (dark theme)
├── components/
│   ├── WelcomeScreen.tsx   # Connect / Import / Create wallet
│   ├── HomeScreen.tsx      # Dashboard + tab navigation
│   ├── BalanceCard.tsx     # Live ETH balance
│   ├── SendModal.tsx       # Gasless ETH send
│   ├── ReceiveModal.tsx    # Address display + copy
│   ├── VirtualCard.tsx     # 3D flip card UI + spending limits
│   ├── TxHistory.tsx       # Transaction history
│   ├── SettingsModal.tsx   # Key export + wallet flow info
│   └── LoadingScreen.tsx   # Splash screen
└── lib/
    ├── wallet.ts           # ZeroDev core: account, paymaster, send
    └── WalletContext.tsx   # React context: signer, addresses, actions
```

---

## Upcoming

- **Session Keys** — card spending with daily limits, no popup per tx
- **USDC Gas** — pay gas in USDC instead of ETH  
- **Tx History** — live from Blockscout API
- **Multi-chain** — Arbitrum, Optimism
- **Real Card Settlement** — on-chain spend via session key → Visa/Mastercard

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_ZERODEV_RPC` | ZeroDev bundler + paymaster RPC | ✅ Yes |
| `NEXT_PUBLIC_APP_URL` | Public URL (for metadata) | Optional |

---

## Security Notes

- Private keys are stored in **localStorage only** — never sent to any server
- Smart account is non-custodial — only your EOA key can authorize transactions
- You can export your key anytime from Settings ⚙️

---

## License

MIT © [Tranzo Labs](https://github.com/tranzolabs)
