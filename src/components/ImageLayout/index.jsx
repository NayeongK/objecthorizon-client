import React, { useEffect, useState, useRef } from "react";
import { fetchAllBackgroundImages } from "../../utils/fetchImages";

function ImageLayout() {
  const canvasRef = useRef(null);
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [startPinchDistance, setStartPinchDistance] = useState(null);
  const [startZoom, setStartZoom] = useState(null);

  useEffect(() => {
    async function loadImages() {
      const fetchedImages = await fetchAllBackgroundImages();
      setImages(fetchedImages);
    }
    loadImages();
  }, []);

  useEffect(() => {
    if (zoom > 3) {
      goToNextImage();
    } else if (zoom < 0.3) {
      goToPreviousImage();
    }
  }, [zoom]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const image = new Image();

    image.addEventListener("load", () => {
      drawImage(canvas, ctx, image, zoom);
    });

    if (images.length > 0) {
      image.src = images[currentImageIndex];
    }
  }, [images, currentImageIndex, zoom]);

  function goToNextImage() {
    setCurrentImageIndex((prevIndex) => {
      return (prevIndex + 1) % images.length;
    });
    setZoom(1);
  }

  function goToPreviousImage() {
    setCurrentImageIndex((prevIndex) => {
      return (prevIndex - 1 + images.length) % images.length;
    });
    setZoom(1);
  }

  function drawImage(canvas, ctx, image, zoom) {
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const imgRatio = image.width / image.height;
    const canvasRatio = canvasWidth / canvasHeight;
    let drawWidth, drawHeight;

    drawWidth = canvasWidth * zoom;
    drawHeight = drawWidth / imgRatio;

    const startX = (canvasWidth - drawWidth) / 2;
    const startY = (canvasHeight - drawHeight) / 2;

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(image, startX, startY, drawWidth, drawHeight);
  }

  function calculatePinchDistance(touches) {
    const [touch1, touch2] = touches;
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function handleTouchStart(e) {
    if (e.touches.length === 2) {
      const distance = calculatePinchDistance(e.touches);
      setStartPinchDistance(distance);
      setStartZoom(zoom);
      e.preventDefault();
    }
  }

  function handleTouchMove(e) {
    if (e.touches.length === 2 && startPinchDistance !== null) {
      const distance = calculatePinchDistance(e.touches);
      const scale = distance / startPinchDistance;
      setZoom(Math.max(0.1, startZoom * scale));
      e.preventDefault();
    }
  }

  function handleTouchEnd(e) {
    setStartPinchDistance(null);
    setStartZoom(null);
  }

  function handleWheel(e) {
    const scale = -e.deltaY * 0.01;
    setZoom((prevZoom) => Math.max(0.1, prevZoom + scale));
    e.preventDefault();
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener("touchstart", handleTouchStart, {
        passive: false,
      });
      canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
      canvas.addEventListener("touchend", handleTouchEnd, { passive: false });
      canvas.addEventListener("wheel", handleWheel, { passive: false });
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener("touchstart", handleTouchStart);
        canvas.removeEventListener("touchmove", handleTouchMove);
        canvas.removeEventListener("touchend", handleTouchEnd);
        canvas.removeEventListener("wheel", handleWheel);
      }
    };
  }, [startPinchDistance, startZoom, zoom]);

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
