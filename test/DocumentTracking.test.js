const DocumentTracking = artifacts.require("DocumentTracking");

contract("DocumentTracking", (accounts) => {
  let contractInstance;
  const uploader = accounts[0];
  const user = accounts[1];

  const document = {
    name: "Test Document",
    cid: "QmTestCID12345",
    size: 1024,
    mimeType: "application/pdf",
    description: "A test document for unit testing."
  };

  before(async () => {
    contractInstance = await DocumentTracking.new();
  });

  it("should upload a document successfully", async () => {
    const tx = await contractInstance.uploadDocument(
      document.name,
      document.cid,
      document.size,
      document.mimeType,
      document.description,
      { from: uploader }
    );

    assert(tx.receipt.status, "Transaction failed");

    const uploadedDoc = await contractInstance.documents(document.cid);

    assert.equal(uploadedDoc.name, document.name, "Document name mismatch");
    assert.equal(uploadedDoc.cid, document.cid, "Document CID mismatch");
    assert.equal(uploadedDoc.size, document.size, "Document size mismatch");
    assert.equal(uploadedDoc.mimeType, document.mimeType, "Document mimeType mismatch");
    assert.equal(uploadedDoc.description, document.description, "Document description mismatch");
    assert.equal(uploadedDoc.uploader, uploader, "Uploader address mismatch");
    assert(uploadedDoc.uploadTimestamp.toNumber() > 0, "Invalid upload timestamp");
  });

  it("should not allow uploading a document with the same CID", async () => {
    try {
      await contractInstance.uploadDocument(
        document.name,
        document.cid,
        document.size,
        document.mimeType,
        document.description,
        { from: uploader }
      );
      assert.fail("Duplicate CID upload was allowed");
    } catch (err) {
      assert(err.message.includes("Document with this CID already exists"), "Unexpected error message");
    }
  });

  it("should record access to a document", async () => {
    const tx = await contractInstance.recordAccess(document.cid, { from: user });

    assert(tx.receipt.status, "Transaction failed");

    const accessLog = await contractInstance.accessLog(document.cid);
    const logLength = accessLog.length.toNumber(); // Get log length from BigNumber

    assert.equal(logLength, 1, "Access log length mismatch");

    const recordedAccess = await contractInstance.accessLog(document.cid, logLength - 1); // Retrieve last log entry
    assert.equal(recordedAccess.user, user, "Access log user mismatch");
    assert(recordedAccess.timestamp.toNumber() > 0, "Invalid access timestamp");
  });

  it("should record download of a document", async () => {
    const tx = await contractInstance.recordDownload(document.cid, { from: user });

    assert(tx.receipt.status, "Transaction failed");

    const downloadLog = await contractInstance.downloadLog(document.cid);
    const logLength = downloadLog.length.toNumber(); // Get log length from BigNumber

    assert.equal(logLength, 1, "Download log length mismatch");

    const recordedDownload = await contractInstance.downloadLog(document.cid, logLength - 1); // Retrieve last log entry
    assert.equal(recordedDownload.user, user, "Download log user mismatch");
    assert(recordedDownload.timestamp.toNumber() > 0, "Invalid download timestamp");
  });

  it("should verify if a file is uploaded", async () => {
    const isUploaded = await contractInstance.isFileUploaded(document.cid);
    assert(isUploaded, "File should be marked as uploaded");

    const notUploadedCID = "NonExistentCID";
    const isNotUploaded = await contractInstance.isFileUploaded(notUploadedCID);
    assert(!isNotUploaded, "File should not be marked as uploaded");
  });

  it("should delete a document metadata", async () => {
    const tx = await contractInstance.deleteDocument(document.cid, { from: uploader });

    assert(tx.receipt.status, "Transaction failed");

    const isUploaded = await contractInstance.isFileUploaded(document.cid);
    assert(!isUploaded, "File metadata should be deleted");
  });

  it("should not allow deletion of a document by non-uploader", async () => {
    const newCID = "QmNewCID12345";
    await contractInstance.uploadDocument(
      "New Document",
      newCID,
      2048,
      "text/plain",
      "Another test document",
      { from: uploader }
    );

    try {
      await contractInstance.deleteDocument(newCID, { from: user });
      assert.fail("Non-uploader was allowed to delete the document");
    } catch (err) {
      assert(err.message.includes("Only uploader can delete this document"), "Unexpected error message");
    }
  });
});