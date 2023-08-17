export async function fetchData(offset, limit) {
  try {
    const data = await fetch(
      `http://localhost:3000/images?offset=${offset}&limit=${limit}`,
    );
    const { images } = await data.json();
    return images;
  } catch (error) {
    console.error("error", error);
  }
}
