const roles = Object.freeze({
  ADMIN: 'admin',
  MODERATOR: 'moderator',
});

const rolePriority = Object.freeze([roles.ADMIN, roles.MODERATOR]);

const accessPolicy = Object.freeze({
  shipments: Object.freeze([roles.ADMIN, roles.MODERATOR]),
  warehouses: Object.freeze([roles.ADMIN, roles.MODERATOR]),
  vehicles: Object.freeze([roles.ADMIN, roles.MODERATOR]),
  users: Object.freeze([roles.ADMIN]),
});

const shipmentStatuses = Object.freeze(['CREATED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']);
const vehicleStatuses = Object.freeze(['AVAILABLE', 'IN_USE', 'SERVICE']);

module.exports = {
  roles,
  rolePriority,
  accessPolicy,
  shipmentStatuses,
  vehicleStatuses,
};
