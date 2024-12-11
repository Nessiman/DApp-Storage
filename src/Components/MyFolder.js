import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWeb3 } from "./Web3Context"; 
import pinata from "../utils/config";
import "../cssComponent/MyFolder.css";

function MyFolder({ files = [] }) {
  const [newFolderName, setNewFolderName] = useState("");
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [fileList, setFileList] = useState(files);
  const [folders, setFolders] = useState([]); 
  const { contract, account } = useWeb3();
  const navigate = useNavigate();

  // Fetch daftar folder dari Pinata
  const fetchFolders = useCallback(async () => {
    try {
      const response = await pinata.groups.list();
      setFolders((prevFolders) => {
        if (JSON.stringify(prevFolders) !== JSON.stringify(response)) {
          return response; // Update jika data berbeda
        }
        return prevFolders; // Tidak ada perubahan
      });
    } catch (error) {
      console.error("Error fetching folders:", error);
    }
  }, []);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  // Fungsi untuk membuat folder baru
  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) {
      alert("Nama folder tidak boleh kosong.");
      return;
    }

    try {
      const response = await pinata.groups.create({ name: newFolderName });

      if (response && response.group) {
        alert(`Folder "${newFolderName}" berhasil dibuat`);

        const updatedFolders = [...folders, response.group];
        setFolders(updatedFolders);
      } else {
        alert("Terjadi kesalahan dalam membuat folder");
      }

      setShowFolderInput(false);
      setNewFolderName("");
    } catch (error) {
      console.error("Gagal membuat folder", error.message);
      alert("Terjadi kesalahan. Gagal membuat folder");
    }
  }, [newFolderName, folders]);

  // Periksa status file apakah sudah diupload
  const checkFileUploadStatus = useCallback(async () => {
    if (!contract || !fileList.length) return;

    try {
      const updatedFileList = await Promise.all(
        fileList.map(async (file) => {
          const isUploaded = await contract.methods.isFileUploaded(file.cid).call();
          return { ...file, uploaded: isUploaded };
        })
      );
      setFileList(updatedFileList);
    } catch (error) {
      console.error("Gagal memuat status upload file", error);
    }
  }, [contract, fileList]);

  useEffect(() => {
    checkFileUploadStatus();
  }, [checkFileUploadStatus]);

  // Fungsi untuk mengunggah file ke blockchain
  const handleUploadToBlockchain = useCallback(async (file) => {
    if (!contract || !account) {
      alert("Kontrak atau akun MetaMask tidak tersedia.");
      return;
    }

    try {
      setIsUploading(true);

      const isUploaded = await contract.methods.isFileUploaded(file.cid).call();
      if (isUploaded) {
        alert(`File ${file.name} sudah diupload ke blockchain.`);
        return;
      }

      const description = file.description || "Deskripsi default";

      const receipt = await contract.methods
        .uploadDocument(file.name, file.cid, file.size, file.type, description)
        .send({ from: account });

      console.log("Transaksi berhasil:", receipt);

      const updatedFiles = fileList.map((f) =>
        f.cid === file.cid ? { ...f, uploaded: true, description } : f
      );
      setFileList(updatedFiles);

      alert(`File ${file.name} berhasil diupload ke blockchain.`);
    } catch (error) {
      console.error("Gagal mengupload ke blockchain:", error);
      alert("Terjadi kesalahan saat mengupload ke blockchain.");
    } finally {
      setIsUploading(false);
    }
  }, [contract, account, fileList]);

  // Fungsi untuk menangani opsi file
  const handleDocumentOption = useCallback(async (document, option) => {
    if (option === "detail") {
      navigate(`/document-detail/${document.cid}`);
    } else if (option === "delete") {
      const updatedFiles = fileList.filter((file) => file.cid !== document.cid);
      setFileList(updatedFiles); 
      alert("Dokumen berhasil dihapus!");
    } else if (option === "upload") {
      handleUploadToBlockchain(document);
    } else if (option === "deleteBlockchain") {
      if (!contract || !account) {
        alert("Kontrak atau akun MetaMask tidak tersedia");
        return;
      }

      try {
        await contract.methods.deleteDocument(document.cid).send({ from: account });

        const updatedFiles = fileList.filter((file) => file.cid !== document.cid);
        setFileList(updatedFiles);

        alert("Dokumen berhasil dihapus dari blockchain!");
      } catch (error) {
        console.log("Terjadi kesalahan dalam menghapus dokumen dari blockchain");
        alert("Terjadi kesalahan dalam menghapus dokumen dari blockchain");
      }
    }
  }, [fileList, navigate, handleUploadToBlockchain, contract, account]);

  // Render status upload
  const renderUploadStatus = (file) =>
    file.uploaded ? (
      <span className="badge bg-success">Uploaded</span>
    ) : (
      <span className="badge bg-warning">Not Uploaded</span>
    );

  return (
    <div className="folder-container">
      <h2>My Folder</h2>

      <button
        className="btn btn-primary btn-new-folder"
        onClick={() => setShowFolderInput(true)}
      >
        New Folder
      </button>

      {showFolderInput && (
        <div className="mb-3">
          <input
            type="text"
            placeholder="Folder Name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="form-control"
          />
          <button className="btn btn-success mt-2" onClick={handleCreateFolder}>
            Create Folder
          </button>
          <button
            className="btn btn-secondary mt-2 ms-2"
            onClick={() => setShowFolderInput(false)}
          >
            Cancel
          </button>
        </div>
      )}

      <h3>Folders:</h3>
      <ul className="list-group folder-list">
        {folders.length > 0 ? (
          folders.map((folder) => (
            <li
              key={folder.id}
              className="list-group-item folder-item"
              onClick={() =>
                navigate(`/folder-page`, { state: { folderData: folder } })
              }
            >
              {folder.name}
            </li>
          ))
        ) : (
          <p>Tidak ada folder yang tersedia.</p>
        )}
      </ul>

      <h3>All Files:</h3>
      <ul className="list-group">
        {fileList.length > 0 ? (
          fileList.map((file, index) => (
            <li key={index} className="list-group-item file-item">
              {file.name} {renderUploadStatus(file)}
              <div className="dropdown ms-3 d-inline">
                <button
                  className="btn btn-secondary dropdown-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                >
                  Opsi
                </button>
                <ul className="dropdown-menu">
                  <li>
                    <a
                      className="dropdown-item"
                      href="#"
                      onClick={() => handleDocumentOption(file, "detail")}
                    >
                      Detail Document
                    </a>
                  </li>
                  <li>
                    <a
                      className="dropdown-item"
                      href="#"
                      onClick={() => handleDocumentOption(file, "delete")}
                    >
                      Delete Document
                    </a>
                  </li>
                  <li>
                    <a
                      className="dropdown-item"
                      href="#"
                      onClick={() => handleDocumentOption(file, "upload")}
                    >
                      Upload to Blockchain
                    </a>
                  </li>
                  <li>
                    <a
                      className="dropdown-item"
                      href="#"
                      onClick={() => handleDocumentOption(file, "deleteBlockchain")}
                    >
                      Delete from Blockchain
                    </a>
                  </li>
                </ul>
              </div>
            </li>
          ))
        ) : (
          <p>Tidak ada file yang tersedia.</p>
        )}
      </ul>
    </div>
  );
}

export default MyFolder;
