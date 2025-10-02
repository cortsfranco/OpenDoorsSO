import React from 'react';
import UserRoles from '@/components/UserRoles';

const UserManagementPage: React.FC = () => {
  const handleRoleChange = (userId: number, newRole: string) => {
    console.log(`User ${userId} role changed to ${newRole}`);
    // Aquí se podría implementar lógica adicional cuando cambie un rol
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-2">
            Administra usuarios, roles y permisos del sistema
          </p>
        </div>
      </div>

      <UserRoles onRoleChange={handleRoleChange} />
    </div>
  );
};

export default UserManagementPage;
