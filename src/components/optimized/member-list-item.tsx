'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Eye } from 'lucide-react';
import { Member } from '@/types';
import { dateFormatters } from '@/lib/utils/date-formatting';

interface MemberListItemProps {
  member: Member;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (member: Member) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

// Memoized member list item for performance optimization in large lists
export const MemberListItem = memo(function MemberListItem({
  member,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onView,
}: MemberListItemProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'frozen':
        return 'bg-blue-100 text-blue-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <TableRow className="hover:bg-gray-50">
      <TableCell>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(member.id)}
          className="rounded border border-gray-300"
        />
      </TableCell>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
            {member.firstName?.[0] || ''}{member.lastName?.[0] || ''}
          </div>
          {member.firstName} {member.lastName}
        </div>
      </TableCell>
      <TableCell>{member.email || 'N/A'}</TableCell>
      <TableCell>{member.phone || 'N/A'}</TableCell>
      <TableCell>
        <Badge className={getStatusColor(member.membershipStatus)}>
          {member.membershipStatus}
        </Badge>
      </TableCell>
      <TableCell>
        {dateFormatters.shortDate(member.joinDate)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(member.id)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(member)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(member.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});