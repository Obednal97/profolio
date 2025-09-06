import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-properties.dto';
import { Prisma, Property } from '@prisma/client';

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePropertyDto & { userId: string }) {
    const createData: Prisma.PropertyCreateInput = {
      user: { connect: { id: dto.userId } },
      address: dto.address,
      street: dto.street,
      city: dto.city,
      region: dto.region,
      postalCode: dto.postalCode,
      country: dto.country,
      propertyType: dto.propertyType,
      ownershipType: dto.ownershipType,
      status: dto.status,
      bedrooms: dto.bedrooms,
      bathrooms: dto.bathrooms,
      squareFootage: dto.squareFootage,
      yearBuilt: dto.yearBuilt,
      lotSize: dto.lotSize,
      currentValue: dto.currentValue, // Already converted to cents by DTO
      purchasePrice: dto.purchasePrice, // Already converted to cents by DTO
      rentalIncome: dto.rentalIncome, // Already converted to cents by DTO
      mortgageAmount: dto.mortgageAmount, // Already converted to cents by DTO
      mortgageRate: dto.mortgageRate,
      mortgageTerm: dto.mortgageTerm,
      monthlyPayment: dto.monthlyPayment, // Already converted to cents by DTO
      mortgageProvider: dto.mortgageProvider,
      propertyTaxes: dto.propertyTaxes, // Already converted to cents by DTO
      insurance: dto.insurance, // Already converted to cents by DTO
      maintenanceCosts: dto.maintenanceCosts, // Already converted to cents by DTO
      hoa: dto.hoa, // Already converted to cents by DTO
      monthlyRent: dto.monthlyRent, // Already converted to cents by DTO
      securityDeposit: dto.securityDeposit, // Already converted to cents by DTO
      notes: dto.notes,
    };

    // Add dates only if they're provided
    if (dto.mortgageStartDate) createData.mortgageStartDate = new Date(dto.mortgageStartDate);
    if (dto.rentalStartDate) createData.rentalStartDate = new Date(dto.rentalStartDate);
    if (dto.rentalEndDate) createData.rentalEndDate = new Date(dto.rentalEndDate);
    if (dto.purchaseDate) createData.purchaseDate = new Date(dto.purchaseDate);

    const property = await this.prisma.property.create({
      data: createData,
    });

    return this.convertCentsToDollars(property);
  }

  async update(id: string, dto: UpdatePropertyDto, userId: string) {
    // First verify the property exists and belongs to the user
    const existingProperty = await this.prisma.property.findUnique({
      where: { id },
    });

    if (!existingProperty) {
      throw new NotFoundException('Property not found');
    }

    if (existingProperty.userId !== userId) {
      throw new ForbiddenException('You can only update your own properties');
    }

    const updateData: Prisma.PropertyUpdateInput = {};
    
    // Only update provided fields with proper type handling
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.street !== undefined) updateData.street = dto.street;
    if (dto.city !== undefined) updateData.city = dto.city;
    if (dto.region !== undefined) updateData.region = dto.region;
    if (dto.postalCode !== undefined) updateData.postalCode = dto.postalCode;
    if (dto.country !== undefined) updateData.country = dto.country;
    if (dto.propertyType !== undefined) updateData.propertyType = dto.propertyType;
    if (dto.ownershipType !== undefined) updateData.ownershipType = dto.ownershipType;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.bedrooms !== undefined) updateData.bedrooms = dto.bedrooms;
    if (dto.bathrooms !== undefined) updateData.bathrooms = dto.bathrooms;
    if (dto.squareFootage !== undefined) updateData.squareFootage = dto.squareFootage;
    if (dto.yearBuilt !== undefined) updateData.yearBuilt = dto.yearBuilt;
    if (dto.lotSize !== undefined) updateData.lotSize = dto.lotSize;
    if (dto.currentValue !== undefined) updateData.currentValue = dto.currentValue;
    if (dto.purchasePrice !== undefined) updateData.purchasePrice = dto.purchasePrice;
    if (dto.rentalIncome !== undefined) updateData.rentalIncome = dto.rentalIncome;
    if (dto.mortgageAmount !== undefined) updateData.mortgageAmount = dto.mortgageAmount;
    if (dto.mortgageRate !== undefined) updateData.mortgageRate = dto.mortgageRate;
    if (dto.mortgageTerm !== undefined) updateData.mortgageTerm = dto.mortgageTerm;
    if (dto.monthlyPayment !== undefined) updateData.monthlyPayment = dto.monthlyPayment;
    if (dto.mortgageProvider !== undefined) updateData.mortgageProvider = dto.mortgageProvider;
    if (dto.mortgageStartDate !== undefined) updateData.mortgageStartDate = dto.mortgageStartDate ? new Date(dto.mortgageStartDate) : undefined;
    if (dto.propertyTaxes !== undefined) updateData.propertyTaxes = dto.propertyTaxes;
    if (dto.insurance !== undefined) updateData.insurance = dto.insurance;
    if (dto.maintenanceCosts !== undefined) updateData.maintenanceCosts = dto.maintenanceCosts;
    if (dto.hoa !== undefined) updateData.hoa = dto.hoa;
    if (dto.monthlyRent !== undefined) updateData.monthlyRent = dto.monthlyRent;
    if (dto.securityDeposit !== undefined) updateData.securityDeposit = dto.securityDeposit;
    if (dto.rentalStartDate !== undefined) updateData.rentalStartDate = dto.rentalStartDate ? new Date(dto.rentalStartDate) : undefined;
    if (dto.rentalEndDate !== undefined) updateData.rentalEndDate = dto.rentalEndDate ? new Date(dto.rentalEndDate) : undefined;
    if (dto.purchaseDate !== undefined) updateData.purchaseDate = dto.purchaseDate ? new Date(dto.purchaseDate) : undefined;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    const property = await this.prisma.property.update({
      where: { id },
      data: updateData,
    });

    return this.convertCentsToDollars(property);
  }

  // Keep the old findAll method for backwards compatibility if needed, but restrict to admin use
  async findAll() {
    const properties = await this.prisma.property.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return properties.map(property => this.convertCentsToDollars(property));
  }

  async findByUserId(userId: string, limit = 50) {
    const properties = await this.prisma.property.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return properties.map(property => this.convertCentsToDollars(property));
  }

  async findOne(id: string, userId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.userId !== userId) {
      throw new ForbiddenException('You can only access your own properties');
    }

    return this.convertCentsToDollars(property);
  }

  async delete(id: string, userId: string) {
    // First verify the property exists and belongs to the user
    const existingProperty = await this.prisma.property.findUnique({
      where: { id },
    });

    if (!existingProperty) {
      throw new NotFoundException('Property not found');
    }

    if (existingProperty.userId !== userId) {
      throw new ForbiddenException('You can only delete your own properties');
    }

    return this.prisma.property.delete({
      where: { id },
    });
  }

  // Convert cent values to dollars for frontend consumption
  private convertCentsToDollars(property: Property) {
    return {
      ...property,
      // Convert financial fields from cents to dollars
      currentValue: property.currentValue ? property.currentValue / 100 : null,
      purchasePrice: property.purchasePrice ? property.purchasePrice / 100 : null,
      rentalIncome: property.rentalIncome ? property.rentalIncome / 100 : null,
      mortgageAmount: property.mortgageAmount ? property.mortgageAmount / 100 : null,
      monthlyPayment: property.monthlyPayment ? property.monthlyPayment / 100 : null,
      propertyTaxes: property.propertyTaxes ? property.propertyTaxes / 100 : null,
      insurance: property.insurance ? property.insurance / 100 : null,
      maintenanceCosts: property.maintenanceCosts ? property.maintenanceCosts / 100 : null,
      hoa: property.hoa ? property.hoa / 100 : null,
      monthlyRent: property.monthlyRent ? property.monthlyRent / 100 : null,
      securityDeposit: property.securityDeposit ? property.securityDeposit / 100 : null,
      // Keep other fields as-is
      mortgageRate: property.mortgageRate ? Number(property.mortgageRate) : null,
      bathrooms: property.bathrooms ? Number(property.bathrooms) : null,
    };
  }
}
