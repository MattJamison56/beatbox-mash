import React, { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  videoUrl: string;
  onComplete: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, onComplete }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.src = videoUrl;
    }
  }, [videoUrl]);

  return (
    <div>
      <video ref={videoRef} controls width="640" height="360" onEnded={onComplete}>
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoPlayer;
