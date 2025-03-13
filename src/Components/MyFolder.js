import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWeb3 } from "./Web3Context";
import pinata from "../utils/config";
import useFavorites from "./FavoritesHandler";
import { FaTrash, FaSortAlphaDown, FaSortAlphaUp } from "react-icons/fa";
import FolderList from "./FolderList";
import FileList from "./FileList";
import "../cssComponent/MyFolder.css";

function MyFolder({ files = [] }) {
  const [newFolderName, setNewFolderName] = useState("");
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileList, setFileList] = useState(files);
  const [folders, setFolders] = useState([]); // Initialize with an empty array
  const { contract, account } = useWeb3();
  const [sortBy, setSortBy] = useState("name"); // Default sorting byname
  const [sortOrder, setSortOrder] = useState("asc"); // Default ascending
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { favorites, toggleFavorites, isFavorite } = useFavorites();
  const [colorLabels, setColorLabels] = useState({}); // Label global warna
  const [newFolderDescription, setNewFolderDescription] = useState("");

  
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    sortFilesAndFolders(e.target.value, sortOrder);
  };

  const toggleSortOrder = () => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newOrder);
    sortFilesAndFolders(sortBy, newOrder);
  };

  const sortFilesAndFolders = (type, order) => {
    const sortFunc = (a, b) => {
      if (type === "date"){
        const dateA = new Date(a.uploadTime || 0).getTime();
        const dateB = new Date(b.uploadTime || 0). getTime();
        return order == "asc" ? dateA - dateB : dateB - dateA;
      }else{
        if (!a[type] || !b[type]) return 0; // Pastikan data tersedia
        if (a[type] < b[type]) return order === "asc" ? -1 : 1;
        if (a[type] > b[type]) return order === "asc" ? 1 : -1;
        return 0;
      }
    };
    setFolders([...folders].sort(sortFunc));
    setFileList([...fileList].sort(sortFunc));
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

  //useEffect untuk Fetch Folder
  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const response = await pinata.groups.list();
        let fetchedFolders = response.groups || [];

        const localFolders =  JSON.parse(localStorage.getItem("folders")) || [];

        fetchedFolders = fetchedFolders.map((folder) => {
          const localFolder = localFolders.find((f) => f.id === folder.id); 
          return localFolder ? { ...folder, description: localFolder.description } : folder; 
        });
        console.log("Folders fetched:", fetchedFolders);
        setFolders(fetchedFolders);
      } catch (error) {
        console.error("Error fetching folders:", error);
        setFolders([]);
      }
    };
    fetchFolders();
  }, []);

  // Fungsi untuk membuat folder baru
  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) {
      alert("Nama folder tidak boleh kosong.");
      return;
    }

    try {
      const response = await pinata.groups.create({
        name: newFolderName,
        description: newFolderDescription,
      });

      if (response && response.group) {
        alert(`Folder "${newFolderName}" berhasil dibuat`);

        const newFolder = {
          ...response.group,
          description : newFolderDescription,
        };

        const updatedFolders = [...folders, newFolder];
        console.log("folders : ", updatedFolders);
        console.log("LocalStorage setelah update:", localStorage.getItem("folders"));

        setFolders(updatedFolders);
        localStorage.setItem("folders", JSON.stringify(updatedFolders));
      } else {
        alert("Terjadi kesalahan dalam membuat folder");
      }

      setShowFolderInput(false);
      setNewFolderName("");
      setNewFolderDescription("");
    } catch (error) {
      console.error("Gagal membuat folder", error.message);
      alert("Terjadi kesalahan. Gagal membuat folder");
    }
  }, [newFolderName, newFolderDescription, folders]);

  //untuk upload ke blockchain
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

        setFileList((prevFiles) =>
          prevFiles.map((f) =>
            f.cid === file.cid ? { ...f, uploaded: true, description } : f
          )
        );

        alert(`File ${file.name} berhasil diupload ke blockchain.`);
      } catch (error) {
        console.error("Gagal mengupload ke blockchain:", error);
        alert("Terjadi kesalahan saat mengupload ke blockchain.");
      } finally {
        setIsUploading(false);
      }
    },
    [contract, account, setFileList]
  );

  // Fungsi untuk menangani opsi file
  const handleDocumentOption = useCallback(
    async (document, option) => {
      if (option === "detail") {
        navigate(`/document-detail/${document.cid}`);
      } else if (option === "delete") {
        setFileList((prevFiles) =>
          prevFiles.filter((file) => file.cid !== document.cid)
        );
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

          setFileList((prevFiles) =>
            prevFiles.map((file) =>
              file.cid === document.cid ? { ...file, uploaded: false } : file
            )
          );

          alert("Dokumen berhasil dihapus dari blockchain!");
        } catch (error) {
          console.log(
            "Terjadi kesalahan dalam menghapus dokumen dari blockchain"
          );
          alert("Terjadi kesalahan dalam menghapus dokumen dari blockchain");
        }
      }
    },
    [navigate, handleUploadToBlockchain, contract, account, setFileList]
  );

  // Periksa status file apakah sudah diupload ke blockchain
  const checkFileUploadStatus = useCallback(async () => {
    if (!contract || fileList.length === 0) return;

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
  }, [contract, fileList, setFileList]);

  useEffect(() => {
    checkFileUploadStatus();
  }, [checkFileUploadStatus]);

  // Render status upload di blockchain
  const renderUploadStatus = (file) =>
    file.uploaded ? (
      <span className="badge bg-success">Uploaded</span>
    ) : (
      <span className="badge bg-warning">Not Uploaded</span>
    );

  return (
    <div className="folder-container">
      <center><h1>My Folder</h1></center>
      <div className="d-flex justify-content-between align-items-center mb-3">
        {/* Search Input */}
        <input
          type="text"
          className="form-control w-25"
          placeholder="Search.."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Tombol New Folder dan Sorting */}
        <div className="d-flex gap-2">
          <button
            className="btn btn-primary"
            onClick={() => setShowFolderInput(true)}
          >
            New Folder
          </button>

          <div className="sort-container d-flex">
            <select
              className="sort-dropdown form-select"
              value={sortBy}
              onChange={handleSortChange}
            >
              <option value="name">Name</option>
              <option value="date">Date</option>
              <option value="type">Type</option>
            </select>
            <button className="btn btn-secondary" onClick={toggleSortOrder}>
              {sortOrder === "asc" ? <FaSortAlphaDown /> : <FaSortAlphaUp />}
            </button>
          </div>
        </div>
      </div>

      {showFolderInput && (
        <div className="mb-3">
          <input
            type="text"
            placeholder="Folder Name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="form-control"
          />
          <input 
          type="text"
          placeholder="Folder Description"
          value={newFolderDescription}
          onChange={(e) => setNewFolderDescription(e.target.value)}
          className="form-control mt-2"/>
          <button
            className="btn btn-success mt-2"
            onClick={handleCreateFolder}
          >
            Create
          </button>
          <button
            className="btn btn-secondary mt-2 ms-2"
            onClick={() => setShowFolderInput(false)}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Kontainer Vertikal */}
      <div className="content-container-vertical">
        {/* Folders Section */}
        <div className="section">
          <h3>Folders</h3>
          <div className="scrollable-container">
            <FolderList folders={filteredFolders} setFolders={setFolders} />
          </div>
        </div>

        {/* Files Section */}
        <div className="section">
          <h3>Files</h3>
          <div className="scrollable-container">
            <FileList fileList={filteredFiles} setFileList={setFileList}  isFavorite={isFavorite}  toggleFavorites={toggleFavorites}/>
          </div>
        </div>

        {/* Favorites Section */}
        <div className="section">
          <h3>Favorite Files</h3>
          <div className="scrollable-container">
            {favorites.length > 0 ? (
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Favorites</th>
                    <th>Status Blockchain</th>
                    <th>Opsi</th>
                  </tr>
                </thead>
                <tbody>
                  {favorites.map((file, index) => (
                    <tr key={index}>
                      <td>{file.name}</td>
                      <td>
                        {file.uploadTime
                          ? new Date(file.uploadTime).toLocaleDateString()
                          : "Unknown"}
                      </td>
                      <td>{file.type || "Unknown"}</td>
                      <td>
                        <button
                          className="btn"
                          onClick={() => toggleFavorites(file)}
                        >
                          ⭐
                        </button>
                      </td>
                      <td>{renderUploadStatus(file)}</td>
                      <td>
                        <div className="dropdown">
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
                                onClick={() => alert(`Detail ${file.name}`)}
                              >
                                Detail Document
                              </a>
                            </li>
                            <li>
                              <a
                                className="dropdown-item"
                                href="#"
                                onClick={() => alert(`Delete ${file.name}`)}
                              >
                                Delete Document
                              </a>
                            </li>
                            <li>
                              <a
                                className="dropdown-item"
                                href="#"
                                onClick={() =>
                                  alert(`Upload ${file.name} to Blockchain`)
                                }
                              >
                                Upload to Blockchain
                              </a>
                            </li>
                            <li>
                              <a
                                className="dropdown-item"
                                href="#"
                                onClick={() =>
                                  alert(`Delete ${file.name} from Blockchain`)
                                }
                              >
                                Delete from Blockchain
                              </a>
                            </li>
                          </ul>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-muted">No favorite files yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyFolder;
