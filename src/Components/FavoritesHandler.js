import React, { useState, useEffect } from "react";

const useFavorites = () => {
    const [favorites, setFavorites] = useState(() => {
        const savedFavorites = localStorage.getItem("favorites");
        return savedFavorites ? JSON.parse(savedFavorites) : [];
    });

    useEffect(() => {
        localStorage.setItem("favorites", JSON.stringify(favorites));
    }, [favorites]);

    const isFavorite = (file) => {
        return favorites.some((fav) => fav.cid === file.cid);
    };

    const toggleFavorites = (file) => {
        setFavorites((prevFavorites)=> {
            if(prevFavorites.some((fav) =>fav.cid === file.cid)){
                return prevFavorites.filter((fav) => fav.cid != file.cid);
            }else{
                return[...prevFavorites, file];
            }
        });
    };

    return { favorites, toggleFavorites, isFavorite };
};

export default useFavorites;
