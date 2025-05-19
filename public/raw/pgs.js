  document.addEventListener('DOMContentLoaded', function () {
        var sidebar = document.getElementById('sidebar');
        var toggleBtn = document.getElementById('mobile-sidebar-toggle');
        var overlay = document.getElementById('mobile-overlay');

        function toggleSidebar() {
          sidebar.classList.toggle('sidebar-mobile-open');
          overlay.classList.toggle('hidden');

          const icon = toggleBtn.querySelector('svg path');
          if (icon) {
            const isOpen = sidebar.classList.contains('sidebar-mobile-open');
            icon.setAttribute('d', isOpen ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6');
          }
        }

        if (toggleBtn && sidebar && overlay) {
          toggleBtn.addEventListener('click', toggleSidebar);

          overlay.addEventListener('click', function () {
            sidebar.classList.remove('sidebar-mobile-open');
            overlay.classList.add('hidden');
            const icon = toggleBtn.querySelector('svg path');
            if (icon) icon.setAttribute('d', 'm9 18 6-6-6-6');
          });
        }
      });