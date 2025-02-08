import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import ConnectMetamask from "./Components/ConnectMetamask";
import MyFolder from "./Components/MyFolder";
import UploadDocument from "./Components/DocumentUpload";
import DocumentGateway from "./Components/DocumentGateway";
import Navbar from "./Components/Navbar"; // Import Navbar
import DocumentDetail from "./Components/DocumentDetail"; // Import DocumentDetail
import FolderPage from "./Components/FolderPage";
import { Web3Provider } from "./Components/Web3Context";


function App() {
  const [account, setAccount] = useState(null); // Menyimpan akun MetaMask
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const navigate = useNavigate();

  const createFolder = (folderName, parentFolderName) => {
    const newFolder = { name: folderName, files: [] };

    if (parentFolderName) {
      const updatedFolders = folders.map((folder) => {
        if (folder.name === parentFolderName) {
          folder.subfolders = folder.subfolders || [];
          folder.subfolders.push(newFolder);
        }
        return folder;
      });
      setFolders(updatedFolders);
      localStorage.setItem("folders", JSON.stringify(updatedFolders));
    } else {
      const updatedFolders = [...folders, newFolder];
      setFolders(updatedFolders);
      localStorage.setItem("folders", JSON.stringify(updatedFolders));
    }
  };

  // Fungsi untuk menghubungkan akun MetaMask
  const handleConnect = (account) => {
    console.log("Akun : ", account);
    setAccount(account); // Menyimpan akun yang terhubung
  };

  // Fungsi untuk logout
  const handleLogout = () => {
    setAccount(null); // Hapus akun dari state
    localStorage.removeItem("userAddress");
    navigate("/"); // Mengarahkan ke halaman login atau home
  };

  // Fungsi untuk menambahkan file
  const addFileToMyFolder = (fileData, folderName) => {
    const updatedFiles = [...files, fileData];
    setFiles(updatedFiles);

    // Simpan pembaruan ke localStorage setelah state diperbarui
    setTimeout(() => {
      localStorage.setItem("ipfsFiles", JSON.stringify(updatedFiles));
    }, 0);

    // Tambahkan file ke folder jika ada
    if (folderName) {
      const updatedFolders = [...folders];
      const folderIndex = updatedFolders.findIndex(
        (folder) => folder.name === folderName
      );
      if (folderIndex !== -1) {
        updatedFolders[folderIndex].files.push(fileData);
        setFolders(updatedFolders);
        localStorage.setItem("folders", JSON.stringify(updatedFolders));
      }
    }
  };

  // Mengambil data file dan folder dari localStorage saat aplikasi dimuat
  useEffect(() => {
    const storedAccount = localStorage.getItem("userAddress");
    if (storedAccount){
      setAccount(storedAccount);
    }
    const storedFiles = JSON.parse(localStorage.getItem("ipfsFiles")) || [];
    const storedFolders = JSON.parse(localStorage.getItem("folders")) || [];
    setFiles(storedFiles);
    setFolders(storedFolders);
  }, []);

  return (
    <Web3Provider>
      {!account ? (
        // Halaman login jika belum terhubung dengan MetaMask
        <ConnectMetamask onConnect={handleConnect} />
      ) : (
        // Aplikasi utama setelah login dengan MetaMask
        <div>
          {/* Navbar dengan fitur logout */}
          <Navbar account={account} onLogout={handleLogout} />
          <div className="container mt-4">
            <Routes>
              <Route
                path="/"
                element={
                  <UploadDocument
                    onFileUploaded={addFileToMyFolder}
                    account={account}
                  />
                }
              />
              <Route
                path="/my-folder"
                element={
                  <MyFolder
                    files={files}
                    folders={folders}
                    addFileToMyFolder={addFileToMyFolder}
                    createFolder={createFolder}
                  />
                }
              />
              <Route path="/document-gateway" element={<DocumentGateway />} />
              <Route
                path="/document-detail/:cid"
                element={<DocumentDetail />}
              />
              <Route
                path="/folder-page"
                element={
                  <FolderPage
                    createFolder={createFolder}
                    folders={folders}
                  />
                }
              />
            </Routes>
          </div>
        </div>
      )}
    </Web3Provider>
  );
}

export default App;
