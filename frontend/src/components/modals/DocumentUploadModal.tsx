import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import {
  Upload,
  File,
  FileText,
  Image,
  FileSpreadsheet,
  Trash2,
  Download,
  Eye,
  X,
  CheckCircle,
  AlertTriangle,
  Cloud,
  FolderOpen,
  Calendar,
  User,
  Paperclip
} from 'lucide-react';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Document {
  id: string;
  business_id: string;
  filename: string;
  mime_type: string;
  file_size: number;
  file_path: string;
  category: string;
  uploaded_by: string;
  created_at: string;
  metadata?: Record<string, any>;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user, currentBusiness } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'documents'>('upload');

  // Document management state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [category, setCategory] = useState('receipts');
  const [description, setDescription] = useState('');

  // Load existing documents
  useEffect(() => {
    if (isOpen && currentBusiness) {
      loadDocuments();
    }
  }, [isOpen, currentBusiness]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('business_id', currentBusiness?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);

    } catch (err: any) {
      console.error('Error loading documents:', err);
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(files);
      setError(null);
      setSuccess(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      setError('Please select files to upload');
      return;
    }

    if (!currentBusiness) {
      setError('No business selected');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccess(null);
      
      const progressArray: UploadProgress[] = Array.from(selectedFiles).map(file => ({
        fileName: file.name,
        progress: 0,
        status: 'uploading' as const
      }));
      setUploadProgress(progressArray);

      // Simulate file upload process (in real app, you'd upload to Supabase Storage)
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 20) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setUploadProgress(prev => 
            prev.map((item, index) => 
              index === i ? { ...item, progress } : item
            )
          );
        }

        // Create document record in database
        const { error: dbError } = await supabase
          .from('documents')
          .insert({
            business_id: currentBusiness.id,
            filename: file.name,
            mime_type: file.type || 'application/octet-stream',
            file_size: file.size,
            category: category,
            uploaded_by: user?.id,
            // In real app, you'd get the actual URL from Supabase Storage
            file_path: `/uploads/${file.name}`,
            metadata: description ? { description } : {}
          });

        if (dbError) {
          setUploadProgress(prev => 
            prev.map((item, index) => 
              index === i ? { ...item, status: 'error', error: dbError.message } : item
            )
          );
        } else {
          setUploadProgress(prev => 
            prev.map((item, index) => 
              index === i ? { ...item, status: 'success' } : item
            )
          );
        }
      }

      setSuccess(`Successfully uploaded ${selectedFiles.length} file(s)!`);
      await loadDocuments(); // Refresh the documents list
      
      // Reset form
      setSelectedFiles(null);
      setDescription('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (err: any) {
      console.error('Error uploading files:', err);
      setError(err.message || 'Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string, filename: string) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      setSuccess('Document deleted successfully');
      await loadDocuments();

    } catch (err: any) {
      console.error('Error deleting document:', err);
      setError(err.message || 'Failed to delete document');
    }
  };

  const handleViewDocument = (doc: Document) => {
    // For now, since we're using demo file paths, we'll show document info
    // In a real app, this would open the actual file
    alert(`Document: ${doc.filename}\nType: ${doc.mime_type}\nSize: ${formatFileSize(doc.file_size)}\nUploaded: ${formatDate(doc.created_at)}\n\nNote: In production, this would open the actual document file.`);
  };

  const handleDownloadDocument = (doc: Document) => {
    // For now, since we're using demo file paths, we'll simulate download
    // In a real app, this would download the actual file from Supabase Storage
    
    // Create a blob with document info for demo purposes
    const docInfo = `Document: ${doc.filename}\nType: ${doc.mime_type}\nSize: ${formatFileSize(doc.file_size)}\nUploaded: ${formatDate(doc.created_at)}\nCategory: ${doc.category}\n\nNote: This is a demo file. In production, the actual document content would be downloaded.`;
    
    const blob = new Blob([docInfo], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc.filename}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
    setSuccess(`Download started for "${doc.filename}"`);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (mimeType.includes('pdf')) return <FileText className="h-4 w-4" />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileSpreadsheet className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryBadgeColor = (category: string) => {
    const colors = {
      receipts: 'bg-blue-100 text-blue-800',
      invoices: 'bg-green-100 text-green-800',
      contracts: 'bg-purple-100 text-purple-800',
      reports: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Document Management</span>
          </DialogTitle>
          <DialogDescription>
            Upload and manage your business documents and files.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex space-x-4 border-b">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Upload Documents
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'documents'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Document Library ({documents.length})
            </button>
          </div>

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Cloud className="h-4 w-4" />
                    <span>Upload New Documents</span>
                  </CardTitle>
                  <CardDescription>
                    Select files to upload to your business document library.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="category">Document Category</Label>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="receipts">Receipts</option>
                      <option value="invoices">Invoices</option>
                      <option value="contracts">Contracts</option>
                      <option value="reports">Reports</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief description of the document(s)"
                    />
                  </div>

                  <div>
                    <Label htmlFor="files">Select Files</Label>
                    <input
                      ref={fileInputRef}
                      id="files"
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Supported formats: PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG, GIF
                    </p>
                  </div>

                  {selectedFiles && selectedFiles.length > 0 && (
                    <div className="space-y-2">
                      <Label>Selected Files:</Label>
                      {Array.from(selectedFiles).map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                          <div className="flex items-center space-x-2">
                            {getFileIcon(file.type)}
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {uploadProgress.length > 0 && (
                    <div className="space-y-2">
                      <Label>Upload Progress:</Label>
                      {uploadProgress.map((progress, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{progress.fileName}</span>
                            <span className={`font-medium ${
                              progress.status === 'success' ? 'text-green-600' :
                              progress.status === 'error' ? 'text-red-600' :
                              'text-blue-600'
                            }`}>
                              {progress.status === 'success' ? '✓ Complete' :
                               progress.status === 'error' ? '✗ Failed' :
                               `${progress.progress}%`}
                            </span>
                          </div>
                          {progress.status === 'uploading' && (
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${progress.progress}%` }}
                              ></div>
                            </div>
                          )}
                          {progress.error && (
                            <p className="text-xs text-red-600">{progress.error}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button
                      onClick={handleUpload}
                      disabled={uploading || !selectedFiles || selectedFiles.length === 0}
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Files
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FolderOpen className="h-4 w-4" />
                    <span>Document Library</span>
                  </CardTitle>
                  <CardDescription>
                    View and manage your uploaded documents.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2">Loading documents...</span>
                    </div>
                  ) : documents.length === 0 ? (
                    <div className="text-center py-8">
                      <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No documents uploaded yet.</p>
                      <p className="text-sm text-gray-400">Upload your first document to get started.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                                             {documents.map((doc) => (
                         <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                           <div className="flex items-center space-x-3">
                             {getFileIcon(doc.mime_type)}
                             <div>
                               <p className="font-medium">{doc.filename}</p>
                               <div className="flex items-center space-x-2 text-sm text-gray-500">
                                 <Badge className={getCategoryBadgeColor(doc.category || 'other')}>
                                   {doc.category || 'other'}
                                 </Badge>
                                 <span>•</span>
                                 <span>{formatFileSize(doc.file_size)}</span>
                                 <span>•</span>
                                 <span>{formatDate(doc.created_at)}</span>
                               </div>
                               {doc.metadata?.description && (
                                 <p className="text-sm text-gray-600 mt-1">{doc.metadata.description}</p>
                               )}
                             </div>
                           </div>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewDocument(doc)}
                              title="View document"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDownloadDocument(doc)}
                              title="Download document"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteDocument(doc.id, doc.filename)}
                              title="Delete document"
                              className="hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 