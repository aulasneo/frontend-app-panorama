import { useContext, useEffect, useRef } from 'react';
import { createEmbeddingContext } from 'amazon-quicksight-embedding-sdk';
import { AppContext } from '@edx/frontend-platform/react';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { camelCaseObject } from '@edx/frontend-platform';
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

const QuickSightConsoleFrame = () => {
  const containerRef = useRef(null);
  const {
    changeError,
    changeLoader,
    currentView,
  } = useContext(DashboardTypeContext);
  const { config } = useContext(AppContext);

  useEffect(() => {
    if (currentView !== 'STUDIO' || !containerRef.current) {
      return undefined;
    }

    let isCancelled = false;
    const container = containerRef.current;

    const mountConsole = async () => {
      changeLoader(true);

      try {
        const { data } = await getAuthenticatedHttpClient().get(
          `${config.LMS_BASE_URL}/panorama/api/get-studio-url`,
        );
        const studioData = camelCaseObject(data).body;
        const consoleUrl = studioData?.[0]?.url;

        if (!consoleUrl) {
          throw new Error('Studio URL not available');
        }

        const embeddingContext = await createEmbeddingContext();

        if (isCancelled || !container) {
          return;
        }

        container.replaceChildren();

        await embeddingContext.embedConsole({
          url: consoleUrl,
          container,
          width: '100%',
          height: '100%',
          className: 'quicksight-embedding-iframe',
          onChange: (changeEvent) => {
            if (changeEvent.eventLevel === 'ERROR') {
              changeError(getQuickSightErrorMessage(changeEvent));
            }
          },
        }, {
          onMessage: (messageEvent) => {
            if (messageEvent.eventName === 'ERROR_OCCURRED') {
              changeError(getQuickSightErrorMessage(messageEvent));
            }
          },
        });
      } catch (error) {
        if (!isCancelled) {
          changeError(error?.message || 'QuickSight embedding failed');
        }
      } finally {
        if (!isCancelled) {
          changeLoader(false);
        }
      }
    };

    mountConsole();

    return () => {
      isCancelled = true;
      container.replaceChildren();
    };
  }, [changeError, changeLoader, config.LMS_BASE_URL, currentView]);

  return (
    <div
      ref={containerRef}
      id="consoleContainer"
      style={{
        width: '100%',
        display: currentView === 'STUDIO' ? 'flex' : 'none',
      }}
    />
  );
};

export default QuickSightConsoleFrame;
