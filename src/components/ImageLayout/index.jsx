import React, { useEffect, useState, useRef } from "react";
import { fetchAllBackgroundImages } from "../../utils/fetchImages";
import { throttle } from "lodash";

function ImageLayout() {
  const canvasRef = useRef(null);
  const [images, setImages] = useState([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const [viewState, setViewState] = useState({ imageIndex: 0, zoom: 1 });

  useEffect(() => {
    async function loadImages() {
      const fetchedImages = await fetchAllBackgroundImages();
      setImages(fetchedImages);
    }
    loadImages();
  }, []);

  function goToNextImage() {
    setViewState((prevState) => ({
      imageIndex: (prevState.imageIndex + 1) % images.length,
      zoom: 1,
    }));
  }

  function goToPreviousImage() {
    setViewState((prevState) => ({
      imageIndex: (prevState.imageIndex - 1 + images.length) % images.length,
      zoom: 1,
    }));
  }

  function drawImage(canvas, ctx, image, zoomValue) {
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const imgRatio = image.width / image.height;
    let drawWidth = canvasWidth * zoomValue;
    let drawHeight = drawWidth / imgRatio;

    const offsetX = (mousePosition.x - canvasWidth / 2) * (zoomValue - 1);
    const offsetY = (mousePosition.y - canvasHeight / 2) * (zoomValue - 1);

    const startX = (canvasWidth - drawWidth) / 2 - offsetX;
    const startY = (canvasHeight - drawHeight) / 2 - offsetY;

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(image, startX, startY, drawWidth, drawHeight);
  }

  function handleWheel(e) {
    let scale = -e.deltaY * 0.01;
    let currentZoom = viewState.zoom;
    const maxZoom = 400;
    const minZoom = 0.3;

    if (currentZoom * (1 + scale) > maxZoom) {
      goToNextImage();
      e.preventDefault();
      return;
    } else if (currentZoom * (1 + scale) < minZoom) {
      goToPreviousImage();
      e.preventDefault();
      return;
    }

    const newZoom = currentZoom * (1 + scale);

    setViewState((prevState) => ({
      ...prevState,
      zoom: newZoom,
    }));
    e.preventDefault();
  }

  const throttleHandler = throttle(handleWheel, 800);

  useEffect(() => {
    const canvas = canvasRef.current;

    function handleMouseMove(e) {
      setMousePosition({ x: e.clientX, y: e.clientY });
    }

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("wheel", throttleHandler, { passive: false });

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("wheel", throttleHandler);
    };
  }, [viewState.zoom]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const image = new Image();

    image.addEventListener("load", () => {
      drawImage(canvas, ctx, image, viewState.zoom);
    });

    if (images.length > 0) {
      image.src = images[viewState.imageIndex];
    }
  }, [images, viewState]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
      }}
    />
  );
}

export default ImageLayout;
