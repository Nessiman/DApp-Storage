import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useWeb3 } from "./Web3Context";
import pinata from "../utils/config";
import FileList from "./FileList";
import useFavorites from "./FavoritesHandler";
import "../cssComponent/FolderPage.css"; // Impor CSS

const colorOptions = ["#3498db", "#e74c3c", "#2ecc71", "#f1c40f", "#9b59b6"]; // Warna tanpa label default

function FolderPage() {
  const [fileList, setFileList] = useState([]);
  const [folderName, setFolderName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState("");
  const [folderColor, setFolderColor] = useState("#ffffff"); 
  const [colorLabels, setColorLabels] = useState({}); 
  const [labelInput, setLabelInput] = useState(""); 
  const [showLabelModal, setShowLabelModal] = useState(false); 
  const [showModal, setShowModal] = useState(false);
  const [showUploadSidebar, setShowUploadSidebar] = useState(false);
  const [showLabelSidebar, setShowLabelSidebar] = useState(false);
  const { state } = useLocation();
  const { folderData } = state || {};
  console.log("folderData:", folderData);
  const { contract, account } = useWeb3();
  const navigate = useNavigate();
  const groupId = folderData ? folderData.id : null;
  const { favorites, toggleFavorites, isFavorite } = useFavorites();
  const { folderId } = useParams(); // Ambil ID folder dari URL
  const [folder, setFolder] = useState(null);

  useEffect(() => {
    console.log("showModal:", showModal);
    console.log("showLabelModal:", showLabelModal);
  }, [showModal, showLabelModal]);

  useEffect(() => {
    if (folderData) {
      setFolderName(folderData.name);

      const storedFolders = JSON.parse(localStorage.getItem("folders")) || [];
      const storedColors = JSON.parse(localStorage.getItem("folderColors")) || {};

      const foundFolder = storedFolders.find(folder => folder.id === folderData.id);
      setFolderColor(storedColors[folderData.id] || foundFolder?.color || "#ffffff");
      setDescription(foundFolder?.description || folderData.description || "Tidak ada deskripsi.");
      
      setFileList(folderData.files || []);
      fetchFilesByGroup();
    }
  }, [folderData]);

  useEffect(() => {
    // Ambil daftar folder dari localStorage
    const storedFolders = JSON.parse(localStorage.getItem("folders")) || [];

    // Cari folder yang sesuai berdasarkan ID
    const selectedFolder = storedFolders.find((f) => f.id === folderId);

    if (selectedFolder) {
      setFolder(selectedFolder);
      setDescription(selectedFolder.description || "Tidak ada deskripsi");
    }
  }, [folderId]);

  // useEffect(() => {
  //   if (folderData) {
  //     const storedFolders = JSON.parse(localStorage.getItem("folders")) || [];
  //     const storedColors = JSON.parse(localStorage.getItem("folderColors")) || {};
      
  //     const foundFolder = storedFolders.find(folder => folder.id === folderData.id);
  //     setFolderColor(storedColors[folderData.id] || foundFolder?.color || "#ffffff");
  //   }
  // }, [folderData]);
  

  // // Simpan warna ke localStorage saat berubah
  // useEffect(() => {
  //   if (folderData) {
  //     const storedFolders = JSON.parse(localStorage.getItem("folders")) || [];
  //     const updatedFolders = storedFolders.map((folder) =>
  //       folder.id === folderData.id ? { ...folder, color: folderColor } : folder
  //     );
  //     localStorage.setItem("folders", JSON.stringify(updatedFolders));
  //   }
  // }, [folderColor, folderData]);

  // Ambil label berdasarkan warna yang dipilih
  useEffect(() => {
    setLabelInput(colorLabels[folderColor] || "");
  }, [folderColor, colorLabels]);



  const fetchFilesByGroup = useCallback(async () => {
    try {
      if (!folderData || !folderData.id) {
        console.error("Id grup tidak ditemukan");
        return;
      }

      const response = await pinata.listFiles().group(folderData.id);

      const fileDetails = response.map((file) => {
        const fileName = file.metadata?.name || "Unknown File"; // Default jika nama file tidak ada
        return {
          id: file.id,
          ipfsHash: file.ipfs_pin_hash,
          size: file.size,
          type: file.mime_type,
          uploadTime: file.date_pinned,
          fileName, // Nama file dari metadata
          name: fileName,
        };
      });

      setFileList(fileDetails);
    } catch (error) {
      console.error("Gagal fetch files by grup:", error);
    }
  }, [folderData]);

  useEffect(() => {
    if (folderData) {
      setFolderName(folderData.name);
      setFileList(folderData.files || []);
      fetchFilesByGroup();
    }
  }, [folderData, fetchFilesByGroup]);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleDescriptionChange = (event) => {
    setDescription(event.target.value);
  };

  const uploadToIPFS = async () => {
    if (!file) {
      alert("Pilih dokumen terlebih dahulu!");
      return;
    }

    if (!groupId) {
      alert("Grup tidak ditemukan");
      return;
    }

    setIsUploading(true);
    try {
      if (!(file instanceof Blob)) {
        throw new Error("File yang dipilih tidak valid.");
      }

      if (!account) {
        alert("MetaMask tidak terhubung!");
        return;
      }

      const response = await pinata.upload.file(file).group(groupId);
      const uploadTime = new Date().toISOString();

      const fileData = {
        name: file.name,
        size: file.size,
        type: file.type,
        cid: response.IpfsHash,
        mimeType: file.type,
        owner: account,
        description,
        uploadTime,
      };

      setFileList([...fileList, fileData]);
      alert("File berhasil diupload ke IPFS!");
      setShowModal(false); // Tutup modal setelah upload
      setFile(null);
      setDescription("");
    } catch (error) {
      console.error("Gagal mengunggah file ke IPFS:", error);
      alert("Terjadi kesalahan saat mengunggah file.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="folder-page-container">
      <div className="button-container">
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          Back to My Folder
        </button>
        <div className="upload-controls">
        <button className="upload-btn" onClick={() => setShowUploadSidebar(true)}>
            Upload File
          </button>
          <button className="btn-label" onClick={() => setShowLabelSidebar(true)}>
            Label
          </button>
        </div>
      </div>

      {/* Sidebar Upload */}
      <div className={`sidebar ${showUploadSidebar ? "active" : ""}`}>
        <div className="sidebar-header">
          <h3>Upload New Document</h3>
          <button className="close-btn" onClick={() => setShowUploadSidebar(false)}>
            &times;
          </button>
        </div>
        <input type="file" onChange={handleFileChange} />
        <textarea
          placeholder="Masukkan deskripsi dokumen"
          value={description}
          onChange={handleDescriptionChange}
          rows="3"
        ></textarea>
        <button onClick={uploadToIPFS} disabled={isUploading}>
          {isUploading ? "Mengunggah..." : "Upload"}
        </button>
      </div>

      {/* Sidebar Label */}
      <div className={`sidebar ${showLabelSidebar ? "active" : ""}`}>
        <div className="sidebar-header">
          <h3>Atur Label dan Warna</h3>
          <button className="close-btn" onClick={() => setShowLabelSidebar(false)}>
            &times;
          </button>
        </div>

        <div className="color-options">
          {colorOptions.map((color) => (
            <button
              key={color}
              className={`color-btn ${folderColor === color ? "active" : ""}`}
              style={{ backgroundColor: color }}
              onClick={() => setFolderColor(color)}
            />
          ))}
        </div>

        <input
          type="text"
          placeholder="Masukkan label untuk warna ini..."
          value={labelInput}
          onChange={(e) => setLabelInput(e.target.value)}
        />
        <button onClick={() => {
          setColorLabels({ ...colorLabels, [folderColor]: labelInput });
          localStorage.setItem("colorLabels", JSON.stringify({ ...colorLabels, [folderColor]: labelInput }));
        }}>
          Simpan Label
        </button>
      </div>

      <center style={{ backgroundColor: folderColor }}>
        <h1>{folderName}</h1>
        <p>{description || "Tidak ada deskripsi."}</p>
      </center>

      <FileList
        fileList={fileList}
        setFileList={setFileList}
        toggleFavorites={toggleFavorites}
        isFavorite={isFavorite}
      />
    </div>
  );
}

export default FolderPage;
