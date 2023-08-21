const { VITE_SERVER_URI } = import.meta.env;

export async function fetchAllBackgroundImages() {
  try {
    const data = await fetch(`${VITE_SERVER_URI}/images?initial=true`);
    const images = await data.json();
    return images;
  } catch (error) {
    console.error("error", error);
  }
}
