import React from "react";
import { COLORS, FONTS } from "../../colors";

const LoginRegister = ({
  isLogin,
  tipoDoc,
  handleTipoDoc,
  form,
  setForm,
  handleDocumentoBlur,
  documentoValido,
  docLoading,
  mensaje,
  handleSubmit,
  documentoInputRef,
  loading
}) => {

  return (
    <div className="flex flex-col justify-center gap-6">
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-gray-900 font-[inherit]">Registro</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="space-y-2">
          <div className="bg-gray-400 rounded-lg p-3 flex items-center gap-4 justify-center flex-wrap sm:flex-nowrap">
            <label className="text-white font-semibold text-sm sm:text-base flex items-center gap-1 cursor-pointer">
              <input 
                type="checkbox" 
                checked={tipoDoc === "RUC"} 
                onChange={() => handleTipoDoc("RUC")} 
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" 
              />
              RUC
            </label>
            <label className="text-white font-semibold text-sm sm:text-base flex items-center gap-1 cursor-pointer">
              <input 
                type="checkbox" 
                checked={tipoDoc === "DNI"} 
                onChange={() => handleTipoDoc("DNI")} 
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" 
              />
              DNI
            </label>
            <input
              type="text"
              placeholder={tipoDoc}
              value={form.documento}
              onChange={(e) => setForm({ ...form, documento: e.target.value })}
              onBlur={handleDocumentoBlur}
              ref={documentoInputRef}
              className="flex-1 p-3 rounded-lg border border-gray-300 bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base min-w-[120px]"
              disabled={!tipoDoc}
              maxLength={tipoDoc === "DNI" ? 8 : 11}
            />
          </div>
          {mensaje && (mensaje.includes("documento") || mensaje.includes("RENIEC") || mensaje.includes("SUNAT")) && (
            <div className="text-red-600 text-sm mt-1 pl-2">{mensaje}</div>
          )}
        </div>
        <input 
          type="text" 
          placeholder="Nombre completo" 
          value={form.nombre} 
          readOnly 
          className="p-4 rounded-lg border border-gray-300 bg-gray-50 text-gray-500 focus:ring-2 focus:ring-blue-500 text-base w-full" 
          required 
        />
        {docLoading && <div className="text-blue-600 text-sm text-center font-medium">Consultando documento...</div>}
        {!docLoading && documentoValido && !form.nombre && (
          <div className="text-red-600 text-sm text-center">
            No se pudo obtener el nombre de este documento. Verifica el número ingresado o revisa tu documento.
          </div>
        )}
        <input 
          type="email" 
          placeholder="Correo electrónico" 
          value={form.correo} 
          onChange={(e) => setForm({ ...form, correo: e.target.value })} 
          className="p-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base w-full disabled:bg-gray-100" 
          disabled={!documentoValido} 
          required 
        />
        <input 
          type="password" 
          placeholder="Contraseña" 
          value={form.contraseña} 
          onChange={(e) => setForm({ ...form, contraseña: e.target.value })} 
          className="p-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base w-full disabled:bg-gray-100" 
          disabled={!documentoValido}
          required 
        />
        <input 
          type="tel" 
          placeholder="Número de teléfono" 
          value={form.numero} 
          onChange={(e) => setForm({ ...form, numero: e.target.value })} 
          className="p-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base w-full disabled:bg-gray-100" 
          disabled={!documentoValido} 
          required 
        />
        <button 
          type="submit" 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-lg transition-all duration-200 w-full shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!documentoValido || !form.nombre || loading}
        >
          {loading ? "Registrando..." : "REGÍSTRATE"}
        </button>
        <div id="googleSignInDivRegistro" className="flex justify-center mt-6"></div>
      </form>
      {mensaje && !mensaje.includes("documento") && !mensaje.includes("RENIEC") && !mensaje.includes("SUNAT") && (
        <div className={`mt-4 text-center text-sm font-medium ${mensaje.includes("exitoso") ? 'text-green-600' : 'text-red-600'}`}>
          {mensaje}
        </div>
      )}
    </div>
  );
};

export default LoginRegister;

