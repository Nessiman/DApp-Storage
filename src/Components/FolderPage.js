import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useWeb3 } from "./Web3Context";
import pinata from "../utils/config"; // Pastikan pinata sudah dikonfigurasi



function FolderPage() {
  const [fileList, setFileList] = useState([]);
  const [folderName, setFolderName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState(null);  // Menyimpan file yang akan diupload
  const [description, setDescription] = useState("");
  const { state } = useLocation();
  const { folderData } = state || {}; // Data folder yang dikirim dari MyFolder
  const { contract, account } = useWeb3();
  const navigate = useNavigate();

  useEffect(() => {
    if (folderData) {
      setFolderName(folderData.name); // Atur nama folder
      setFileList(folderData.files || []); // Ambil daftar file dari data folder
    }
  }, [folderData]);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
  };

  const handleDescriptionChange = (event) => {
    setDescription(event.target.value);
  };

  const uploadToIPFS = async () => {
    if (!file) {
      alert("Pilih dokumen terlebih dahulu!");
      return;
    }

    setIsUploading(true);
    try {
      if (!(file instanceof Blob)) {
        throw new Error("File yang dipilih tidak valid.");
      }

      // Pastikan akun MetaMask terhubung
      if (!account) {
        alert("MetaMask tidak terhubung!");
        return;
      }

      // Mengunggah file ke IPFS menggunakan Pinata
      const response = await pinata.upload.file(file);

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

      // Menambahkan file ke folder setelah upload berhasil
      setFileList([...fileList, fileData]);  // Menambahkan file yang baru diupload ke daftar
      alert("File berhasil diupload ke IPFS!");
    } catch (error) {
      console.error("Gagal mengunggah file ke IPFS:", error);
      alert("Terjadi kesalahan saat mengunggah file.");
    } finally {
      setIsUploading(false);
    }
  };

  
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

  const handleDocumentOption = useCallback(
    async (document, option) => {
      if (option === "detail") {
        navigate(`/document-detail/${document.cid}`);
      } else if (option === "delete") {
        const updatedFiles = fileList.filter((file) => file.cid !== document.cid);
        setFileList(updatedFiles); // Perbarui state lokal
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

          // Update file list setelah menghapus metadata dari blockchain
          const updatedFiles = fileList.filter((file) => file.cid !== document.cid);
          setFileList(updatedFiles);

          alert("Dokumen berhasil dihapus dari blockchain!");
        } catch (error) {
          console.log("Terjadi kesalahan dalam menghapus dokumen dari blockchain");
          alert("Terjadi kesalahan dalam menghapus dokumen dari blockchain");
        }
      }
    },
    [fileList, navigate, contract, account]
  );

  const renderUploadStatus = (file) =>
    file.uploaded ? (
      <span className="badge bg-success">Uploaded</span>
    ) : (
      <span className="badge bg-warning">Not Uploaded</span>
    );

  return (
    <div className="folder-page-container">
      <h2>{folderName}</h2>
      <button className="btn btn-secondary mb-3" onClick={() => navigate(-1)}>
        Back to My Folder
      </button>

      <h3>Files in this folder:</h3>
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
          <p>No files available in this folder.</p>
        )}
      </ul>

      <div className="upload-section mt-4">
        <h3>Upload New Document</h3>
        <input type="file" onChange={handleFileChange} />
        <textarea
          placeholder="Masukkan deskripsi dokumen"
          value={description}
          onChange={handleDescriptionChange}
          rows="3"
          cols="40"
        ></textarea><br />
        <button onClick={uploadToIPFS} disabled={isUploading}>
          {isUploading ? "Mengunggah..." : "Upload"}
        </button>
      </div>
    </div>
  );
}

export default FolderPage;
