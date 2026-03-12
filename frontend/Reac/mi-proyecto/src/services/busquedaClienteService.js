/**
 * Helper para búsqueda de cliente combinada:
 * 1. Busca en tabla cliente (por documento)
 * 2. Si no encuentra, busca en APIs Peru (si es DNI)
 * 
 * Retorna info para mostrar en el UI
 */
import { buscarClientePorDocumento } from './presupuestoGuardarService';

export async function buscarClienteCombinado({ tipo, numero, nombresDNI_RUC_callback }) {
  try {
    // Primero: buscar en tabla cliente
    const resultadoCliente = await buscarClientePorDocumento(numero);
    
    if (resultadoCliente.encontrado) {
      const cliente = resultadoCliente.cliente;
      return {
        encontrado: true,
        enBD: true,
        nombre: cliente.nombre || '',
        mensaje: '✓ Cliente logueado en sistema',
        clienteData: cliente
      };
    }
    
    // Si no está en BD, continuar con búsqueda en APIs
    // (mantener el comportamiento original de APIs)
    return {
      encontrado: false,
      enBD: false,
      nombre: '',
      mensaje: 'Cliente no está en sistema; se buscará en APIs',
      clienteData: null
    };
    
  } catch (error) {
    console.error('Error en buscarClienteCombinado:', error);
    return {
      encontrado: false,
      enBD: false,
      nombre: '',
      mensaje: 'Error al buscar cliente',
      clienteData: null
    };
  }
}
