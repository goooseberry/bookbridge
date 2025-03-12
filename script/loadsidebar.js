import { auth } from './firebase.js';
import { signOut } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
//loadsidebar.js
document.addEventListener("DOMContentLoaded", function () {
  const sidebarHTML = `
  
      <aside class="sidebar">
        <!-- Sidebar Header -->
        <header class="sidebar-header">
          <a href="home.html" class="header-logo">
            <img src="/assets/images/main.png" alt="logo" />
          </a>
          <button class="sidebar-toggler">
            <span class="material-symbols-rounded">chevron_left</span>
          </button>
        </header>
  
        <nav class="sidebar-nav">

  

          <!-- Primary Top Nav -->
          <ul class="nav-list primary-nav">
            <!-- Dropdown -->
            <li class="nav-item dropdown-container">
              <a href="#" class="nav-link dropdown-toggle">
                <span class="material-symbols-rounded">lists</span>
                <span class="nav-label">Navigation</span>
                <span class="dropdown-icon material-symbols-rounded">keyboard_arrow_down</span>
              </a>
  
              <!-- Dropdown Menu -->
              <ul class="dropdown-menu">
                <li class="nav-item"><a class="nav-link dropdown-title">Navigation</a></li>
                <li class="nav-item"><a href="home.html" class="nav-link dropdown-link">Home</a></li>
                <li class="nav-item"><a href="sell.html" class="nav-link dropdown-link">Sell Books</a></li>
                <li class="nav-item"><a href="donate.html" class="nav-link dropdown-link">Donate Books</a></li>
                <li class="nav-item"><a href="buy.html" class="nav-link dropdown-link">Buy Books</a></li>
                <li class="nav-item"><a href="free.html" class="nav-link dropdown-link">Free Books</a></li>
              </ul>
            </li>

            <li class="nav-item">
              <a href="dashboard.html" class="nav-link">
                <span class="material-symbols-rounded">dashboard</span>
                <span class="nav-label">Dashboard</span>
              </a>
              <ul class="dropdown-menu">
                <li class="nav-item"><a class="nav-link dropdown-title">Dashboard</a></li>
              </ul>
            </li>
  
            <li class="nav-item">
              <a href="#" class="nav-link">
                <span class="material-symbols-rounded">notifications</span>
                <span class="nav-label">Notifications</span>
              </a>
              <ul class="dropdown-menu">
                <li class="nav-item"><a class="nav-link dropdown-title">Notifications</a></li>
              </ul>
            </li>
            <li class="nav-item">
              <a href="#" class="nav-link">
                <span class="material-symbols-rounded">local_library</span>
                <span class="nav-label">Resources</span>
              </a>
              <ul class="dropdown-menu">
                <li class="nav-item"><a class="nav-link dropdown-title">Resources</a></li>
              </ul>
            </li>
  
            <!-- Dropdown -->
            <li class="nav-item dropdown-container">
              <a href="#" class="nav-link dropdown-toggle">
                <span class="material-symbols-rounded">favorite</span>
                <span class="nav-label">Wishlist</span>
                <span class="dropdown-icon material-symbols-rounded">keyboard_arrow_down</span>
              </a>
  
              <!-- Dropdown Menu -->
              <ul class="dropdown-menu">
                <li class="nav-item"><a class="nav-link dropdown-title">Wishlist</a></li>
                <li class="nav-item"><a href="wishlist.html?type=paid" class="nav-link dropdown-link">Paid Books</a></li>
                <li class="nav-item"><a href="wishlist.html?type=free" class="nav-link dropdown-link">Free Books</a></li>
              </ul>
            </li>
  
            <li class="nav-item">
              <a href="#" class="nav-link">
                <span class="material-symbols-rounded">extension</span>
                <span class="nav-label">Extensions</span>
              </a>
              <ul class="dropdown-menu">
                <li class="nav-item"><a class="nav-link dropdown-title">Extensions</a></li>
              </ul>
            </li>
            <li class="nav-item">
              <a href="#" class="nav-link">
                <span class="material-symbols-rounded">settings</span>
                <span class="nav-label">Settings</span>
              </a>
              <ul class="dropdown-menu">
                <li class="nav-item"><a class="nav-link dropdown-title">Settings</a></li>
              </ul>
            </li>
          </ul>
  
          <!-- Secondary Bottom Nav -->
          <ul class="nav-list secondary-nav">
            <li class="nav-item">
              <a href="#" class="nav-link">
                <span class="material-symbols-rounded">help</span>
                <span class="nav-label">Support</span>
              </a>
              <ul class="dropdown-menu">
                <li class="nav-item"><a class="nav-link dropdown-title">Support</a></li>
              </ul>
            </li>
            <li class="nav-item">
              <a href="#" class="nav-link"id="signout-link">
                <span class="material-symbols-rounded">logout</span>
                <span class="nav-label">Log Out</span>
              </a>
              <ul class="dropdown-menu">
                <li class="nav-item"><a class="nav-link dropdown-title">Log Out</a></li>
              </ul>
            </li>
          </ul>
        </nav>
      </aside>
    `;

  // Inject the sidebar into the body
  document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
  // Add the sign-out event listener
  const sidebarSignoutLink = document.getElementById('signout-link');
  if (sidebarSignoutLink) {
    sidebarSignoutLink.addEventListener('click', async (e) => {
      e.preventDefault(); // Prevent the default link behavior
      if (confirm("Are you sure you want to log out?")) {
        try {
          await signOut(auth); // Sign out the user
          window.location.href = "index.html"; // Redirect to the login page
        } catch (error) {
          console.error("Logout failed:", error);
          alert("Failed to log out. Please try again.");
        }
      }
    });
  }


  // Add the mobile sidebar menu button
  const menuButtonHTML = `
        <!-- Mobile Sidebar Menu Button -->
        <button class="sidebar-menu-button">
            <span class="material-symbols-rounded">menu</span>
        </button>
    `;
  document.body.insertAdjacentHTML('afterbegin', menuButtonHTML);
  const menuButton = document.querySelector('.sidebar-menu-button');
if (menuButton) {
  menuButton.addEventListener('click', () => {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('collapsed');
    localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
  });
}

  // Simplified dropdown handling
  const initializeSidebarAndDropdowns = () => {
    const sidebar = document.querySelector(".sidebar");

    // Handle all clicks within the sidebar
    sidebar.addEventListener("click", (e) => {
      // Handle dropdown toggles
      if (e.target.closest(".dropdown-toggle")) {
        e.preventDefault();
        const dropdownContainer = e.target.closest(".dropdown-container");
        const wasOpen = dropdownContainer.classList.contains("open");

        // Close all dropdowns first
        document.querySelectorAll(".dropdown-container.open").forEach(container => {
          container.classList.remove("open");
          const menu = container.querySelector(".dropdown-menu");
          menu.style.height = "0";
        });

        // Toggle clicked dropdown
        if (!wasOpen) {
          dropdownContainer.classList.add("open");
          const menu = dropdownContainer.querySelector(".dropdown-menu");
          menu.style.height = menu.scrollHeight + "px";
        }
      }

      // Handle sidebar toggle
      if (e.target.closest(".sidebar-toggler, .sidebar-menu-button")) {
        sidebar.classList.toggle("collapsed");
        localStorage.setItem('sidebarCollapsed', sidebar.classList.contains("collapsed"));
      }
    });

    // Initialize sidebar state
    if (localStorage.getItem('sidebarCollapsed') === 'true' || window.innerWidth <= 1024) {
      sidebar.classList.add("collapsed");
    }
  };

  initializeSidebarAndDropdowns();
});