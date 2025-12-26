'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from "@/components/app-layout";
import { usePostApiV1Organizations } from "@/lib/api/generated/organizations/organizations";

export default function NewOrganizationPage() {
  const router = useRouter();
  const createOrganization = usePostApiV1Organizations();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    phone: '',
    fax: '',
    website: '',
    timezone: 'UTC',
    locale: 'en',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await createOrganization.mutateAsync({
        data: {
          name: formData.name,
          description: formData.description || undefined,
          address: formData.address || undefined,
          city: formData.city || undefined,
          state: formData.state || undefined,
          zipCode: formData.zipCode || undefined,
          country: formData.country || undefined,
          phone: formData.phone || undefined,
          fax: formData.fax || undefined,
          website: formData.website || undefined,
          timezone: formData.timezone,
          locale: formData.locale,
        }
      });

      // Redirect to organizations list on success
      router.push('/organizations');
    } catch (error) {
      console.error('Failed to create organization:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <AppLayout>
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Create New Organization</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-400">
            Add a new organization to manage projects and documents.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name - Required */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-900 dark:text-white">
              Organization Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              id="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="mt-2 block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm dark:bg-white/5 dark:text-white dark:ring-white/10 dark:focus:ring-indigo-500"
              placeholder="Acme Corporation"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-900 dark:text-white">
              Description
            </label>
            <textarea
              name="description"
              id="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="mt-2 block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm dark:bg-white/5 dark:text-white dark:ring-white/10 dark:focus:ring-indigo-500"
              placeholder="Brief description of the organization"
            />
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-900 dark:text-white">
              Street Address
            </label>
            <input
              type="text"
              name="address"
              id="address"
              value={formData.address}
              onChange={handleChange}
              className="mt-2 block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm dark:bg-white/5 dark:text-white dark:ring-white/10 dark:focus:ring-indigo-500"
              placeholder="123 Main Street"
            />
          </div>

          {/* City, State, Zip */}
          <div className="grid grid-cols-6 gap-6">
            <div className="col-span-3">
              <label htmlFor="city" className="block text-sm font-medium text-gray-900 dark:text-white">
                City
              </label>
              <input
                type="text"
                name="city"
                id="city"
                value={formData.city}
                onChange={handleChange}
                className="mt-2 block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm dark:bg-white/5 dark:text-white dark:ring-white/10 dark:focus:ring-indigo-500"
                placeholder="San Francisco"
              />
            </div>

            <div className="col-span-2">
              <label htmlFor="state" className="block text-sm font-medium text-gray-900 dark:text-white">
                State
              </label>
              <input
                type="text"
                name="state"
                id="state"
                value={formData.state}
                onChange={handleChange}
                className="mt-2 block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm dark:bg-white/5 dark:text-white dark:ring-white/10 dark:focus:ring-indigo-500"
                placeholder="CA"
              />
            </div>

            <div className="col-span-1">
              <label htmlFor="zipCode" className="block text-sm font-medium text-gray-900 dark:text-white">
                ZIP
              </label>
              <input
                type="text"
                name="zipCode"
                id="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                className="mt-2 block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm dark:bg-white/5 dark:text-white dark:ring-white/10 dark:focus:ring-indigo-500"
                placeholder="94102"
              />
            </div>
          </div>

          {/* Country */}
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-900 dark:text-white">
              Country
            </label>
            <input
              type="text"
              name="country"
              id="country"
              value={formData.country}
              onChange={handleChange}
              className="mt-2 block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm dark:bg-white/5 dark:text-white dark:ring-white/10 dark:focus:ring-indigo-500"
              placeholder="US"
            />
          </div>

          {/* Phone, Fax, Website */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-900 dark:text-white">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                id="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-2 block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm dark:bg-white/5 dark:text-white dark:ring-white/10 dark:focus:ring-indigo-500"
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label htmlFor="fax" className="block text-sm font-medium text-gray-900 dark:text-white">
                Fax
              </label>
              <input
                type="tel"
                name="fax"
                id="fax"
                value={formData.fax}
                onChange={handleChange}
                className="mt-2 block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm dark:bg-white/5 dark:text-white dark:ring-white/10 dark:focus:ring-indigo-500"
                placeholder="(555) 123-4568"
              />
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-900 dark:text-white">
                Website
              </label>
              <input
                type="url"
                name="website"
                id="website"
                value={formData.website}
                onChange={handleChange}
                className="mt-2 block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm dark:bg-white/5 dark:text-white dark:ring-white/10 dark:focus:ring-indigo-500"
                placeholder="https://example.com"
              />
            </div>
          </div>

          {/* Timezone and Locale */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-900 dark:text-white">
                Timezone
              </label>
              <select
                name="timezone"
                id="timezone"
                value={formData.timezone}
                onChange={handleChange}
                className="mt-2 block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm dark:bg-white/5 dark:text-white dark:ring-white/10 dark:focus:ring-indigo-500"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="America/Anchorage">Alaska Time</option>
                <option value="Pacific/Honolulu">Hawaii Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Europe/Berlin">Berlin</option>
                <option value="Asia/Tokyo">Tokyo</option>
                <option value="Asia/Shanghai">Shanghai</option>
                <option value="Asia/Kolkata">India</option>
                <option value="Australia/Sydney">Sydney</option>
              </select>
            </div>

            <div>
              <label htmlFor="locale" className="block text-sm font-medium text-gray-900 dark:text-white">
                Locale
              </label>
              <select
                name="locale"
                id="locale"
                value={formData.locale}
                onChange={handleChange}
                className="mt-2 block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm dark:bg-white/5 dark:text-white dark:ring-white/10 dark:focus:ring-indigo-500"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
                <option value="pt">Portuguese</option>
                <option value="ja">Japanese</option>
                <option value="zh">Chinese</option>
                <option value="ko">Korean</option>
                <option value="ar">Arabic</option>
                <option value="ru">Russian</option>
                <option value="nl">Dutch</option>
              </select>
            </div>
          </div>

          {/* Error Message */}
          {createOrganization.isError && (
            <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/10">
              <div className="text-sm text-red-800 dark:text-red-400">
                Failed to create organization. Please try again.
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-x-4 border-t border-gray-200 pt-6 dark:border-gray-700">
            <button
              type="button"
              onClick={() => router.push('/organizations')}
              className="rounded-md px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createOrganization.isPending}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              {createOrganization.isPending ? 'Creating...' : 'Create Organization'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
