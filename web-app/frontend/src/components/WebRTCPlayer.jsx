import { useEffect, useRef, useState } from "react";

function WebRTCPlayer({ path }) {
  const videoRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!path) return;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.addTransceiver("video", { direction: "recvonly" });
    pc.addTransceiver("audio", { direction: "recvonly" });

    pc.ontrack = (event) => {
      if (videoRef.current) {
        videoRef.current.srcObject = event.streams[0];
      }
    };

    const negotiate = async () => {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const whepUrl = `/webrtc/${path}/whep`;

      const res = await fetch(whepUrl, {
        method: "POST",
        headers: { "Content-Type": "application/sdp" },
        body: offer.sdp,
      });

      if (res.ok) {
        const answer = await res.text();
        await pc.setRemoteDescription({ type: "answer", sdp: answer });
      } else {
        setError(true);
      }
    };

    negotiate().catch(() => setError(true));

    return () => pc.close();
  }, [path]);

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <span style={styles.errorText}>Falha na conexão</span>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      style={styles.video}
    />
  );
}

const styles = {
  video: {
    width: "100%",
    display: "block",
    background: "#000",
    aspectRatio: "16/9",
    objectFit: "contain",
  },
  errorContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#1a1a2e",
    aspectRatio: "16/9",
  },
  errorText: {
    color: "#e94560",
    fontSize: "0.875rem",
  },
};

export default WebRTCPlayer;
