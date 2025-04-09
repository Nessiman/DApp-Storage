import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useWeb3 } from "./Web3Context";
import pinata from "../utils/config";
import FileList from "./FileList";
import CryptoJS from "crypto-js";
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
  const [showUploadSidebar, setShowUploadSidebar] = useState(false);
  const [showLabelSidebar, setShowLabelSidebar] = useState(false);
  const [showDescriptionSidebar, setShowDescriptionSidebar] = useState(false);
  const { state } = useLocation();
  const { folderData } = state || {};
  const { contract, account } = useWeb3();
  const navigate = useNavigate();
  const groupId = folderData ? folderData.id : null;
  const { favorites, toggleFavorites, isFavorite } = useFavorites();
  const { folderId } = useParams(); // Ambil ID folder dari URL
  const [folder, setFolder] = useState(null);
  // State untuk menyimpan deskripsi folder
const [folderDescriptions, setFolderDescriptions] = useState({});

  // useEffect(() => {
  //   if (folderData) {
  //     setFolderName(folderData.name);

  //     // Ambil deskripsi dari localStorage jika tidak ada di `folderData`
  //     const storedFolders = JSON.parse(localStorage.getItem("folders")) || [];
  //     const foundFolder = storedFolders.find(
  //       (folder) => folder.id === folderData.id
  //     );
  //     setDescription(
  //       foundFolder?.description ||
  //         folderData.description ||
  //         "Tidak ada deskripsi."
  //     );

  //     setFileList(folderData.files || []);
  //   }
  // }, [folderData]);

  //mengganti warna folder yang akan disimpan di localstorage
  const handleColorChange = (color) => {
    if (!folderData?.id) {
      console.error("❌ folderData.id tidak tersedia!");
      return;
    }
  
    setFolderColor(color);
    
    const storedColors = JSON.parse(localStorage.getItem("folderColors")) || {};
    storedColors[folderData.id] = color;
    localStorage.setItem("folderColors", JSON.stringify(storedColors));
  
    console.log(`✅ Warna ${color} tersimpan untuk folder ${folderData.id}`);
  };
  
  // Simpan label warna ke localstorage
  const saveColorLabel = () => {
    if (!folderColor) return;

    const updatedLabels = { ...colorLabels, [folderColor]: labelInput };
    setColorLabels(updatedLabels);
    localStorage.setItem("colorLabels", JSON.stringify(updatedLabels));

    console.log("Label warna tersimpan:", updatedLabels); // Debugging
    setShowLabelSidebar(false);
  };

  //Mengambil label warna saat komponen warna dibuka
  useEffect(() => {
    try {
      const storedLabels = localStorage.getItem("colorLabels");
      if (storedLabels) {
        const parsedLabels = JSON.parse(storedLabels);
        setColorLabels(parsedLabels);
        console.log("Label warna diambil dari localStorage:", parsedLabels);
      } else {
        console.log("Tidak ada label warna di localStorage");
      }
    } catch (error) {
      console.error("Error parsing localStorage data:", error);
    }
  }, []);
  

  // Set input label setiap kali folderColor berubah
  useEffect(() => {
    const newLabel = colorLabels[folderColor] || "";
    if (labelInput !== newLabel) {
      setLabelInput(newLabel);
    }
  }, [folderColor, colorLabels, labelInput]);

  //Mengambil warna dari localstorage ketika folder dibuka
  useEffect(() => {
    if (folderData?.id) {
      const storedColors = JSON.parse(localStorage.getItem("folderColors")) || {};
  
      if (storedColors[folderData.id]) {
        setFolderColor(storedColors[folderData.id]);
      } else {
        const colorIndex = parseInt(folderData.id, 10) % colorOptions.length;
        const newColor = colorOptions[colorIndex];
  
        storedColors[folderData.id] = newColor;
        localStorage.setItem("folderColors", JSON.stringify(storedColors));
        console.log("🔵 Warna disimpan ke localStorage:", storedColors);
        setFolderColor(newColor);
      }
    } else {
      console.warn("⚠️ folderData.id tidak ditemukan, warna tidak bisa disimpan.");
    }
  }, [folderData]);
  

  const fetchFilesByGroup = useCallback(async () => {
    console.log("⚡ fetchFilesByGroup dipanggil...");
    try {
      if (!folderData || !folderData.id) {
        console.error("❌ Id grup tidak ditemukan");
        return;
      }
  
      console.log("📂 Fetching files for group ID:", folderData.id);
      
      const response = await pinata.listFiles().group(folderData.id);
      console.log("🔥 Response dari Pinata:", response);
  
      if (!response || response.length === 0) {
        console.warn("⚠️ Tidak ada file yang ditemukan.");
        return;
      }
  
      const fileDetails = response.map((file) => {
        const fileName = file.metadata?.name || "Unknown File";
        return {
          name: fileName,
          size: file.size,
          cid: file.ipfs_pin_hash,
          type: file.mime_type,
          owner: account,
          description: description || "Tidak ada deskripsi",
          uploadTime: new Date().toISOString(),
        };
      });
  
      console.log("📝 Menyimpan ke localStorage:", fileDetails);
      localStorage.setItem(`files_${folderData.id}`, JSON.stringify(fileDetails));
  
      if (JSON.stringify(fileList) !== JSON.stringify(fileDetails)) {
        setFileList(fileDetails);
        console.log("✅ File berhasil diperbarui:", fileDetails);
      } else {
        console.log("📂 File tidak berubah, tidak perlu update state.");
      }
    } catch (error) {
      console.error("🚨 Gagal fetch files by grup:", error);
    }
  }, [folderData, account]); // Pastikan dependensinya cukup luas agar fungsi bisa berjalan
  
  //Mengambil filde dari localstorage, jjika tidak ada diambil dari pinata
  useEffect(() => {
    console.log("🟢 useEffect dijalankan");
    console.log("📂 folderData:", folderData);
  
    if (folderData?.id) {
      console.log("✅ folderData.id ditemukan:", folderData.id);
      
      const storedFiles = JSON.parse(localStorage.getItem(`files_${folderData.id}`)) || [];
      if (storedFiles.length > 0) {
        console.log("📂 Menggunakan file dari localStorage:", storedFiles);
        setFileList(storedFiles);
      } else {
        console.log("🔍 localStorage kosong, memanggil fetchFilesByGroup...");
        fetchFilesByGroup(); // Jika localStorage kosong, fetch dari API
      }
    } else {
      console.warn("⚠️ folderData.id masih kosong, useEffect tidak bisa fetch file.");
    }
  }, [folderData?.id, account]);
  
  
  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleDescriptionChange = (event) => {
    setDescription(event.target.value); // Hanya perbarui state, penyimpanan akan dilakukan oleh useEffect
  };
  
