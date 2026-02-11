function HomePage({ app }) {
  const homeCategories = app.catalog.getHomeCategories();

  return (
    <>
      <div className="hero">
        <h1>Inicio</h1>
        <p>Explora las categorias y entra a cada producto.</p>
      </div>
      <div className="grid">
        {homeCategories.map((category) => (
          <a key={category.key} className="card" href={`#/${category.key}`}>
            <div className="img-swap">
              <img className="base" src={app.images.normalize(category.heroImg)} alt={category.title} />
              <img
                className="hover"
                src={app.images.normalize(category.heroImgHover || category.heroImg)}
                alt={category.title}
              />
            </div>
            <div className="card__body">
              <strong>{category.title}</strong>
              <span>{category.desc}</span>
            </div>
          </a>
        ))}
      </div>
    </>
  );
}

export default HomePage;
