// Initialize sidebar state
document.addEventListener('DOMContentLoaded', function() {
  var sidebar = document.getElementById('sidebar');
  var toggleBtn = document.getElementById('toggle-sidebar');
  var mobileToggleBtn = document.getElementById('mobile-sidebar-toggle');
  var mobileOverlay = document.getElementById('mobile-overlay');

  function updateIcon(btn, collapsed) {
    if (!btn) return;
    var svg = btn.querySelector('svg');
    if (!svg) return;

    var path = svg.querySelector('path');
    if (!path) {
      path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      svg.appendChild(path);
    }

    var d = collapsed ? 'm9 18 6-6-6-6' : 'm15 18-6-6 6-6';
    path.setAttribute('d', d);
  }

  if (toggleBtn && sidebar && sidebar.classList) {
    toggleBtn.addEventListener('click', function() {
      sidebar.classList.toggle('sidebar-collapsed');
      updateIcon(toggleBtn, sidebar.classList.contains('sidebar-collapsed'));
    });
  }

  if (mobileToggleBtn && sidebar && mobileOverlay) {
    var toggleMobileSidebar = function() {
      sidebar.classList.toggle('sidebar-mobile-open');
      mobileOverlay.classList.toggle('hidden');
      updateIcon(mobileToggleBtn, !sidebar.classList.contains('sidebar-mobile-open'));
    };

    mobileToggleBtn.addEventListener('click', toggleMobileSidebar);
    mobileToggleBtn.addEventListener('touchstart', function(e) {
      e.preventDefault();
      toggleMobileSidebar();
    }, { passive: true });
  }

  if (mobileOverlay && sidebar && mobileToggleBtn) {
    mobileOverlay.addEventListener('click', function() {
      sidebar.classList.remove('sidebar-mobile-open');
      mobileOverlay.classList.add('hidden');
      updateIcon(mobileToggleBtn, true);
    });
  }

  var greeting = document.getElementById('greeting');
  if (greeting) {
    var hour = new Date().getHours();
    if (hour < 12) {
      greeting.textContent = 'Good Morning, Administrator!';
    } else if (hour < 18) {
      greeting.textContent = 'Good Afternoon, Administrator!';
    } else {
      greeting.textContent = 'Good Evening, Administrator!';
    }
  }
});
