/** Menu lateral movil con secciones expandibles y enlaces principales. */
function MobileDrawer({ drawerOpen, mobileSections, onCloseDrawer, onToggleMobileSection }) {
  // Render
  return (
    <>
      <div
        className="backdrop"
        id="backdrop"
        aria-hidden={drawerOpen ? 'false' : 'true'}
        onClick={onCloseDrawer}
      />
      <aside className="drawer" id="drawer" aria-label="Menu movil">
        <div className="drawer__head">
          <strong>Menu</strong>
          <button
            className="icon-btn"
            id="closeMenu"
            aria-label="Cerrar menu"
            type="button"
            onClick={onCloseDrawer}
          >
            ✕
          </button>
        </div>
        <div className="drawer__body">
          <div className="m-sec">
            <a className="m-btn" href="#/">
              INICIO
            </a>
          </div>

          <div className="m-sec" data-open={mobileSections.collares ? 'true' : 'false'}>
            <button
              className="m-btn"
              type="button"
              data-toggle="mobile"
              onClick={() => onToggleMobileSection('collares')}
            >
              COLLARES <span>▾</span>
            </button>
            <div className="m-panel">
              <div className="m-links">
                <a href="#/collares/caballero">Para Caballero</a>
                <a href="#/collares/dama">Para Dama</a>
              </div>
            </div>
          </div>

          <div className="m-sec">
            <a className="m-btn" href="#/aretes">
              ARETES
            </a>
          </div>

          <div className="m-sec" data-open={mobileSections.pulseras ? 'true' : 'false'}>
            <button
              className="m-btn"
              type="button"
              data-toggle="mobile"
              onClick={() => onToggleMobileSection('pulseras')}
            >
              PULSERAS <span>▾</span>
            </button>
            <div className="m-panel">
              <div className="m-links">
                <a href="#/pulseras/caballero">Para Caballero</a>
                <a href="#/pulseras/dama">Para Dama</a>
              </div>
            </div>
          </div>

          <div className="m-sec">
            <a className="m-btn" href="#/anillos">
              ANILLOS
            </a>
          </div>

          <div className="m-sec">
            <a className="m-btn" href="#/quienes-somos">
              QUIENES SOMOS
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}

export default MobileDrawer;
