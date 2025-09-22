import { ethers } from "ethers"
import { MEDICAL_RECORDS_STORAGE_ABI } from "@repo/web3"

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

const contract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS!,
    MEDICAL_RECORDS_STORAGE_ABI,
    provider
)

export default contract;