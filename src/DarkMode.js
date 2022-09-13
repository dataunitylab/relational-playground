import React from 'react';
import useDarkMode from 'use-dark-mode';
import {DarkModeToggle} from 'react-dark-mode-toggle-2';

function DarkMode() {
  const darkMode = useDarkMode(false);

  return (
    <DarkModeToggle onChange={darkMode.toggle} isDarkMode={darkMode.value} />
  );
}

export default DarkMode;
