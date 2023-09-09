import { render, fireEvent, waitFor } from "@testing-library/react";
import ImageLayout from "../../src/components/ImageLayout";
import fetchMock from "jest-fetch-mock";
import "jest-canvas-mock";

fetchMock.enableMocks();

describe.only("ImageLayout Component", () => {
  beforeEach(() => {
    fetchMock.mockResponseOnce(JSON.stringify({ url: "mocked-image-url" }));
  });

  it("Zoom in and out with wheel events", async () => {
    const { getByTestId } = render(<ImageLayout />);
    const canvas = getByTestId("canvas");

    fireEvent.wheel(canvas, { deltaY: -100 });

    await waitFor(() => {
      const zoomedIn = getByTestId("canvas");
      const transformValue = window.getComputedStyle(zoomedIn).transform;
      const matrix = new DOMMatrix(transformValue);
      const scaleValue = matrix.a;
      expect(scaleValue).toBeGreaterThanOrEqual(1.0);
    });

    fireEvent.wheel(canvas, { deltaY: 100 });

    await waitFor(() => {
      const zoomedOut = getByTestId("canvas");
      const transformValue = window.getComputedStyle(zoomedOut).transform;
      const matrix = new DOMMatrix(transformValue);
      const scaleValue = matrix.a;
      expect(scaleValue).toBeLessThanOrEqual(1.0);
    });
  });
});
