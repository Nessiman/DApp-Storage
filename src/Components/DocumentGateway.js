import React, { useState } from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { useWeb3 } from './Web3Context';
import CryptoJS from 'crypto-js';

function DocumentGateway() {
  const [cid, setCid] = useState('');
  const [documentUrl, setDocumentUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [owner, setOwner] = useState('');
  const { contract, account } = useWeb3();
  const [encryptedCID, setEncryptedCID] = useState('');
  const [decryptedCID, setDecryptedCID] = useState('');

  const encryptionKey = 'your-secret-key';

  const decryptCID = async () => {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedCID, encryptionKey);
      const decryptedCID = bytes.toString(CryptoJS.enc.Utf8);

      if (!decryptedCID) {
        throw new Error('CID hasil dekripsi kosong!');
      }

      console.log('CID Terdekripsi:', decryptedCID);

      // Update state terlebih dahulu
      setDecryptedCID(decryptedCID);
      setCid(decryptedCID);

      // Tunggu hingga state diperbarui sebelum fetch document
      await fetchDocument(decryptedCID);
    } catch (error) {
      console.error('Gagal mendekripsi CID:', error);
      alert('Gagal mendekripsi CID. Periksa kembali input Anda.');
    }
  };

  const fetchDocument = async (cid) => {
    if (!cid || cid.trim() === '') {
      alert('CID tidak valid!');
      return;
    }

    setLoading(true);
    try {
      const isUploaded = await contract.methods.isFileUploaded(cid).call();
      if (!isUploaded) {
        alert('Dokumen tidak ditemukan di blockchain!');
        setLoading(false);
        return;
      }

      try {
        await contract.methods.recordAccess(cid).send({ from: account });
        alert('Transaksi berhasil, akses tercatat di blockchain');
      } catch (error) {
        alert('Transaksi dibatalkan. Dokumen tidak bisa diakses');
        setLoading(false);
        return;
      }

      const document = await contract.methods.documents(cid).call();
      setOwner(document.uploader);

      const url = `https://ipfs.io/ipfs/${cid}`;
      const response = await fetch(url);
      if (!response.ok) {
        alert('Dokumen tidak ditemukan di IPFS!');
        setLoading(false);
        return;
      }

      setDocumentUrl(url);
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
        await contract.methods.recordDownload(cid).send({ from: account });

        const response = await fetch(documentUrl);
        if (!response.ok) {
          alert('Gagal mengunduh dokumen');
          return;
        }

        const blob = await response.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'document.pdf';
        link.click();

        alert('Aksi unduhan berhasil dicatat di blockchain.');
      } catch (error) {
        console.error('Terjadi kesalahan saat mencatat unduhan:', error);
        alert('Terjadi kesalahan saat mencatat unduhan!');
      }
    }
  };

  return (
    <div>
      <h1 className="text-center">Document Gateway</h1>

      {/* Input untuk Encrypted CID */}
      <div className="card p-4 shadow mt-4" style={{ maxWidth: '500px', margin: 'auto' }}>
        <div className="mb-3">
          <label className="form-label"><strong>Encrypted CID</strong></label>
          <input 
            type="text" 
            className="form-control" 
            value={encryptedCID} 
            onChange={(e) => setEncryptedCID(e.target.value)} 
            placeholder="Masukkan hash terenkripsi"
          />
        </div>

        <button className="btn btn-primary w-100" onClick={decryptCID} disabled={loading}>
          {loading ? 'Mencari...' : 'Dekripsi & Cari'}
        </button>
      </div>

      {documentUrl && (
        <div className="mt-5">
          <h4 className="text-center">Dokumen Ditemukan:</h4>
          <p className="text-center"><strong>Pemilik:</strong> {owner}</p>

          <div className="text-center mt-3">
            <button onClick={handleDownload} className="btn btn-success">
              Download Dokumen
            </button>
          </div>

          <div className="mt-4" style={{ border: '1px solid #ccc', height: '500px' }}>
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
