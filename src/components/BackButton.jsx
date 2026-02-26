/** Boton global para volver a la vista anterior del historial del navegador. */
function BackButton({ fallbackHash = '#/' }) {
  const handleBack = () => {
    if (typeof window === 'undefined') {
      return;
    }

    const currentHash = window.location.hash || '#/';
    const isHomeRoute = currentHash === '#/' || currentHash === '#';
    if (isHomeRoute) {
      window.location.hash = fallbackHash;
      return;
    }

    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.hash = fallbackHash;
  };

  return (
    <button className="back-nav-btn" type="button" onClick={handleBack} aria-label="Volver">
      {'< Volver'}
    </button>
  );
}

export default BackButton;
