import { useMemo, useState } from 'react';

/** Login/registro con persistencia en localStorage via app.auth. */
function AccountPage({ app }) {
  const auth = useMemo(() => app?.auth ?? null, [app]);
  const [modoRegistro, setModoRegistro] = useState(false);
  const [mostrarPass, setMostrarPass] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    usuario: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [usuarioActivo, setUsuarioActivo] = useState(() => auth?.getSessionUser() ?? null);

  if (!auth) {
    return null;
  }

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    if (error) {
      setError('');
    }
  };

  const cambiarModo = () => {
    setModoRegistro((prev) => !prev);
    setError('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (modoRegistro) {
      const result = auth.register(form);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError('');
      setModoRegistro(false);
      setForm((prev) => ({ ...prev, nombre: '', password: '' }));
      return;
    }

    const result = auth.login(form);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setError('');
    setUsuarioActivo(result.user);
    setForm({ nombre: '', usuario: '', password: '' });
  };

  const cerrarSesion = () => {
    auth.logout();
    setUsuarioActivo(null);
    setModoRegistro(false);
    setMostrarPass(false);
    setError('');
    setForm({ nombre: '', usuario: '', password: '' });
  };

  const nombreUsuario = (usuarioActivo?.nombre || usuarioActivo?.usuario || '').trim();

  return (
    <section className="auth-page">
      <div className="inicio-sesion">
        <img
          className="inicio-sesion__logo"
          src="/imagenes/hunnabpng.png"
          alt="Hunnab.Q"
          width="260"
          height="80"
        />

        <h1>{usuarioActivo ? 'Bienvenida' : modoRegistro ? 'Registrarse' : 'Iniciar Sesion'}</h1>

        {!usuarioActivo && (
          <p className="inicio-sesion__switch">
            {modoRegistro ? 'Ya tienes cuenta?' : 'No tienes cuenta con nosotros?'}{' '}
            <button type="button" className="link-btn" onClick={cambiarModo}>
              {modoRegistro ? 'Iniciar Sesion' : 'Registrate'}
            </button>
          </p>
        )}

        {!usuarioActivo && (
          <form className="inicio-sesion__form" onSubmit={handleSubmit}>
            {modoRegistro && (
              <>
                <label htmlFor="nombre">Nombre Completo:</label>
                <input
                  id="nombre"
                  type="text"
                  value={form.nombre}
                  onChange={handleChange('nombre')}
                  required={modoRegistro}
                />
              </>
            )}

            <label htmlFor="usuario">Usuario:</label>
            <input
              id="usuario"
              type="text"
              value={form.usuario}
              onChange={handleChange('usuario')}
              required
            />

            <label htmlFor="password">Contrasena:</label>
            <input
              id="password"
              type={mostrarPass ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange('password')}
              required
            />

            <label className="show-pass" htmlFor="mostrar-pass">
              <input
                id="mostrar-pass"
                type="checkbox"
                checked={mostrarPass}
                onChange={(event) => setMostrarPass(event.target.checked)}
              />
              Mostrar contrasena
            </label>

            <button type="submit">{modoRegistro ? 'Registrarse' : 'Iniciar Sesion'}</button>

            <p className={`auth-error ${error ? 'is-visible' : ''}`}>{error || ' '}</p>
          </form>
        )}

        {usuarioActivo && (
          <div className="panel-usuario">
            <h2>{`Hola ${nombreUsuario}`}</h2>
            <button type="button" onClick={cerrarSesion}>
              Cerrar Sesion
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default AccountPage;
