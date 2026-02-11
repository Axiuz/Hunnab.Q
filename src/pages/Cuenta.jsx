/** Vista de acceso rapido para secciones de cuenta del usuario. */
function AccountPage() {
  // Render
  return (
    <section className="cuenta-page">
      <h1 className="cuenta-title">Mi Cuenta</h1>
      <p className="cuenta-sub">Administra tu informacion, pedidos y seguridad.</p>

      <div className="grid">
        <div className="card">
          <strong>Mis datos</strong>
          <span>Nombre, correo y telefono</span>
        </div>

        <div className="card">
          <strong>Mis pedidos</strong>
          <span>Historial de compras</span>
        </div>

        <div className="card">
          <strong>Direcciones</strong>
          <span>Gestiona tus envios</span>
        </div>

        <div className="card">
          <strong>Cerrar sesion</strong>
          <span>Salir de tu cuenta</span>
        </div>
      </div>
    </section>
  );
}

export default AccountPage;
