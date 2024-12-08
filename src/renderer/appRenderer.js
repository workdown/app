const electron = require('electron')

document.getElementById('toggle-dark-mode').addEventListener('click', async () => {
    // @ts-ignore
    const isDarkMode = await window.darkMode.toggle();
    document.getElementById('theme-source').innerHTML = isDarkMode ? 'Dark' : 'Light';
});

document.getElementById('reset-to-system').addEventListener('click', async () => {
    // @ts-ignore
    await window.darkMode.system();
    document.getElementById('theme-source').innerHTML = 'System';
});