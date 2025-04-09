import React, { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import pinata from "../utils/config";
import "../cssComponent/FolderList.css";
import MyFolder from "./MyFolder";

function FolderList({ sortBy, sortOrder, onDeleteFolder }) { // ✅ Tambahkan onDeleteFolder sebagai props
  const navigate = useNavigate();
  const [localFolders, setLocalFolders] = useState([]);
  const [colorLabels, setColorLabels] = useState(() => JSON.parse(localStorage.getItem("colorLabels")) || {});
  const [folderColors, setFolderColors] = useState(() => JSON.parse(localStorage.getItem("folderColors")) || {});
  const [folderDescriptions, setFolderDescriptions] = useState(() => JSON.parse(localStorage.getItem("folderDescriptions")) || {});

  const isFetching = useRef(false);

  // 📌 Ambil daftar folder dari API
  const fetchFolders = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;

    try {
      const response = await pinata.groups.list();
      console.log("Respon dari API list folders:", response);

      if (Array.isArray(response) && response.length > 0) {
        setLocalFolders(response);
        localStorage.setItem("folders", JSON.stringify(response));
      } else {
        setLocalFolders([]);
      }
    } catch (error) {
      console.error("Error fetching folders:", error);
      setLocalFolders([]);
    } finally {
      isFetching.current = false;
    }
  }, []);

  // 📌 Ambil folder dari API saat pertama kali render
  useEffect(() => {
    const cachedFolders = JSON.parse(localStorage.getItem("folders"));
    if (cachedFolders && cachedFolders.length > 0) {
      setLocalFolders(cachedFolders);
    } else {
      fetchFolders();
    }
  }, [fetchFolders]);

  // 📌 Gunakan useMemo untuk sorting hanya ketika opsi sorting berubah
  const sortedFolders = useMemo(() => {
    if (!sortBy) return localFolders; // Jika tidak ada opsi sorting, tampilkan default

    return [...localFolders].sort((a, b) => {
      if (sortBy === "name") {
        return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      if (sortBy === "date") {
        return sortOrder === "asc"
          ? new Date(a.createdAt) - new Date(b.createdAt)
          : new Date(b.createdAt) - new Date(a.createdAt);
      }
      return 0;
    });
  }, [localFolders, sortBy, sortOrder]);

  // 🔄 Format tanggal ke DD/MM/YY
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${date.getFullYear().toString().slice(-2)}`;
  };

  return (
    <div className="folder-list-container">
      {sortedFolders.length > 0 ? ( // ✅ Gunakan sortedFolders
        <table className="folder-table">
          <thead>
            <tr>
              <th>Nama Folder</th>
              <th>ID</th>
              <th>Deskripsi</th>
              <th>Date</th>
              <th>Warna</th>
              <th>Label</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {sortedFolders.map((folder) => { // ✅ Gunakan sortedFolders, bukan localFolders
              const folderColor = folderColors[folder.id] || "#f8f9fa";
              const folderLabel = colorLabels[folder.id]?.label || "-";             
              const folderDescription = folderDescriptions[folder.id] || "Tidak ada deskripsi";

              return (
                <tr
                  key={folder.id || folder.name}
                  onClick={() => navigate(`/folder-page`, { state: { folderData: folder } })}
                  style={{ cursor: "pointer" }}
                >
                  <td>{folder.name}</td>
                  <td>{folder.id}</td>
                  <td>{folderDescription}</td>
                  <td>{formatDate(folder.createdAt)}</td>
                  <td>
                    <div className="color-box" style={{ backgroundColor: folderColor }}></div>
                  </td>
                  <td>{folderLabel}</td>
                  <td>
                    {onDeleteFolder && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteFolder(folder.id);
                        }}
                      >
                        <FaTrash />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p className="text-muted">Tidak ada folder yang tersedia.</p>
      )}
    </div>
  );
}

export default FolderList;
