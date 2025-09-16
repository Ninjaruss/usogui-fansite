import React, { useState } from 'react'
import BadgeDisplay from '../BadgeDisplay'
import {
  List,
  Datagrid,
  TextField,
  EmailField,
  DateField,
  Edit,
  Show,
  SimpleForm,
  TextInput,
  SimpleShowLayout,
  BooleanField,
  BooleanInput,
  SelectInput,
  ReferenceManyField,
  FunctionField,
  CreateButton,
  useRecordContext,
  Button,
  TopToolbar,
  EditButton,
  ReferenceInput,
  AutocompleteInput,
  NumberInput,
  useCreate,
  useNotify,
  useRefresh
} from 'react-admin'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField as MuiTextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material'
import { Delete, Add } from '@mui/icons-material'

// Badge Award Modal Component
const BadgeAwardModal = ({ open, onClose, userId, username }: {
  open: boolean;
  onClose: () => void;
  userId: number;
  username: string;
}) => {
  const [badgeId, setBadgeId] = useState('');
  const [reason, setReason] = useState('');
  const [year, setYear] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [availableBadges, setAvailableBadges] = useState<any[]>([]);
  const [loadingBadges, setLoadingBadges] = useState(true);

  const [create] = useCreate();
  const notify = useNotify();
  const refresh = useRefresh();

  // Fetch available badges when modal opens
  React.useEffect(() => {
    if (open) {
      const fetchBadges = async () => {
        try {
          setLoadingBadges(true);
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/badges`);
          if (response.ok) {
            const data = await response.json();
            setAvailableBadges(Array.isArray(data) ? data : data.data || []);
          } else {
            throw new Error('Failed to fetch badges');
          }
        } catch (error) {
          console.error('Error fetching badges:', error);
          notify('Failed to load available badges', { type: 'error' });
          setAvailableBadges([]);
        } finally {
          setLoadingBadges(false);
        }
      };

      fetchBadges();
    }
  }, [open, notify]);

  const handleSubmit = async () => {
    if (!badgeId) {
      notify('Please select a badge', { type: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      const badgeData: any = {
        userId,
        badgeId: parseInt(badgeId),
        reason: reason || null,
      };

      // Add year for supporter badges
      if (year) {
        badgeData.year = parseInt(year);
      }

      // Add expiration date if provided
      if (expiresAt) {
        badgeData.expiresAt = new Date(expiresAt).toISOString();
      }

      await create('badges/award', { data: badgeData });

      notify('Badge awarded successfully!', { type: 'success' });
      refresh();
      onClose();
      setBadgeId('');
      setReason('');
      setYear('');
      setExpiresAt('');
    } catch (error) {
      notify('Failed to award badge', { type: 'error' });
      console.error('Badge award error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Award Badge to {username}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <FormControl fullWidth required>
            <InputLabel>Badge</InputLabel>
            <Select
              value={badgeId}
              onChange={(e) => {
                const newBadgeId = e.target.value;
                setBadgeId(newBadgeId);
                
                // Auto-set expiration for Active Supporter badges
                const selectedBadge = availableBadges.find(b => b.id === parseInt(newBadgeId));
                if (selectedBadge?.type === 'active_supporter') {
                  const oneYearFromNow = new Date();
                  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
                  setExpiresAt(oneYearFromNow.toISOString().slice(0, 16));
                }
              }}
              label="Badge"
              disabled={loadingBadges}
            >
              {loadingBadges ? (
                <MenuItem disabled>Loading badges...</MenuItem>
              ) : availableBadges.length === 0 ? (
                <MenuItem disabled>No badges available</MenuItem>
              ) : (
                availableBadges.map((badge) => (
                  <MenuItem key={badge.id} value={badge.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                      <div
                        className="inline-flex items-center justify-center px-2 py-0.5 rounded-full border text-xs font-semibold uppercase tracking-wide flex-shrink-0"
                        style={{
                          backgroundColor: badge.backgroundColor ? `${badge.backgroundColor}33` : 'transparent',
                          borderColor: badge.color,
                          color: badge.color,
                          minWidth: '80px'
                        }}
                      >
                        {badge.name}
                      </div>
                      <Box sx={{ ml: 1 }}>
                        <div className="font-medium">{badge.name}</div>
                        {badge.description && (
                          <div className="text-xs text-gray-500">{badge.description}</div>
                        )}
                      </Box>
                    </Box>
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          <MuiTextField
            fullWidth
            label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            multiline
            rows={2}
            placeholder="Optional reason for awarding this badge"
          />

          {(() => {
            const selectedBadge = availableBadges.find(b => b.id === parseInt(badgeId));
            return selectedBadge?.type === 'supporter' || selectedBadge?.type === 'active_supporter' ? (
              <MuiTextField
                fullWidth
                label="Year"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g., 2024"
                helperText="Year for supporter badges"
              />
            ) : null;
          })()}

          <FormControl fullWidth>
            <InputLabel>Expiration</InputLabel>
            <Select
              value={expiresAt ? 'custom' : 'permanent'}
              onChange={(e) => {
                if (e.target.value === 'permanent') {
                  setExpiresAt('');
                } else if (e.target.value === '1year') {
                  const oneYearFromNow = new Date();
                  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
                  setExpiresAt(oneYearFromNow.toISOString().slice(0, 16));
                } else if (e.target.value === 'custom') {
                  // Keep current value or set to current time
                  if (!expiresAt) {
                    const now = new Date();
                    setExpiresAt(now.toISOString().slice(0, 16));
                  }
                }
              }}
              label="Expiration"
            >
              {(() => {
                const selectedBadge = availableBadges.find(b => b.id === parseInt(badgeId));
                
                // For Active Supporter badges, only allow 1 year expiration
                if (selectedBadge?.type === 'active_supporter') {
                  return (
                    <MenuItem value="1year">1 Year from now (required for Active Supporter)</MenuItem>
                  );
                }
                
                // For other badges, show all options
                return [
                  <MenuItem key="permanent" value="permanent">Permanent (no expiration)</MenuItem>,
                  <MenuItem key="1year" value="1year">1 Year from now</MenuItem>,
                  <MenuItem key="custom" value="custom">Custom date/time</MenuItem>
                ];
              })()}
            </Select>
          </FormControl>

          {expiresAt && (
            <>
              {(() => {
                const selectedBadge = availableBadges.find(b => b.id === parseInt(badgeId));
                const isActiveSupporterBadge = selectedBadge?.type === 'active_supporter';
                
                return (
                  <MuiTextField
                    fullWidth
                    label={isActiveSupporterBadge ? "Expiration Date (Auto-set)" : "Custom Expiration Date"}
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    helperText={
                      isActiveSupporterBadge 
                        ? "Active Supporter badges automatically expire after 1 year" 
                        : "Set specific expiration date and time"
                    }
                    InputLabelProps={{ shrink: true }}
                    disabled={isActiveSupporterBadge}
                  />
                );
              })()}
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          variant="contained"
        >
          {submitting ? 'Awarding...' : 'Award Badge'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Badge Removal Modal Component
const BadgeRemovalModal = ({ open, onClose, userBadge, badgeName, onConfirm }: {
  open: boolean;
  onClose: () => void;
  userBadge: any;
  badgeName: string;
  onConfirm: (reason: string) => void;
}) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      await onConfirm(reason.trim());
      setReason('');
      onClose();
    } catch (error) {
      console.error('Error in removal:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setReason('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Remove Badge: {badgeName}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <div>
            Are you sure you want to remove the <strong>"{badgeName}"</strong> badge?
            This action will log the removal for audit purposes.
          </div>

          <MuiTextField
            fullWidth
            required
            multiline
            rows={3}
            label="Reason for Removal"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter the reason for removing this badge..."
            helperText="This reason will be logged in the badge history"
            error={!reason.trim() && reason.length > 0}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || !reason.trim()}
          variant="contained"
          color="error"
        >
          {submitting ? 'Removing...' : 'Remove Badge'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const UserList = () => (
  <List>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="username" />
      <EmailField source="email" />
      <TextField source="role" />
      <FunctionField
        label="Badges"
        render={(record: any) => {
          // Check both `badges` and `userBadges` properties for compatibility
          const userBadges = record?.userBadges || record?.badges || [];
          
          if (userBadges.length === 0) {
            return <span className="text-gray-400">—</span>;
          }

          return (
            <div className="flex gap-2">
              {userBadges.slice(0, 3).map((userBadge: any) => {
                if (!userBadge.badge) return null;

                return (
                  <BadgeDisplay
                    key={userBadge.id}
                    userBadge={userBadge}
                    size="sm"
                    showTooltip={true}
                  />
                );
              })}
              {userBadges.length > 3 && (
                <span className="text-xs text-gray-500 ml-1">+{userBadges.length - 3}</span>
              )}
            </div>
          );
        }}
      />
      <BooleanField source="isEmailVerified" />
      <DateField source="createdAt" />
      <EditButton />
    </Datagrid>
  </List>
)

const UserShowActions = () => {
  const record = useRecordContext();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <TopToolbar>
        <EditButton />
        <Button
          onClick={() => setModalOpen(true)}
          label="Award Badge"
        />
      </TopToolbar>
      {record && (
        <BadgeAwardModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          userId={Number(record.id)}
          username={record.username}
        />
      )}
    </>
  );
};

// Custom field to display user's current badges with edit capabilities
const UserBadgesField = () => {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const [removeModalOpen, setRemoveModalOpen] = React.useState(false);
  const [badgeToRemove, setBadgeToRemove] = React.useState<{userBadge: any, badgeName: string} | null>(null);

  const handleDeleteBadge = (userBadge: any, badgeName: string) => {
    setBadgeToRemove({ userBadge, badgeName });
    setRemoveModalOpen(true);
  };

  const handleConfirmRemoval = async (reason: string) => {
    if (!badgeToRemove) return;

    const { userBadge, badgeName } = badgeToRemove;

    try {
      // Use the correct API endpoint: DELETE /badges/user/:userId/badge/:badgeId
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/badges/user/${userBadge.userId}/badge/${userBadge.badgeId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason }),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Delete response:', response.status, errorData);
        throw new Error(`Failed to remove badge: ${response.status}`);
      }

      notify(`Badge "${badgeName}" removed successfully`, { type: 'success' });
      refresh();
    } catch (error) {
      console.error('Error removing badge:', error);
      notify('Failed to remove badge', { type: 'error' });
      throw error;
    }
  };

  // Check both `badges` and `userBadges` properties for compatibility
  const userBadges = record?.userBadges || record?.badges || [];
  
  // Filter to show only active badges in the current badges section
  const activeBadges = userBadges.filter((userBadge: any) => {
    if (!userBadge.isActive) return false;
    if (userBadge.expiresAt && new Date(userBadge.expiresAt) < new Date()) return false;
    return true;
  });

  if (activeBadges.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <span className="text-gray-500 italic">No active badges</span>
        <Tooltip title="Add Badge">
          <IconButton size="small" onClick={() => setAddModalOpen(true)}>
            <Add />
          </IconButton>
        </Tooltip>
        {addModalOpen && record && (
          <BadgeAwardModal
            open={addModalOpen}
            onClose={() => setAddModalOpen(false)}
            userId={Number(record.id)}
            username={record.username}
          />
        )}
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <span className="text-sm font-medium">Current Active Badges</span>
        <Tooltip title="Add Badge">
          <IconButton size="small" onClick={() => setAddModalOpen(true)}>
            <Add />
          </IconButton>
        </Tooltip>
      </Box>
      <div className="flex flex-wrap gap-2">
        {activeBadges.map((userBadge: any) => {
          const badge = userBadge.badge;
          if (!badge) return null;

          return (
            <Box key={userBadge.id} sx={{ position: 'relative', display: 'inline-block' }}>
              <BadgeDisplay
                userBadge={userBadge}
                size="md"
                showTooltip={true}
              />
              <Tooltip title="Remove Badge">
                <IconButton
                  size="small"
                  onClick={() => handleDeleteBadge(userBadge, badge.type === 'supporter' && userBadge.year ? `${badge.name} ${userBadge.year}` : badge.name)}
                  sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    backgroundColor: 'error.main',
                    color: 'white',
                    width: 20,
                    height: 20,
                    '&:hover': {
                      backgroundColor: 'error.dark',
                    },
                  }}
                >
                  <Delete sx={{ fontSize: 12 }} />
                </IconButton>
              </Tooltip>
            </Box>
          );
        })}
      </div>
      {addModalOpen && record && (
        <BadgeAwardModal
          open={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          userId={Number(record.id)}
          username={record.username}
        />
      )}
      {removeModalOpen && badgeToRemove && (
        <BadgeRemovalModal
          open={removeModalOpen}
          onClose={() => {
            setRemoveModalOpen(false);
            setBadgeToRemove(null);
          }}
          userBadge={badgeToRemove.userBadge}
          badgeName={badgeToRemove.badgeName}
          onConfirm={handleConfirmRemoval}
        />
      )}
    </Box>
  );
};


const UserBadgeHistoryField = () => {
  const record = useRecordContext();

  // Check both `badges` and `userBadges` properties for compatibility
  const userBadges = record?.userBadges || record?.badges || [];

  if (userBadges.length === 0) {
    return <span className="text-gray-500 italic">No badge history</span>;
  }

  // Sort badges by awarded date (newest first)
  const sortedBadges = [...userBadges].sort((a, b) =>
    new Date(b.awardedAt).getTime() - new Date(a.awardedAt).getTime()
  );

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-600 mb-3">
        <strong>Badge History</strong> - Complete record of all badge activities (active, expired, and removed)
      </div>

      {sortedBadges.map((userBadge: any) => {
        const badge = userBadge.badge;
        if (!badge) return null;

        const displayName = badge.type === 'supporter' && userBadge.year
          ? `${badge.name} ${userBadge.year}`
          : badge.name;

        const isExpired = userBadge.expiresAt && new Date(userBadge.expiresAt) < new Date();
        const isActive = userBadge.isActive;

        return (
          <div key={userBadge.id} className="p-3 bg-gray-50 rounded-lg border-l-4"
               style={{ borderLeftColor: badge.color }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <BadgeDisplay
                  userBadge={userBadge}
                  size="md"
                  showTooltip={false}
                  className={!isActive ? 'opacity-60' : ''}
                />

                <div className="flex gap-2">
                  {!isActive && (
                    <Chip label="Removed" size="small" color="error" variant="outlined" />
                  )}
                  {isExpired && (
                    <Chip label="Expired" size="small" color="warning" variant="outlined" />
                  )}
                  {isActive && !isExpired && (
                    <Chip label="Active" size="small" color="success" variant="outlined" />
                  )}
                </div>
              </div>

              <div className="text-xs text-gray-600 text-right">
                <div><strong>Awarded:</strong> {new Date(userBadge.awardedAt).toLocaleString()}</div>
                {userBadge.expiresAt && (
                  <div><strong>Expires:</strong> {new Date(userBadge.expiresAt).toLocaleString()}</div>
                )}
                {userBadge.revokedAt && (
                  <div><strong>Removed:</strong> {new Date(userBadge.revokedAt).toLocaleString()}</div>
                )}
                {userBadge.updatedAt !== userBadge.awardedAt && (
                  <div><strong>Last Updated:</strong> {new Date(userBadge.updatedAt).toLocaleString()}</div>
                )}
              </div>
            </div>

            {userBadge.reason && (
              <div className="mt-2 text-sm text-gray-700">
                <strong>Reason:</strong> {userBadge.reason}
              </div>
            )}

            {userBadge.revokedReason && (
              <div className="mt-2 text-sm text-gray-700">
                <strong>Removal Reason:</strong> {userBadge.revokedReason}
              </div>
            )}

            <div className="mt-1 text-xs text-gray-500 space-y-1">
              {userBadge.awardedByUserId && (
                <div>Manually awarded by admin (ID: {userBadge.awardedByUserId})</div>
              )}
              {userBadge.revokedBy ? (
                <div>Removed by admin: {userBadge.revokedBy.username}</div>
              ) : userBadge.revokedByUserId && (
                <div>Removed by admin (ID: {userBadge.revokedByUserId})</div>
              )}
            </div>
          </div>
        );
      })}

      <div className="text-xs text-gray-500 mt-3 p-2 bg-blue-50 rounded">
        <strong>Note:</strong> Badge history shows all badges ever awarded to this user. 
        Use "Current Active Badges" section above to manage active badges. 
        Removed and expired badges are logged here for audit purposes.
      </div>
    </div>
  );
};

export const UserShow = () => (
  <Show actions={<UserShowActions />}>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="username" />
      <EmailField source="email" />
      <TextField source="role" />
      <BooleanField source="isEmailVerified" />
      <FunctionField
        label="Current Badges"
        render={() => <UserBadgesField />}
      />
      <FunctionField
        label="Badge History"
        render={() => <UserBadgeHistoryField />}
      />
      <DateField source="createdAt" />
      <DateField source="updatedAt" />
    </SimpleShowLayout>
  </Show>
)

export const UserEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="username" required />
      <TextInput source="email" type="email" required />
      <SelectInput
        source="role"
        choices={[
          { id: 'user', name: 'User' },
          { id: 'moderator', name: 'Moderator' },
          { id: 'admin', name: 'Admin' },
        ]}
      />
      <BooleanInput source="isEmailVerified" />
    </SimpleForm>
  </Edit>
)