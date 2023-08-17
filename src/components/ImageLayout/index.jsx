import React, { useEffect, useState, useRef } from "react";
import { fetchData } from "../../utils/image";

function ImageLayout() {
  const canvasRef = useRef(null);
  const zoomRef = useRef(1);
  const [images, setImages] = useState([]);
  const [currentImage, setCurrentImage] = useState(null);

  useEffect(() => {
    async function loadImages() {
      const fetchedData = await fetchData(0, 10);
      setImages(fetchedData);
      setCurrentImage(fetchedData[0]);
    }
    loadImages();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (canvas) {
      const ctx = canvas.getContext("2d");
      const image = new Image();

      image.onload = () => {
        const canvasWidth = window.innerWidth;
        const canvasHeight = window.innerHeight;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const imgRatio = image.width / image.height;
        const canvasRatio = canvasWidth / canvasHeight;

        let drawWidth, drawHeight;

        if (imgRatio > canvasRatio) {
          drawWidth = canvasWidth;
          drawHeight = canvasWidth / imgRatio;
        } else {
          drawHeight = canvasHeight;
          drawWidth = canvasHeight * imgRatio;
        }

        const startX = (canvasWidth - drawWidth) / 2;
        const startY = (canvasHeight - drawHeight) / 2;

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        ctx.drawImage(image, startX, startY, drawWidth, drawHeight);
      };

      if (currentImage) {
        image.src = currentImage.url;
      }
    }
  }, [currentImage, canvasRef]);

  return (
    <canvas ref={canvasRef} style={{ position: "fixed", top: 0, left: 0 }} />
  );
}

export default ImageLayout;
