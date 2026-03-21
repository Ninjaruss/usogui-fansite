import React, { useState } from 'react'
import { Toolbar, SaveButton, useRecordContext, Button, useUpdate, useNotify, useRefresh } from 'react-admin'
import { Box, Divider, Dialog, DialogTitle, DialogContent, DialogActions, TextField as MuiTextField, Button as MuiButton, CircularProgress } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle } from 'lucide-react'
import { DeleteButtonWithConfirmation } from './DeleteButtonWithConfirmation'

interface EditToolbarProps {
  resource: string
  showDelete?: boolean
  deleteLabel?: string
  saveLabel?: string
  confirmTitle?: string
  confirmMessage?: string
}

export const EditToolbar: React.FC<EditToolbarProps> = ({
  resource,
  showDelete = true,
  deleteLabel = 'Delete',
  saveLabel = 'Save',
  confirmTitle,
  confirmMessage
}) => {
  const record = useRecordContext()
  const navigate = useNavigate()

  return (
    <Toolbar
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '0 0 8px 8px',
        p: 3,
        gap: 2,
        flexWrap: 'wrap',
        '& .RaToolbar-defaultToolbar': {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          gap: 2
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <SaveButton
          label={saveLabel}
          variant="contained"
          color="primary"
          size="medium"
          sx={{
            backgroundColor: '#1976d2',
            '&:hover': {
              backgroundColor: '#1565c0'
            },
            fontWeight: 600,
            textTransform: 'none',
            px: 3,
            py: 1
          }}
        />
        <Button
          label="Cancel"
          onClick={() => navigate(-1)}
          variant="outlined"
          size="medium"
          sx={{
            borderColor: 'rgba(255, 255, 255, 0.3)',
            color: 'rgba(255, 255, 255, 0.7)',
            '&:hover': {
              borderColor: 'rgba(255, 255, 255, 0.5)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)'
            },
            fontWeight: 600,
            textTransform: 'none',
            px: 3,
            py: 1
          }}
        />
      </Box>

      {showDelete && record?.id && (
        <>
          <Divider
            orientation="vertical"
            flexItem
            sx={{
              borderColor: 'rgba(255, 255, 255, 0.2)',
              display: { xs: 'none', sm: 'block' }
            }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DeleteButtonWithConfirmation
              resource={resource}
              label={deleteLabel}
              confirmTitle={confirmTitle}
              confirmMessage={confirmMessage}
              size="medium"
            />
          </Box>
        </>
      )}
    </Toolbar>
  )
}

interface ApproveRejectToolbarProps {
  resource: string
  showDelete?: boolean
}

export const ApproveRejectToolbar: React.FC<ApproveRejectToolbarProps> = ({
  resource,
  showDelete = false,
}) => {
  const record = useRecordContext()
  const notify = useNotify()
  const refresh = useRefresh()
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const [approve, { isPending: approving }] = useUpdate(
    resource,
    { id: record?.id, data: { status: 'approved' }, previousData: record },
    {
      onSuccess: () => {
        notify('Approved successfully', { type: 'success' })
        refresh()
      },
      onError: (error: any) => {
        notify(error?.message || 'Approval failed', { type: 'error' })
      },
    }
  )

  const [reject, { isPending: rejecting }] = useUpdate(
    resource,
    { id: record?.id, data: { status: 'rejected', rejectionReason }, previousData: record },
    {
      onSuccess: () => {
        notify('Rejected successfully', { type: 'success' })
        setRejectOpen(false)
        setRejectionReason('')
        refresh()
      },
      onError: (error: any) => {
        notify(error?.message || 'Rejection failed', { type: 'error' })
      },
    }
  )

  return (
    <>
      <Toolbar
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '0 0 8px 8px',
          p: 3,
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <SaveButton label="Save" variant="contained" />
          <MuiButton
            variant="contained"
            color="success"
            startIcon={approving ? <CircularProgress size={16} /> : <CheckCircle size={16} />}
            disabled={approving || rejecting}
            onClick={() => approve()}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Approve
          </MuiButton>
          <MuiButton
            variant="outlined"
            color="error"
            startIcon={<XCircle size={16} />}
            disabled={approving || rejecting}
            onClick={() => setRejectOpen(true)}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Reject
          </MuiButton>
        </Box>
        {showDelete && record?.id && (
          <>
            <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.2)', display: { xs: 'none', sm: 'block' } }} />
            <Box>
              <DeleteButtonWithConfirmation resource={resource} size="medium" />
            </Box>
          </>
        )}
      </Toolbar>

      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject — provide a reason</DialogTitle>
        <DialogContent>
          <MuiTextField
            label="Rejection Reason"
            multiline
            rows={4}
            fullWidth
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            helperText="This reason will be shown to the submitter"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={() => setRejectOpen(false)} disabled={rejecting}>Cancel</MuiButton>
          <MuiButton
            variant="contained"
            color="error"
            disabled={rejecting || !rejectionReason.trim()}
            onClick={() => reject()}
          >
            {rejecting ? <CircularProgress size={16} /> : 'Confirm Reject'}
          </MuiButton>
        </DialogActions>
      </Dialog>
    </>
  )
}