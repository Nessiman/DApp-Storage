import React, { useState } from "react";

function ConnectMetamask({ onConnect }) {
  const [loading, setLoading] = useState(false);

  const connectToMetaMask = async () => {
    if (window.ethereum) {
      try {
        setLoading(true);
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",  // Meminta akun MetaMask
        });
        onConnect(accounts[0]); // Kirimkan akun yang terhubung ke App.js
      } catch (error) {
        console.error("MetaMask connection error:", error);
      } finally {
        setLoading(false);
      }
    } else {
      alert("Please install MetaMask to connect.");
    }
  };

  return (
    <div>
      <h2>Connect MetaMask</h2>
      <button onClick={connectToMetaMask} disabled={loading}>
        {loading ? "Connecting..." : "Connect with MetaMask"}
      </button>
    </div>
  );
}

export default ConnectMetamask;
