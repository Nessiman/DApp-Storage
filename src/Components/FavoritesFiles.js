import React, { useState, useEffect } from "react";
import useFavorites from "./FavoritesHandler";

function FavoritesFiles() {
    const { favorites, toggleFavorites, isFavorite } = useFavorites();

    // Render status upload di blockchain
    const renderUploadStatus = (file) =>
        file.uploaded ? (
          <span className="badge bg-success">Uploaded</span>
        ) : (
          <span className="badge bg-warning">Not Uploaded</span>
        );
    
  return (
    <div>
      <h1><center>Favorites Files</center></h1>
        <div className="section">
          <div className="scrollable-container">
            {favorites.length > 0 ? (
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Favorites</th>
                    <th>Status Blockchain</th>
                    <th>Opsi</th>
                  </tr>
                </thead>
                <tbody>
                  {favorites.map((file, index) => (
                    <tr key={index}>
                      <td>{file.name}</td>
                      <td>
                        {file.uploadTime
                          ? new Date(file.uploadTime).toLocaleDateString()
                          : "Unknown"}
                      </td>
                      <td>{file.type || "Unknown"}</td>
                      <td>
                        <button
                          className="btn"
                          onClick={() => toggleFavorites(file)}
                        >
                          ⭐
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
                                onClick={() => alert(`Detail ${file.name}`)}
                              >
                                Detail Document
                              </a>
                            </li>
                            <li>
                              <a
                                className="dropdown-item"
                                href="#"
                                onClick={() => alert(`Delete ${file.name}`)}
                              >
                                Delete Document
                              </a>
                            </li>
                            <li>
                              <a
                                className="dropdown-item"
                                href="#"
                                onClick={() =>
                                  alert(`Upload ${file.name} to Blockchain`)
                                }
                              >
                                Upload to Blockchain
                              </a>
                            </li>
                            <li>
                              <a
                                className="dropdown-item"
                                href="#"
                                onClick={() =>
                                  alert(`Delete ${file.name} from Blockchain`)
                                }
                              >
                                Delete from Blockchain
                              </a>
                            </li>
                          </ul>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-muted">No favorite files yet.</p>
            )}
          </div>
        </div>
    </div>
  );
}

export default FavoritesFiles;
