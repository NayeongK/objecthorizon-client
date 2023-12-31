import { useEffect, useState, useRef } from "react";
import {
  fetchAllBackgroundImages,
  fetchClosestBackgroundImage,
} from "../../utils/fetchImages";

function ImageLayout() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [images, setImages] = useState<string[]>([]);
  const [imageElements, setImageElements] = useState<{
    [key: string]: HTMLImageElement;
  }>({});
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [viewState, setViewState] = useState({ imageIndex: 0, zoom: 1 });
  const [sentColor, setSentColor] = useState(false);
  const [ticking, setTicking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [animationFrameId, setAnimationFrameId] = useState<number | null>(null);

  useEffect(() => {
    function handleDocumentWheel(event: WheelEvent) {
      const target = event.target as HTMLElement;
      if (canvasRef.current && target && canvasRef.current.contains(target)) {
        handleWheelEvent(event);
      }
    }

    document.addEventListener("wheel", handleDocumentWheel, { passive: false });

    return () => {
      document.removeEventListener("wheel", handleDocumentWheel);
    };
  }, [viewState, images, setImages, sentColor]);

  useEffect(() => {
    async function loadImages() {
      setIsLoading(true);
      const fetchedImages = await fetchAllBackgroundImages();
      setImages(fetchedImages);
      setIsLoading(false);
    }
    loadImages();
  }, []);

  useEffect(() => {
    if (images[viewState.imageIndex + 1]) {
      setIsLoading(true);
      const nextImage = new Image();
      nextImage.addEventListener("load", () => {
        setIsLoading(false);
      });
      nextImage.addEventListener("error", () => {
        setIsLoading(true);
      });
      nextImage.src = images[viewState.imageIndex + 1];
    }
  }, [images, viewState.imageIndex]);

  function goToNextImage() {
    setViewState((prevState) => ({
      imageIndex: prevState.imageIndex + 1,
      zoom: 1,
    }));
  }

  function goToPreviousImage() {
    setViewState((prevState) => ({
      imageIndex: (prevState.imageIndex - 1 + images.length) % images.length,
      zoom: 1,
    }));
  }

  function drawImage(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    zoomValue: number,
  ) {
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const imgRatio = image.width / image.height;
    let drawWidth = canvasWidth * zoomValue;
    let drawHeight = drawWidth / imgRatio;

    let startX, startY;

    if (zoomValue > 1) {
      const offsetX = (mousePosition.x - canvasWidth / 2) * (zoomValue - 1);
      const offsetY = (mousePosition.y - canvasHeight / 2) * (zoomValue - 1);

      startX = (canvasWidth - drawWidth) / 2 - offsetX;
      startY = (canvasHeight - drawHeight) / 2 - offsetY;

      if (startX > 0) startX = 0;
      if (startY > 0) startY = 0;
      if (startX + drawWidth < canvasWidth) startX = canvasWidth - drawWidth;
      if (startY + drawHeight < canvasHeight)
        startY = canvasHeight - drawHeight;
    } else {
      startX = (canvasWidth - drawWidth) / 2;
      startY = (canvasHeight - drawHeight) / 2;
    }

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(image, startX, startY, drawWidth, drawHeight);
  }

  function handleWheelEvent(event: WheelEvent) {
    let scale = -event.deltaY * 0.01;
    let currentZoom = viewState.zoom;
    const maxZoom = 2000;
    const minZoom = 0.3;

    if (currentZoom * (1 + scale) > maxZoom) {
      goToNextImage();
      event.preventDefault();
      return;
    }

    if (currentZoom * (1 + scale) < minZoom) {
      goToPreviousImage();
      event.preventDefault();
      return;
    }

    const newZoom = currentZoom * (1 + scale);

    setViewState((prevState) => ({
      ...prevState,
      zoom: newZoom,
    }));
    event.preventDefault();

    if (newZoom > 600 && !sentColor) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          const centerColor = ctx.getImageData(centerX, centerY, 1, 1).data;

          async function fetchNextImage() {
            const nextImage = await fetchClosestBackgroundImage(centerColor);
            if (nextImage && nextImage.url) {
              setImages((currentImages) => {
                const updatedImages = [...currentImages, nextImage.url];
                return updatedImages;
              });
              setViewState((currentViewState) => ({
                imageIndex: images.length,
                zoom: 1,
              }));
            }
          }
          fetchNextImage();
          setSentColor(true);
        }
      }
    }
    if (newZoom <= 600) {
      setSentColor(false);
    }
  }

  function handleWheel(event: WheelEvent) {
    if (!ticking) {
      const id = window.requestAnimationFrame(() => {
        handleWheelEvent(event);
        setTicking(false);
      });
      setAnimationFrameId(id);
      setTicking(true);
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      function handleMouseMove(event: MouseEvent) {
        setMousePosition({ x: event.clientX, y: event.clientY });
      }

      canvas.addEventListener("mousemove", handleMouseMove);
      canvas.addEventListener("wheel", handleWheel, { passive: true });

      return () => {
        if (animationFrameId !== null) {
          window.cancelAnimationFrame(animationFrameId);
        }
        canvas.removeEventListener("mousemove", handleMouseMove);
        canvas.removeEventListener("wheel", handleWheel);
      };
    }
  }, [viewState.zoom]);

  useEffect(() => {
    function loadImage(imageIndex: number) {
      const src = images[imageIndex];
      if (!imageElements[src]) {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.src = src;
        image.addEventListener("load", () => {
          setImageElements((prev) => ({ ...prev, [src]: image }));
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
              drawImage(canvas, ctx, image, viewState.zoom);
            }
          }
        });
      } else {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            drawImage(canvas, ctx, imageElements[src], viewState.zoom);
          }
        }
      }
    }

    if (images.length > 0) {
      loadImage(viewState.imageIndex);
    }
  }, [mousePosition, images, viewState, imageElements]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="canvas"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
      }}
    />
  );
}

export default ImageLayout;
