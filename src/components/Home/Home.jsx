import React, { useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardTypeContext } from '../DashboardContext';
import EmbedHome from './EmbedHome';

const HOME_PAGES_ORIGIN = 'https://panorama-home-pages.s3.amazonaws.com';

const Home = () => {
  const { homeMode, error } = useContext(DashboardTypeContext);
  const iframeRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== HOME_PAGES_ORIGIN
        || event.source !== iframeRef.current?.contentWindow
        || event.data?.type !== 'panorama:navigate-panels') {
        return;
      }
      navigate('/panels');
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate]);

  let iframeSrc = null;
  if (homeMode === 'FREE') {
    iframeSrc = 'https://panorama-home-pages.s3.amazonaws.com/panorama-free-home.html';
  } else if (homeMode === 'SAAS') {
    iframeSrc = 'https://panorama-home-pages.s3.amazonaws.com/panorama-saas-home.html';
  } else if (homeMode === 'CUSTOM') {
    iframeSrc = 'https://panorama-home-pages.s3.amazonaws.com/panorama-custom-home.html';
  } else if (homeMode) {
    iframeSrc = 'https://panorama-home-pages.s3.amazonaws.com/panorama-demo-home.html';
  }

  return (
    <div className="dashboard" id="dashboard">
      <EmbedHome />
      <div className="framesContainerHome" id="framesContainerHome">
        {error && <p role="alert">{error}</p>}
        {!error && iframeSrc && (
          <iframe
            ref={iframeRef}
            className="homes-iframe"
            src={`${iframeSrc}?navigation=message`}
            title="Home Mode"
          />
        )}
      </div>
    </div>
  );
};

export default Home;
