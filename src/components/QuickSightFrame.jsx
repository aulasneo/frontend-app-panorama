import { useContext, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { createEmbeddingContext } from 'amazon-quicksight-embedding-sdk';
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

const getStudentParametersFromUrl = (url) => {
  const fragment = url.split('#')[1];
  if (!fragment) {
    return [];
  }

  const fragmentParams = new URLSearchParams(fragment);
  const quickSightParameters = [];

  ['userId', 'lms'].forEach((name) => {
    const value = fragmentParams.get(`p.${name}`);
    if (value) {
      quickSightParameters.push({
        Name: name,
        Values: [value],
      });
    }
  });

  return quickSightParameters;
};

const QuickSightFrame = ({ dashboard, isActive }) => {
  const containerRef = useRef(null);
  const embeddingContextRef = useRef(null);
  const { changeError, userRole } = useContext(DashboardTypeContext);
  const dashboardName = dashboard.name;
  const dashboardUrl = dashboard.url;

  useEffect(() => {
    if (!isActive || !dashboardUrl || !userRole || !containerRef.current) {
      return undefined;
    }

    let isCancelled = false;
    // Each mount owns its node, so late SDK work only touches a detached node.
    const container = document.createElement('div');
    container.style.width = '100%';
    containerRef.current.replaceChildren(container);

    const mountDashboard = async () => {
      try {
        changeError(null);

        const onQuickSightChange = (changeEvent) => {
          if (!isCancelled && isQuickSightFrameErrorEvent(changeEvent)) {
            changeError(getQuickSightErrorMessage(changeEvent));
          }
        };

        // Reuse the SDK control context across tab switches. Frame callbacks
        // belong to the current mount; context callbacks must not capture it.
        if (!embeddingContextRef.current) {
          embeddingContextRef.current = createEmbeddingContext().catch((error) => {
            embeddingContextRef.current = null;
            throw error;
          });
        }
        const embeddingContext = await embeddingContextRef.current;

        if (isCancelled || !container) {
          return;
        }

        const frameOptions = {
          url: dashboardUrl,
          container,
          width: '100%',
          height: '100%',
          className: 'quicksight-embedding-iframe',
          withIframePlaceholder: true,
          onChange: onQuickSightChange,
        };

        const contentOptions = {
          onMessage: (messageEvent) => {
            if (!isCancelled && isQuickSightContentErrorEvent(messageEvent)) {
              changeError(getQuickSightErrorMessage(messageEvent));
            }
          },
        };

        const isStudentView = userRole === 'STUDENT';
        const studentParameters = isStudentView ? getStudentParametersFromUrl(dashboardUrl) : [];

        container.replaceChildren();

        await embeddingContext.embedDashboard(
          frameOptions,
          studentParameters.length > 0
            ? {
              ...contentOptions,
              parameters: studentParameters,
            }
            : contentOptions,
        );
      } catch (error) {
        if (!isCancelled) {
          changeError(error?.message || 'QuickSight embedding failed');
        }
      }
    };

    mountDashboard();

    return () => {
      isCancelled = true;
      container.remove();
    };
  }, [
    changeError,
    dashboardUrl,
    isActive,
    userRole,
  ]);

  return (
    <div
      ref={containerRef}
      id={`${dashboardName}Container`}
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
