import React, { useEffect, useRef } from "react";
import imageSrc from "../../assets/0-earth-nasa-vhSz50AaFAs-unsplash.jpg";

function ImageLayout() {
  const canvasRef = useRef(null);
  const image = new Image();
  image.src = imageSrc;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const imgRatio = image.width / image.height;
      const canvasRatio = canvas.width / canvas.height;

      let renderHeight, renderWidth;

      if (canvasRatio < imgRatio) {
        renderHeight = canvas.height;
        renderWidth = canvas.height * imgRatio;
      } else {
        renderWidth = canvas.width;
        renderHeight = canvas.width / imgRatio;
      }

      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(
        image,
        (canvas.width - renderWidth) / 2,
        (canvas.height - renderHeight) / 2,
        renderWidth,
        renderHeight,
      );
    }

    image.onload = () => {
      window.addEventListener("resize", resizeCanvas);
      resizeCanvas();
    };

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [image]);

  return (
    <canvas ref={canvasRef} style={{ position: "fixed", top: 0, left: 0 }} />
  );
}

export default ImageLayout;
