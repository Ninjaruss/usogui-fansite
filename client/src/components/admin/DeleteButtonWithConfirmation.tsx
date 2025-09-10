import React, { useState } from 'react'
import { 
  useDelete, 
  useNotify, 
  useRedirect, 
  useRecordContext,
  Button
} from 'react-admin'
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Typography, 
  Box 
} from '@mui/material'
import { Trash2, AlertTriangle } from 'lucide-react'

interface DeleteButtonWithConfirmationProps {
  resource: string
  label?: string
  variant?: 'contained' | 'outlined' | 'text'
  color?: 'error' | 'warning' | 'primary' | 'secondary'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  confirmTitle?: string
  confirmMessage?: string
}

export const DeleteButtonWithConfirmation: React.FC<DeleteButtonWithConfirmationProps> = ({
  resource,
  label = 'Delete',
  variant = 'contained',
  color = 'error',
  size = 'medium',
  disabled = false,
  confirmTitle,
  confirmMessage
}) => {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  const record = useRecordContext()
  const notify = useNotify()
  const redirect = useRedirect()
  const [deleteRecord] = useDelete()

  const handleDelete = async () => {
    if (!record?.id) return
    
    setDeleting(true)
    try {
      await deleteRecord(resource, { id: record.id, previousData: record })
      notify(`${resource.slice(0, -1)} deleted successfully`, { type: 'success' })
      redirect(`/${resource}`)
    } catch (error) {
      notify(`Error deleting ${resource.slice(0, -1)}: ${error}`, { type: 'error' })
    } finally {
      setDeleting(false)
      setOpen(false)
    }
  }

  const getDefaultTitle = () => {
    const resourceName = resource.slice(0, -1)
    return `Delete ${resourceName.charAt(0).toUpperCase() + resourceName.slice(1)}`
  }

  const getDefaultMessage = () => {
    const resourceName = resource.slice(0, -1)
    const itemName = record?.name || record?.title || `this ${resourceName}`
    return `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        disabled={disabled || deleting}
        variant={variant}
        color={color}
        size={size}
        startIcon={<Trash2 size={16} />}
        sx={{
          backgroundColor: color === 'error' ? '#d32f2f' : undefined,
          '&:hover': {
            backgroundColor: color === 'error' ? '#b71c1c' : undefined,
          },
          fontWeight: 600,
          textTransform: 'none'
        }}
      >
        {deleting ? 'Deleting...' : label}
      </Button>

      <Dialog
        open={open}
        onClose={() => !deleting && setOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#0a0a0a',
            border: '2px solid #d32f2f',
            borderRadius: 2,
            color: '#ffffff'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          backgroundColor: 'rgba(211, 47, 47, 0.1)',
          borderBottom: '1px solid rgba(211, 47, 47, 0.3)',
          color: '#d32f2f',
          fontWeight: 'bold'
        }}>
          <AlertTriangle size={24} />
          {confirmTitle || getDefaultTitle()}
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" sx={{ color: '#ffffff', lineHeight: 1.6 }}>
            {confirmMessage || getDefaultMessage()}
          </Typography>
          
          <Box sx={{ 
            mt: 3, 
            p: 2, 
            backgroundColor: 'rgba(255, 152, 0, 0.1)', 
            borderRadius: 1,
            border: '1px solid rgba(255, 152, 0, 0.3)'
          }}>
            <Typography variant="body2" sx={{ 
              color: '#ff9800', 
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <AlertTriangle size={16} />
              This action is permanent and cannot be undone.
            </Typography>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ 
          p: 3, 
          gap: 2,
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Button
            onClick={() => setOpen(false)}
            disabled={deleting}
            variant="outlined"
            sx={{
              borderColor: 'rgba(255, 255, 255, 0.3)',
              color: '#ffffff',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)'
              },
              fontWeight: 600,
              textTransform: 'none'
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={deleting}
            variant="contained"
            color="error"
            sx={{
              backgroundColor: '#d32f2f',
              '&:hover': {
                backgroundColor: '#b71c1c'
              },
              fontWeight: 600,
              textTransform: 'none'
            }}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}