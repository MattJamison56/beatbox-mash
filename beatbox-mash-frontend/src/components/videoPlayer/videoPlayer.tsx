import React, { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  videoUrl: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.src = videoUrl;
    }
  }, [videoUrl]);

  return (
    <div>
      <video ref={videoRef} controls width="640" height="360">
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoPlayer;
