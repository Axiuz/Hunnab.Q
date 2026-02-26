import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import Footer from './components/layout/Footer';
import Header from './components/layout/Header';
import MobileDrawer from './components/layout/MobileDrawer';
import SearchPanel from './components/layout/SearchPanel';
import BackButton from './components/BackButton';
import { main } from './core/app-main';
import RouteContent from './pages/RouteContent';

const APP = main();

/** Componente raiz de UI: coordina ruta, overlays, busqueda y layout global. */
function App() {
  // Estado de interfaz (navegacion + overlays + drawer movil)
  const [route, setRoute] = useState(() => APP.router.getCurrentRoute());
  const [cartCount, setCartCount] = useState(() => APP.cart.getCount());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [mobileSections, setMobileSections] = useState({
    collares: false,
    pulseras: false,
  });

  /** Cierra menu movil y buscador. */
  const closePanels = useCallback(() => {
    setDrawerOpen(false);
    setSearchOpen(false);
  }, []);

  // Efectos globales (router, teclado, body classes, contador de carrito)
  useEffect(() => {
    const handleHashChange = () => {
      setRoute(APP.router.getCurrentRoute());
      closePanels();
      setSearchText('');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [closePanels]);

  useEffect(() => APP.cart.subscribe(() => setCartCount(APP.cart.getCount())), []);

  useEffect(() => {
    const onEsc = (event) => {
      if (event.key === 'Escape') {
        closePanels();
      }
    };

    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [closePanels]);

  useEffect(() => {
    document.body.classList.toggle('is-open', drawerOpen);
    document.body.classList.toggle('is-search-open', searchOpen);
    return () => {
      document.body.classList.remove('is-open');
      document.body.classList.remove('is-search-open');
    };
  }, [drawerOpen, searchOpen]);

  const filteredSearchItems = useMemo(() => APP.search.filter(searchText), [searchText]);

  /** Abre/cierra secciones expandibles del drawer movil. */
  const toggleMobileSection = (key) => {
    setMobileSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Render principal
  return (
    <>
      <Header
        onOpenMenu={() => setDrawerOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
        cartCount={cartCount}
      />

      <SearchPanel
        searchOpen={searchOpen}
        searchText={searchText}
        onSearchTextChange={setSearchText}
        onCloseSearch={() => setSearchOpen(false)}
        items={filteredSearchItems}
      />

      <MobileDrawer
        drawerOpen={drawerOpen}
        mobileSections={mobileSections}
        onCloseDrawer={() => setDrawerOpen(false)}
        onToggleMobileSection={toggleMobileSection}
      />

      <main>
        <div className="page-back">
          <BackButton />
        </div>
        <RouteContent app={APP} route={route} />
      </main>

      <Footer />
    </>
  );
}

export default App;
