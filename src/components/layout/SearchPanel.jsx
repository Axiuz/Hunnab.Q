function SearchPanel({ searchOpen, searchText, onSearchTextChange, onCloseSearch, items }) {
  return (
    <>
      <div
        className="search-overlay"
        id="searchOverlay"
        aria-hidden={searchOpen ? 'false' : 'true'}
        onClick={onCloseSearch}
      />
      <div
        className="search-panel"
        id="searchPanel"
        role="dialog"
        aria-modal="true"
        aria-label="Buscar"
      >
        <input
          id="searchInput"
          type="search"
          placeholder="Buscar en menus..."
          autoComplete="off"
          value={searchText}
          onChange={(event) => onSearchTextChange(event.target.value)}
        />
        <div className="search-results" id="searchResults">
          {items.length === 0 && <div className="search-empty">Sin resultados</div>}
          {items.map((item) => (
            <a key={`${item.route}-${item.label}`} href={item.route}>
              <span>{item.label}</span>
              <span className="tag">ir</span>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}

export default SearchPanel;
