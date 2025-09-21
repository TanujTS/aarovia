import Web3 from "web3";

let web3;

async function connectWallet() {
  if (window.ethereum) {

    await window.ethereum.request({ method: "eth_requestAccounts" });

    web3 = new Web3(window.ethereum);

    const accounts = await web3.eth.getAccounts();
    document.body.innerHTML = `<h3>Connected Account:</h3><pre>${accounts[0]}</pre>`;
    console.log("Connected:", accounts);
  } else {
    alert("MetaMask not found. Please install it!");
  }
}

connectWallet();
