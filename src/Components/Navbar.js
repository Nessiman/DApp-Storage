import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Web3 from "web3";

function Navbar({ account, onLogout }) {
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    const web3 = new Web3(window.ethereum);
    const getBalance = async () => {
      if (account){
        const balanceInWei = await web3.eth.getBalance(account);
        const balanceInEth = web3.utils.fromWei(balanceInWei, "ether");
        setBalance(balanceInEth);
      }
    };
    
    getBalance();
  }, [account]);
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          Document DApp
        </Link>
        <div className="navbar-nav ms-auto">
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link className="nav-link active" to="/">
                Upload Document
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/my-folder">
                My Folder
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/favorites">
                Favorites
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/document-gateway">
                Document Gateway
              </Link>
            </li>
          </ul>
          {/* MetaMask Account & Balance */}
          {account && (
            <div className="nav-item dropdown ms-3">
              <button
                className="btn btn-light dropdown-toggle"
                type="button"
                id="accountDropdown"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="fas fa-user-circle"></i> {account.slice(0, 6)}...{account.slice(-4)}
              </button>
              <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="accountDropdown">
                <li>
                  <p className="dropdown-item">
                    <strong>Account</strong>: {account}
                  </p>
                </li>
                {balance && (
                  <li>
                  <p className="dropdown-item">
                    <strong>Balance</strong>: {balance} ETH
                  </p>
                </li>
                )}
                <li>
                  <button
                    className="dropdown-item text-danger"
                    onClick={onLogout}
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
