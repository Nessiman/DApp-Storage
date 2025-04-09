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
  const [folders, setFolders] = useState([]);
   // Initialize with an empty array
  const { contract, account } = useWeb3();
  const [sortBy, setSortBy] = useState("name"); // Default sorting byname
  const [sortOrder, setSortOrder] = useState("asc"); // Default ascending
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { favorites, toggleFavorites, isFavorite } = useFavorites();
  const [colorLabels, setColorLabels] = useState({}); // Label global warna
  const [newFolderDescription, setNewFolderDescription] = useState("");
  const [sortedFiles, setSortedFiles] = useState([]);
  const [sortedFolders, setSortedFolders] = useState([]);

  const sortFiles = useCallback(
    (type, order) => {
      if (!fileList.length) return;

      const sorted = [...fileList].sort((a, b) => {
        if (type === "date") {
          return order === "asc"
            ? new Date(a.uploadTime) - new Date(b.uploadTime)
            : new Date(b.uploadTime) - new Date(a.uploadTime);
        } else if (type === "uploaded") {
          return order === "asc"
            ? Number(a.uploaded) - Number(b.uploaded)
            : Number(b.uploaded) - Number(a.uploaded);
        } else if (type === "type") {
          return order === "asc"
            ? a.type.localeCompare(b.type)
            : b.type.localeCompare(a.type);
        } else {
          return order === "asc"
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        }
      });
      setSortedFiles(sorted);
    },
    [fileList]
  );

  useEffect(() => {
    sortFiles(sortBy, sortOrder);
  }, [fileList, sortBy, sortOrder]);

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
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
          description: newFolderDescription,
        };

        const updatedFolders = [...folders, newFolder];

        setFolders(updatedFolders);
        localStorage.setItem("folders", JSON.stringify(updatedFolders));
      } else {
        alert("Terjadi kesalahan dalam membuat folder");
      }
    } catch (error) {
      console.error("Gagal membuat folder", error.message);
      alert("Terjadi kesalahan. Gagal membuat folder");
    } finally {
      setShowFolderInput(false);
      setNewFolderName("");
      setNewFolderDescription("");
    }
  }, [newFolderName, newFolderDescription, folders]);

  // Periksa status file apakah sudah diupload ke blockchain
  const checkFileUploadStatus = useCallback(async () => {
    if (!contract || fileList.length === 0) return;

    try {
      const updatedFileList = await Promise.all(
        fileList.map(async (file) => {
          try {
            const isUploaded = await contract.methods
              .isFileUploaded(file.cid)
              .call();
            return { ...file, uploaded: isUploaded };
          } catch (error) {
            console.error(`Gagal mendapatkan status file ${file.name}:`, error);
            return { ...file, uploaded: false, error: "Gagal memuat status" };
          }
        })
      );
      setFileList(updatedFileList);
    } catch (error) {
      console.error("Gagal memuat status upload file", error);
      alert("Terjadi kesalahan saat memuat status file di blockchain.");
    }
  }, [contract, fileList, setFileList]);

  useEffect(() => {
    try {
        const storedFolders = JSON.parse(localStorage.getItem("folders"));
        console.log("📁 Folders di localStorage:", storedFolders); // Debugging
        setFolders(storedFolders || []);
    } catch (error) {
        console.error("❌ Gagal membaca folders dari localStorage:", error);
        setFolders([]);
    }
}, []);

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
      <center>
        <h1>My Folder</h1>
      </center>
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
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">Name</option>
              <option value="date">Date</option>
              <option value="type">Type</option>
              <option value="uploaded">Blockchain Status</option>
            </select>
            <button
              className="btn btn-secondary"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
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
            className="form-control mt-2"
          />
          <button className="btn btn-success mt-2" onClick={handleCreateFolder}>
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
          <FolderList sortBy={sortBy} sortOrder={sortOrder} />
          </div>
        </div>

        {/* Files Section */}
        <div className="section">
          <h3>Files</h3>
          <div className="scrollable-container">
            <FileList
              fileList={sortedFiles}
              setFileList={setFileList}
              isFavorite={isFavorite}
              toggleFavorites={toggleFavorites}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyFolder;
