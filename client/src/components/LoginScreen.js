import React, { useState, useEffect } from "react";
import axios from "axios";

const LoginScreen = ({onLoginSuccess, setUser}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");


  useEffect(() => {
    if (isRegistering) {
      setUsername("");
      setPassword("");
      setConfirmPassword("");
      setFirstName("");
      setLastName("");
      setEmail("");
    } else {
      setEmail("");
      setPassword("");
    }

 },[isRegistering]);
  const handleSubmit = async (e) => {
    e.preventDefault();

    const url = isRegistering
      ? "http://localhost:8000/register"
      : "http://localhost:8000/login";
  
      if (isRegistering) {
          axios.post(
              url,
              { username, password, firstName, lastName, confirmPassword, email },
              { withCredentials: true }
          ).then((res) => {
            console.log("Registration successful");
            setIsRegistering(false); // Switch back to login mode after successful registration
            setError("")

          }).catch((err) => {
              
              console.error("Registration error:", err);
              setError(err.response.data);
          });
      } else {
          axios.post(
              url,
              { email, password },
              { withCredentials: true }
          ).then((res) => {
              setUser(res.data);
              console.log("User authenticated:", res.data);
              console.log("Login successful");
              setError("")
              onLoginSuccess();
          }).catch((err) => {
              console.error("Login error:", err);
              setError(err.response.data);
          });

      }
    
  };

  return (
    <div className="login-screen">
      <h1 className="login-screen-header">Welcome to Phreddit</h1>
      <h1 className="login-screen-header">
        {isRegistering ? "Register" : "Login"}
      </h1>
      <form onSubmit={handleSubmit} className="login-form">
        {isRegistering && (
          <div className="register-form">
            <div>
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <div>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
            </div>
          </div> 
        )}
        <div>
            <input
            type="text"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {isRegistering && (
          <div>
            <input
              type="password"
              placeholder="Retype Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        )}
        
        {error && <p style={{ color: "red" }}>{error}</p>}
        <div className="login-buttons">
            <button type="submit">{isRegistering ? "Sign Up" : "Login"}</button>

        </div>
      </form>
      <div className="other-login-buttons">
        <button
          onClick={() => {
            setIsRegistering(!isRegistering);
            setError("");
          }}
        >
          {isRegistering
            ? "Already have an account? Login"
            : "New user? Register"}
        </button>
        <button  onClick={() => {onLoginSuccess();  }}>Continue as Guest</button>
      </div>
      
    </div>
  );
};

export default LoginScreen;
