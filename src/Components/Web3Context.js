import React, { createContext, useContext, useEffect, useState } from "react";
import Web3 from "web3";
import DocumentTrackingABI from "../contracts/DocumentTracking.json";

const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);

  useEffect(() => {
    const initWeb3 = async () => {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);

        // Cek apakah akun sudah terhubung
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });

        if (accounts.length > 0) {
          // Jika akun sudah terhubung, inisialisasi kontrak
          const networkId = await web3Instance.eth.net.getId();
          const deployedNetwork = DocumentTrackingABI.networks[networkId];
          const contractInstance = new web3Instance.eth.Contract(
            DocumentTrackingABI.abi,
            deployedNetwork && deployedNetwork.address
          );

          setWeb3(web3Instance);
          setAccount(accounts[0]);
          setContract(contractInstance);
        } else {
          console.log("No accounts connected. Waiting for manual connection.");
        }
      } else {
        alert("Please install MetaMask to use this application.");
      }
    };

    initWeb3();
  }, []);

  const connectToMetaMask = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        const web3Instance = new Web3(window.ethereum);
        const networkId = await web3Instance.eth.net.getId();
        const deployedNetwork = DocumentTrackingABI.networks[networkId];
        const contractInstance = new web3Instance.eth.Contract(
          DocumentTrackingABI.abi,
          deployedNetwork && deployedNetwork.address
        );

        setWeb3(web3Instance);
        setAccount(accounts[0]);
        setContract(contractInstance);
      } catch (error) {
        console.error("MetaMask connection error:", error);
      }
    } else {
      alert("Please install MetaMask to connect.");
    }
  };

  return (
    <Web3Context.Provider value={{ web3, account, contract, connectToMetaMask }}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  return useContext(Web3Context);
};
