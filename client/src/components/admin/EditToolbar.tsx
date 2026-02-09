import React from 'react'
import { Toolbar, SaveButton, useRecordContext, Button } from 'react-admin'
import { Box, Divider } from '@mui/material'
import { useNavigate } from 'react-router-dom'
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