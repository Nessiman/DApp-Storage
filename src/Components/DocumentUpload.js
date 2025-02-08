import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import pinata from "../utils/config";

function DocumentUpload({ onFileUploaded, account }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState("");
  const navigate = useNavigate();

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

    setUploading(true);
    try {
      if (!(file instanceof Blob)) {
        throw new Error("File yang dipilih tidak valid.");
      }

      if (!account) {
        alert("MetaMask tidak terhubung!");
        return;
      }

      // Mengunggah file ke IPFS menggunakan Pinata
      const response = await pinata.upload.file(file);
      console.log("Response dari Pinata:", response);

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

      // Menyimpan file di localStorage
      localStorage.setItem("UploadedDocument", JSON.stringify(fileData));

      // Menambahkan file ke folder setelah upload berhasil
      onFileUploaded(fileData);

      alert("File berhasil diupload ke IPFS!");

      setTimeout(() => {
              // Navigasi ke halaman detail dokumen
      navigate(`/document-detail/${fileData.cid}`);
      },500);

    } catch (error) {
      console.error("Gagal mengunggah file ke IPFS:", error);
      alert("Terjadi kesalahan saat mengunggah file.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mt-5 d-flex flex-column align-items-center">
      <h1 className="text-center mb-4">Document Storage DApp</h1>
      <p className="text-center mb-5">Upload or Drag Your File Here!</p>

      <div className="card shadow-lg p-4" style={{ width: "100%", maxWidth: "500px" }}>
        <div className="mb-3">
          <label htmlFor="description" className="form-label">
            <strong>Description</strong>
          </label>
          <textarea
            className="form-control"
            id="description"
            placeholder="Masukkan deskripsi dokumen"
            value={description}
            onChange={handleDescriptionChange}
            rows="3"
          ></textarea>
        </div>

        <div className="mb-3">
          <label htmlFor="fileInput" className="form-label">
            <strong>Choose File</strong>
          </label>
          <input type="file" className="form-control" id="fileInput" onChange={handleFileChange} />
        </div>

        <div className="d-flex justify-content-end">
          <button className="btn btn-primary" onClick={uploadToIPFS} disabled={uploading}>
            {uploading ? "Mengunggah..." : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DocumentUpload;
