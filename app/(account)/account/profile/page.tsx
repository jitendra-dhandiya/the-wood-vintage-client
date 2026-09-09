'use client';
import { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button,
  Avatar, IconButton, Divider, Skeleton,
} from '@mui/material';
import { CameraAlt } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSelector, useDispatch } from 'react-redux';
import { userApi } from '../../../../services/api.service';
import { setUser } from '../../../../store/slices/authSlice';
import { toast } from 'react-hot-toast';
import type { RootState } from '../../../../store';
import { useImageCropper } from '../../../../components/common/ImageCropperProvider';

const profileSchema = Yup.object({
  firstName: Yup.string().required('First name required'),
  lastName: Yup.string(),
  phone: Yup.string(),
});

const passwordSchema = Yup.object({
  currentPassword: Yup.string().required(),
  newPassword: Yup.string().min(8, 'At least 8 characters').required(),
  confirmPassword: Yup.string().oneOf([Yup.ref('newPassword')], 'Passwords must match').required(),
});

export default function ProfilePage() {
  const cropImage = useImageCropper();
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  const profileFormik = useFormik({
    initialValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: (user as any)?.phone || '',
    },
    enableReinitialize: true,
    validationSchema: profileSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const fd = new FormData();
        Object.entries(values).forEach(([k, v]) => fd.append(k, v));
        if (avatarFile) fd.append('avatar', avatarFile);
        const { data } = await userApi.updateProfile(fd);
        dispatch(setUser(data.data));
        toast.success('Profile updated');
      } catch {
        toast.error('Update failed');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const passwordFormik = useFormik({
    initialValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    validationSchema: passwordSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        await userApi.changePassword({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        });
        toast.success('Password changed');
        resetForm();
      } catch (e: any) {
        toast.error(e.response?.data?.message || 'Failed to change password');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    // Avatars render in a circle, so a square crop is the only shape that does
    // not lose someone's chin to the mask.
    const cropped = await cropImage(file, 'avatar');
    if (cropped) { setAvatarFile(cropped); setAvatarPreview(URL.createObjectURL(cropped)); }
  };

  if (!user) return <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />;

  return (
    <Box>
      <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, mb: 3 }}>
        My Profile
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 3 }}>Personal Information</Typography>

              {/* Avatar */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box sx={{ position: 'relative' }}>
                  <Avatar
                    src={avatarPreview || (user as any).avatar}
                    sx={{ width: 80, height: 80, fontSize: 28 }}
                  >
                    {user.firstName?.[0]}
                  </Avatar>
                  <IconButton
                    component="label" size="small"
                    sx={{
                      position: 'absolute', bottom: 0, right: 0,
                      bgcolor: '#1a1a1a', color: '#fff', width: 26, height: 26,
                      '&:hover': { bgcolor: '#333' },
                    }}>
                    <CameraAlt sx={{ fontSize: 14 }} />
                    <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
                  </IconButton>
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={600}>{user.firstName} {user.lastName}</Typography>
                  <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                </Box>
              </Box>

              <form onSubmit={profileFormik.handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField label="First Name" size="small" fullWidth required
                      {...profileFormik.getFieldProps('firstName')}
                      error={profileFormik.touched.firstName && !!profileFormik.errors.firstName}
                      helperText={profileFormik.touched.firstName && profileFormik.errors.firstName} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Last Name" size="small" fullWidth
                      {...profileFormik.getFieldProps('lastName')} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Phone" size="small" fullWidth
                      {...profileFormik.getFieldProps('phone')} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Email" size="small" fullWidth disabled value={user.email} />
                  </Grid>
                </Grid>
                <Button type="submit" variant="contained" sx={{ mt: 2.5, bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' } }}
                  disabled={profileFormik.isSubmitting}>
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Change Password</Typography>
              <form onSubmit={passwordFormik.handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField label="Current Password" type="password" size="small" fullWidth
                      {...passwordFormik.getFieldProps('currentPassword')}
                      error={passwordFormik.touched.currentPassword && !!passwordFormik.errors.currentPassword} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="New Password" type="password" size="small" fullWidth
                      {...passwordFormik.getFieldProps('newPassword')}
                      error={passwordFormik.touched.newPassword && !!passwordFormik.errors.newPassword}
                      helperText={passwordFormik.touched.newPassword && passwordFormik.errors.newPassword} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Confirm New Password" type="password" size="small" fullWidth
                      {...passwordFormik.getFieldProps('confirmPassword')}
                      error={passwordFormik.touched.confirmPassword && !!passwordFormik.errors.confirmPassword}
                      helperText={passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword} />
                  </Grid>
                </Grid>
                <Button type="submit" variant="outlined" sx={{ mt: 2.5, borderColor: '#1a1a1a', color: '#1a1a1a' }}
                  disabled={passwordFormik.isSubmitting}>
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
