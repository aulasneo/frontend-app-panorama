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

  if (typeof event?.message === 'string') {
    return event.message;
  }

  if (event?.eventName) {
    return `QuickSight frame error: ${event.eventName}`;
  }

  return 'QuickSight embedding failed';
};

const QUICK_SIGHT_FRAME_ERROR_EVENTS = [
  'NO_FRAME_OPTIONS',
  'INVALID_FRAME_OPTIONS',
  'FRAME_NOT_CREATED',
  'NO_BODY',
  'NO_CONTAINER',
  'INVALID_CONTAINER',
  'NO_URL',
  'INVALID_URL',
];

const isQuickSightFrameErrorEvent = (event) => event?.eventLevel === 'ERROR'
  && QUICK_SIGHT_FRAME_ERROR_EVENTS.includes(event?.eventName);

const isQuickSightContentErrorEvent = (event) => event?.eventName === 'ERROR_OCCURRED';

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
        changeError(null);

        const { data } = await getAuthenticatedHttpClient().get(
          `${config.LMS_BASE_URL}/panorama/api/get-studio-url`,
        );
        const studioData = camelCaseObject(data).body;
        const consoleUrl = studioData?.[0]?.url;

        if (!consoleUrl) {
          throw new Error('Studio URL not available');
        }

        const onQuickSightChange = (changeEvent) => {
          if (!isCancelled && isQuickSightFrameErrorEvent(changeEvent)) {
            changeError(getQuickSightErrorMessage(changeEvent));
          }
        };

        const embeddingContext = await createEmbeddingContext({
          onChange: onQuickSightChange,
        });

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
          withIframePlaceholder: true,
          onChange: onQuickSightChange,
        }, {
          onMessage: (messageEvent) => {
            if (!isCancelled && isQuickSightContentErrorEvent(messageEvent)) {
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
