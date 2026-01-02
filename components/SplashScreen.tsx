import React from 'react';

const SplashScreen: React.FC = () => {
  const title = "Jarvis";
  const subtitle = "developed by Muhammad Dawood";

  return (
    <div className="splash-screen">
      <div className="splash-content">
        <h1 className="splash-title">
          {title.split('').map((char, index) => (
            <span key={index} style={{ animationDelay: `${index * 0.1}s` }}>
              {char}
            </span>
          ))}
        </h1>
        <p className="splash-subtitle">
          {subtitle.split(' ').map((word, index) => (
            <span key={index} style={{ animationDelay: `${0.6 + index * 0.15}s` }}>
              {word}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
