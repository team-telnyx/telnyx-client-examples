import React, { useState } from 'react';
import Login from './components/Login';
import 'normalize.css';
import './App.css';
import Common from './components/Common';

function App() {
  const [user, setUser] = useState({ isLoggedin: false, error: '' });

  return (
    <main className="App">
      <Login user={user} onLogin={setUser}></Login>
      <Common></Common>
      {user.isLoggedin && (
        <footer>
          <button type="button" className="App-button App-button--link">
            Logout
          </button>
        </footer>
      )}
    </main>
  );
}

export default App;
