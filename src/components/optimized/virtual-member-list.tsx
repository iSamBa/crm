'use client';

import { useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Member } from '@/types';
import { MemberListItem } from './member-list-item';

interface VirtualMemberListProps {
  members: Member[];
  selectedMembers: string[];
  onSelectMember: (id: string) => void;
  onEditMember: (member: Member) => void;
  onDeleteMember: (id: string) => void;
  onViewMember: (id: string) => void;
  height?: number;
  itemHeight?: number;
}

interface ListItemProps {
  index: number;
  style: React.CSSProperties;
}

// Virtualized member list for optimal performance with large datasets
export function VirtualMemberList({
  members,
  selectedMembers,
  onSelectMember,
  onEditMember,
  onDeleteMember,
  onViewMember,
  height = 600,
  itemHeight = 80,
}: VirtualMemberListProps) {
  // Memoized callbacks to prevent unnecessary re-renders
  const handleSelectMember = useCallback((id: string) => {
    onSelectMember(id);
  }, [onSelectMember]);

  const handleEditMember = useCallback((member: Member) => {
    onEditMember(member);
  }, [onEditMember]);

  const handleDeleteMember = useCallback((id: string) => {
    onDeleteMember(id);
  }, [onDeleteMember]);

  const handleViewMember = useCallback((id: string) => {
    onViewMember(id);
  }, [onViewMember]);

  // Memoized list item renderer
  const ListItem = useCallback(({ index, style }: ListItemProps) => {
    const member = members[index];
    const isSelected = selectedMembers.includes(member.id);

    return (
      <div style={style}>
        <MemberListItem
          member={member}
          isSelected={isSelected}
          onSelect={handleSelectMember}
          onEdit={handleEditMember}
          onDelete={handleDeleteMember}
          onView={handleViewMember}
        />
      </div>
    );
  }, [members, selectedMembers, handleSelectMember, handleEditMember, handleDeleteMember, handleViewMember]);

  // Memoized list configuration
  const listConfig = useMemo(() => ({
    height,
    width: '100%',
    itemCount: members.length,
    itemSize: itemHeight,
    overscanCount: 5, // Pre-render 5 items outside visible area
  }), [height, members.length, itemHeight]);

  if (members.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500">
        No members found
      </div>
    );
  }

  return (
    <List
      {...listConfig}
      itemData={members}
    >
      {ListItem}
    </List>
  );
}