// Simpan deskripsi ke localStorage
const saveDescription = () => {
  if (!folderData?.id) {
    console.error("❌ ID folder tidak ditemukan!");
    return;
  }

  const updatedDescriptions = { ...folderDescriptions, [folderData.id]: description };
  setFolderDescriptions(updatedDescriptions);
  localStorage.setItem("folderDescriptions", JSON.stringify(updatedDescriptions));

  console.log("✅ Deskripsi tersimpan:", updatedDescriptions);
  setShowDescriptionSidebar(false);
};

// Mengambil deskripsi saat komponen dimuat
useEffect(() => {
  if(folderData){
    setFolderName(folderData.name);
  }

  try {
    const storedDescriptions = localStorage.getItem("folderDescriptions");
    if (storedDescriptions) {
      const parsedDescriptions = JSON.parse(storedDescriptions);
      setFolderDescriptions(parsedDescriptions);
      console.log("📌 Deskripsi diambil dari localStorage:", parsedDescriptions);
    } else {
      console.log("⚠️ Tidak ada deskripsi tersimpan di localStorage.");
    }
  } catch (error) {
    console.error("❌ Error parsing localStorage data:", error);
  }
}, []);

// Update deskripsi saat folderData berubah
useEffect(() => {
  if (folderData?.id && folderDescriptions[folderData.id]) {
    setDescription(folderDescriptions[folderData.id]);
  } else {
    setDescription("Tidak ada deskripsi.");
  }
}, [folderData, folderDescriptions]);
  
  const uploadToIPFS = async () => {
    if (!file) {
      alert("Pilih dokumen terlebih dahulu!");
      return;
    }

    if (!account) {
      alert("Metamask tidak terhubung");
      return;
    }

    if (!folderData || !folderData.id) {
      alert("Folder tidak ditemukan!");
      return;
    }

    setIsUploading(true);
    try {
      if (!(file instanceof Blob)) {
        throw new Error("File yang dipilih tidak valid.");
      }

      const response = await pinata.upload.file(file).group(groupId);

      const cid = response.IpfsHash;

      // Enkripsi CID sebelum disimpan
      const encryptionKey = "your-secret-key"; // Pastikan kunci ini aman
      const encryptedCID = CryptoJS.AES.encrypt(cid, encryptionKey).toString();

      const fileData = {
        name: file.name,
        size: file.size,
        type: file.type,
        cid: cid,
        encryptedCID: encryptedCID,
        mimeType: file.type,
        owner: account,
        description,
        uploadTime: new Date().toISOString(),
      };
    // Update fileList state
    const newFileList = [...fileList, fileData];
    setFileList(newFileList);
    console.log("Daftar file terbaru setelah upload:", newFileList);
    
    if (folderData?.id) {
      localStorage.setItem(`files_${folderData.id}`, JSON.stringify(newFileList));
    } else {
      console.error("Gagal menyimpan ke localStorage: folderData.id tidak ditemukan!");
    }    

      const storedFolders = JSON.parse(localStorage.getItem("folders")) || [];
      const updatedFolders = storedFolders.map((folder) =>
        folder.id === folderData.id
          ? { ...folder, files: [...(folder.files || []), fileData] }
          : folder
      );

      localStorage.setItem("folders", JSON.stringify(updatedFolders));

      alert("File berhasil diupload ke IPFS!");

      setShowUploadSidebar(false);
      setFile(null);
      setDescription("");

      console.log("CID yang dikirim ke DocumentDetail:", fileData.cid);
      setTimeout(() => {
        if (fileData.cid) {
          navigate(`/document-detail/${fileData.cid}`);
        } else {
          console.error("CID tidak ditemukan! Navigasi dibatalkan.");
        }
      }, 500);
      
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
          <button
            className="upload-btn"
            onClick={() => setShowUploadSidebar(true)}
          >
            Upload File
          </button>
          <button
            className="btn-label"
            onClick={() => setShowLabelSidebar(true)}
          >
            Label
          </button>
          <button
            className="btn-description"
            onClick={() => setShowDescriptionSidebar(true)}
          >
            Edit Deskripsi
          </button>
        </div>
      </div>

      {/* Sidebar Upload */}
      <div className={`sidebar ${showUploadSidebar ? "active" : ""}`}>
        <div className="sidebar-header">
          <h3>Upload New Document</h3>
          <button
            className="close-btn"
            onClick={() => setShowUploadSidebar(false)}
          >
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

      {/* Sidebar Deskripsi */}
      <div className={`sidebar ${showDescriptionSidebar ? "active" : ""}`}>
        <div className="sidebar-header">
          <h3>Edit Deskripsi Folder</h3>
          <button
            className="close-btn"
            onClick={() => setShowDescriptionSidebar(false)}
          >
            &times;
          </button>
        </div>
        <textarea
          placeholder="Masukkan deskripsi folder..."
          value={description}
          onChange={handleDescriptionChange}
          rows="4"
        ></textarea>
        <button onClick={saveDescription}>Simpan Deskripsi</button>
      </div>

      <div className={`sidebar ${showLabelSidebar ? "active" : ""}`}>
        <div className="sidebar-header">
          <h3>Atur Label dan Warna</h3>
          <button
            className="close-btn"
            onClick={() => setShowLabelSidebar(false)}
          >
            &times;
          </button>
        </div>

        {/* Pilihan Warna */}
        <div className="color-options">
          {colorOptions.map((color) => (
            <button
              key={color}
              className={`color-btn ${folderColor === color ? "active" : ""}`}
              style={{ backgroundColor: color }}
              onClick={() => handleColorChange(color)}
            />
          ))}
        </div>

        {/* Input Label */}
        <input
          type="text"
          placeholder="Masukkan label untuk warna ini..."
          value={labelInput}
          onChange={(e) => setLabelInput(e.target.value)}
        />

        {/* Tombol Simpan */}
        <button onClick={saveColorLabel}>Simpan Label</button>
      </div>

      <div className="folder-title-container">
        <center style={{ backgroundColor: folderColor }}>
          <h1>{folderName}</h1>
          <p>{description || "Tidak ada deskripsi."}</p>
        </center>
      </div>

      <FileList
        fileList={fileList}
        setFileList={setFileList}
        isFavorite={isFavorite}
        toggleFavorites={toggleFavorites}
      />
    </div>
  );
}

export default FolderPage;
