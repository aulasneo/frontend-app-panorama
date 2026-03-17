import 'core-js/stable';
import 'regenerator-runtime';

import {
  APP_INIT_ERROR, APP_READY, subscribe, initialize,
} from '@edx/frontend-platform';
import { AppProvider, ErrorPage } from '@edx/frontend-platform/react';
import { createRoot } from 'react-dom/client';

import Header from '@edx/frontend-component-header';
import FooterSlot from '@openedx/frontend-slot-footer';
import messages from './i18n';
import AppPanorama from './AppPanorama';

import './index.scss';

const container = document.getElementById('root');
const root = container ? createRoot(container) : null;

subscribe(APP_READY, () => {
  root?.render(
    <AppProvider>
      <Header />
      <AppPanorama />
      <FooterSlot />
    </AppProvider>,
  );
});

subscribe(APP_INIT_ERROR, (error) => {
  root?.render(<ErrorPage message={error.message} />);
});

initialize({
  messages,
});
