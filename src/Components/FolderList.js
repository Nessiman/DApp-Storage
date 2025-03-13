import React, { useState, useCallback, useEffect } from "react";
import { FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import pinata from "../utils/config";

function FolderList({ folders = [], onDeleteFolder }) {
  const navigate = useNavigate();
  const [localFolders, setLocalFolders] = useState(folders);
  const [colorLabels, setColorLabels] = useState({}); // Simpan label global warna
  const [folderColors, setFolderColors] = useState({});

  // Ambil daftar folder dari API jika tidak ada dari props
  const fetchFolders = useCallback(async () => {
    try {
      const response = await pinata.groups.list();
      console.log("Respon dari API list folders:", response);

      if (response && Array.isArray(response) && response.length > 0) {
        setLocalFolders(response);
      } else {
        setLocalFolders([]);
      }
    } catch (error) {
      console.error("Error fetching folders:", error);
      setLocalFolders([]);
    }
  }, []);

  const handleDeleteFolder = async (folderId) => {
    try {
      await pinata.groups.delete(folderId);
      setLocalFolders((prevFolders) => prevFolders.filter((folder) => folder.id !== folderId));

      // Hapus warna dan label dari localStorage
      const updatedColors = { ...folderColors };
      delete updatedColors[folderId];

      const updatedLabels = { ...colorLabels };
      delete updatedLabels[folderColors[folderId]];

      localStorage.setItem("folders", JSON.stringify(updatedColors));
      localStorage.setItem("colorLabels", JSON.stringify(updatedLabels));

      setFolderColors(updatedColors);
      setColorLabels(updatedLabels);

      console.log(`Folder dengan ID ${folderId} berhasil dihapus.`);
    } catch (error) {
      console.error("Gagal menghapus folder:", error);
    }
  };

  useEffect(() => {
    if (folders.length === 0) {
      fetchFolders();
    }

    // Ambil warna dan label dari localStorage
    const storedFolders = JSON.parse(localStorage.getItem("folders")) || [];
    const storedLabels = JSON.parse(localStorage.getItem("colorLabels")) || {};

    // Buat objek warna berdasarkan ID folder
    const colorsMap = {};
    storedFolders.forEach((folder) => {
      if (folder.id) {
        colorsMap[folder.id] = folder.color || "#f8f9fa"; // Warna default
      }
    });

    setFolderColors(colorsMap);
    setColorLabels(storedLabels);
  }, [fetchFolders, folders]);

  return (
    <div className="container mt-4">
    <div className="row g-3">
      {localFolders.length > 0 ? (
        localFolders.map((folder) => {
          const folderColor = folderColors[folder.id] || "#f8f9fa"; // Ambil warna dari state atau gunakan default
          const folderLabel = colorLabels[folderColor] || ""; // Ambil label warna dari state

          return (
            <div key={folder.id || folder.name} className="col-md-4 col-sm-6 col-12">
              <div
                className="card folder-card p-3 d-flex flex-column justify-content-center align-items-center"
                style={{
                  backgroundColor: folderColor,
                  border: "1px solid #4a4c4e",
                  transition: "background-color 0.3s ease",
                }}
                onClick={() => navigate(`/folder-page`, { state: { folderData: folder } })}
              >
                <span className="folder-name" style={{ cursor: "pointer", fontWeight: "bold" }}>
                  {folder.name}
                </span>

                {/* Tampilkan label jika ada */}
                {folderLabel && (
                  <span className="folder-label" style={{ fontSize: "12px", fontWeight: "bold", marginTop: "5px" }}>
                    {folderLabel}
                  </span>
                )}

                <button
                  className="btn btn-danger btn-sm mt-2"
                  style={{ width: "32px", height: "32px", borderRadius: "50%" }}
                  onClick={(e) => {
                    e.stopPropagation(); // Supaya klik tombol tidak membuka folder
                    handleDeleteFolder(folder.id);
                  }}
                >
                  <FaTrash size={14} />
                </button>
              </div>
            </div>
          );
        })
      ) : (
        <p className="text-muted">Tidak ada folder yang tersedia.</p>
      )}
    </div>
  </div>
);
}

export default FolderList;
