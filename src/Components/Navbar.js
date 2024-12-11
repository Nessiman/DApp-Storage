import React, { useState } from "react";
import { Link } from "react-router-dom";

function Navbar({ account, onLogout }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [navbarOpen, setNavbarOpen] = useState(false); // Menambahkan state untuk navbar toggle

  // Fungsi untuk toggle dropdown
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  // Fungsi untuk toggle navbar collapse
  const toggleNavbar = () => {
    setNavbarOpen(!navbarOpen);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          Document DApp
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          onClick={toggleNavbar} // Menggunakan state React untuk toggle
          aria-controls="navbarNav"
          aria-expanded={navbarOpen ? "true" : "false"}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className={`collapse navbar-collapse ${navbarOpen ? "show" : ""}`} id="navbarNav">
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
              <Link className="nav-link" to="/document-gateway">
                Document Gateway
              </Link>
            </li>
          </ul>
          {account && (
            <div className="ml-auto dropdown">
              <button
                className="btn btn-light dropdown-toggle"
                onClick={toggleDropdown} // Mengatur dropdown menggunakan state
              >
                <i className="fas fa-user-circle"></i> {/* Ikon user */}
              </button>
              {dropdownOpen && (
                <div className="dropdown-menu dropdown-menu-end">
                  <p className="dropdown-item">
                    <strong>Account</strong> <br /> {account}
                  </p>
                  <button
                    className="dropdown-item text-danger"
                    onClick={onLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
