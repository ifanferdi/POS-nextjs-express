import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { User } from '@/domain';
import _ from 'lodash';
import moment from 'moment';

interface UserTableProps {
  users: Omit<User, 'permissions'>[];
}
export function UserTable({ users }: UserTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Username</TableHead>
          <TableHead>Gender</TableHead>
          <TableHead>Birth</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Is Active?</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.profile.fullName}</TableCell>
            <TableCell>{user.username}</TableCell>
            <TableCell>{_.capitalize(user.profile.gender)}</TableCell>
            <TableCell>{`${user.profile.placeOfBirth}, ${moment(user.profile.dateOfBirth).format('MMMM Do YYYY')}`}</TableCell>
            <TableCell>{user.role.name}</TableCell>
            <TableCell>{user.isActive ? 'Active' : 'Inactive'}</TableCell>
            <TableCell className="flex gap-2"></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
