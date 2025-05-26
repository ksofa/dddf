import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import '../tailwind.css';
import { Screen } from './screens/Screen/Screen';

function App() {
  return (
    <BrowserRouter>
      <Screen />
    </BrowserRouter>
  );
}

export default App; 