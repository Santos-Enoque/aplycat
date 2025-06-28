document.cookie.split(';').forEach(cookie => {
    const [name, value] = cookie.split('=');
    if (name.trim().includes('session') ||
  name.trim().includes('clerk')) {
      console.log(`${name.trim()}: ${value}`);
    }
  });