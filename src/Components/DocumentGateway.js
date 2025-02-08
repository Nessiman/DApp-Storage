import React, { useState } from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { useWeb3 } from './Web3Context'; // Pastikan Anda memiliki Web3Context yang terkonfigurasi

function DocumentGateway() {
  const [cid, setCid] = useState(''); // State untuk CID
  const [documentUrl, setDocumentUrl] = useState(null); // URL dokumen dari IPFS
  const [loading, setLoading] = useState(false); // Status loading
  const [owner, setOwner] = useState(''); // Pemilik dokumen
  const { contract, account } = useWeb3(); // Mengambil instance contract dan akun aktif dari Web3Context

  const fetchDocument = async () => {
    if (!cid.trim()) {
      alert('CID tidak boleh kosong');
      return;
    }

    setLoading(true);
    try {
      // Cek dokumen di blockchain
      const isUploaded = await contract.methods.isFileUploaded(cid).call();
      if (!isUploaded) {
        alert('Dokumen tidak ditemukan di blockchain!');
        setLoading(false);
        return;
      }

      try {
        await contract.methods.recordAccess(cid).send({ from: account });
        alert('Transaksi berhasil, akses tercatat di blockchain');
      }catch (error){
        alert('Transaksi dibatalkan. Dokumen tidak bisa diakses');
        setLoading(false);
        return;
      }

      // Ambil metadata dokumen
      const document = await contract.methods.documents(cid).call();
      setOwner(document.uploader);

      // Ambil URL dokumen dari IPFS
      const url = `https://ipfs.io/ipfs/${cid}`;
      const response = await fetch(url);
      if (!response.ok) {
        alert('Dokumen tidak ditemukan di IPFS!');
        setLoading(false);
        return;
      }

      setDocumentUrl(url); // Simpan URL dokumen untuk ditampilkan

    } catch (error) {
      console.error('Terjadi kesalahan saat mencari dokumen:', error);
      alert('Terjadi kesalahan saat mencari dokumen!');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (documentUrl) {
      try {
        // Rekam unduhan di blockchain
        await contract.methods.recordDownload(cid).send({ from: account });

        // Unduh dokumen
        const response = await fetch(documentUrl);
        if (!response.ok) {
          alert('Gagal mengunduh dokumen');
          return;
        }

        const blob = await response.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'document.pdf'; // Nama file yang diunduh
        link.click();

        alert('Aksi unduhan berhasil dicatat di blockchain.');
      } catch (error) {
        console.error('Terjadi kesalahan saat mencatat unduhan:', error);
        alert('Terjadi kesalahan saat mencatat unduhan!');
      }
    }
  };

  return (
    <div className="container">
      <h1><center>Document Gateway</center></h1>

      {/* Form untuk memasukkan CID */}
      <div className="mb-3">
        <label htmlFor="cidInput" className="form-label">Masukkan CID Dokumen:</label>
        <div className="d-flex">
          <input
            type="text"
            id="cidInput"
            className="form-control"
            placeholder="CID"
            value={cid}
            onChange={(e) => setCid(e.target.value)}
          />
          <button
            className="btn btn-primary ms-2"
            onClick={fetchDocument}
            disabled={loading}
          >
            {loading ? 'Mencari...' : 'Cari'}
          </button>
        </div>
      </div>

      {/* Tampilkan hasil dokumen dan tombol download */}
      {documentUrl && (
        <div className="mt-4">
          <h4>Dokumen Ditemukan:</h4>
          <p><strong>Pemilik Dokumen:</strong> {owner}</p>
          <button onClick={handleDownload} className="btn btn-success mt-3">
            Download Dokumen
          </button>
          <div style={{ border: '1px solid #ccc', height: '500px', marginTop: '20px' }}>
            <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.3.122/build/pdf.worker.min.js`}>
              <Viewer fileUrl={documentUrl} />
            </Worker>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentGateway;
