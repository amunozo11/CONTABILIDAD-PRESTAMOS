// Script de inicialización MongoDB
// Se ejecuta automáticamente la primera vez que levanta el contenedor

db = db.getSiblingDB('gotagota');

// Crear usuario de la aplicación con permisos restringidos
db.createUser({
  user: 'gotagota_user',
  pwd: process.env.MONGO_APP_PASSWORD || 'CHANGE_ME_APP_PASSWORD',
  roles: [
    {
      role: 'readWrite',
      db: 'gotagota'
    }
  ]
});

// Crear colecciones con validación de esquema básica
db.createCollection('usuarios');
db.createCollection('clientes');
db.createCollection('prestamos');
db.createCollection('cobros');
db.createCollection('gastos');
db.createCollection('auditlogs');
db.createCollection('pushsubscriptions');
db.createCollection('offlinequeues');

// ─── Índices ──────────────────────────────────────────────

// Usuarios
db.usuarios.createIndex({ email: 1 }, { unique: true });
db.usuarios.createIndex({ deletedAt: 1 });

// Clientes
db.clientes.createIndex({ cedula: 1 }, { unique: true, sparse: true });
db.clientes.createIndex({ celular: 1 });
db.clientes.createIndex({ estado: 1 });
db.clientes.createIndex({ nombre: 'text' });
db.clientes.createIndex({ deletedAt: 1 });

// Préstamos
db.prestamos.createIndex({ cliente: 1 });
db.prestamos.createIndex({ cobrador: 1 });
db.prestamos.createIndex({ estado: 1 });
db.prestamos.createIndex({ fechaInicio: 1 });
db.prestamos.createIndex({ fechaFin: 1 });
db.prestamos.createIndex({ cliente: 1, estado: 1 });
db.prestamos.createIndex({ deletedAt: 1 });

// Cobros
db.cobros.createIndex({ prestamo: 1 });
db.cobros.createIndex({ cliente: 1 });
db.cobros.createIndex({ cobrador: 1 });
db.cobros.createIndex({ fecha: -1 });
db.cobros.createIndex({ cobrador: 1, fecha: -1 });
db.cobros.createIndex({ deletedAt: 1 });

// Gastos
db.gastos.createIndex({ fecha: -1 });
db.gastos.createIndex({ usuario: 1 });
db.gastos.createIndex({ categoria: 1 });
db.gastos.createIndex({ deletedAt: 1 });

// AuditLogs
db.auditlogs.createIndex({ timestamp: -1 });
db.auditlogs.createIndex({ usuario: 1 });
db.auditlogs.createIndex({ recurso: 1, recursoId: 1 });

// Push Subscriptions
db.pushsubscriptions.createIndex({ usuario: 1 }, { unique: true });

print('✅ GotaGota DB inicializada correctamente');
