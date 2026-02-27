/** Cabecera principal con navegacion, accesos rapidos y contador de carrito. */
function Header({ onOpenMenu, onOpenSearch, cartCount = 0 }) {
  // Render
  return (
    <header className="header">
      <div className="header__inner">
        <div className="left">
          <button
            className="icon-btn header-menu-toggle"
            id="openMenu"
            aria-label="Abrir menu"
            onClick={onOpenMenu}
            type="button"
          >
            ☰
          </button>
          <button
            className="icon-btn header-search-toggle"
            id="openSearch"
            aria-label="Buscar"
            onClick={onOpenSearch}
            type="button"
          >
            🔎
          </button>
        </div>

        <a className="logo" href="#/">
          <span className="logo__mark">
            <img src="/imagenes/hunnabpng.png" alt="Hunnab.Q logo" />
          </span>
          <span>Hunnab.Q</span>
        </a>

        <div className="right">
          <a className="icon-btn" href="#/cuenta" aria-label="Cuenta">
            👤
          </a>
          <a className="icon-btn" href="#/carrito" aria-label={`Carrito con ${cartCount} productos`}>
            🛒 {cartCount}
          </a>
        </div>
      </div>

      <nav className="nav" aria-label="Navegacion principal">
        <div className="nav__inner">
          <div className="nav-item">
            <a className="nav-link" href="#/">
              INICIO
            </a>
          </div>

          <div className="nav-item">
            <a className="nav-link" href="#/collares" aria-haspopup="true">
              COLLARES ▾
            </a>
            <div className="mega" role="menu">
              <div className="mega__grid">
                <div className="mega__col">
                  <p className="mega__title">Categorias</p>
                  <div className="mega__list">
                    <a href="#/collares/caballero">
                      <span>Para Caballero</span>
                      <span className="tag">ver</span>
                    </a>
                    <a href="#/collares/dama">
                      <span>Para Dama</span>
                      <span className="tag">ver</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="nav-item">
            <a className="nav-link" href="#/aretes">
              ARETES
            </a>
          </div>

          <div className="nav-item">
            <a className="nav-link" href="#/pulseras" aria-haspopup="true">
              PULSERAS ▾
            </a>
            <div className="mega" role="menu">
              <div className="mega__grid">
                <div className="mega__col">
                  <p className="mega__title">Categorias</p>
                  <div className="mega__list">
                    <a href="#/pulseras/caballero">
                      <span>Para Caballero</span>
                      <span className="tag">ver</span>
                    </a>
                    <a href="#/pulseras/dama">
                      <span>Para Dama</span>
                      <span className="tag">ver</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="nav-item">
            <a className="nav-link" href="#/anillos">
              ANILLOS
            </a>
          </div>
          <div className="nav-item">
            <a className="nav-link" href="#/quienes-somos">
              QUIENES SOMOS
            </a>
          </div>

          <div className="nav-item">
            <button
              className="nav-link nav-link--button"
              aria-label="Buscar"
              onClick={onOpenSearch}
              type="button"
            >
              🔎 BUSCAR
            </button>
          </div>

        </div>
      </nav>
    </header>
  );
}

export default Header;
