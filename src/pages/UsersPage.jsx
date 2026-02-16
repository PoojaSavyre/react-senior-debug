/**
 * UsersPage - Lazy loaded route page for users.
 *
 * Competency: Bundle Optimization, React Suspense for Data Fetching
 */

import React from 'react';
import { UserList } from '../components/users/UserList';

function UsersPage() {
  return <UserList />;
}

export default UsersPage;
