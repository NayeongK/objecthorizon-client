import {
  fetchAllBackgroundImages,
  fetchClosestBackgroundImage,
} from "../../src/utils/fetchImages";

describe("API functions", () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    fetchMock.mockClear();
    delete global.fetch;
  });

  it("fetches all background images", async () => {
    const mockData = ["mockurl1.jpg"];

    fetchMock.mockResolvedValueOnce({
      json: async () => mockData,
    });

    const result = await fetchAllBackgroundImages();
    expect(result).toEqual(mockData);
  });

  it("fetches the closest background image based on color", async () => {
    const mockColor = [255, 255, 255, 255];
    const mockData = { url: "mockurl1.jpg" };

    fetchMock.mockResolvedValueOnce({
      json: async () => mockData,
    });

    const result = await fetchClosestBackgroundImage(mockColor);
    expect(result).toEqual(mockData);
  });

  it("throws an error if there is an issue fetching background images", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Server error"));

    await expect(fetchAllBackgroundImages()).rejects.toThrow();
  });
});
