AI-Powered Dynamic DeFi Option Vault

This project is a decentralized finance (DeFi) application that enables users to earn passive income by depositing ETH into an automated option vault. The vault executes a covered call writing strategy, selling options to generate yield while managing risk.

Unlike traditional DeFi vaults that rely on static strategies, this system introduces a dynamic, AI-enhanced strategy engine. It leverages real-time market data via Chainlink price feeds and a machine learning model to adjust key parameters such as strike price and collateralization ratio based on market volatility.

The platform includes a fully interactive React-based dashboard, allowing users to:

Deposit and withdraw ETH
Monitor vault performance (APY, Profit/Loss)
View live strategy adjustments
Analyze AI-generated strike recommendations

Additionally, the system supports a mock options lifecycle, including option writing, premium collection, expiry, and settlement, all deployed on a local Hardhat blockchain for demonstration.

To further enhance decision-making, the project includes a backtesting module that simulates historical performance of different strategies, providing users with insights into potential returns and risks.

This project demonstrates a powerful combination of:

DeFi (smart contracts & yield strategies)
AI/ML (strategy optimization)
Oracles (Chainlink price feeds)
Full-stack development (React + Solidity + Python)
