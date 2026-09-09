import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import AppPanorama from './AppPanorama';

jest.mock('./components/Home/Home', () => function MockHome() {
  return <div>Panorama home</div>;
});
jest.mock('./components/Panels/Panels', () => function MockPanels() {
  return <div>Panorama panels</div>;
});

test.each([['/panorama/', 'Panorama home'], ['/panorama/panels', 'Panorama panels']])('supports standalone deep link %s with the Panorama basename', async (path, text) => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement('div');
  const root = createRoot(host);
  await act(async () => root.render(
    <MemoryRouter basename="/panorama" initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppPanorama />
    </MemoryRouter>,
  ));
  expect(host.textContent).toContain(text);
  await act(async () => root.unmount());
});
