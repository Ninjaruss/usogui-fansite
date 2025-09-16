'use client';

import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  IconButton,
  Typography,
  Tooltip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Edit, Save, X, Star } from 'lucide-react';
import { api } from '../lib/api';

interface CustomRoleEditorProps {
  currentRole: string | null;
  isActiveSupporterUser: boolean;
  onUpdate: (newRole: string | null) => void;
}

export default function CustomRoleEditor({
  currentRole,
  isActiveSupporterUser,
  onUpdate
}: CustomRoleEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedRole, setEditedRole] = useState(currentRole || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const handleSave = async () => {
    if (editedRole.trim().length > 50) {
      setError('Custom role must be 50 characters or less');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const roleToSave = editedRole.trim() || null;
      
      if (roleToSave) {
        await api.updateCustomRole(roleToSave);
      } else {
        await api.removeCustomRole();
      }

      onUpdate(roleToSave);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update custom role');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedRole(currentRole || '');
    setIsEditing(false);
    setError('');
  };

  const handleRemove = async () => {
    setLoading(true);
    setError('');

    try {
      await api.removeCustomRole();
      onUpdate(null);
      setConfirmDialogOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to remove custom role');
    } finally {
      setLoading(false);
    }
  };

  if (!isActiveSupporterUser) {
    return (
      <Box sx={{ mb: 2 }}>
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          <Typography variant="body2">
            Custom cosmetic roles are available for Active Supporter badge holders. Support the project to unlock this feature!
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Star size={18} color="#9c27b0" />
        <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold' }}>
          Custom Cosmetic Role
        </Typography>
      </Box>

      {!isEditing ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          {currentRole ? (
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                backgroundColor: '#f3e5f5',
                color: '#7b1fa2',
                px: 1.5,
                py: 0.5,
                borderRadius: 3,
                border: '1px solid #ce93d8',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              <Star size={14} />
              {currentRole}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              No custom role set
            </Typography>
          )}
          
          <Tooltip title="Edit custom role">
            <IconButton
              size="small"
              onClick={() => setIsEditing(true)}
              sx={{ ml: 1 }}
            >
              <Edit size={16} />
            </IconButton>
          </Tooltip>

          {currentRole && (
            <Tooltip title="Remove custom role">
              <IconButton
                size="small"
                onClick={() => setConfirmDialogOpen(true)}
                color="error"
              >
                <X size={16} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            value={editedRole}
            onChange={(e) => setEditedRole(e.target.value)}
            placeholder="Enter your custom cosmetic role..."
            variant="outlined"
            inputProps={{ maxLength: 50 }}
            helperText={`${editedRole.length}/50 characters`}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              size="small"
              onClick={handleSave}
              disabled={loading}
              startIcon={<Save size={16} />}
              sx={{ borderRadius: 2 }}
            >
              Save
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={handleCancel}
              disabled={loading}
              sx={{ borderRadius: 2 }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 1, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Remove Custom Role</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove your custom cosmetic role? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRemove}
            color="error"
            disabled={loading}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
