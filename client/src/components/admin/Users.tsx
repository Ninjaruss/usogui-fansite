import React, { useState } from 'react'
import { API_BASE_URL } from '../../lib/api'
import { MAX_CHAPTER, USER_ROLES } from '../../lib/constants'
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
  useRefresh,
  useDataProvider,
  usePermissions,
  SearchInput,
  BulkDeleteButton
} from 'react-admin'
import { useQueryClient } from '@tanstack/react-query'
import { useFormContext, useWatch } from 'react-hook-form'
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
  Chip,
  Typography
} from '@mui/material'
import { Delete, Add, Warning } from '@mui/icons-material'

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

  const [create] = useCreate()
  const notify = useNotify()
  const refresh = useRefresh()
  const dataProvider = useDataProvider()
  const queryClient = useQueryClient()

  // Fetch available badges when modal opens
  React.useEffect(() => {
    if (open) {
      const fetchBadges = async () => {
        try {
          setLoadingBadges(true)
          const badgeResponse = await dataProvider.getList('badges', {
            pagination: { page: 1, perPage: 1000 },
            sort: { field: 'name', order: 'ASC' },
            filter: {}
          })

          const data = Array.isArray(badgeResponse?.data) ? badgeResponse.data : []
          setAvailableBadges(data)
        } catch (error) {
          console.error('Error fetching badges:', error)
          notify('Failed to load available badges', { type: 'error' })
          setAvailableBadges([])
        } finally {
          setLoadingBadges(false)
        }
      };

      fetchBadges();
    }
  }, [open, dataProvider, notify]);

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
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'users'
      });
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <div
                        className="inline-flex items-center justify-center px-2 py-0.5 rounded-full border text-xs font-semibold uppercase tracking-wide flex-shrink-0"
                        style={{
                          backgroundColor: badge.backgroundColor ? `${badge.backgroundColor}33` : 'transparent',
                          borderColor: badge.color,
                          color: badge.color,
                          minWidth: '100px'
                        }}
                      >
                        {badge.name}
                      </div>
                      {badge.description && (
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                          {badge.description}
                        </Typography>
                      )}
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

const userFilters = [
  <SearchInput key="q" source="q" placeholder="Search by username or email" alwaysOn />,
  <SelectInput
    key="role"
    source="role"
    label="Role"
    alwaysOn
    choices={USER_ROLES}
  />,
  <SelectInput
    key="isEmailVerified"
    source="isEmailVerified"
    label="Email Verified"
    choices={[
      { id: 'true', name: 'Verified' },
      { id: 'false', name: 'Not Verified' },
    ]}
  />
]

const UserBulkActionButtons = () => (
  <>
    <BulkDeleteButton mutationMode="pessimistic" />
  </>
)

export const UserList = () => (
  <List filters={userFilters}>
    <Datagrid rowClick="show" bulkActionButtons={<UserBulkActionButtons />}>
      <TextField source="id" sortable />
      <TextField source="username" sortable />
      <EmailField source="email" sortable />
      <TextField source="role" sortable />
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
                <span className="text-xs text-gray-400 ml-1">+{userBadges.length - 3}</span>
              )}
            </div>
          );
        }}
      />
      <BooleanField source="isEmailVerified" />
      <DateField source="createdAt" sortable />
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
  const queryClient = useQueryClient();
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
        `${API_BASE_URL}/badges/user/${userBadge.userId}/badge/${userBadge.badgeId}`,
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
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'users'
      });
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
        <span className="text-gray-400 italic">No active badges</span>
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
        <Tooltip title="Add Badge">
          <IconButton size="small" onClick={() => setAddModalOpen(true)} sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: '#e11d48' } }}>
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
    return <span className="text-gray-400 italic">No badge history</span>;
  }

  // Sort badges by awarded date (newest first)
  const sortedBadges = [...userBadges].sort((a, b) =>
    new Date(b.awardedAt).getTime() - new Date(a.awardedAt).getTime()
  );

  return (
    <div className="space-y-2">

      {sortedBadges.map((userBadge: any) => {
        const badge = userBadge.badge;
        if (!badge) return null;

        const displayName = badge.type === 'supporter' && userBadge.year
          ? `${badge.name} ${userBadge.year}`
          : badge.name;

        const isExpired = userBadge.expiresAt && new Date(userBadge.expiresAt) < new Date();
        const isActive = userBadge.isActive;

        return (
          <div key={userBadge.id} className="p-3 bg-gray-700 rounded-lg border-l-4"
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

              <div className="text-xs text-gray-300 text-right">
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
              <div className="mt-2 text-sm text-gray-300">
                <strong>Reason:</strong> {userBadge.reason}
              </div>
            )}

            {userBadge.revokedReason && (
              <div className="mt-2 text-sm text-gray-300">
                <strong>Removal Reason:</strong> {userBadge.revokedReason}
              </div>
            )}

            <div className="mt-1 text-xs text-gray-400 space-y-1">
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

    </div>
  );
};

const getRoleColor = (role: string): string => {
  switch (role) {
    case 'admin': return '#ef4444'
    case 'moderator': return '#f59e0b'
    case 'editor': return '#3b82f6'
    default: return '#6b7280'
  }
}

const SectionDivider = ({ label, color = '#818cf8' }: { label: string; color?: string }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 2.5 }}>
    <Box sx={{ height: '1px', width: 40, background: `linear-gradient(to right, transparent, ${color}60)` }} />
    <Typography sx={{
      color: 'rgba(255,255,255,0.5)',
      fontSize: '0.63rem',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      fontWeight: 700,
      whiteSpace: 'nowrap',
      flexShrink: 0,
    }}>
      {label}
    </Typography>
    <Box sx={{ height: '1px', flex: 1, maxWidth: 120, background: `linear-gradient(to left, transparent, ${color}30)` }} />
  </Box>
)

