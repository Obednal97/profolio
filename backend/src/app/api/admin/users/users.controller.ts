import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  ValidationPipe,
  ParseUUIDPipe,
  HttpException,
  HttpStatus,
  UsePipes,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { JwtAuthGuard } from "@/common/auth/jwt-auth.guard";
import { RoleGuard, RequireAdmin } from "@/common/rbac/role.guard";
import { AuthUser } from "@/common/auth/jwt.strategy";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";

@ApiTags("admin/users")
@ApiBearerAuth()
@Controller("admin/users")
@UseGuards(JwtAuthGuard, RoleGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  })
)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequireAdmin()
  @ApiOperation({ summary: "Get all users (admin only)" })
  @ApiResponse({ status: 200, description: "Users retrieved successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Admin access required" })
  async findAll(@Req() req: { user: AuthUser }) {
    try {
      return await this.usersService.findAll();
    } catch (error) {
      throw new HttpException(
        "Failed to fetch users",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(":id")
  @RequireAdmin()
  @ApiOperation({ summary: "Get a specific user (admin only)" })
  @ApiResponse({ status: 200, description: "User retrieved successfully" })
  @ApiResponse({ status: 404, description: "User not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Admin access required" })
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: { user: AuthUser }
  ) {
    try {
      return await this.usersService.findOne(id);
    } catch (error) {
      throw new HttpException(
        "Failed to fetch user",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post()
  @RequireAdmin()
  @ApiOperation({ summary: "Create a new user (admin only)" })
  @ApiResponse({ status: 201, description: "User created successfully" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Admin access required" })
  async create(@Body() body: CreateUserDto, @Req() req: { user: AuthUser }) {
    try {
      return await this.usersService.create(body);
    } catch (error) {
      throw new HttpException(
        "Failed to create user",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(":id")
  @RequireAdmin()
  @ApiOperation({ summary: "Delete a user (admin only)" })
  @ApiResponse({ status: 204, description: "User deleted successfully" })
  @ApiResponse({ status: 404, description: "User not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Admin access required" })
  async delete(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: { user: AuthUser }
  ) {
    try {
      // Prevent admin from deleting themselves
      if (id === req.user.id) {
        throw new HttpException(
          "Cannot delete your own account",
          HttpStatus.FORBIDDEN
        );
      }

      await this.usersService.delete(id);
      return { message: "User deleted successfully" };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        "Failed to delete user",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
