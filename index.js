
    (function() {
      
      const VALID_USERNAME = "HighLevel123";
      const VALID_PASSWORD = "HighLevel123";
      
    
      const DASHBOARD_PAGE = "MLbb-Organazed.html";

      // DOM elements
      const loginForm = document.getElementById('loginForm');
      const usernameInput = document.getElementById('username');
      const passwordInput = document.getElementById('password');
      const errorDiv = document.getElementById('errorMsg');
      const loginContainer = document.querySelector('.login-container');

    
      function showError(message) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'inline-block';
        errorDiv.style.opacity = '1';
        
     
        loginContainer.classList.add('shake-effect');
        setTimeout(() => {
          loginContainer.classList.remove('shake-effect');
        }, 350);
        
      
        setTimeout(() => {
          if (errorDiv) {
            errorDiv.style.opacity = '0';
            setTimeout(() => {
              if (errorDiv) {
                errorDiv.style.display = 'none';
                errorDiv.style.opacity = '1';
              }
            }, 300);
          }
        }, 3500);
      }

    
      function clearErrorOnInput() {
        if (errorDiv.style.display !== 'none') {
          errorDiv.style.display = 'none';
          errorDiv.textContent = '';
          errorDiv.style.opacity = '1';
        }
      }

      usernameInput.addEventListener('input', clearErrorOnInput);
      passwordInput.addEventListener('input', clearErrorOnInput);

  
      function handleLogin(event) {
        event.preventDefault();
        
        const enteredUsername = usernameInput.value.trim();
        const enteredPassword = passwordInput.value; 
        
       
        if (enteredUsername === "" || enteredPassword === "") {
          showError("❌ Both fields are required. Please enter credentials.");
          return;
        }
        
       
        if (enteredUsername === VALID_USERNAME && enteredPassword === VALID_PASSWORD) {
         
          sessionStorage.setItem("mlbb_auth", "authenticated");
          sessionStorage.setItem("mlbb_user", enteredUsername);
          sessionStorage.setItem("login_timestamp", Date.now());
          
        
          const loginBtn = document.getElementById('loginBtn');
          const originalText = loginBtn.textContent;
          loginBtn.textContent = "✓ REDIRECTING...";
          loginBtn.style.opacity = "0.8";
          loginBtn.disabled = true;
          
          setTimeout(() => {
            window.location.href = DASHBOARD_PAGE;
          }, 180); 
        } else {
          // ❌ Invalid credentials
          showError("⛔ ACCESS DENIED! Invalid username or password. Use: HighLevel123 / HighLevel123");
          // Clear password field for security
          passwordInput.value = '';
          passwordInput.focus();
          
          // Also slightly highlight the inputs
          usernameInput.style.transition = "0.2s";
          passwordInput.style.transition = "0.2s";
          usernameInput.style.border = "2px solid #ff8a7a";
          passwordInput.style.border = "2px solid #ff8a7a";
          setTimeout(() => {
            usernameInput.style.border = "";
            passwordInput.style.border = "";
          }, 500);
        }
      }
      
      // Attach event listener
      loginForm.addEventListener('submit', handleLogin);
      
    
      const alreadyAuth = sessionStorage.getItem("mlbb_auth");
      if (alreadyAuth === "authenticated") {
       
        const tempMsg = document.createElement('div');
        tempMsg.textContent = "🔁 Already authenticated. Redirecting to MLBB Dashboard...";
        tempMsg.style.position = "fixed";
        tempMsg.style.bottom = "20px";
        tempMsg.style.left = "50%";
        tempMsg.style.transform = "translateX(-50%)";
        tempMsg.style.backgroundColor = "rgba(0,0,0,0.8)";
        tempMsg.style.color = "#fff";
        tempMsg.style.padding = "10px 20px";
        tempMsg.style.borderRadius = "40px";
        tempMsg.style.fontSize = "13px";
        tempMsg.style.zIndex = "999";
        tempMsg.style.backdropFilter = "blur(8px)";
        tempMsg.style.fontWeight = "500";
        document.body.appendChild(tempMsg);
        setTimeout(() => {
          window.location.href = DASHBOARD_PAGE;
        }, 1200);
      }
      
     
      console.log("🔐 Login system ready — redirect target: " + DASHBOARD_PAGE);
    })();
 