import { useContext, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { createEmbeddingContext } from 'amazon-quicksight-embedding-sdk';
import { DashboardTypeContext } from './DashboardContext';

const getQuickSightErrorMessage = (event) => {
  if (event?.message?.errorCode) {
    return `QuickSight error: ${event.message.errorCode}`;
  }

  if (event?.eventName) {
    return `QuickSight frame error: ${event.eventName}`;
  }

  return 'QuickSight embedding failed';
};

const QuickSightFrame = ({ dashboard, isActive }) => {
  const containerRef = useRef(null);
  const hasEmbeddedRef = useRef(false);
  const { changeError } = useContext(DashboardTypeContext);

  useEffect(() => {
    if (!isActive || !dashboard?.url || !containerRef.current) {
      return undefined;
    }

    let isCancelled = false;

    const mountDashboard = async () => {
      try {
        const embeddingContext = await createEmbeddingContext();

        if (isCancelled || !containerRef.current) {
          return;
        }

        const frameOptions = {
          url: dashboard.url,
          container: containerRef.current,
          width: '100%',
          height: '100%',
          className: 'quicksight-embedding-iframe',
          onChange: (changeEvent) => {
            if (changeEvent.eventLevel === 'ERROR') {
              changeError(getQuickSightErrorMessage(changeEvent));
            }
          },
        };

        const contentOptions = {
          onMessage: (messageEvent) => {
            if (messageEvent.eventName === 'ERROR_OCCURRED') {
              changeError(getQuickSightErrorMessage(messageEvent));
            }
          },
        };

        containerRef.current.replaceChildren();

        await embeddingContext.embedDashboard(frameOptions, contentOptions);

        hasEmbeddedRef.current = true;
      } catch (error) {
        if (!isCancelled) {
          changeError(error?.message || 'QuickSight embedding failed');
        }
      }
    };

    if (!hasEmbeddedRef.current) {
      mountDashboard();
    }

    return () => {
      isCancelled = true;
    };
  }, [
    changeError,
    dashboard,
    isActive,
  ]);

  useEffect(() => {
    if (!isActive) {
      hasEmbeddedRef.current = false;
      if (containerRef.current) {
        containerRef.current.replaceChildren();
      }
    }
  }, [isActive]);

  return (
    <div
      ref={containerRef}
      id={`${dashboard.name}Container`}
      style={{
        width: '100%',
        display: isActive ? 'flex' : 'none',
      }}
    />
  );
};

QuickSightFrame.propTypes = {
  dashboard: PropTypes.shape({
    name: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
  }).isRequired,
  isActive: PropTypes.bool.isRequired,
};

export default QuickSightFrame;
