import { ethers } from "ethers";

const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
const CONTRACT_ADDRESS = "0xa913A07bD88C94E5230d1521Ac25aDD9a1AA7067"; 
const WALLET_ADDRESS = "0xd68BcB873Adc7897E3E97540aB1095D41fF432b9";

const ABI = [
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function PATIENT_ROLE() view returns (bytes32)",
  "function DOCTOR_ROLE() view returns (bytes32)"
];

async function check() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

  const patientRole = await contract.PATIENT_ROLE();
  const doctorRole = await contract.DOCTOR_ROLE();

  const isPatient = await contract.hasRole(patientRole, WALLET_ADDRESS);
  const isDoctor = await contract.hasRole(doctorRole, WALLET_ADDRESS);

  console.log(`Wallet: ${WALLET_ADDRESS}`);
  console.log(`Is Patient? ${isPatient}`);
  console.log(`Is Doctor?  ${isDoctor}`);
}

check();
