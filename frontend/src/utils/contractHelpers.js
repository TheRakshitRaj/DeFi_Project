import { ethers } from "ethers";
import VaultABI from "../abis/Vault.json";
import StrategyABI from "../abis/StrategyManager.json";
import addresses from "../abis/addresses.json";

export const getProvider = () => {
    if (!window.ethereum) throw new Error("MetaMask not found");
    return new ethers.providers.Web3Provider(window.ethereum);
};

export const getSigner = async () => {
    const p = getProvider();
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
