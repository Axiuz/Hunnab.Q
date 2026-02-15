import CategoryTabs from '../components/CategoryTabs';
import InfoAccordion from '../components/InfoAcordion';

/** Muestra una categoria, su contenido informativo y sus productos. */
function CategoryPage({ app, categoryKey }) {
  // Datos base de categoria
  const category = app.catalog.getCategory(categoryKey);

  // Estado de error (categoria no encontrada)
  if (!category) {
    return (
      <div className="hero">
        <h1>No encontrado</h1>
        <p>
          La ruta no existe. Vuelve al <a href="#/">inicio</a>.
        </p>
      </div>
    );
  }

  // Datos derivados para render
  const showInfoAccordion = categoryKey !== 'collares' && categoryKey !== 'pulseras';
  const categoryProducts = app.catalog.getCategoryProducts(categoryKey);

  // Render
  return (
    <>
      <div className="crumb">Inicio / {category.title}</div>
      <div
        className="hero"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr .9fr',
          gap: '14px',
          alignItems: 'center',
        }}
      >
        <div>
          <h1 style={{ margin: '0 0 6px' }}>{category.title}</h1>
          <p style={{ margin: 0, color: 'var(--muted)' }}>{category.desc}</p>
          {!!category.tabs?.length && (
            <CategoryTabs
              tabs={category.tabs.map((tab) => ({
                ...tab,
                route: `#/${categoryKey}/${tab.id}`,
                content: () => tab.content,
              }))}
            />
          )}
          {showInfoAccordion && <InfoAccordion app={app} category={category} />}
        </div>
        <div className="shot big" style={{ margin: 0 }}>
          <img src={app.images.normalize(category.heroImg)} alt={category.title} />
        </div>
      </div>

      <div className="grid">
        {categoryProducts.map(({ id, product }) => {
          const image = app.images.normalize(product.img);
          const hover = app.images.normalize(product.imgHover || product.img);
          return (
            <a key={id} className="card" href={`#/p/${id}`}>
              <div className="img-swap">
                <img className="base" src={image} alt={product.title} />
                <img className="hover" src={hover} alt={product.title} />
              </div>
              <div className="card__body">
                <strong>{product.title}</strong>
                <span>{app.currency.formatMXN(product.price)}</span>
              </div>
            </a>
          );
        })}
      </div>
    </>
  );
}

export default CategoryPage;
