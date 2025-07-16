import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Tag,
  Search
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Transaction {
  id: string;
  business_id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
  created_at: string;
  updated_at: string;
}

interface Business {
  id: string;
  name: string;
  owner_id: string;
  status: string;
}

interface TransactionFormData {
  type: 'income' | 'expense';
  amount: string;
  description: string;
  category: string;
  date: string;
}

const EXPENSE_CATEGORIES = [
  'Office Rent',
  'Utilities',
  'Software Subscriptions',
  'Office Supplies',
  'Marketing',
  'Travel',
  'Professional Services',
  'Insurance',
  'Equipment',
  'Meals & Entertainment',
  'Other Expenses'
];

const INCOME_CATEGORIES = [
  'Client Payments',
  'Consulting Services',
  'Product Sales',
  'Subscription Revenue',
  'Investment Income',
  'Refunds',
  'Other Income'
];

export const ClientTransactions: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Filter states
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({
    start: '',
    end: ''
  });

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<TransactionFormData>({
    type: 'income',
    amount: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Load user businesses on mount
  useEffect(() => {
    let mounted = true;
    
    const initializeData = async () => {
      if (user?.id && mounted) {
        await loadBusinesses();
      } else if (user === null && mounted) {
        // User is not authenticated
        setLoading(false);
        setError('User not authenticated');
      }
      // If user is undefined, we're still loading auth, so keep loading state
    };

    initializeData();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  // Load transactions when business changes
  useEffect(() => {
    if (selectedBusiness?.id) {
      loadTransactions();
    }
    // Remove the problematic loading dependency that was causing loops
  }, [selectedBusiness?.id]);

  const createDemoBusinessForUser = async () => {
    if (!user?.id) return;

    try {
      console.log('Creating demo business for user:', user.email);
      // Create demo business
      const { data: newBusiness, error: businessError } = await supabase
        .from('businesses')
        .insert({
          name: 'Demo Business',
          owner_id: user.id,
          status: 'active'
        })
        .select()
        .single();

      if (businessError) throw businessError;

      console.log('Demo business created:', newBusiness);

      // Create demo transactions
      const demoTransactions = [
        { business_id: newBusiness.id, amount: 5000, description: 'Client Payment', category: 'Client Payments', type: 'income', date: new Date().toISOString().split('T')[0] },
        { business_id: newBusiness.id, amount: -1200, description: 'Office Rent', category: 'Office Rent', type: 'expense', date: new Date(Date.now() - 86400000).toISOString().split('T')[0] },
        { business_id: newBusiness.id, amount: 3500, description: 'Consulting Services', category: 'Consulting Services', type: 'income', date: new Date(Date.now() - 172800000).toISOString().split('T')[0] },
        { business_id: newBusiness.id, amount: -800, description: 'Software Subscriptions', category: 'Software Subscriptions', type: 'expense', date: new Date(Date.now() - 259200000).toISOString().split('T')[0] }
      ];

      const { error: transactionError } = await supabase
        .from('transactions')
        .insert(demoTransactions);

      if (transactionError) {
        console.warn('Failed to create demo transactions:', transactionError);
      }
      
             // Set businesses and selected business without triggering reload
       setBusinesses([newBusiness]);
       setSelectedBusiness(newBusiness);
       
       // Immediately load transactions for the new business
       setTimeout(() => {
         loadTransactions();
       }, 100); // Small delay to ensure state is updated
      
    } catch (err: any) {
      console.error('Error creating demo business:', err);
      setError('Failed to create demo business: ' + err.message);
    }
  };

  const loadBusinesses = async () => {
    if (isInitialized) return; // Prevent multiple initializations
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user?.id)
        .eq('status', 'active');

      if (error) throw error;

      setBusinesses(data || []);
      if (data && data.length > 0) {
        setSelectedBusiness(data[0]);
      } else {
        // No businesses found, create a demo business
        console.log('No businesses found, creating demo business...');
        await createDemoBusinessForUser();
      }
    } catch (err: any) {
      console.error('Error loading businesses:', err);
      setError('Failed to load businesses');
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  };

  const loadTransactions = async () => {
    if (!selectedBusiness?.id) {
      setTransactions([]);
      return;
    }

    // Only show loading if we don't have any transactions yet
    if (transactions.length === 0) {
      setLoading(true);
    }
    
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('business_id', selectedBusiness.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (err: any) {
      console.error('Error loading transactions:', err);
      setError('Failed to load transactions');
    } finally {
      // Only set loading to false if we were actually showing loading state
      if (transactions.length === 0) {
        setLoading(false);
      }
    }
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusiness?.id) return;

    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      const transactionData = {
        business_id: selectedBusiness.id,
        type: formData.type,
        amount: formData.type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
        description: formData.description.trim(),
        category: formData.category,
        date: formData.date
      };

      if (editingTransaction) {
        // Update existing transaction
        const { error } = await supabase
          .from('transactions')
          .update({
            ...transactionData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTransaction.id);

        if (error) throw error;
        setIsEditModalOpen(false);
        setEditingTransaction(null);
      } else {
        // Create new transaction
        const { error } = await supabase
          .from('transactions')
          .insert(transactionData);

        if (error) throw error;
        setIsAddModalOpen(false);
      }

      // Reset form
      setFormData({
        type: 'income',
        amount: '',
        description: '',
        category: '',
        date: new Date().toISOString().split('T')[0]
      });

      // Reload transactions
      await loadTransactions();
    } catch (err: any) {
      console.error('Error saving transaction:', err);
      setError(err.message || 'Failed to save transaction');
    }
  }, [selectedBusiness, formData, editingTransaction, loadTransactions]);

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      amount: Math.abs(transaction.amount).toString(),
      description: transaction.description,
      category: transaction.category,
      date: transaction.date
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (transactionId: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId);

      if (error) throw error;
      await loadTransactions();
    } catch (err: any) {
      console.error('Error deleting transaction:', err);
      setError('Failed to delete transaction');
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesType = filterType === 'all' || transaction.type === filterType;
    const matchesCategory = filterCategory === 'all' || transaction.category === filterCategory;
    const matchesSearch = transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesDateRange = true;
    if (dateRange.start && dateRange.end) {
      const transactionDate = new Date(transaction.date);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      matchesDateRange = transactionDate >= startDate && transactionDate <= endDate;
    }

    return matchesType && matchesCategory && matchesSearch && matchesDateRange;
  });

  const summary = filteredTransactions.reduce(
    (acc, transaction) => {
      if (transaction.type === 'income') {
        acc.totalIncome += Math.abs(transaction.amount);
      } else {
        acc.totalExpenses += Math.abs(transaction.amount);
      }
      return acc;
    },
    { totalIncome: 0, totalExpenses: 0 }
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Memoized form to prevent focus loss
  const TransactionForm = React.useMemo(() => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Type</Label>
          <Select value={formData.type} onValueChange={(value: 'income' | 'expense') => setFormData(prev => ({ ...prev, type: value, category: '' }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            required
            autoFocus={false}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          placeholder="Enter transaction description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {(formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            required
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" className="w-full">
          {editingTransaction ? 'Update Transaction' : 'Add Transaction'}
        </Button>
      </DialogFooter>
    </form>
  ), [formData, handleSubmit, editingTransaction]);

  if (loading && !isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-lg text-gray-600 mb-2">
            {!user ? 'Authenticating...' : 
             businesses.length === 0 ? 'Setting up your business...' : 
             'Loading transactions...'}
          </div>
          <div className="text-sm text-gray-500">
            {!user ? 'Verifying your account' :
             businesses.length === 0 ? 'Creating demo business and sample data' :
             'Fetching your financial data'}
          </div>
        </div>
      </div>
    );
  }

  if (!selectedBusiness) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">No business found</p>
          <p className="text-gray-500">You need to have a business to manage transactions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600">Manage your income and expenses for {selectedBusiness.name}</p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Transaction</DialogTitle>
              <DialogDescription>
                Add a new income or expense transaction to your business.
              </DialogDescription>
            </DialogHeader>
            {TransactionForm}
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary.totalIncome)}
            </div>
            <p className="text-xs text-gray-600">
              From {filteredTransactions.filter(t => t.type === 'income').length} income transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summary.totalExpenses)}
            </div>
            <p className="text-xs text-gray-600">
              From {filteredTransactions.filter(t => t.type === 'expense').length} expense transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.totalIncome - summary.totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summary.totalIncome - summary.totalExpenses)}
            </div>
            <p className="text-xs text-gray-600">
              From {filteredTransactions.length} total transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search transactions..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Type</Label>
              <Select value={filterType} onValueChange={(value: 'all' | 'income' | 'expense') => setFilterType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {[...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES].map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date Range</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
          <CardDescription>
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No transactions found</p>
              <p className="text-sm text-gray-400 mt-1">
                {transactions.length === 0 ? 'Add your first transaction to get started' : 'Try adjusting your filters'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {transaction.type === 'income' ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{transaction.description}</div>
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <Tag className="h-3 w-3" />
                        {transaction.category}
                        <Calendar className="h-3 w-3 ml-2" />
                        {formatDate(transaction.date)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className={`text-lg font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(transaction)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(transaction.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogDescription>
              Update the transaction details below.
            </DialogDescription>
          </DialogHeader>
          {TransactionForm}
        </DialogContent>
      </Dialog>
    </div>
  );
}; 