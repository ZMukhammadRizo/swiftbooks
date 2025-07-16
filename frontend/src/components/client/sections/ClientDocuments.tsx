import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, File, Download, Eye, Trash2, Plus, X, Edit } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadDate: string;
  category: string;
}

export const ClientDocuments: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const categories = ['All Documents', 'Receipts', 'Bank Statements', 'Invoices', 'Tax Documents', 'Templates'];
  const uploadCategories = categories.filter(cat => cat !== 'All Documents'); // Exclude 'All Documents' for upload
  const [selectedCategory, setSelectedCategory] = useState('All Documents');
  const [uploadCategory, setUploadCategory] = useState('Receipts');
  const [editingDocument, setEditingDocument] = useState<string | null>(null);

  // Load documents when user is available
  useEffect(() => {
    if (user?.id) {
      loadDocuments();
    } else if (user === null) {
      setLoading(false);
      setError('User not authenticated');
    }
  }, [user]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user?.id) {
        setDocuments([]);
        return;
      }

      // Fetch documents from Supabase
      const { data: documentsData, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .eq('business_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching documents:', fetchError);
        // If documents table doesn't exist or there's an error, use demo data
        const demoDocuments: Document[] = [
          { id: '1', name: 'Q1_2024_Receipts.pdf', type: 'PDF', size: '2.4 MB', uploadDate: '2024-01-15', category: 'Receipts' },
          { id: '2', name: 'Bank_Statement_Jan.pdf', type: 'PDF', size: '1.2 MB', uploadDate: '2024-01-20', category: 'Bank Statements' },
          { id: '3', name: 'Invoice_Template.docx', type: 'DOCX', size: '0.8 MB', uploadDate: '2024-01-10', category: 'Templates' },
          { id: '4', name: 'Tax_Return_2023.pdf', type: 'PDF', size: '3.1 MB', uploadDate: '2024-01-05', category: 'Tax Documents' },
          { id: '5', name: 'Contract_Template.docx', type: 'DOCX', size: '1.5 MB', uploadDate: '2024-01-12', category: 'Templates' },
        ];
        setDocuments(demoDocuments);
        return;
      }

      // Transform database data to match our Document interface
      const transformedDocuments: Document[] = (documentsData || []).map(doc => ({
        id: doc.id,
        name: doc.filename,
        type: doc.file_type || 'PDF',
        size: formatFileSize(doc.file_size || 0),
        uploadDate: doc.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        category: doc.category || 'Other'
      }));

      setDocuments(transformedDocuments);
    } catch (err: any) {
      console.error('Error loading documents:', err);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileType = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'PDF';
      case 'doc':
      case 'docx': return 'DOCX';
      case 'xls':
      case 'xlsx': return 'XLS';
      case 'jpg':
      case 'jpeg':
      case 'png': return 'IMAGE';
      default: return 'OTHER';
    }
  };

  const handleFileUpload = async (files: FileList | File[]) => {
    try {
      if (!user?.id) {
        setError('User not authenticated');
        return;
      }

      if (uploading) {
        console.warn('Upload already in progress, ignoring new upload request');
        return;
      }

      const fileArray = Array.from(files);
      
      if (fileArray.length === 0) {
        return;
      }
      
      // Validate files
      for (const file of fileArray) {
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          setError(`File ${file.name} is too large. Maximum size is 10MB.`);
          return;
        }
        
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
                             'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                             'image/jpeg', 'image/png', 'image/jpg'];
        
        if (!allowedTypes.includes(file.type)) {
          setError(`File ${file.name} has an unsupported format. Please use PDF, DOC, XLS, JPG, or PNG.`);
          return;
        }
      }

      setUploading(true);
      setUploadProgress(0);
      setError(null);

    try {
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        
        // Create unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        
        // Try to upload to Supabase Storage
        let uploadSuccessful = false;
        try {
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('documents')
            .upload(fileName, file);

          if (uploadError) {
            console.warn('Supabase Storage upload failed:', uploadError.message);
            throw new Error(uploadError.message);
          }
          
          uploadSuccessful = true;
          console.log('File uploaded successfully to Supabase Storage:', fileName);
        } catch (storageError) {
          console.warn('Storage upload failed, using demo mode:', storageError);
          // Fallback: Add to local documents state for demo purposes
          const newDocument: Document = {
            id: `demo_${Date.now()}_${i}`,
            name: file.name,
            type: getFileType(file.name),
            size: formatFileSize(file.size),
            uploadDate: new Date().toISOString().split('T')[0],
            category: uploadCategory
          };
          
          setDocuments(prev => [newDocument, ...prev]);
          setUploadProgress(Math.round(((i + 1) / fileArray.length) * 100));
          continue; // Skip database operations for this file
        }

        // Save document metadata to database (only if storage upload was successful)
        if (uploadSuccessful) {
          try {
            const documentData = {
              business_id: user.id, // User ID is already UUID from Supabase auth
              filename: file.name,
              file_path: fileName,
              file_size: file.size,
              file_type: getFileType(file.name),
              category: uploadCategory, // User selected category
              uploaded_by: user.id
            };

            const { error: dbError } = await supabase
              .from('documents')
              .insert(documentData);

            if (dbError) {
              console.warn('Database save failed, but file was uploaded to storage:', dbError);
              // Add to local state for immediate feedback
              const newDocument: Document = {
                id: `storage_${Date.now()}_${i}`,
                name: file.name,
                type: getFileType(file.name),
                size: formatFileSize(file.size),
                uploadDate: new Date().toISOString().split('T')[0],
                category: uploadCategory
              };
              
              setDocuments(prev => [newDocument, ...prev]);
            } else {
              console.log('Document metadata saved to database successfully');
            }
          } catch (dbError) {
            console.warn('Database operation failed:', dbError);
            // Add to local state for immediate feedback
            const newDocument: Document = {
              id: `storage_${Date.now()}_${i}`,
              name: file.name,
                              type: getFileType(file.name),
                size: formatFileSize(file.size),
                uploadDate: new Date().toISOString().split('T')[0],
                category: uploadCategory
            };
            
            setDocuments(prev => [newDocument, ...prev]);
          }
        }

        // Update progress
        setUploadProgress(Math.round(((i + 1) / fileArray.length) * 100));
      }

      // Refresh documents list only if we're using database storage
      try {
        await loadDocuments();
      } catch (refreshError) {
        console.warn('Failed to refresh documents list:', refreshError);
        // If refresh fails, that's okay - documents were already added to local state in fallback mode
      }
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload files');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  } catch (outerErr: any) {
    console.error('Outer upload error:', outerErr);
    setError('An unexpected error occurred during upload');
    setUploading(false);
    setUploadProgress(0);
  }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading) {
      setDragActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Essential for allowing drop
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (!uploading && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files);
    }
  };

  const handleChooseFiles = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    fileInputRef.current?.click();
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      // Find the document to get the file path
      const document = documents.find(doc => doc.id === documentId);
      if (!document) return;

      // Try to delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (dbError) {
        console.warn('Database delete failed, removing from local state:', dbError);
        // Fallback: Remove from local state for demo mode
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
        return;
      }

      // Delete from storage (optional - you might want to keep files for backup)
      // await supabase.storage.from('documents').remove([document.filePath]);

      // Refresh documents list
      await loadDocuments();
    } catch (err: any) {
      console.error('Delete error:', err);
      // Fallback: Remove from local state
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    }
  };

  const handleUpdateDocumentCategory = async (documentId: string, newCategory: string) => {
    try {
      // Try to update in database
      const { error: dbError } = await supabase
        .from('documents')
        .update({ category: newCategory })
        .eq('id', documentId);

      if (dbError) {
        console.warn('Database update failed, updating local state:', dbError);
        // Fallback: Update local state for demo mode
        setDocuments(prev => prev.map(doc => 
          doc.id === documentId ? { ...doc, category: newCategory } : doc
        ));
        setEditingDocument(null);
        return;
      }

      // Refresh documents list
      await loadDocuments();
      setEditingDocument(null);
      setError(null); // Clear any previous errors
    } catch (err: any) {
      console.error('Update error:', err);
      // Fallback: Update local state
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId ? { ...doc, category: newCategory } : doc
      ));
      setEditingDocument(null);
      setError(null); // Clear any previous errors
    }
  };

  const filteredDocuments = selectedCategory === 'All Documents' 
    ? documents 
    : documents.filter(doc => doc.category === selectedCategory);

  const getFileIcon = (type: string) => {
    return <File className="h-5 w-5 text-blue-600" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-lg text-gray-600 mb-2">Loading documents...</div>
          <div className="text-sm text-gray-500">Fetching your uploaded files</div>
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
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
              <Upload className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Document Management</h2>
              <p className="text-gray-600">Upload, organize, and manage your business documents</p>
            </div>
          </div>
          <Button 
            type="button"
            className="bg-green-600 hover:bg-green-700" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!uploading) {
                handleChooseFiles(e);
              }
            }}
            disabled={uploading}
          >
            <Plus className="h-4 w-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </div>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Upload</CardTitle>
          <CardDescription>
            Drag and drop files here or click to browse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Category
            </label>
            <Select value={uploadCategory} onValueChange={setUploadCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {uploadCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              dragActive 
                ? 'border-green-500 bg-green-50' 
                : uploading 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-green-400'
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!uploading) {
                handleChooseFiles(e);
              }
            }}
          >
            <Upload className={`h-12 w-12 mx-auto mb-4 ${
              dragActive ? 'text-green-500' : uploading ? 'text-blue-500' : 'text-gray-400'
            }`} />
            
            {uploading ? (
              <div className="space-y-2">
                <p className="text-blue-600 mb-2">Uploading to {uploadCategory}...</p>
                <div className="w-full max-w-xs mx-auto bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-blue-500">{uploadProgress}% complete</p>
              </div>
            ) : (
              <>
                <p className="text-gray-600 mb-2">
                  {dragActive ? 'Drop files here to upload' : 'Drop files here or click to upload'}
                </p>
                <p className="text-sm text-gray-500">Supports PDF, DOC, XLS, JPG, PNG (Max 10MB)</p>
                <Button 
                  type="button"
                  variant="outline" 
                  className="mt-4" 
                  disabled={uploading}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!uploading) {
                      handleChooseFiles(e);
                    }
                  }}
                >
                  Choose Files
                </Button>
              </>
            )}
          </div>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
            onChange={handleFileInputChange}
            className="hidden"
            style={{ display: 'none' }}
            onClick={(e) => e.stopPropagation()}
          />
        </CardContent>
      </Card>

      {/* Category Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Document Categories</CardTitle>
          <CardDescription>
            Filter documents by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Documents</CardTitle>
          <CardDescription>
            {filteredDocuments.length} document(s) found • Click on category names to edit them
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-8">
              <File className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No documents found in this category</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDocuments.map((document) => (
                <div key={document.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(document.type)}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{document.name}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        {editingDocument === document.id ? (
                          <div className="flex items-center space-x-2">
                            <Select 
                              value={document.category} 
                              onValueChange={(newCategory) => handleUpdateDocumentCategory(document.id, newCategory)}
                            >
                              <SelectTrigger className="w-32 h-6 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {uploadCategories.map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setEditingDocument(null)}
                              className="h-6 px-2 text-xs"
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <span 
                            className="cursor-pointer hover:text-green-600 flex items-center space-x-1"
                            onClick={() => setEditingDocument(document.id)}
                          >
                            <span>{document.category}</span>
                            <Edit className="h-3 w-3" />
                          </span>
                        )}
                        <span>•</span>
                        <span>{document.size}</span>
                        <span>•</span>
                        <span>Uploaded {new Date(document.uploadDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteDocument(document.id)}
                      disabled={uploading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 