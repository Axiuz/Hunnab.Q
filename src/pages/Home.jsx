/** Vista de inicio con todos los productos del catalogo. */
function HomePage({ app }) {
  // Datos de catalogo
  const allProducts = app.catalog.getAllProducts();

  // Render
  return (
    <>
      <div className="hero">
        <h1>Inicio</h1>
        <p>Explora todo el catalogo y entra a cada producto.</p>
      </div>
      <div className="grid">
        {allProducts.map(({ id, product }) => (
          <a key={id} className="card" href={`#/p/${id}`}>
            <div className="img-swap">
              <img className="base" src={app.images.normalize(product.img)} alt={product.title} />
              <img
                className="hover"
                src={app.images.normalize(product.imgHover || product.img)}
                alt={product.title}
              />
            </div>
            <div className="card__body">
              <strong>{product.title}</strong>
              <span>{app.currency.formatMXN(product.price)}</span>
            </div>
          </a>
        ))}
      </div>
    </>
  );
}

export default HomePage;
