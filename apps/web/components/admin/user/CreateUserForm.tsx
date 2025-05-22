// apps\web\components\admin\user\CreateUserForm.tsx

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { supabase } from '@shared/supabaseClient';
import { toast } from 'react-toastify';

// Define the shape of the form data
interface FormData {
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'moderator' | 'user';
  status: 'active' | 'inactive';
  password: string;
}

// Define the props for the component
interface CreateUserFormProps {
  onSuccess?: () => void;
}

export default function CreateUserForm({ onSuccess }: CreateUserFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const {
        data: signUpData,
        error: signUpError,
      } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            phone: data.phone,
          },
        },
      });

      if (signUpError) throw signUpError;
      const userId = signUpData.user?.id;
      if (!userId) throw new Error('User ID not returned from sign up');

      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        status: data.status,
      });
      if (profileError) throw profileError;

      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: data.role });
      if (roleError) throw roleError;

      setSuccess('User created successfully!');
      toast.success('User created successfully!');
      reset();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      toast.error(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-md mx-auto p-4 bg-white rounded shadow"
    >
      {/* Name Field */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          type="text"
          {...register('name', { required: 'Name is required' })}
          className="w-full px-3 py-2 border border-gray-300 rounded" required
        />
        {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
      </div>

      {/* Email Field */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Invalid email address',
            },
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded" required
        />
        {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
      </div>

      {/* Phone Field */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Phone</label>
        <input
          type="tel"
          {...register('phone', {
            required: 'Phone is required',
            pattern: {
              value: /^[0-9]{11}$/,
              message: 'Phone must be 10 digits',
            },
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
        />
        {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>}
      </div>

      {/* Role Field */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Role</label>
        <select
          {...register('role', { required: 'Role is required' })}
          className="w-full px-3 py-2 border border-gray-300 rounded" required
        >
          <option value="">Select a role</option>
          <option value="admin">Admin</option>
          <option value="support">Support</option>
          {/* <option value="moderator">Moderator</option> */}
          <option value="vendor">Vendor</option>
          <option value="rider">Rider</option>
          <option value="user">User</option>
        </select>
        {errors.role && <p className="text-red-600 text-sm mt-1">{errors.role.message}</p>}
      </div>

      {/* Status Field */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Status</label>
        <select
          {...register('status', { required: 'Status is required' })}
          className="w-full px-3 py-2 border border-gray-300 rounded" required
        >
          <option value="">Select status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        {errors.status && <p className="text-red-600 text-sm mt-1">{errors.status.message}</p>}
      </div>

      {/* Password Field */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          type="password"
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 6, message: 'Minimum 6 characters' },
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded" required
        />
        {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>}
      </div>

      {/* Submission Feedback */}
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {success && <div className="text-green-600 mb-4">{success}</div>}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded disabled:opacity-50"
      >
        {isLoading ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
}
