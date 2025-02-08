import React, { useState, useEffect, useCallback } from "react";

const useFavorites = () => {
    const [favorites, setFavorites] = useState([]);

    const isFavorite = (file) => {
        return favorites.some(fav => fav.cid === file.cid); // Use a unique identifier like `cid` to check if file is favorite
      };
      
      const toggleFavorites = (file) => {
        const updatedFavorites = isFavorite(file)
          ? favorites.filter(fav => fav.cid !== file.cid) // Remove from favorites
          : [...favorites, file]; // Add to favorites
        setFavorites(updatedFavorites); // Update the favorites state
      };
      

    return { favorites, toggleFavorites, isFavorite };
};

export default useFavorites;