export function getDominantBackgroundColor(canvas) {
  const ctx = canvas.getContext("2d");
  const edgePixels = [];
  const width = canvas.width;
  const height = canvas.height;

  for (let x = 0; x < width; x++) {
    edgePixels.push(ctx.getImageData(x, 0, 1, 1).data);
    edgePixels.push(ctx.getImageData(x, height - 1, 1, 1).data);
  }

  for (let y = 0; y < height; y++) {
    edgePixels.push(ctx.getImageData(0, y, 1, 1).data);
    edgePixels.push(ctx.getImageData(width - 1, y, 1, 1).data);
  }

  const colorCounts = {};

  edgePixels.forEach((pixel) => {
    const key = `${pixel[0]}-${pixel[1]}-${pixel[2]}`;
    if (!colorCounts[key]) {
      colorCounts[key] = 0;
    }
    colorCounts[key]++;
  });

  let dominantColor = null;
  let maxCount = 0;

  Object.keys(colorCounts).forEach((key) => {
    if (colorCounts[key] > maxCount) {
      dominantColor = key;
      maxCount = colorCounts[key];
    }
  });

  return dominantColor ? dominantColor.split("-").map(Number) : null;
}
