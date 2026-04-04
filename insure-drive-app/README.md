# Insure Drive 🚗⚡

**AI-Powered Parametric Insurance for Delivery & Ride-Share Drivers**

Insure Drive is a decentralized, fully on-chain Web3 application built on the **Sepolia Testnet**. It protects gig economy workers from income loss caused by extreme real-world disruptions (Torrential Rain, Heatwaves, and Toxic Smog) through instant, mathematically guaranteed smart contract payouts.

---

## 🏆 Key Hackathon Features

### 1. Dynamic AI Pricing Engine
Traditional insurance relies on static geographical risk models. Insure Drive integrates a real-time **Machine Learning Engine** that polls localized APIs (Weather, Humidity, AQI) to actively calculate localized risk scores. The weekly premium automatically dynamically adjusts (e.g., adding ₹12 during high-risk monsoons, or discounting premiums in safe zones) before enrollment.

### 2. Multi-Oracle Automated Triggers
We eliminate human insurance adjusters entirely. The smart contract relies on an automated decentralized Oracle network. When multiple independent nodes (mocked in our UI for presentation purposes) sign a `voteEvent` transaction confirming a disruption threshold has been breached (e.g., Temperature > 40°C), the event automatically unlocks on the blockchain.

### 3. Zero-Touch Algorithmic Payouts
Once the Oracle threshold is met, the "Intelligent Claim" system activates instantly. Riders simply push a single button to execute `claimPayout()`, dropping precisely calculated Ethereum (Ξ) directly into their MetaMask wallets. No arbitrary rejections, no paperwork, and no processing delays.

---

## 🛠️ Technology Stack

- **Frontend:** Next.js 14, React, TailwindCSS, Framer Motion
- **Blockchain Connectivity:** Ethers.js (v6)
- **Smart Contracts:** Solidity (Deployed on Sepolia)
- **Web3 Wallet Auth:** MetaMask Browser Injection

---

## 🚀 Local Deployment

### 1. Clone the repository & install dependencies
```bash
git clone https://github.com/Imortal-Ajay/insure-drive.git
cd insure-drive/insure-drive-app
npm install
```

### 2. Required Environment Variables
Create a `.env.local` file in the root of the project to point the interface to the deployed Smart Contract:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS="YOUR_SEPOLIA_CONTRACT_ADDRESS_HERE"
```

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. 

---

## 🚘 Using the Platform (Demo Flow)

1. **Connect Wallet:** Ensure MetaMask is set to the **Sepolia Testnet**.
2. **Review AI Underwriting:** Select your operating zone and verify the dynamically ML-adjusted premium.
3. **Enroll Policy:** Click _Activate Policy_ to execute `enrollRider` on-chain.
4. **Trigger Oracles:** Scroll down to the *Automated Trigger Oracle* and simulate two separate nodes voting for a disruption. 
5. **Intelligent Claim:** Watch the UI automatically transition from *Monitoring* to *Claim Ready* and instantly deposit funds into your wallet.
