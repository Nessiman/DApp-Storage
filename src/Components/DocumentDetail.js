import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Viewer, Worker } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { useWeb3 } from "./Web3Context"; // Gunakan Web3Context
import "../cssComponent/DocumentDetail.css";
import CryptoJS from "crypto-js";

const colorOptions = ["#3498db", "#e74c3c", "#2ecc71", "#f1c40f", "#9b59b6"];
const defaultColor = "#ffffff"; // Warna default ketika tidak ada warna

const DocumentDetail = () => {
  const { cid } = useParams(); // Ambil CID dari URL
  const { contract } = useWeb3(); // Akses kontrak dari Web3Context
  const [document, setDocument] = useState(null); // Detail dokumen dari localStorage
  const [accessLog, setAccessLog] = useState([]);
  const [downloadLog, setDownloadLog] = useState([]); // Log download dokumen
  const [loading, setLoading] = useState(true); // Status loading
  const navigate = useNavigate();
  const [tags, setTags] = useState([]);

  const [docColor, setDocColor] = useState("#ffffff");
  const [colorLabels, setColorLabels] = useState({});
  const [labelInput, setLabelInput] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);

  const [encryptedCID, setEncryptedCID] = useState("");

  const availableTags = [
    "music",
    "video",
    "document",
    "report",
    "podcast",
    "project",
    "picture",
    "animation",
    "presentation",
    "research",
    "invoice",
    "contract",
    "manual",
    "guide",
    "article",
    "blog",
    "thesis",
    "dataset",
    "Certficate",
    "To Do List",
  ];

  //useEffect COLOR
  useEffect(() => {
    const storedFiles = JSON.parse(localStorage.getItem("ipfsFiles")) || [];
    const doc = storedFiles.find((file) => file.cid === cid);
    if (doc) {
      setDocument(doc);
      setDocColor(doc.color || defaultColor);
      setEncryptedCID(doc.encryptedCID || "Tidak Tersedia");
    }

    const storedLabels = JSON.parse(localStorage.getItem("colorLabels")) || {};
    setColorLabels(storedLabels);
  }, [cid]);

  useEffect(() => {
    setLabelInput(colorLabels[docColor] || "");
  }, [docColor, colorLabels]);

  const handleColorChange = (color) => {
    const newColor = docColor === color ? defaultColor : color;
    setDocColor(newColor);
    saveDocumentColor(cid, newColor);
  };

  const saveDocumentColor = (docId, color) => {
    const storedFiles = JSON.parse(localStorage.getItem("ipfsFiles")) || [];
    const updatedFiles = storedFiles.map((doc) =>
      doc.cid === docId ? { ...doc, color } : doc
    );
    localStorage.setItem("ipfsFiles", JSON.stringify(updatedFiles));
  };

  const handleLabelChange = (event) => {
    setLabelInput(event.target.value);
  };

  const saveLabel = () => {
    if (docColor) {
      const updatedLabels = { ...colorLabels, [docColor]: labelInput };
      setColorLabels(updatedLabels);
      localStorage.setItem("colorLabels", JSON.stringify(updatedLabels));
    }
  };

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
          }));
          setDownloadLog(formattedLog);
        } catch (error) {
          console.error("Error fetching download log:", error);
        }
      }
    };

    const FetchAccessLog = async () => {
      if (contract && cid) {
        try {
          const log = await contract.methods.getAccessLog(cid).call();

          const formattedLog = log.map((record) => ({
            user: record.user,
            timestamp: Number(record.timestamp),
          }));
          setAccessLog(formattedLog);
        } catch (error) {
          console.error("Error fetch akses log", error);
        }
      }
    };

    const storedTags = JSON.parse(localStorage.getItem(`tags-${cid}`)) || [];
    setTags(storedTags);

    FetchAccessLog();
    fetchDocument();
    fetchDownloadLog();
    setLoading(false);
  }, [contract, cid]);

  const updateTags = (updatedTags) => {
    setTags(updatedTags);
    localStorage.setItem(`tags-${cid}`, JSON.stringify(updatedTags));
  };

  const addTag = (selectedTag) => {
    if (!tags.includes(selectedTag)) updateTags([...tags, selectedTag]);
  };

  const removeTag = (tagToRemove) => {
    updateTags(tags.filter((tag) => tag !== tagToRemove));
  };

  if (loading) return <div>Loading...</div>;

  if (!document) return <div>Dokumen tidak ditemukan.</div>;

  const documentUrl = `https://ipfs.io/ipfs/${cid}`; // URL file di IPFS

  return (
    <div
      className="document-container"
      style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}
    >
      <div className="header-container">
        <button className="back-button" onClick={() => navigate(-1)}>
          &larr; Back to My Folder
        </button>
        <div className="right-controls">
          <div className="tag-section">
            <select
              className="tag-select"
              onChange={(e) => addTag(e.target.value)}
            >
              <option value="">Pilih Tag</option>
              {availableTags.map((tag, index) => (
                <option key={index} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>
          <button className="label-btn" onClick={() => setShowSidebar(!showSidebar)}>
    Label
  </button>
        </div>
      </div>
      {showSidebar && (
  <div className="label-panel">
    <h3>Label Warna</h3>
    <div className="color-options">
      {colorOptions.map((color) => (
        <div key={color} className="color-item">
          <button
            className={`color-btn ${docColor === color ? "active" : ""}`}
            style={{ backgroundColor: color }}
            onClick={() => handleColorChange(color)}
          ></button>
          {colorLabels[color] ? (
            <p className="color-label">{colorLabels[color]}</p>
          ) : (
            <p className="color-label"></p>
          )}
        </div>
      ))}
    </div>
    {docColor !== defaultColor && (
      <div>
        <input
          type="text"
          placeholder="Masukkan label..."
          value={labelInput}
          onChange={handleLabelChange}
        />
        <button onClick={saveLabel}>Simpan</button>
      </div>
    )}
  </div>
)}
      <div className="title-container" style={{ backgroundColor: docColor }}>
        <h1>
          <b>
            <center>{document.name}</center>
          </b>
          <div className="tag-list">
            {tags.map((tag, index) => (
              <span key={index} className="tag" onClick={() => removeTag(tag)}>
                {tag} ×
              </span>
            ))}
          </div>
        </h1>
        <center>
          <p>{document.description}</p>
        </center>
      </div>
      <div className="doc-tab">
        <table className="document-table">
          <tbody>
            <tr className="tebel">
              <th>Nama</th>
              <th>CID</th>
              <th>Ukuran</th>
            </tr>
            <tr className="space">
              <td>{document.name}</td>
              <td>{document.cid}</td>
              <td>{document.size} bytes</td>
            </tr>
            <tr className="tebel">
              <th>Tipe</th>
              <th>Waktu Upload</th>
              <th>Pengupload</th>
            </tr>
            <tr>
              <td>{document.type}</td>
              <td>{document.uploadTime}</td>
              <td className="truncate">{document.owner}</td>
            </tr>
            <tr className="tebel">
              <th>Hash Enkripsi</th>
            </tr>
            <tr>
              <td>{document.encryptedCID}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ border: "1px solid #ccc", height: "500px" }}>
        {document.type === "application/pdf" ? (
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.3.122/build/pdf.worker.min.js">
            <Viewer fileUrl={documentUrl} />
          </Worker>
        ) : document.type.startsWith("image/") ? (
          <img
            src={documentUrl}
            alt={document.name}
            style={{ maxWidth: "100%", height: "auto" }}
          />
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
            Pratinjau tidak tersedia untuk tipe file ini. Anda dapat mengunduh
            file menggunakan tautan berikut:{" "}
            <a href={documentUrl} download>
              {document.name}
            </a>
          </p>
        )}
      </div>
      {/* Container untuk Riwayat Akses & Riwayat Download */}
      <div className="log-container">
        {/* Tabel Riwayat Akses */}
        <div className="log-table">
          <center className="title-history">Riwayat Akses</center>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Address</th>
                <th>Waktu</th>
              </tr>
            </thead>
            <tbody>
              {accessLog.length > 0 ? (
                accessLog.map((log) => (
                  <tr key={log.no}>
                    <td>{log.no}</td>
                    <td className="truncate">{log.user}</td>
                    <td>{log.timestamp}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">Belum ada riwayat akses</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Tabel Riwayat Download */}
        <div className="log-table">
          <center className="title-history">Riwayat Download</center>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Address</th>
                <th>Waktu</th>
              </tr>
            </thead>
            <tbody>
              {downloadLog.length > 0 ? (
                downloadLog.map((log) => (
                  <tr key={log.no}>
                    <td>{log.no}</td>
                    <td className="truncate">{log.user}</td>
                    <td>{log.timestamp}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">Belum ada riwayat download</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetail;
