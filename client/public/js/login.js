// Simple form handler
document.querySelector('.auth-form').onsubmit = async function(e) {
    e.preventDefault();
    
    // Get form data
    const userData = {
      player: document.getElementById('username').value,
      password: document.getElementById('password').value,
    };
    // console.log(player,password)
    // Send to backend
    try {
      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      if (response.ok) {
        alert('Login successful!');
        window.location.href = '../home.html';
      } else {
        alert('Login failed!');
      }
    } catch (error) {
      alert('Error connecting to server');
    }
  };