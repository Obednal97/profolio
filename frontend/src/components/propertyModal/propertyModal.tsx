'use client';

import React, { useState } from 'react';
import { Property } from '@/types/global';
import { Button } from '@/components/ui/button/button';
import { motion } from 'framer-motion';

interface PropertyModalProps {
  property: Property | null;
  onSave: (property: Property) => void;
  onClose: () => void;
}

interface PropertyFormData {
  address: string;
  purchasePrice: string;
  currentValue: string;
  propertyType: string;
  status: string;
  notes?: string;
  ownershipType: 'owned' | 'rented';
  rentalStartDate?: string;
  rentalEndDate?: string;
  monthlyRent?: string;
  securityDeposit?: string;
  purchaseDate?: string;
  mortgageAmount?: string;
  mortgageRate?: string;
  mortgageTerm?: string;
  monthlyPayment?: string;
  mortgageStartDate?: string;
  mortgageProvider?: string;
  bedrooms?: string;
  bathrooms?: string;
  squareFootage?: string;
  yearBuilt?: string;
  lotSize?: string;
  rentalIncome?: string;
  propertyTaxes?: string;
  insurance?: string;
  maintenanceCosts?: string;
  hoa?: string;
}

export default function PropertyModal({ property, onSave, onClose }: PropertyModalProps) {
  const [formData, setFormData] = useState<PropertyFormData>(() => {
    if (property) {
      return {
        address: property.address || "",
        purchasePrice: property.purchasePrice?.toString() || "",
        currentValue: property.currentValue?.toString() || "",
        propertyType: property.propertyType || "single_family",
        status: property.status || "owned",
        notes: property.notes || "",
        ownershipType: property.ownershipType || "owned",
        rentalStartDate: property.rentalStartDate || "",
        rentalEndDate: property.rentalEndDate || "",
        monthlyRent: property.monthlyRent?.toString() || "",
        securityDeposit: property.securityDeposit?.toString() || "",
        purchaseDate: property.purchaseDate || "",
        mortgageAmount: property.mortgageAmount?.toString() || "",
        mortgageRate: property.mortgageRate?.toString() || "",
        mortgageTerm: property.mortgageTerm?.toString() || "",
        monthlyPayment: property.monthlyPayment?.toString() || "",
        mortgageStartDate: property.mortgageStartDate || "",
        mortgageProvider: property.mortgageProvider || "",
        bedrooms: property.bedrooms?.toString() || "",
        bathrooms: property.bathrooms?.toString() || "",
        squareFootage: property.squareFootage?.toString() || "",
        yearBuilt: property.yearBuilt?.toString() || "",
        lotSize: property.lotSize?.toString() || "",
        rentalIncome: property.rentalIncome?.toString() || "",
        propertyTaxes: property.propertyTaxes?.toString() || "",
        insurance: property.insurance?.toString() || "",
        maintenanceCosts: property.maintenanceCosts?.toString() || "",
        hoa: property.hoa?.toString() || "",
      };
    } else {
      return {
        address: "",
        purchasePrice: "",
        currentValue: "",
        propertyType: "single_family",
        status: "owned",
        notes: "",
        ownershipType: "owned",
      };
    }
  });

  const [activeSection, setActiveSection] = useState<string>('basic');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const propertyData: Omit<Property, 'id'> & { id?: string } = {
      ...(property?.id && { id: property.id }),
      address: formData.address,
      purchasePrice: formData.purchasePrice ? Number(formData.purchasePrice) : undefined,
      currentValue: formData.currentValue ? Number(formData.currentValue) : undefined,
      propertyType: formData.propertyType as Property["propertyType"],
      status: formData.status as Property["status"],
      notes: formData.notes || undefined,
      ownershipType: formData.ownershipType,
      rentalStartDate: formData.rentalStartDate || undefined,
      rentalEndDate: formData.rentalEndDate || undefined,
      monthlyRent: formData.monthlyRent ? Number(formData.monthlyRent) : undefined,
      securityDeposit: formData.securityDeposit ? Number(formData.securityDeposit) : undefined,
      purchaseDate: formData.purchaseDate || undefined,
      mortgageAmount: formData.mortgageAmount ? Number(formData.mortgageAmount) : undefined,
      mortgageRate: formData.mortgageRate ? Number(formData.mortgageRate) : undefined,
      mortgageTerm: formData.mortgageTerm ? Number(formData.mortgageTerm) : undefined,
      monthlyPayment: formData.monthlyPayment ? Number(formData.monthlyPayment) : undefined,
      mortgageStartDate: formData.mortgageStartDate || undefined,
      mortgageProvider: formData.mortgageProvider || undefined,
      bedrooms: formData.bedrooms ? Number(formData.bedrooms) : undefined,
      bathrooms: formData.bathrooms ? Number(formData.bathrooms) : undefined,
      squareFootage: formData.squareFootage ? Number(formData.squareFootage) : undefined,
      yearBuilt: formData.yearBuilt ? Number(formData.yearBuilt) : undefined,
      lotSize: formData.lotSize ? Number(formData.lotSize) : undefined,
      rentalIncome: formData.rentalIncome ? Number(formData.rentalIncome) : undefined,
      propertyTaxes: formData.propertyTaxes ? Number(formData.propertyTaxes) : undefined,
      insurance: formData.insurance ? Number(formData.insurance) : undefined,
      maintenanceCosts: formData.maintenanceCosts ? Number(formData.maintenanceCosts) : undefined,
      hoa: formData.hoa ? Number(formData.hoa) : undefined,
    };

    onSave(propertyData as Property);
  };

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: 'fa-home' },
    { id: 'details', label: 'Property Details', icon: 'fa-ruler-combined' },
    { id: 'financial', label: 'Financial', icon: 'fa-dollar-sign' },
    { id: 'mortgage', label: 'Mortgage', icon: 'fa-university' },
    { id: 'costs', label: 'Additional Costs', icon: 'fa-receipt' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 lg:p-8 w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700 shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          {property ? "Edit Property" : "Add New Property"}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          aria-label="Close Modal"
        >
          <i className="fas fa-times text-lg sm:text-xl"></i>
        </button>
      </div>

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setActiveSection(section.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
              activeSection === section.id
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <i className={`fas ${section.icon} text-sm`}></i>
            <span className="text-sm">{section.label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Section */}
        {activeSection === 'basic' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Property Address <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200"
                rows={2}
                placeholder="123 Main St, City, State ZIP"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Property Type
                </label>
                <select
                  value={formData.propertyType}
                  onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200"
                >
                  <option value="single_family">Single Family</option>
                  <option value="condo">Condo</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="multi_family">Multi Family</option>
                  <option value="commercial">Commercial</option>
                  <option value="land">Land</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ownership Type
                </label>
                <select
                  value={formData.ownershipType}
                  onChange={(e) => setFormData({ ...formData, ownershipType: e.target.value as 'owned' | 'rented' })}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200"
                >
                  <option value="owned">Owned</option>
                  <option value="rented">Rented</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200"
                >
                  <option value="owned">Owned</option>
                  <option value="rental">Rental Property</option>
                  <option value="rented">Renting</option>
                  <option value="sold">Sold</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}

        {/* Property Details Section */}
        {activeSection === 'details' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bedrooms
              </label>
              <input
                type="number"
                min="0"
                value={formData.bedrooms}
                onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200"
                placeholder="3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bathrooms
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData.bathrooms}
                onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200"
                placeholder="2.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Square Footage
              </label>
              <input
                type="number"
                min="0"
                value={formData.squareFootage}
                onChange={(e) => setFormData({ ...formData, squareFootage: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200"
                placeholder="2000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Year Built
              </label>
              <input
                type="number"
                min="1800"
                max={new Date().getFullYear()}
                value={formData.yearBuilt}
                onChange={(e) => setFormData({ ...formData, yearBuilt: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200"
                placeholder="2020"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Lot Size (sq ft)
              </label>
              <input
                type="number"
                min="0"
                value={formData.lotSize}
                onChange={(e) => setFormData({ ...formData, lotSize: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200"
                placeholder="8000"
              />
            </div>
          </motion.div>
        )}

        {/* Financial Information Section */}
        {activeSection === 'financial' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Purchase Price
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    min="0"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-8 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200"
                    placeholder="500000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Value <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    min="0"
                    value={formData.currentValue}
                    onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-8 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200"
                    placeholder="550000"
                    required
                  />
                </div>
              </div>

              {formData.ownershipType === 'owned' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200"
                  />
                </div>
              )}

              {formData.status === 'rental' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Monthly Rental Income
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      min="0"
                      value={formData.rentalIncome}
                      onChange={(e) => setFormData({ ...formData, rentalIncome: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-8 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200"
                      placeholder="3000"
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Mortgage Details Section */}
        {activeSection === 'mortgage' && formData.ownershipType === 'owned' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mortgage Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  min="0"
                  value={formData.mortgageAmount}
                  onChange={(e) => setFormData({ ...formData, mortgageAmount: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-8 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200"
                  placeholder="400000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Interest Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="20"
                value={formData.mortgageRate}
                onChange={(e) => setFormData({ ...formData, mortgageRate: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200"
                placeholder="3.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Term (years)
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={formData.mortgageTerm}
                onChange={(e) => setFormData({ ...formData, mortgageTerm: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200"
                placeholder="30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Monthly Payment
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  min="0"
                  value={formData.monthlyPayment}
                  onChange={(e) => setFormData({ ...formData, monthlyPayment: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-8 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200"
                  placeholder="2000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mortgage Provider
              </label>
              <input
                type="text"
                value={formData.mortgageProvider}
                onChange={(e) => setFormData({ ...formData, mortgageProvider: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200"
                placeholder="Bank of America"
              />
            </div>
          </motion.div>
        )}

        {/* Additional Costs Section */}
        {activeSection === 'costs' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Property Taxes (Monthly)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  min="0"
                  value={formData.propertyTaxes}
                  onChange={(e) => setFormData({ ...formData, propertyTaxes: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-8 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200"
                  placeholder="500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Insurance (Monthly)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  min="0"
                  value={formData.insurance}
                  onChange={(e) => setFormData({ ...formData, insurance: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-8 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200"
                  placeholder="200"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maintenance (Monthly)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  min="0"
                  value={formData.maintenanceCosts}
                  onChange={(e) => setFormData({ ...formData, maintenanceCosts: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-8 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200"
                  placeholder="300"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                HOA Fees (Monthly)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  min="0"
                  value={formData.hoa}
                  onChange={(e) => setFormData({ ...formData, hoa: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-8 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200"
                  placeholder="150"
                />
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200"
                rows={3}
                placeholder="Additional information about the property..."
              />
            </div>
          </motion.div>
        )}

        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            onClick={onClose}
            variant="ghost"
            className="w-full sm:w-auto px-6 py-3 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium shadow-lg"
          >
            {property ? "Update Property" : "Add Property"}
          </Button>
        </div>
      </form>
    </div>
  );
} 