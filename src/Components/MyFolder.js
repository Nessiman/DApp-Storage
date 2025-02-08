import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWeb3 } from "./Web3Context";
import pinata from "../utils/config";
import useFavorites from "./FavoritesHandler";
import "../cssComponent/MyFolder.css";

function MyFolder({ files = [] }) {
  const [newFolderName, setNewFolderName] = useState("");
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [fileList, setFileList] = useState(files);
  const [folders, setFolders] = useState([]); // Initialize with an empty array
  const { contract, account } = useWeb3();
  const navigate = useNavigate();

  //manajemen dokumen
  const [searchQuery, setSearchQuery] = useState("");
  const [fileSortOrder, setFileSortOrder] = useState("asc");
  const [folderSortOrder, setFolderSortOrder] = useState("asc");
  const { favorites, toggleFavorites, isFavorite } = useFavorites();

  const handleSortFolders = () => {
    const newOrder = folderSortOrder === "asc" ? "desc" : "asc";  // Toggle the order
    setFolderSortOrder(newOrder);  // Update the state for sorting order
  
    const sortedFolders = [...folders].sort((a, b) => {
      if (newOrder === "asc") {
        return a.name.localeCompare(b.name);  // Ascending order (A-Z)
      } else {
        return b.name.localeCompare(a.name);  // Descending order (Z-A)
      }
    });
  
    setFolders(sortedFolders);  // Update the folder list with the sorted order
  };
  
  const handleSortFiles = () => {
    const newOrder = fileSortOrder === "asc" ? "desc" : "asc";  // Toggle order
    setFileSortOrder(newOrder);  // Update the sort order state
  
    // Sort files based on the new order
    const sortedFiles = [...fileList].sort((a, b) => {
      if (newOrder === "asc") {
        return a.name.localeCompare(b.name);  // Ascending order (A-Z)
      } else {
        return b.name.localeCompare(a.name);  // Descending order (Z-A)
      }
    });
  
    setFileList(sortedFiles);  // Update the state with sorted files
  };
  

  const filteredFolders = searchQuery
  ? folders.filter((folder) =>
      folder.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  : folders; // Menampilkan semua folder jika searchQuery kosong

const filteredFiles = searchQuery
  ? fileList.filter((file) =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  : fileList; // Menampilkan semua file jika searchQuery kosong

  
  const fetchFolders = useCallback(async () => {
    try {
      const response = await pinata.groups.list();
      console.log("Response dari API list folders:", response); // Log seluruh response untuk memeriksa struktur data
      
      // Periksa apakah data tersedia dan merupakan array yang tidak kosong
      if (response && Array.isArray(response) && response.length > 0) {
        setFolders(response); // Set folders dengan data yang valid
        console.log("State folders diupdate dengan data:", response);
      } else {
        console.log("Response tidak sesuai atau tidak ada data:", response); // Log response jika data kosong atau tidak valid
        setFolders([]); // Set state folders menjadi kosong jika tidak ada data yang valid
      }
    } catch (error) {
      console.error("Error fetching folders:", error);
      setFolders([]); // Set folders menjadi kosong jika terjadi error
    }
  }, []);
  
  // Panggil fetchFolders pada useEffect
  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);
  

  const handleDeleteFolder = useCallback(async (id) => {
    console.log("ID folder yang dikirim ke API untuk penghapusan:", id);
    console.log(typeof id);
  
    // Validasi ID
    if (!id || typeof id !== "string") {
      console.error("ID folder tidak valid:", id);
      alert("ID folder tidak valid!");
      return;
    }
  
    try {
      // Panggil API untuk menghapus folder
      const deleteGroups = await pinata.groups.delete(id); // Pastikan API menerima id sebagai parameter
      console.log("Respons lengkap dari API:", deleteGroups);
  
      // Periksa status respons
      if (deleteGroups.status === 200 || deleteGroups.success) {
        console.log("Folder berhasil dihapus:", deleteGroups);
        setFolders((prevFolders) =>
          prevFolders.filter((folder) => folder.id !== id)
        );
        alert("Folder berhasil dihapus!");
      } else {
        console.error("Gagal menghapus folder. Respons API tidak sesuai:", deleteGroups);
        alert("Gagal menghapus folder. Periksa respons API.");
      }
    } catch (error) {
      if (error.response) {
        console.error("Error dari server:", error.response.data);
        alert("Gagal menghapus folder: " + error.response.data.message);
      } else if (error.request) {
        console.error("Tidak ada respons dari server:", error.request);
        alert("Tidak ada respons dari server. Periksa koneksi Anda.");
      } else {
        console.error("Kesalahan:", error.message);
        alert("Kesalahan: " + error.message);
      }
    }
  }, []);
  
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
        console.log("folders : ", updatedFolders);
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
          const isUploaded = await contract.methods
            .isFileUploaded(file.cid)
            .call();
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
  const handleUploadToBlockchain = useCallback(
    async (file) => {
      if (!contract || !account) {
        alert("Kontrak atau akun MetaMask tidak tersedia.");
        return;
      }

      try {
        setIsUploading(true);

        const isUploaded = await contract.methods
          .isFileUploaded(file.cid)
          .call();
        if (isUploaded) {
          alert(`File ${file.name} sudah diupload ke blockchain.`);
          return;
        }

        const description = file.description || "Deskripsi default";

        const receipt = await contract.methods
          .uploadDocument(
            file.name,
            file.cid,
            file.size,
            file.type,
            description
          )
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
    },
    [contract, account, fileList]
  );

  // Fungsi untuk menangani opsi file
  const handleDocumentOption = useCallback(
    async (document, option) => {
      if (option === "detail") {
        navigate(`/document-detail/${document.cid}`);
      } else if (option === "delete") {
        const updatedFiles = fileList.filter(
          (file) => file.cid !== document.cid
        );
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
          await contract.methods
            .deleteDocument(document.cid)
            .send({ from: account });

          const updatedFiles = fileList.filter(
            (file) => file.cid !== document.cid
          );
          setFileList(updatedFiles);

          alert("Dokumen berhasil dihapus dari blockchain!");
        } catch (error) {
          console.log(
            "Terjadi kesalahan dalam menghapus dokumen dari blockchain"
          );
          alert("Terjadi kesalahan dalam menghapus dokumen dari blockchain");
        }
      }
    },
    [fileList, navigate, handleUploadToBlockchain, contract, account]
  );

  // Render status upload
  const renderUploadStatus = (file) =>
    file.uploaded ? (
      <span className="badge bg-success">Uploaded</span>
    ) : (
      <span className="badge bg-warning">Not Uploaded</span>
    );

  return (
    <div className="folder-container">

    <div className="search-bar mb-3">
      <input 
      type="text"
      className="form-control"
      placeholder="Search folders or files here"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
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
      <button onClick={handleSortFolders} className="btn btn-link">
        {folderSortOrder === "asc" ? "A-Z" : "Z-A"}
      </button>
      <ul className="list-group folder-list">
        {folders.length > 0 ? (
          filteredFolders.map((folder) => (
            <li
              key={folder.id || folder.name}
              className="list-group-item folder-item"
            >
              <span
                className="folder-name"
                onClick={() =>
                  navigate(`/folder-page`, { state: { folderData: folder } })
                }
              >
                {folder.name}
              </span>
              <button
                className="btn btn-danger btn-sm ms-2"
                onClick={() => {
                  console.log("ID folder yang akan dihapus:", folder.id);
                  handleDeleteFolder(folder.id); // Gunakan id di sini
                }}
              >
                Delete
              </button>
            </li>
          ))
         ) : (
          <p>Tidak ada folder yang tersedia.</p>
        )}
      </ul>

      <h3>All Files:</h3>
      <button onClick={handleSortFiles} className="btn btn-link">
        Sort Files {fileSortOrder === "asc" ? "A-Z" : "Z-A"}
      </button>
      <ul className="list-group">
        {filteredFiles.length > 0 ? (
          filteredFiles.map((file, index) => (
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
                      onClick={() =>
                        handleDocumentOption(file, "deleteBlockchain")
                      }
                    >
                      Delete from Blockchain
                    </a>
                  </li>
                </ul>
              </div>
              <button className={`btn btn-${isFavorite(file) ? "danger" : "outline-secondary"} ms-3`} onClick={() => toggleFavorites(file)}>
                {isFavorite(file) ? "❤️" :  "🤍"}
              </button>
            </li>
          ))
        ) : (
          <p>Tidak ada file yang tersedia.</p>
        )}
      </ul>
      <h3>Favorite Files : </h3>
      <ul className="list-group">
        {favorites.length > 0 ? (
          favorites.map((file, index) => (
            <li key={index} className="list-group-item file-item">
              {file.name}
              <button className="btn btn-danger ms-3" onClick={() => toggleFavorites(file)}>❤️</button>
            </li>  
          ))
        ):(
          <p>no favorites yet</p>
        )}
      </ul>
    </div>
  );
}

export default MyFolder;
