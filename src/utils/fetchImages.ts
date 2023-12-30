const { VITE_SERVER_URI } = import.meta.env;
import { Color } from "../types/color";

export async function fetchAllBackgroundImages() {
  try {
    const data = await fetch(`${VITE_SERVER_URI}/images?initial=true`);
    const images = await data.json();
    return images;
  } catch (error) {
    throw error;
  }
}

export async function fetchClosestBackgroundImage(color: Uint8ClampedArray) {
  try {
    const data = await fetch(`${VITE_SERVER_URI}/images?color=${color}`);
    const image = await data.json();
    return image;
  } catch (error) {
    throw error;
  }
}
