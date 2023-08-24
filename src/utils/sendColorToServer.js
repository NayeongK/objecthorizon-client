const { VITE_SERVER_URI } = import.meta.env;

export async function sendDominantColorToServer(url, color) {
  const response = await fetch(`${VITE_SERVER_URI}/images?initial=true`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url, color }),
  });

  if (response.ok) {
    return true;
  } else {
    console.error("Failed to send dominant color to server");
    return false;
  }
}
