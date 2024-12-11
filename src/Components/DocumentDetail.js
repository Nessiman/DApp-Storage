import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Viewer, Worker } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { useWeb3 } from "./Web3Context"; // Gunakan Web3Context

const DocumentDetail = () => {
  const { cid } = useParams(); // Ambil CID dari URL
  const { contract } = useWeb3(); // Akses kontrak dari Web3Context
  const [document, setDocument] = useState(null); // Detail dokumen dari localStorage
  const [accessLog, setAccessLog] = useState([]);
  const [downloadLog, setDownloadLog] = useState([]); // Log download dokumen
  const [loading, setLoading] = useState(true); // Status loading


  useEffect(() => {
    const fetchDocument = () => {
      const storedFiles = JSON.parse(localStorage.getItem("ipfsFiles")) || [];
      const doc = storedFiles.find((file) => file.cid === cid);
      if (doc) {
        setDocument(doc);
      } else {
        alert("Dokumen tidak ditemukan di localStorage!");
      }
    };

    const fetchDownloadLog = async () => {
      if (contract && cid) {
        try {
          const log = await contract.methods.getDownloadLog(cid).call();

          const formattedLog = log.map((record) => ({
            user: record.user,
            timestamp: Number(record.timestamp),
          }))
          setDownloadLog(formattedLog);
        } catch (error) {
          console.error("Error fetching download log:", error);
        }
      }
    };

    const FetchAccessLog = async() =>{
      if (contract && cid) {
        try {
          const log = await contract.methods.getAccessLog(cid).call();

          const formattedLog = log.map((record)=> ({
            user: record.user,
            timestamp: Number(record.timestamp),
          }));
          setAccessLog(formattedLog);
        }catch(error){
          console.error("Error fetch akses log", error);
        }
      }
    };

    FetchAccessLog();
    fetchDocument();
    fetchDownloadLog();
    setLoading(false);
  }, [contract, cid]);

  if (loading) return <div>Loading...</div>;

  if (!document) return <div>Dokumen tidak ditemukan.</div>;

  const documentUrl = `https://ipfs.io/ipfs/${cid}`; // URL file di IPFS

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h3>Detail Dokumen</h3>
      <div style={{ marginBottom: "20px" }}>
        <p><strong>Nama:</strong> {document.name}</p>
        <p><strong>CID:</strong> {document.cid}</p>
        <p><strong>Ukuran:</strong> {document.size} bytes</p>
        <p><strong>Tipe:</strong> {document.type}</p>
        <p><strong>Waktu Upload:</strong> {document.uploadTime}</p>
        <p><strong>Pengupload:</strong> {document.owner}
        <p><strong>Deskripsi:</strong> {document.description}</p>
</p>
      </div>

      <div style={{ border: "1px solid #ccc", height: "500px", padding: "10px" }}>
        {document.type === "application/pdf" ? (
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.3.122/build/pdf.worker.min.js">
            <Viewer fileUrl={documentUrl} />
          </Worker>
        ) : document.type.startsWith("image/") ? (
          <img src={documentUrl} alt={document.name} style={{ maxWidth: "100%", height: "auto" }} />
        ) : document.type.startsWith("video/") ? (
          <video controls style={{ maxWidth: "100%" }}>
            <source src={documentUrl} type={document.type} />
            Browser Anda tidak mendukung tag video.
          </video>
        ) : document.type.startsWith("audio/") ? (
          <audio controls>
            <source src={documentUrl} type={document.type} />
            Browser Anda tidak mendukung tag audio.
          </audio>
        ) : (
          <p>
            Pratinjau tidak tersedia untuk tipe file ini. Anda dapat mengunduh file menggunakan tautan
            berikut: <a href={documentUrl} download>{document.name}</a>
          </p>
        )}
      </div>

      <h4 style={{ marginTop: "30px"}}>Riwayat Akses</h4>
      <ul>
        {accessLog.length > 0 ? (
          accessLog.map((log, index) => (
            <li key={index}>{log.user} diakses pada {new Date(log.timestamp * 1000).toLocaleString()}</li>
          ))
        ) : (
          <div>-</div>
        )}
      </ul>

      <h4 style={{ marginTop: "30px" }}>Riwayat Download</h4>
      <ul>
        {downloadLog.length > 0 ? (
          downloadLog.map((log, index) => 
          <li key={index}>{log.user} didownload pada {new Date(log.timestamp * 1000).toLocaleString()}</li>)
        ) : (
          <div>Belum ada log download untuk dokumen ini</div>
        )}
      </ul>
    </div>
  );
};

export default DocumentDetail;
