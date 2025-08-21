'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Filter, 
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { shortDate } from '@/lib/utils/date-formatting';
import { Member } from '@/types';
import { MemberForm } from '@/components/members/member-form';
import { useMembers, useDeleteMembers } from '@/lib/hooks/use-members-modern';
import { MemberDetailView } from '@/components/members/member-detail-view';
import { MemberDistributionChart } from '@/components/charts/member-distribution-chart';
import { memberService } from '@/lib/services/member-service';

export default function MembersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [isExporting, setIsExporting] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [errorDialog, setErrorDialog] = useState<{isOpen: boolean, title: string, message: string}>({isOpen: false, title: '', message: ''});
  const itemsPerPage = 10;

  // Use the modern TanStack Query hooks
  const { data: members = [], isLoading } = useMembers({
    status: statusFilter === 'all' ? undefined : statusFilter,
    searchTerm: searchTerm || undefined
  });
  const deleteMembers = useDeleteMembers();

  // Since filtering is now handled by the hook, we can use members directly
  const filteredMembers = members;
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMembers = filteredMembers.slice(startIndex, startIndex + itemsPerPage);

  const handleMemberCreated = () => {
    setIsCreateDialogOpen(false);
    // TanStack Query will automatically refetch and update cache
  };

  const handleMemberUpdated = () => {
    setEditingMember(null);
    // TanStack Query will automatically refetch and update cache
  };

  const handleDeleteMember = (memberId: string) => {
    setMemberToDelete(memberId);
  };

  const confirmDeleteMember = async () => {
    if (!memberToDelete) return;

    try {
      await deleteMembers.mutateAsync([memberToDelete]);
      setMemberToDelete(null);
      // TanStack Query will automatically update cache
    } catch (error) {
      console.error('Error deleting member:', error);
      // Keep dialog open on error so user can retry
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900';
      case 'frozen':
        return 'bg-gray-600 text-white dark:bg-gray-400 dark:text-gray-900';
      case 'inactive':
        return 'bg-gray-400 text-white dark:bg-gray-600 dark:text-white';
      case 'cancelled':
        return 'bg-gray-300 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-300 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }


  const handleSelectMember = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSelectAll = () => {
    if (selectedMembers.length === paginatedMembers.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(paginatedMembers.map(member => member.id));
    }
  };

  const handleBulkDelete = () => {
    setShowBulkDeleteDialog(true);
  };

  const confirmBulkDelete = async () => {
    try {
      await deleteMembers.mutateAsync(selectedMembers);
      setSelectedMembers([]);
      setShowBulkDeleteDialog(false);
      // TanStack Query will automatically update cache
    } catch (error) {
      console.error('Error deleting members:', error);
    }
  };

  const handleViewMember = (memberId: string) => {
    setSelectedMemberId(memberId);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setSelectedMemberId(null);
    setViewMode('list');
  };

  const handleExportMembers = async () => {
    setIsExporting(true);
    
    try {
      // Export with current filters applied
      const result = await memberService.exportMembersToCSV({
        status: statusFilter === 'all' ? undefined : statusFilter,
        searchTerm: searchTerm || undefined,
      });

      if (!result.success) {
        console.error('Export failed:', result.error);
        setErrorDialog({
          isOpen: true,
          title: 'Export Failed',
          message: 'Failed to export members: ' + (result.error || 'Unknown error')
        });
      }
      // Success is handled by the download trigger
    } catch (error) {
      console.error('Export error:', error);
      setErrorDialog({
        isOpen: true,
        title: 'Export Failed',
        message: 'Failed to export members. Please try again.'
      });
    } finally {
      setIsExporting(false);
    }
  };

  // If viewing member detail, show the detail view
  if (viewMode === 'detail' && selectedMemberId) {
    return (
      <div className="space-y-6">
        {/* Back button */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBackToList}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Members
          </Button>
        </div>
          
          {/* Member detail view */}
          <MemberDetailView 
            memberId={selectedMemberId} 
            onBack={handleBackToList}
          />
      </div>
    );
  }

  // Otherwise show the list view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Members</h1>
          <p className="text-muted-foreground">
            Manage your gym members and their information
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleExportMembers}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-7xl max-w-[95vw] w-[95vw] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Member</DialogTitle>
              </DialogHeader>
              <MemberForm onSuccess={handleMemberCreated} />
            </DialogContent>
          </Dialog>
        </div>
      </div>


      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Member Distribution Chart */}
        <div className="lg:col-span-2">
          <MemberDistributionChart />
        </div>
        
        {/* Quick Stats */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Members</span>
                  <span className="font-medium">{members.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Rate</span>
                  <span className="font-medium">
                    {members.length > 0 
                      ? Math.round((members.filter(m => m.membershipStatus === 'active').length / members.length) * 100)
                      : 0
                    }%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">This Month</span>
                  <span className="font-medium text-green-600">+12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Retention</span>
                  <span className="font-medium">94%</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Status Breakdown</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#cb8589' }}></div>
                    <span className="text-sm">Active</span>
                  </div>
                  <span className="font-medium">{members.filter(m => m.membershipStatus === 'active').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#d7b29d' }}></div>
                    <span className="text-sm">Frozen</span>
                  </div>
                  <span className="font-medium">{members.filter(m => m.membershipStatus === 'frozen').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#e8d2ae' }}></div>
                    <span className="text-sm">Inactive</span>
                  </div>
                  <span className="font-medium">{members.filter(m => m.membershipStatus === 'inactive').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#DDE8B9' }}></div>
                    <span className="text-sm">Cancelled</span>
                  </div>
                  <span className="font-medium">{members.filter(m => m.membershipStatus === 'cancelled').length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="frozen">Frozen</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        {selectedMembers.length > 0 && (
          <Button variant="destructive" onClick={handleBulkDelete}>
            Delete Selected ({selectedMembers.length})
          </Button>
        )}
      </div>

      {/* Members Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedMembers.length === paginatedMembers.length && paginatedMembers.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border border-gray-300"
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    {searchTerm || statusFilter !== 'all' ? 'No members found matching your criteria.' : 'No members found.'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMembers.map((member) => (
                  <TableRow key={member.id} className="hover:bg-gray-50">
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(member.id)}
                        onChange={() => handleSelectMember(member.id)}
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
                      {shortDate(member.joinDate)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewMember(member.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingMember(member)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMember(member.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredMembers.length)} of {filteredMembers.length} members
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {editingMember && (
        <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
          <DialogContent className="sm:max-w-7xl max-w-[95vw] w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Member</DialogTitle>
            </DialogHeader>
            <MemberForm
              member={editingMember}
              onSuccess={handleMemberUpdated}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Member Confirmation Dialog */}
      <AlertDialog open={!!memberToDelete} onOpenChange={() => setMemberToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this member? This action cannot be undone and will permanently remove all member data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteMember}
              disabled={deleteMembers.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMembers.isPending ? 'Deleting...' : 'Delete Member'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Members</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedMembers.length} members? This action cannot be undone and will permanently remove all selected member data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmBulkDelete}
              disabled={deleteMembers.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMembers.isPending ? 'Deleting...' : `Delete ${selectedMembers.length} Members`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error Dialog */}
      <AlertDialog open={errorDialog.isOpen} onOpenChange={() => setErrorDialog({isOpen: false, title: '', message: ''})}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{errorDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {errorDialog.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}