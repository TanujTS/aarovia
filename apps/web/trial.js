import Web3 from 'web3';
// Connect to local Hardhat node
const web3 = new Web3('http://127.0.0.1:8545');
// Example: get accounts
async function getAccounts() {
  const accounts = await web3.eth.getAccounts();
  console.log(accounts);
}
getAccounts();
