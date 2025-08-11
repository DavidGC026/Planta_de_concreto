import React, { useState } from 'react';

const ImageWithFallback = ({ src, alt, className, style, fallback = null }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  if (hasError) {
    return fallback || null;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={handleError}
      onLoad={handleLoad}
      loading="lazy"
    />
  );
};

export default ImageWithFallback;