const UserShowContent = () => {
  const record = useRecordContext()

  if (!record) return null

  const accentColor = '#e11d48'
  const arcColor = '#818cf8'
  const guideColor = '#f59e0b'
  const mediaColor = '#06b6d4'
  const annoColor = '#a78bfa'
  const eventColor = '#34d399'

  const readingProgress = record.userProgress != null
    ? Math.min(Math.round((record.userProgress / MAX_CHAPTER) * 100), 100)
    : null

  const avatarUrl = record.fluxerId && record.fluxerAvatar
    ? `https://fluxerusercontent.com/avatars/${record.fluxerId}/${record.fluxerAvatar}.png`
    : null

  const roleColor = getRoleColor(record.role)
  const joinDate = record.createdAt
    ? new Date(record.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'Unknown'

  const stats = record?.stats || {}
  const statItems = [
    { label: 'Guides', value: stats.guidesWritten ?? 0, color: guideColor },
    { label: 'Media', value: stats.mediaSubmitted ?? 0, color: mediaColor },
    { label: 'Annotations', value: stats.annotationsSubmitted ?? 0, color: annoColor },
    { label: 'Events', value: stats.eventsSubmitted ?? 0, color: eventColor },
    { label: 'Likes', value: stats.likesReceived ?? 0, color: accentColor },
  ]

  return (
    <Box sx={{ p: 3, background: 'transparent' }}>
      {/* Main Profile Card */}
      <Box sx={{
        background: 'linear-gradient(135deg, rgba(127,29,29,0.45), rgba(127,29,29,0.15)), #0a0a0a',
        border: '1px solid rgba(225,29,72,0.4)',
        borderRadius: 3,
        boxShadow: '0 20px 45px rgba(225,29,72,0.12)',
        p: 4,
        mb: 3,
        color: '#fff',
      }}>
        {/* Profile Header: Avatar + Info */}
        <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start', mb: 4, flexWrap: 'wrap' }}>
          {/* Avatar */}
          <Box sx={{
            flexShrink: 0,
            width: 120,
            height: 120,
            borderRadius: '50%',
            border: '3px solid rgba(225,29,72,0.5)',
            boxShadow: '0 0 24px rgba(225,29,72,0.2), 0 0 8px rgba(225,29,72,0.1)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(225,29,72,0.08)',
          }}>
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={record.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Typography sx={{ fontSize: '3rem', fontWeight: 800, color: accentColor, lineHeight: 1, fontFamily: 'Georgia, serif' }}>
                {record.username?.[0]?.toUpperCase() ?? '?'}
              </Typography>
            )}
          </Box>

          {/* User Info */}
          <Box sx={{ flex: 1, minWidth: 200 }}>
            {/* Name + Role chips */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 0.75 }}>
              <Typography sx={{
                fontSize: '1.85rem',
                fontWeight: 800,
                color: '#fff',
                lineHeight: 1.1,
                fontFamily: 'Georgia, "Times New Roman", serif',
                letterSpacing: '-0.01em',
              }}>
                {record.username}
              </Typography>
              <Chip
                label={record.role?.toUpperCase()}
                size="small"
                sx={{
                  backgroundColor: `${roleColor}20`,
                  border: `1px solid ${roleColor}50`,
                  color: roleColor,
                  fontWeight: 700,
                  fontSize: '0.62rem',
                  letterSpacing: '0.1em',
                  height: 22,
                  '& .MuiChip-label': { px: 1.2 },
                }}
              />
              {record.customRole && (
                <Chip
                  label={record.customRole}
                  size="small"
                  sx={{
                    color: 'rgba(255,255,255,0.6)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    fontSize: '0.7rem',
                    height: 22,
                    '& .MuiChip-label': { px: 1.2 },
                  }}
                />
              )}
            </Box>

            {/* Meta */}
            <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem', mb: 1 }}>
              Joined {joinDate} · ID #{record.id}
            </Typography>

            {/* Email + verified chip */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                {record.email}
              </Typography>
              {record.isEmailVerified ? (
                <Chip label="Verified" size="small" color="success" sx={{ height: 18, fontSize: '0.6rem', '& .MuiChip-label': { px: 0.8 } }} />
              ) : (
                <Chip label="Unverified" size="small" color="warning" sx={{ height: 18, fontSize: '0.6rem', '& .MuiChip-label': { px: 0.8 } }} />
              )}
            </Box>

            {/* Stats row */}
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              {statItems.map((stat) => (
                <Box key={stat.label} sx={{
                  px: 1.75,
                  py: 1.25,
                  background: `${stat.color}08`,
                  border: `1px solid ${stat.color}22`,
                  borderRadius: 1.5,
                  textAlign: 'center',
                  minWidth: 64,
                }}>
                  <Typography sx={{
                    fontSize: '1.5rem',
                    fontWeight: 400,
                    color: stat.color,
                    lineHeight: 1,
                    mb: 0.3,
                    fontFamily: 'Georgia, serif',
                  }}>
                    {stat.value}
                  </Typography>
                  <Typography sx={{
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: '0.56rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    display: 'block',
                  }}>
                    {stat.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        <Box sx={{ height: '1px', background: 'rgba(225,29,72,0.25)', my: 3 }} />

        {/* Reading Progress */}
        {readingProgress !== null && (
          <Box sx={{
            background: 'rgba(129,140,248,0.12)',
            border: '1px solid rgba(129,140,248,0.35)',
            borderRadius: 2,
            p: 3,
            mb: 3,
          }}>
            <SectionDivider label="Reading Progress" color={arcColor} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 2 }}>
              <Box>
                <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.63rem', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 0.5 }}>
                  Current Chapter
                </Typography>
                <Typography sx={{ color: arcColor, fontSize: '1.5rem', fontFamily: 'Georgia, serif', lineHeight: 1 }}>
                  {record.userProgress ?? 0}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.63rem', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 0.5 }}>
                  Total Chapters
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '1.5rem', fontFamily: 'Georgia, serif', lineHeight: 1 }}>
                  {MAX_CHAPTER}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ position: 'relative', height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <Box sx={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: `${readingProgress}%`,
                background: `linear-gradient(to right, ${arcColor}80, ${arcColor})`,
                borderRadius: 4,
                transition: 'width 0.8s ease',
              }} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}>0%</Typography>
              <Typography sx={{ color: arcColor, fontSize: '0.8rem', fontWeight: 600 }}>{readingProgress}%</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}>100%</Typography>
            </Box>
          </Box>
        )}

        {/* Active Badges */}
        <Box>
          <SectionDivider label="Active Badges" color={accentColor} />
          <UserBadgesField />
        </Box>
      </Box>

      {/* Badge History Card */}
      <Box sx={{
        background: 'linear-gradient(135deg, rgba(225,29,72,0.14), rgba(225,29,72,0.04)), #0a0a0a',
        border: '1px solid rgba(225,29,72,0.35)',
        borderRadius: 3,
        boxShadow: '0 16px 36px rgba(225,29,72,0.1)',
        p: 4,
        color: '#fff',
      }}>
        <SectionDivider label="Badge History" color={accentColor} />
        <UserBadgeHistoryField />
      </Box>
    </Box>
  )
}

