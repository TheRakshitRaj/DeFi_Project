import { ethers } from "ethers";
import VaultABI from "../abis/Vault.json";
import StrategyABI from "../abis/StrategyManager.json";
import addresses from "../abis/addresses.json";

const HARDHAT_RPC = "http://127.0.0.1:8545";

// Read-only provider: uses MetaMask if available, otherwise falls back to Hardhat RPC
export const getProvider = () => {
    if (window.ethereum) {
        return new ethers.providers.Web3Provider(window.ethereum);
    }
    // Fallback: connect directly to the Hardhat node for read-only operations
    return new ethers.providers.JsonRpcProvider(HARDHAT_RPC);
};

// Signer: always requires MetaMask — used only for transactions
export const getSigner = async () => {
    if (!window.ethereum) throw new Error("MetaMask not found. Connect your wallet to make transactions.");
    const p = new ethers.providers.Web3Provider(window.ethereum);
    await p.send("eth_requestAccounts", []);
    return p.getSigner();
};

export const getVaultContract = async (withSigner = false) => {
    const sp = withSigner ? await getSigner() : getProvider();
    return new ethers.Contract(addresses.Vault, VaultABI, sp);
};

export const getStrategyContract = async () =>
    new ethers.Contract(addresses.StrategyManager, StrategyABI, getProvider());

export const fmt = (val) => ethers.utils.formatEther(val || "0");
export const parse = (val) => ethers.utils.parseEther(val.toString());
