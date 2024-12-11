import React, { useState } from "react";
import pinata from "../utils/config";


function DocumentUpload({ onFileUploaded, account }) {
  const [file, setFile] = useState(null);
  const [fileAttributes, setFileAttributes] = useState(null);
  const [cid, setCid] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState("");


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

    setUploading(true);
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

      setFileAttributes(fileData);
      setCid(response.IpfsHash);

      // Menambahkan file ke folder setelah upload berhasil
      onFileUploaded(fileData);
      alert("File berhasil diupload ke IPFS!");
    } catch (error) {
      console.error("Gagal mengunggah file ke IPFS:", error);
      alert("Terjadi kesalahan saat mengunggah file.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h2>Upload Document ke IPFS</h2>
      <input type="file" onChange={handleFileChange} />
      <textarea
      placeholder="Masukkan deskripsi dokumen"
      value={description}
      onChange={handleDescriptionChange}
      rows="3"
      cols="40"></textarea><br />
      <button onClick={uploadToIPFS} disabled={uploading}>
        {uploading ? "Mengunggah..." : "Upload"}
      </button>

      {fileAttributes && cid && (
        <div>
          <h3>Informasi Dokumen:</h3>
          <p>Nama: {fileAttributes.name}</p>
          <p>Ukuran: {fileAttributes.size} bytes</p>
          <p>Tipe: {fileAttributes.type}</p>
          <p>Deskripsi: {fileAttributes.description}</p> 
          <p>Waktu Upload: {fileAttributes.uploadTime}</p> 
          <p>CID (IPFS Hash): {cid}</p>
          <p>Pemilik: {fileAttributes.owner}</p>
        </div>
      )}
    </div>
  );
}

export default DocumentUpload;
