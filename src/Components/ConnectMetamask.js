import React from "react";
import "../cssComponent/ConnectMetamask.css"; // Tetap impor file CSS biasa
import metamaskLogo from "../assets/ui.png";
import folderLogo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";

function ConnectMetamask({ onConnect }) {
  const navigate = useNavigate();

  const connectToMetaMask = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        const connectedAccount = accounts[0];
        onConnect(connectedAccount);
        navigate("/my-folder");
      } catch (error) {
        console.error("MetaMask connection error:", error);
        alert("Failed to connect to MetaMask. Please try again.");
      }
    } else {
      alert("MetaMask is not installed. Please install MetaMask to continue.");
    }
  };

  return (
    <div className="connectMetamask-container"> 
      <div className="content">
        <h1 className="title">Document Storage</h1>
        <p className="subtitle">For store your document</p>
        <button className="connect-button" onClick={connectToMetaMask}>
          <img
            src={metamaskLogo}
            alt="MetaMask Logo"
            className="metamask-logo"
          />
          Connect MetaMask
        </button>
      </div>
      <div className="folder-icon">
        <img src={folderLogo} alt="Folder Icon" />
      </div>
    </div>
  );
}

export default ConnectMetamask;
