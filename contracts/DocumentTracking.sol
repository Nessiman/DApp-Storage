// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DocumentTracking {

    struct Document {
        string name;
        string cid;
        uint256 size;
        string mimeType;
        string description; // Deskripsi dokumen
        address uploader;
        uint256 uploadTimestamp; // Waktu unggah
    }

    struct AccessRecord {
        address user;
        uint256 timestamp; // Waktu akses
    }

    struct DownloadRecord {
        address user;
        uint256 timestamp; // Waktu download
    }

    mapping(string => Document) public documents; // CID -> Document metadata
    mapping(string => AccessRecord[]) public accessLog; // CID -> Access log
    mapping(string => DownloadRecord[]) public downloadLog; // CID -> Download log

    // Upload document metadata to blockchain (dengan deskripsi tambahan dan waktu unggah)
    function uploadDocument(
        string memory _name,
        string memory _cid,
        uint256 _size,
        string memory _mimeType,
        string memory _description
    ) public {
        require(bytes(documents[_cid].cid).length == 0, "Document with this CID already exists");
        
        documents[_cid] = Document({
            name: _name,
            cid: _cid,
            size: _size,
            mimeType: _mimeType,
            description: _description,
            uploader: msg.sender,
            uploadTimestamp: block.timestamp // Menyimpan waktu unggah
        });
    }

    // Record access to a document with timestamp
    function recordAccess(string memory _cid) public {
        require(bytes(documents[_cid].cid).length > 0, "Document does not exist");
        accessLog[_cid].push(AccessRecord(msg.sender, block.timestamp));
    }

    // Get access log for a document
    function getAccessLog(string memory _cid) public returns (AccessRecord[] memory) {
        require(bytes(documents[_cid].cid).length > 0, "Document does not exist");
        return accessLog[_cid];
    }

    // Record document download with timestamp
    function recordDownload(string memory _cid) public {
        require(bytes(documents[_cid].cid).length > 0, "Document does not exist");
        downloadLog[_cid].push(DownloadRecord(msg.sender, block.timestamp));
    }

    // Get download log for a document
    function getDownloadLog(string memory _cid) public returns (DownloadRecord[] memory) {
        require(bytes(documents[_cid].cid).length > 0, "Document does not exist");
      
        return downloadLog[_cid];
    }

    // Fungsi untuk memeriksa apakah file sudah diupload berdasarkan CID
    function isFileUploaded(string memory _cid) public view returns (bool) {
        return bytes(documents[_cid].cid).length > 0;
    }

    // Fungsi untuk menghapus metadata dokumen tanpa menghapus log
    function deleteDocument(string memory _cid) public {
        require(bytes(documents[_cid].cid).length > 0, "Document does not exist");
        require(documents[_cid].uploader == msg.sender, "Only uploader can delete this document");

        // Hapus metadata dokumen
        delete documents[_cid];
    }
}
