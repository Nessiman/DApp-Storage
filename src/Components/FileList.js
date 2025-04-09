import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWeb3 } from "./Web3Context";
import "../cssComponent/FileList.css";

function FileList({ fileList, setFileList, toggleFavorites, isFavorite }) {
  // ✅ Pakai dari props
  const { contract, account } = useWeb3();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);

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

  const checkFileUploadStatus = useCallback(async () => {
    if (!contract || !fileList || fileList.length === 0) return;

    try {
      const validFiles = fileList.filter((file) => file.cid);
      if (validFiles.length === 0) return;

      const updatedFileList = await Promise.all(
        validFiles.map(async (file) => {
          const isUploaded = await contract.methods
            .isFileUploaded(file.cid)
            .call();
          return { ...file, uploaded: isUploaded };
        })
      );

      setFileList((prevFiles) => {
        const newFileList = prevFiles.map(
          (file) => updatedFileList.find((f) => f.cid === file.cid) || file
        );

        // Cek apakah ada perubahan sebelum memanggil setState
        if (JSON.stringify(prevFiles) === JSON.stringify(newFileList)) {
          return prevFiles; // Hindari pemanggilan setState jika tidak ada perubahan
        }

        return newFileList;
      });
    } catch (error) {
      console.error("Gagal memuat status upload file", error);
    }
  }, [contract, JSON.stringify(fileList), setFileList]); // Gunakan JSON.stringify(fileList)

  useEffect(() => {
    checkFileUploadStatus();
  }, []); // Jalankan hanya sekali saat komponen mount

  useEffect(() => {
    checkFileUploadStatus();
  }, [checkFileUploadStatus]);

  const renderUploadStatus = (file) =>
    file.uploaded ? (
      <span className="badge bg-success">Uploaded</span>
    ) : (
      <span className="badge bg-warning">Not Uploaded</span>
    );

  return (
    <div>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Nama Dokumen</th>
            <th>Date</th>
            <th>Type</th>
            <th>Label</th>
            <th>Tag</th>
            <th>Favorites</th>
            <th>Status Blockchain</th>
            <th>Opsi</th>
          </tr>
        </thead>
        <tbody>
          {fileList.length > 0 ? (
            fileList.map((file, index) => (
              <tr key={file.id || index}>
                <td>{file.name}</td>
                <td>
                  {file.uploadTime
                    ? new Date(file.uploadTime).toLocaleDateString()
                    : "Unknown"}
                </td>
                <td>{file.type || "Unknown"}</td>
                <td>
                  <span
                    style={{
                      display: "inline-block",
                      width: "20px",
                      height: "20px",
                      backgroundColor: file.color || "#ccc",
                      borderRadius: "4px",
                    }}
                  ></span>
                </td>
                <td>{file.tag || "-"}</td>
                <td>
                  <button className="btn" onClick={() => toggleFavorites(file)}>
                    {isFavorite(file) ? "⭐" : "☆"}
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
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="text-center">
                Tidak ada file yang tersedia.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default FileList;
