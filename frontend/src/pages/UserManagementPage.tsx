import React from 'react';
import UserManagementTable from '@/components/UserManagementTable';

const UserManagementPage: React.FC = () => {
  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-2">
            Administra usuarios, roles y permisos del sistema. Solo los administradores pueden crear, editar o eliminar usuarios.
          </p>
        </div>
      </div>

      <UserManagementTable />
    </div>
  );
};

export default UserManagementPage;
