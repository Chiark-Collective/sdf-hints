// ABOUTME: Left sidebar panel for project and file management
// ABOUTME: Allows creating projects and uploading point clouds

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  PlusIcon,
  FileIcon,
  TrashIcon,
  UploadIcon,
  ChevronRightIcon,
} from '@radix-ui/react-icons'
import * as Dialog from '@radix-ui/react-dialog'

import { useProjectStore } from '../../stores/projectStore'
import {
  listProjects,
  createProject,
  deleteProject,
  uploadPointCloud,
  type ProjectCreate,
} from '../../services/api'

export function ProjectPanel() {
  const currentProjectId = useProjectStore((s) => s.currentProjectId)
  const setCurrentProject = useProjectStore((s) => s.setCurrentProject)

  // Fetch projects from backend
  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: listProjects,
  })

  const projects = data?.projects ?? []

  return (
    <div className="w-64 flex flex-col bg-gray-900 border-r border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <span className="font-medium text-sm">Projects</span>
        <CreateProjectDialog />
      </div>

      {/* Project list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-sm text-gray-500">Loading...</div>
        ) : projects.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">No projects yet</div>
        ) : (
          <ul className="py-2">
            {projects.map((project) => (
              <ProjectItem
                key={project.id}
                project={project}
                isSelected={project.id === currentProjectId}
                onSelect={() => setCurrentProject(project.id)}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Upload section (when project selected) */}
      {currentProjectId && (
        <div className="p-4 border-t border-gray-800">
          <UploadDropzone projectId={currentProjectId} />
        </div>
      )}
    </div>
  )
}

interface ProjectItemProps {
  project: any
  isSelected: boolean
  onSelect: () => void
}

function ProjectItem({ project, isSelected, onSelect }: ProjectItemProps) {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => deleteProject(project.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  return (
    <li
      className={`
        flex items-center gap-2 px-4 py-2 cursor-pointer transition-colors
        ${isSelected ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-gray-800'}
      `}
      onClick={onSelect}
    >
      <ChevronRightIcon
        className={`w-4 h-4 transition-transform ${isSelected ? 'rotate-90' : ''}`}
      />
      <FileIcon className="w-4 h-4" />
      <span className="flex-1 text-sm truncate">{project.name}</span>
      <button
        onClick={(e) => {
          e.stopPropagation()
          if (confirm('Delete this project?')) {
            deleteMutation.mutate()
          }
        }}
        className="p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100"
      >
        <TrashIcon className="w-4 h-4" />
      </button>
    </li>
  )
}

function CreateProjectDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const queryClient = useQueryClient()
  const setCurrentProject = useProjectStore((s) => s.setCurrentProject)

  const createMutation = useMutation({
    mutationFn: (data: ProjectCreate) => createProject(data),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setCurrentProject(project.id)
      setOpen(false)
      setName('')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      createMutation.mutate({ name: name.trim() })
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded">
          <PlusIcon className="w-4 h-4" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 p-6 bg-gray-900 rounded-lg border border-gray-700 shadow-xl">
          <Dialog.Title className="text-lg font-medium mb-4">
            New Project
          </Dialog.Title>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={!name.trim() || createMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

interface UploadDropzoneProps {
  projectId: string
}

function UploadDropzone({ projectId }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const queryClient = useQueryClient()
  const updateProject = useProjectStore((s) => s.updateProject)

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadPointCloud(projectId, file),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['octree-metadata', projectId] })
      updateProject(projectId, {
        pointCloudId: result.id,
        pointCount: result.point_count,
        hasNormals: result.has_normals,
        boundsLow: result.bounds_low,
        boundsHigh: result.bounds_high,
      })
    },
  })

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        uploadMutation.mutate(file)
      }
    },
    [uploadMutation]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        uploadMutation.mutate(file)
      }
    },
    [uploadMutation]
  )

  return (
    <div
      className={`
        p-4 border-2 border-dashed rounded-lg text-center transition-colors
        ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-600'}
        ${uploadMutation.isPending ? 'opacity-50 pointer-events-none' : ''}
      `}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <UploadIcon className="w-8 h-8 mx-auto mb-2 text-gray-500" />
      <p className="text-sm text-gray-400 mb-2">
        {uploadMutation.isPending ? 'Uploading...' : 'Drop point cloud here'}
      </p>
      <label className="text-xs text-blue-400 hover:underline cursor-pointer">
        or browse files
        <input
          type="file"
          accept=".ply,.las,.laz,.csv,.npz,.parquet"
          onChange={handleFileSelect}
          className="hidden"
        />
      </label>
      <p className="text-xs text-gray-600 mt-2">
        PLY, LAS, LAZ, CSV, NPZ, Parquet
      </p>
    </div>
  )
}
