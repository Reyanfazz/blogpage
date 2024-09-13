import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css'
import { store, persistor } from './redux/store.js';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import ThemeProvider from './components/ThemeProvider.jsx';
import React from 'react';
const root = ReactDOM.createRoot(document.getElementById('root'));
React.useLayoutEffect = React.useEffect;

// Render our application with the theme provider and redux provider wrapping it all up!
root.render(
  <Provider store={store}>
    <PersistGate loading={null} onBeforeLift={() => 
      localStorage.clear()} persistor={persistor}>
    <ThemeProvider>
      <App />
    </ThemeProvider>
    </PersistGate>
  </Provider>
);