export const UserShow = () => (
  <Show actions={<UserShowActions />}>
    <UserShowContent />
  </Show>
)

// Role Select Input with elevation protection
const RoleSelectInput = () => {
  const { permissions } = usePermissions()
  const record = useRecordContext()
  const { setValue } = useFormContext()
  const currentRole = useWatch({ name: 'role' })
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingRole, setPendingRole] = useState<string | null>(null)
  const notify = useNotify()

  const isAdmin = permissions === 'admin'
  const isModerator = permissions === 'moderator'
  const isEditor = permissions === 'editor'

  // Moderators and Editors cannot promote to admin
  const availableChoices = isModerator || isEditor
    ? USER_ROLES.filter(r => r.id !== 'admin')
    : USER_ROLES

  const handleRoleChange = (event: any) => {
    const newRole = event.target.value
    const originalRole = record?.role

    // Require confirmation for admin promotion
    if (newRole === 'admin' && originalRole !== 'admin') {
      setPendingRole(newRole)
      setConfirmOpen(true)
      return
    }

    // Require confirmation for admin demotion
    if (originalRole === 'admin' && newRole !== 'admin') {
      setPendingRole(newRole)
      setConfirmOpen(true)
      return
    }

    setValue('role', newRole, { shouldDirty: true })
  }

  const handleConfirm = () => {
    if (pendingRole) {
      setValue('role', pendingRole, { shouldDirty: true })
      notify(
        pendingRole === 'admin'
          ? 'Admin role will be applied on save'
          : 'Role change will be applied on save',
        { type: 'info' }
      )
    }
    setConfirmOpen(false)
    setPendingRole(null)
  }

  const handleCancel = () => {
    setConfirmOpen(false)
    setPendingRole(null)
  }

  const isPromotingToAdmin = pendingRole === 'admin' && record?.role !== 'admin'
  const isDemotingFromAdmin = record?.role === 'admin' && pendingRole !== 'admin'

  return (
    <>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Role</InputLabel>
        <Select
          value={currentRole || record?.role || 'user'}
          onChange={handleRoleChange}
          label="Role"
        >
          {availableChoices.map((choice) => (
            <MenuItem key={choice.id} value={choice.id}>
              {choice.name}
              {choice.id === 'admin' && (
                <Chip
                  label="Elevated"
                  size="small"
                  color="error"
                  sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                />
              )}
            </MenuItem>
          ))}
        </Select>
        {isModerator && (
          <Typography variant="caption" sx={{ mt: 0.5, color: 'text.secondary' }}>
            Moderators cannot promote users to admin role
          </Typography>
        )}
      </FormControl>

      <Dialog
        open={confirmOpen}
        onClose={handleCancel}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#0a0a0a',
            border: '2px solid #f44336',
            borderRadius: 2,
            color: '#ffffff'
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          borderBottom: '1px solid rgba(244, 67, 54, 0.3)',
          color: '#f44336',
          fontWeight: 'bold'
        }}>
          <Warning />
          {isPromotingToAdmin ? 'Confirm Admin Promotion' : 'Confirm Role Change'}
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" sx={{ color: '#ffffff', mb: 2 }}>
            {isPromotingToAdmin ? (
              <>
                You are about to promote <strong>{record?.username}</strong> to <strong>Admin</strong>.
                <br /><br />
                Admins have full access to:
                <ul style={{ marginTop: 8 }}>
                  <li>Promote/demote any user including other admins</li>
                  <li>Delete any content permanently</li>
                  <li>Manage all system settings</li>
                </ul>
              </>
            ) : isDemotingFromAdmin ? (
              <>
                You are about to demote <strong>{record?.username}</strong> from Admin to <strong>{pendingRole}</strong>.
                <br /><br />
                They will lose all admin privileges immediately upon save.
              </>
            ) : (
              <>
                You are about to change <strong>{record?.username}</strong>&apos;s role to <strong>{pendingRole}</strong>.
              </>
            )}
          </Typography>

          <Box sx={{
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
              <Warning sx={{ fontSize: 16 }} />
              This action will take effect when you save the form.
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button
            onClick={handleCancel}
            variant="outlined"
            sx={{
              borderColor: 'rgba(255, 255, 255, 0.3)',
              color: '#ffffff',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            color="error"
            sx={{
              backgroundColor: '#f44336',
              '&:hover': {
                backgroundColor: '#d32f2f'
              }
            }}
          >
            {isPromotingToAdmin ? 'Confirm Promotion' : 'Confirm Change'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export const UserEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="username" required />
      <TextInput source="email" type="email" required />
      <RoleSelectInput />
      <TextInput source="customRole" label="Custom Role" helperText="Optional display title shown on the user's profile (e.g. 'Site Founder')" />
      <BooleanInput source="isEmailVerified" />
    </SimpleForm>
  </Edit>
)
