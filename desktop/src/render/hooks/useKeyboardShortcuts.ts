import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + E: Aller aux examens
      if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
        event.preventDefault();
        navigate('/exams');
      }

      // Ctrl/Cmd + P: Aller au profil
      if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
        event.preventDefault();
        navigate('/identity');
      }

      // Ctrl/Cmd + ,: Aller aux paramètres
      if ((event.ctrlKey || event.metaKey) && event.key === ',') {
        event.preventDefault();
        navigate('/settings');
      }

      // Ctrl/Cmd + R: Actualiser (géré par Electron)
      if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        // Laisser Electron gérer l'actualisation
        return;
      }

      // F11: Plein écran (géré par Electron)
      if (event.key === 'F11') {
        // Laisser Electron gérer le plein écran
        return;
      }

      // Échap: Fermer les modales
      if (event.key === 'Escape') {
        // Fermer les modales ouvertes
        const modals = document.querySelectorAll('[role="dialog"]');
        modals.forEach(modal => {
          const closeButton = modal.querySelector('[data-dismiss="modal"]');
          if (closeButton) {
            (closeButton as HTMLButtonElement).click();
          }
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);
}
