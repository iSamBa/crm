'use client';

import { useState, useEffect } from 'react';
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
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { Trainer } from '@/types';
import { TrainerForm } from '@/components/trainers/trainer-form';
import { AdminLayout } from '@/components/layout/admin-layout';
import { useTrainerActions } from '@/lib/hooks/use-trainers-modern';
import { getTrainersServer, getTrainerStatsServer, ServerTrainer } from './actions';
import { TrainerDetailView } from '@/components/trainers/trainer-detail-view';
import { TrainerStatsCards } from '@/components/trainers/trainer-stats-cards';

export default function TrainersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTrainers, setSelectedTrainers] = useState<string[]>([]);
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const itemsPerPage = 10;

  // Server-side data fetching
  const [trainers, setTrainers] = useState<ServerTrainer[]>([]);
  const [statsData, setStatsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const { deleteTrainer } = useTrainerActions();

  // Fetch trainers data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [trainersResult, statsResult] = await Promise.all([
        getTrainersServer({
          searchTerm: searchTerm || undefined,
          specialization: specializationFilter === 'all' ? undefined : specializationFilter,
          sortBy: 'name',
          sortOrder: 'asc'
        }),
        getTrainerStatsServer()
      ]);

      if (trainersResult.error) {
        console.error('Failed to fetch trainers:', trainersResult.error);
      } else {
        setTrainers(trainersResult.data);
        // Extract unique specializations
        const allSpecs = trainersResult.data.flatMap(t => t.specializations || []);
        setSpecializations([...new Set(allSpecs)]);
      }

      if (statsResult.error) {
        console.error('Failed to fetch stats:', statsResult.error);
      } else {
        setStatsData(statsResult.data);
      }
    } catch (error) {
      console.error('Error fetching trainer data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchTerm, specializationFilter]);

  const refetch = fetchData;

  // Filter and paginate trainers
  const filteredTrainers = trainers;
  const totalPages = Math.ceil(filteredTrainers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTrainers = filteredTrainers.slice(startIndex, startIndex + itemsPerPage);

  const handleTrainerCreated = () => {
    setIsCreateDialogOpen(false);
    refetch();
  };

  const handleTrainerUpdated = () => {
    setEditingTrainer(null);
    refetch();
  };

  const handleDeleteTrainer = async (trainerId: string) => {
    if (!confirm('Are you sure you want to delete this trainer? This will also remove their account access.')) return;

    const result = await deleteTrainer.mutateAsync(trainerId);
    
    if (result.data?.success) {
      refetch();
    } else {
      console.error('Error deleting trainer:', result.error);
      alert('Failed to delete trainer: ' + (result.error || 'Unknown error'));
    }
  };

  const getSpecializationColors = (specializations: string[]) => {
    const colors = ['bg-blue-100 text-blue-800', 'bg-green-100 text-green-800', 'bg-purple-100 text-purple-800', 'bg-orange-100 text-orange-800'];
    return specializations.map((spec, index) => (
      <Badge key={spec} className={colors[index % colors.length]} variant="secondary">
        {spec}
      </Badge>
    ));
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  const handleSelectTrainer = (trainerId: string) => {
    setSelectedTrainers(prev => 
      prev.includes(trainerId) 
        ? prev.filter(id => id !== trainerId)
        : [...prev, trainerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTrainers.length === paginatedTrainers.length) {
      setSelectedTrainers([]);
    } else {
      setSelectedTrainers(paginatedTrainers.map(trainer => trainer.id));
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedTrainers.length} trainers?`)) return;
    
    try {
      await Promise.all(selectedTrainers.map(id => deleteTrainer.mutateAsync(id)));
      setSelectedTrainers([]);
      refetch();
    } catch (error) {
      console.error('Error deleting trainers:', error);
      alert('Failed to delete some trainers');
    }
  };

  const handleViewTrainer = (trainerId: string) => {
    setSelectedTrainerId(trainerId);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setSelectedTrainerId(null);
    setViewMode('list');
  };

  // If viewing trainer detail, show the detail view
  if (viewMode === 'detail' && selectedTrainerId) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          {/* Back button */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBackToList}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Trainers
            </Button>
          </div>
          
          {/* Trainer detail view */}
          <TrainerDetailView 
            trainerId={selectedTrainerId} 
            onBack={handleBackToList}
          />
        </div>
      </AdminLayout>
    );
  }

  // Otherwise show the list view
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Trainers</h1>
            <p className="text-muted-foreground">
              Manage your gym trainers and their information
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Trainer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Add New Trainer</DialogTitle>
                </DialogHeader>
                <TrainerForm onSuccess={handleTrainerCreated} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <TrainerStatsCards stats={statsData || undefined} />

        {/* Filters and Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search trainers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by specialization" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Specializations</SelectItem>
              {specializations.map(spec => (
                <SelectItem key={spec} value={spec}>{spec}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedTrainers.length > 0 && (
            <Button variant="destructive" onClick={handleBulkDelete}>
              Delete Selected ({selectedTrainers.length})
            </Button>
          )}
        </div>

        {/* Trainers Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedTrainers.length === paginatedTrainers.length && paginatedTrainers.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border border-gray-300"
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Specializations</TableHead>
                  <TableHead>Hourly Rate</TableHead>
                  <TableHead>Certifications</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTrainers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      {searchTerm || specializationFilter !== 'all' ? 'No trainers found matching your criteria.' : 'No trainers found.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTrainers.map((trainer) => (
                    <TableRow key={trainer.id} className="hover:bg-gray-50">
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedTrainers.includes(trainer.id)}
                          onChange={() => handleSelectTrainer(trainer.id)}
                          className="rounded border border-gray-300"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                            {trainer.firstName?.[0] || ''}{trainer.lastName?.[0] || ''}
                          </div>
                          {trainer.firstName} {trainer.lastName}
                        </div>
                      </TableCell>
                      <TableCell>{trainer.email}</TableCell>
                      <TableCell>{trainer.phone || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {getSpecializationColors(trainer.specializations.slice(0, 2))}
                          {trainer.specializations.length > 2 && (
                            <Badge variant="outline">+{trainer.specializations.length - 2}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">${trainer.hourlyRate}/hr</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {trainer.certifications.length} cert{trainer.certifications.length !== 1 ? 's' : ''}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewTrainer(trainer.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingTrainer(trainer)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTrainer(trainer.id)}
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
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredTrainers.length)} of {filteredTrainers.length} trainers
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

        {editingTrainer && (
          <Dialog open={!!editingTrainer} onOpenChange={() => setEditingTrainer(null)}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Edit Trainer</DialogTitle>
              </DialogHeader>
              <TrainerForm
                trainer={editingTrainer}
                onSuccess={handleTrainerUpdated}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AdminLayout>
  );
}