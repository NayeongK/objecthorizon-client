import { sendDominantColorToServer } from "../../src/utils/sendColorToServer";

describe("sendDominantColorToServer", () => {
  let fetchMock;
  let consoleErrorSpy;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    fetchMock.mockClear();
    delete global.fetch;
    consoleErrorSpy.mockRestore();
  });

  it("should send dominant color to the server and return true on success", async () => {
    const mockUrl = "example.com/image.jpg";
    const mockColor = [255, 255, 255];

    fetchMock.mockResolvedValueOnce({ ok: true });

    const result = await sendDominantColorToServer(mockUrl, mockColor);
    expect(result).toBe(true);

    expect(fetchMock).toHaveBeenCalledWith(
      `${process.env.VITE_SERVER_URI}/images?initial=true`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: mockUrl, color: mockColor }),
      },
    );

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("should return false and log an error message on failure", async () => {
    const mockUrl = "example.com/image.jpg";
    const mockColor = [255, 255, 255];

    fetchMock.mockResolvedValueOnce({ ok: false });

    const result = await sendDominantColorToServer(mockUrl, mockColor);
    expect(result).toBe(false);

    expect(fetchMock).toHaveBeenCalledWith(
      `${process.env.VITE_SERVER_URI}/images?initial=true`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: mockUrl, color: mockColor }),
      },
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to send dominant color to server",
    );
  });
});
