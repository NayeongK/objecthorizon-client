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

export async function fetchClosestBackgroundImage(color) {
  try {
    const data = await fetch(`${VITE_SERVER_URI}/images?color=${color}`);
    const image = await data.json();
    return image;
  } catch (error) {
    console.error("error", error);
  }
}
