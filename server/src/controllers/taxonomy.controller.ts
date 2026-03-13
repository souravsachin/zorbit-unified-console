import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TaxonomyService } from '../services/taxonomy.service';
import { CreateTaxonomyDto } from '../models/dto/create-taxonomy.dto';
import { UpdateTaxonomyDto } from '../models/dto/update-taxonomy.dto';
import { CreateTaxonomyCategoryDto, UpdateTaxonomyCategoryDto } from '../models/dto/create-taxonomy-category.dto';
import { CreateTaxonomyItemDto, UpdateTaxonomyItemDto } from '../models/dto/create-taxonomy-item.dto';
import { JwtAuthGuard } from '../middleware/jwt-auth.guard';
import { NamespaceGuard } from '../middleware/namespace.guard';
import { JwtPayload } from '../middleware/jwt.strategy';

/**
 * Taxonomy management endpoints (Organization namespace).
 * All routes enforce JWT authentication and namespace isolation.
 */
@ApiTags('taxonomies')
@ApiBearerAuth()
@Controller('api/v1/O/:orgId/taxonomies')
@UseGuards(JwtAuthGuard, NamespaceGuard)
export class TaxonomyController {
  constructor(private readonly taxonomyService: TaxonomyService) {}

  // ─── Taxonomy endpoints ─────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List taxonomies', description: 'List all taxonomies for the organization.' })
  @ApiParam({ name: 'orgId', description: 'Organization hash ID', example: 'O-92AF' })
  @ApiResponse({ status: 200, description: 'List of taxonomies returned.' })
  async findAll(@Param('orgId') orgId: string) {
    return this.taxonomyService.findAll(orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get taxonomy', description: 'Get a taxonomy by ID with categories and items.' })
  @ApiParam({ name: 'orgId', description: 'Organization hash ID', example: 'O-92AF' })
  @ApiParam({ name: 'id', description: 'Taxonomy short hash ID', example: 'TXN-A1B2' })
  @ApiResponse({ status: 200, description: 'Taxonomy returned.' })
  @ApiResponse({ status: 404, description: 'Taxonomy not found.' })
  async findOne(
    @Param('orgId') orgId: string,
    @Param('id') taxonomyId: string,
  ) {
    return this.taxonomyService.findOne(orgId, taxonomyId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create taxonomy', description: 'Create a new taxonomy.' })
  @ApiParam({ name: 'orgId', description: 'Organization hash ID', example: 'O-92AF' })
  @ApiResponse({ status: 201, description: 'Taxonomy created successfully.' })
  async create(
    @Param('orgId') orgId: string,
    @Body() dto: CreateTaxonomyDto,
    @Req() req: { user: JwtPayload },
  ) {
    return this.taxonomyService.createTaxonomy(orgId, dto, req.user.sub);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update taxonomy', description: 'Update a taxonomy.' })
  @ApiParam({ name: 'orgId', description: 'Organization hash ID', example: 'O-92AF' })
  @ApiParam({ name: 'id', description: 'Taxonomy short hash ID', example: 'TXN-A1B2' })
  @ApiResponse({ status: 200, description: 'Taxonomy updated successfully.' })
  @ApiResponse({ status: 404, description: 'Taxonomy not found.' })
  async update(
    @Param('orgId') orgId: string,
    @Param('id') taxonomyId: string,
    @Body() dto: UpdateTaxonomyDto,
  ) {
    return this.taxonomyService.update(orgId, taxonomyId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete taxonomy', description: 'Delete a taxonomy and all its categories and items.' })
  @ApiParam({ name: 'orgId', description: 'Organization hash ID', example: 'O-92AF' })
  @ApiParam({ name: 'id', description: 'Taxonomy short hash ID', example: 'TXN-A1B2' })
  @ApiResponse({ status: 204, description: 'Taxonomy deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Taxonomy not found.' })
  async remove(
    @Param('orgId') orgId: string,
    @Param('id') taxonomyId: string,
  ) {
    return this.taxonomyService.remove(orgId, taxonomyId);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate taxonomy', description: 'Activate a taxonomy version, archiving the previous active version.' })
  @ApiParam({ name: 'orgId', description: 'Organization hash ID', example: 'O-92AF' })
  @ApiParam({ name: 'id', description: 'Taxonomy short hash ID', example: 'TXN-A1B2' })
  @ApiResponse({ status: 200, description: 'Taxonomy activated.' })
  @ApiResponse({ status: 404, description: 'Taxonomy not found.' })
  async activate(
    @Param('orgId') orgId: string,
    @Param('id') taxonomyId: string,
  ) {
    return this.taxonomyService.activateTaxonomy(orgId, taxonomyId);
  }

  @Post(':id/clone')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Clone taxonomy', description: 'Deep-clone a taxonomy with a new version.' })
  @ApiParam({ name: 'orgId', description: 'Organization hash ID', example: 'O-92AF' })
  @ApiParam({ name: 'id', description: 'Taxonomy short hash ID to clone', example: 'TXN-A1B2' })
  @ApiResponse({ status: 201, description: 'Taxonomy cloned successfully.' })
  @ApiResponse({ status: 404, description: 'Taxonomy not found.' })
  async clone(
    @Param('orgId') orgId: string,
    @Param('id') taxonomyId: string,
    @Body('version') version: string,
    @Req() req: { user: JwtPayload },
  ) {
    return this.taxonomyService.cloneTaxonomy(orgId, taxonomyId, version || '2.0.0', req.user.sub);
  }

  // ─── Category endpoints ─────────────────────────────────────────

  @Get(':taxId/categories')
  @ApiOperation({ summary: 'List categories', description: 'List all categories in a taxonomy.' })
  @ApiParam({ name: 'orgId', description: 'Organization hash ID', example: 'O-92AF' })
  @ApiParam({ name: 'taxId', description: 'Taxonomy short hash ID', example: 'TXN-A1B2' })
  @ApiResponse({ status: 200, description: 'List of categories returned.' })
  async findCategories(
    @Param('orgId') orgId: string,
    @Param('taxId') taxId: string,
  ) {
    return this.taxonomyService.findCategories(orgId, taxId);
  }

  @Post(':taxId/categories')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create category', description: 'Add a category to a taxonomy.' })
  @ApiParam({ name: 'orgId', description: 'Organization hash ID', example: 'O-92AF' })
  @ApiParam({ name: 'taxId', description: 'Taxonomy short hash ID', example: 'TXN-A1B2' })
  @ApiResponse({ status: 201, description: 'Category created successfully.' })
  async createCategory(
    @Param('orgId') orgId: string,
    @Param('taxId') taxId: string,
    @Body() dto: CreateTaxonomyCategoryDto,
  ) {
    return this.taxonomyService.createCategory(orgId, taxId, dto);
  }

  @Put(':taxId/categories/:catId')
  @ApiOperation({ summary: 'Update category', description: 'Update a taxonomy category.' })
  @ApiParam({ name: 'orgId', description: 'Organization hash ID', example: 'O-92AF' })
  @ApiParam({ name: 'taxId', description: 'Taxonomy short hash ID', example: 'TXN-A1B2' })
  @ApiParam({ name: 'catId', description: 'Category short hash ID', example: 'TXC-A1B2' })
  @ApiResponse({ status: 200, description: 'Category updated successfully.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  async updateCategory(
    @Param('orgId') orgId: string,
    @Param('taxId') taxId: string,
    @Param('catId') catId: string,
    @Body() dto: UpdateTaxonomyCategoryDto,
  ) {
    return this.taxonomyService.updateCategory(orgId, taxId, catId, dto);
  }

  @Delete(':taxId/categories/:catId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete category', description: 'Delete a taxonomy category and all its items.' })
  @ApiParam({ name: 'orgId', description: 'Organization hash ID', example: 'O-92AF' })
  @ApiParam({ name: 'taxId', description: 'Taxonomy short hash ID', example: 'TXN-A1B2' })
  @ApiParam({ name: 'catId', description: 'Category short hash ID', example: 'TXC-A1B2' })
  @ApiResponse({ status: 204, description: 'Category deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  async removeCategory(
    @Param('orgId') orgId: string,
    @Param('taxId') taxId: string,
    @Param('catId') catId: string,
  ) {
    return this.taxonomyService.removeCategory(orgId, taxId, catId);
  }

  // ─── Item endpoints ─────────────────────────────────────────────

  @Get(':taxId/categories/:catId/items')
  @ApiOperation({ summary: 'List items', description: 'List all items in a taxonomy category.' })
  @ApiParam({ name: 'orgId', description: 'Organization hash ID', example: 'O-92AF' })
  @ApiParam({ name: 'taxId', description: 'Taxonomy short hash ID', example: 'TXN-A1B2' })
  @ApiParam({ name: 'catId', description: 'Category short hash ID', example: 'TXC-A1B2' })
  @ApiResponse({ status: 200, description: 'List of items returned.' })
  async findItems(
    @Param('orgId') orgId: string,
    @Param('taxId') taxId: string,
    @Param('catId') catId: string,
  ) {
    return this.taxonomyService.findItems(orgId, taxId, catId);
  }

  @Post(':taxId/categories/:catId/items')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create item', description: 'Add an item to a taxonomy category.' })
  @ApiParam({ name: 'orgId', description: 'Organization hash ID', example: 'O-92AF' })
  @ApiParam({ name: 'taxId', description: 'Taxonomy short hash ID', example: 'TXN-A1B2' })
  @ApiParam({ name: 'catId', description: 'Category short hash ID', example: 'TXC-A1B2' })
  @ApiResponse({ status: 201, description: 'Item created successfully.' })
  async createItem(
    @Param('orgId') orgId: string,
    @Param('taxId') taxId: string,
    @Param('catId') catId: string,
    @Body() dto: CreateTaxonomyItemDto,
  ) {
    return this.taxonomyService.createItem(orgId, taxId, catId, dto);
  }

  @Put(':taxId/categories/:catId/items/:itemId')
  @ApiOperation({ summary: 'Update item', description: 'Update a taxonomy item.' })
  @ApiParam({ name: 'orgId', description: 'Organization hash ID', example: 'O-92AF' })
  @ApiParam({ name: 'taxId', description: 'Taxonomy short hash ID', example: 'TXN-A1B2' })
  @ApiParam({ name: 'catId', description: 'Category short hash ID', example: 'TXC-A1B2' })
  @ApiParam({ name: 'itemId', description: 'Item short hash ID', example: 'TXI-A1B2' })
  @ApiResponse({ status: 200, description: 'Item updated successfully.' })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  async updateItem(
    @Param('orgId') orgId: string,
    @Param('taxId') taxId: string,
    @Param('catId') catId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateTaxonomyItemDto,
  ) {
    return this.taxonomyService.updateItem(orgId, taxId, catId, itemId, dto);
  }

  @Delete(':taxId/categories/:catId/items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete item', description: 'Delete a taxonomy item.' })
  @ApiParam({ name: 'orgId', description: 'Organization hash ID', example: 'O-92AF' })
  @ApiParam({ name: 'taxId', description: 'Taxonomy short hash ID', example: 'TXN-A1B2' })
  @ApiParam({ name: 'catId', description: 'Category short hash ID', example: 'TXC-A1B2' })
  @ApiParam({ name: 'itemId', description: 'Item short hash ID', example: 'TXI-A1B2' })
  @ApiResponse({ status: 204, description: 'Item deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  async removeItem(
    @Param('orgId') orgId: string,
    @Param('taxId') taxId: string,
    @Param('catId') catId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.taxonomyService.removeItem(orgId, taxId, catId, itemId);
  }
}
