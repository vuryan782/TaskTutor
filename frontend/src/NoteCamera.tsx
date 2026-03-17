import { useEffect, useRef, useState } from "react";

type NoteCameraProps = {
  onCapture?: (imageDataUrl: string) => void | Promise<void>;
};

export default function NoteCamera({ onCapture }: NoteCameraProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const startCamera = async () => {
    try {
      setError("");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCameraOn(true);
    } catch (err) {
      console.error(err);
      setError("Unable to access camera. Allow camera permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraOn(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageDataUrl = canvas.toDataURL("image/png");
    setCapturedImage(imageDataUrl);
    stopCamera();

    if (onCapture) {
      try {
        setLoading(true);
        await onCapture(imageDataUrl);
      } catch (err) {
        console.error(err);
        setError("Image captured but upload failed.");
      } finally {
        setLoading(false);
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setError("");
    startCamera();
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Capture Notes</h2>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!isCameraOn && !capturedImage && (
        <button
          onClick={startCamera}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Open Camera
        </button>
      )}

      {isCameraOn && (
        <div className="space-y-4">
          <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg border" />

          <div className="flex gap-2">
            <button
              onClick={capturePhoto}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
            >
              Take Picture
            </button>

            <button
              onClick={stopCamera}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {capturedImage && (
        <div className="space-y-3">
          <img src={capturedImage} alt="Captured notes" className="w-full rounded-lg border" />

          <button
            onClick={retakePhoto}
            className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg"
          >
            Retake
          </button>

          {loading && <p className="text-sm text-gray-600">Uploading...</p>}
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}