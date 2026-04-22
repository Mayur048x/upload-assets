'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useDropzone } from 'react-dropzone';

// Just change this once when you create your new bucket
const BUCKET_NAME = 'upload-assets';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function UploadAssetsPage() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Fetch projects from Supabase on mount
  useEffect(() => {
    const fetchProjects = async () => {
      setLoadingProjects(true);
      const { data, error } = await supabase
        .from('projects')
        .select('id, project_name, status')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error.message);
      } else {
        setProjects(data || []);
        if (data && data.length > 0) {
          setSelectedProject(data[0]);
        }
      }
      setLoadingProjects(false);
    };

    fetchProjects();
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      setFiles(prev => [...prev, ...acceptedFiles]);
    }
  });

  const handleUpload = async () => {
    if (!selectedProject) {
      alert('Please select a project');
      return;
    }
    if (files.length === 0) {
      alert('Please select files');
      return;
    }

    setUploading(true);

    try {
      // Upload all files directly to storage, nothing else
      for (const file of files) {
   const safeProjectName = selectedProject.project_name.replace(/\s+/g, '-');

   const filePath = `${safeProjectName}/${Date.now()}-${file.name}`;

   const { error } = await supabase.storage
    .from('upload-assets')
    .upload(filePath, file); // ❌ removed upsert

    if (error) throw error;
  }

      setSuccess(true);
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Assets Uploaded!</h1>
          <p className="text-gray-600 mb-6">
            {files.length} file(s) saved to <span className="font-semibold">{selectedProject?.project_name}</span> folder
          </p>
          <button
            onClick={() => { setSuccess(false); setFiles([]); }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Upload More
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📁 Upload Project Assets</h1>
          <p className="text-gray-500 mb-8">Upload brand kits, design files, and references for your team</p>

          {/* Project Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project *
            </label>

            {loadingProjects ? (
              <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-400 text-sm">
                Loading projects...
              </div>
            ) : projects.length === 0 ? (
              <div className="w-full px-4 py-3 border border-red-200 rounded-lg bg-red-50 text-red-500 text-sm">
                No projects found in database
              </div>
            ) : (
              <div className="space-y-2">
                <select
                  value={selectedProject?.id || ''}
                  onChange={(e) => {
                    const project = projects.find(p => p.id === parseInt(e.target.value));
                    setSelectedProject(project || null);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                >
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.project_name}
                    </option>
                  ))}
                </select>

                {selectedProject && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
                    <span className="text-xs text-blue-600 font-medium">Selected Project:</span>
                    <span className="text-xs text-gray-700 font-semibold">{selectedProject.project_name}</span>
                    {selectedProject.status && (
                      <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${
                        selectedProject.status === 'Active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {selectedProject.status}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Drop Zone */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Files *
            </label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
                isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <div className="text-4xl mb-3">📎</div>
              <p className="text-gray-700 font-medium">
                {isDragActive ? 'Drop files here...' : 'Drag & drop or click to browse'}
              </p>
              <p className="text-sm text-gray-400 mt-1">Any format • Any size</p>
            </div>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Selected ({files.length} files):
              </h3>
              <div className="space-y-2">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">📄 {file.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                      <button
                        onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                        className="text-red-500 text-sm hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={uploading || files.length === 0 || !selectedProject}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {uploading ? 'Uploading...' : `Upload ${files.length > 0 ? files.length + ' file(s)' : 'Files'}`}
          </button>
        </div>
      </div>
    </div>
  );
}