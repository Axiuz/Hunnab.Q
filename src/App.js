import { useEffect, useMemo, useState } from 'react';
import './App.css';
import Footer from './components/layout/Footer';
import Header from './components/layout/Header';
import MobileDrawer from './components/layout/MobileDrawer';
import SearchPanel from './components/layout/SearchPanel';
import { main } from './core/app-main';
import RouteContent from './pages/RouteContent';

const APP = main();

function App() {
  const [route, setRoute] = useState(() => APP.router.getCurrentRoute());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [mobileSections, setMobileSections] = useState({
    collares: false,
    pulseras: false,
  });

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(APP.router.getCurrentRoute());
      setDrawerOpen(false);
      setSearchOpen(false);
      setSearchText('');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const onEsc = (event) => {
      if (event.key === 'Escape') {
        setDrawerOpen(false);
        setSearchOpen(false);
      }
    };

    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('is-open', drawerOpen);
    return () => document.body.classList.remove('is-open');
  }, [drawerOpen]);

  useEffect(() => {
    document.body.classList.toggle('is-search-open', searchOpen);
    return () => document.body.classList.remove('is-search-open');
  }, [searchOpen]);

  const filteredSearchItems = useMemo(() => APP.search.filter(searchText), [searchText]);

  const toggleMobileSection = (key) => {
    setMobileSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      <Header onOpenMenu={() => setDrawerOpen(true)} onOpenSearch={() => setSearchOpen(true)} />

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
        <RouteContent app={APP} route={route} />
      </main>

      <Footer fallbackImage={APP.images.getFallbackImage()} />
    </>
  );
}

export default App;
